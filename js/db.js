// ======================================================
//  App.DB  —  IndexedDB Wrapper
//  v2: adds 'batches' and 'transactions' stores
//  DB name changed to v2 to avoid upgrade conflicts.
//  On first open, checks for old v1 DB and migrates.
// ======================================================

window.App = window.App || {};
App.DB = {};

(function () {

    const DB_NAME    = "SchoolLotteryDB_v2";
    const DB_VERSION = 1;
    let db = null;

    // --------------------------------------------------
    // Open Database
    // --------------------------------------------------
    App.DB.open = function () {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = (e) => {
                const idb = e.target.result;

                // students store
                if (!idb.objectStoreNames.contains("students")) {
                    const store = idb.createObjectStore("students", {
                        keyPath: "id", autoIncrement: true
                    });
                    store.createIndex("byTeacher",     "teacher",           { unique: false });
                    store.createIndex("byNameTeacher", ["name", "teacher"], { unique: true  });
                }

                // batches store
                if (!idb.objectStoreNames.contains("batches")) {
                    const bs = idb.createObjectStore("batches", {
                        keyPath: "id", autoIncrement: true
                    });
                    bs.createIndex("byImportedAt", "importedAt", { unique: false });
                }

                // transactions store
                if (!idb.objectStoreNames.contains("transactions")) {
                    const ts = idb.createObjectStore("transactions", {
                        keyPath: "id", autoIncrement: true
                    });
                    ts.createIndex("byBatch",   "batchId",           { unique: false });
                    ts.createIndex("byStudent", ["name", "teacher"], { unique: false });
                }
            };

            req.onsuccess = async (e) => {
                db = e.target.result;

                // Migrate from old DB name if it exists
                await _migrateFromV1IfNeeded();

                resolve();
            };

            req.onerror   = (e) => reject(e.target.error);
            req.onblocked = ()  => {
                alert("Database upgrade is blocked. Please close all other tabs running this app, then refresh.");
            };
        });
    };

    // --------------------------------------------------
    // One-time migration from SchoolLotteryDB_v1
    // --------------------------------------------------
    async function _migrateFromV1IfNeeded() {
        // Only run once — flag stored in localStorage
        if (localStorage.getItem("slm_v1_migrated")) return;

        return new Promise((resolve) => {
            const checkReq = indexedDB.open("SchoolLotteryDB_v1", 1);

            checkReq.onupgradeneeded = (e) => {
                // DB didn't exist — abort so we don't create it
                e.target.transaction.abort();
                localStorage.setItem("slm_v1_migrated", "1");
                resolve();
            };

            checkReq.onsuccess = async (e) => {
                const oldDb = e.target.result;

                // Read all students from old DB
                const students = await new Promise((res, rej) => {
                    const tx  = oldDb.transaction("students", "readonly");
                    const req = tx.objectStore("students").getAll();
                    req.onsuccess = () => res(req.result || []);
                    req.onerror   = () => res([]);
                });

                oldDb.close();

                if (students.length === 0) {
                    localStorage.setItem("slm_v1_migrated", "1");
                    resolve();
                    return;
                }

                // Import students into new DB
                for (const s of students) {
                    const clean = { ...s };
                    delete clean.id;
                    await App.DB.upsertStudent(clean);
                }

                // Wrap any existing amounts in a legacy batch
                const hasMoney = students.filter(s => (s.online || 0) + (s.cash || 0) > 0);

                if (hasMoney.length > 0) {
                    const batchId = await App.DB.addBatch({
                        filename:   "(legacy data from v1)",
                        importedAt: new Date().toISOString(),
                        mode:       "legacy-migration",
                        rowCount:   hasMoney.length
                    });

                    for (const s of hasMoney) {
                        await App.DB.addTransaction({
                            name:    s.name,
                            teacher: s.teacher,
                            online:  Number(s.online || 0),
                            cash:    Number(s.cash   || 0),
                            txDate:  null,
                            notes:   "(migrated from previous version)",
                            batchId
                        });
                    }
                }

                localStorage.setItem("slm_v1_migrated", "1");
                console.log(`Migrated ${students.length} students from SchoolLotteryDB_v1`);
                resolve();
            };

            checkReq.onerror = () => {
                localStorage.setItem("slm_v1_migrated", "1");
                resolve();
            };
        });
    }

    // ======================================================
    //  STUDENTS
    // ======================================================

    App.DB.getAllStudents = function () {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("students", "readonly");
            const store = tx.objectStore("students");
            const req   = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.upsertStudent = function (student) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("students", "readwrite");
            const store = tx.objectStore("students");
            const idx   = store.index("byNameTeacher");
            const key   = [student.name, student.teacher];
            const getReq = idx.getKey(key);

            getReq.onsuccess = () => {
                const existingKey = getReq.result;

                if (existingKey != null) {
                    const getEx = store.get(existingKey);
                    getEx.onsuccess = () => {
                        const existing    = getEx.result;
                        const safeStudent = { ...student };
                        delete safeStudent.online;
                        delete safeStudent.cash;
                        const updated = { ...existing, ...safeStudent, id: existing.id };
                        const putReq  = store.put(updated);
                        putReq.onsuccess = () => resolve(existing.id);
                        putReq.onerror   = (e) => reject(e.target.error);
                    };
                    getEx.onerror = (e) => reject(e.target.error);
                } else {
                    const newStudent = { ...student, online: 0, cash: 0 };
                    const addReq     = store.add(newStudent);
                    addReq.onsuccess = () => resolve(addReq.result);
                    addReq.onerror   = (e) => reject(e.target.error);
                }
            };

            getReq.onerror = (e) => reject(e.target.error);
        });
    };

    App.DB.updateStudent = function (id, changes) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("students", "readwrite");
            const store = tx.objectStore("students");
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (!existing) return resolve();
                const updated = { ...existing, ...changes };
                const putReq  = store.put(updated);
                putReq.onsuccess = () => resolve();
                putReq.onerror   = (e) => reject(e.target.error);
            };
            getReq.onerror = (e) => reject(e.target.error);
        });
    };

    App.DB.clearStudents = function () {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("students", "readwrite");
            const store = tx.objectStore("students");
            const req   = store.clear();
            req.onsuccess = () => resolve();
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    // ======================================================
    //  BATCHES
    // ======================================================

    App.DB.addBatch = function (batch) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("batches", "readwrite");
            const store = tx.objectStore("batches");
            const req   = store.add(batch);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.updateBatch = function (batchId, changes) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("batches", "readwrite");
            const store = tx.objectStore("batches");
            const getReq = store.get(batchId);
            getReq.onsuccess = () => {
                const record = { ...getReq.result, ...changes };
                const putReq = store.put(record);
                putReq.onsuccess = () => resolve();
                putReq.onerror   = (e) => reject(e.target.error);
            };
            getReq.onerror = (e) => reject(e.target.error);
        });
    };

    App.DB.getAllBatches = function () {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("batches", "readonly");
            const store = tx.objectStore("batches");
            const req   = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.deleteBatch = function (batchId) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("batches", "readwrite");
            const store = tx.objectStore("batches");
            const req   = store.delete(batchId);
            req.onsuccess = () => resolve();
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.clearBatches = function () {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("batches", "readwrite");
            const store = tx.objectStore("batches");
            const req   = store.clear();
            req.onsuccess = () => resolve();
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    // ======================================================
    //  TRANSACTIONS
    // ======================================================

    App.DB.addTransaction = function (txData) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("transactions", "readwrite");
            const store = tx.objectStore("transactions");
            const req   = store.add(txData);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.getAllTransactions = function () {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("transactions", "readonly");
            const store = tx.objectStore("transactions");
            const req   = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.getTransactionsByBatch = function (batchId) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("transactions", "readonly");
            const store = tx.objectStore("transactions");
            const idx   = store.index("byBatch");
            const req   = idx.getAll(batchId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.getTransactionsByStudent = function (name, teacher) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("transactions", "readonly");
            const store = tx.objectStore("transactions");
            const idx   = store.index("byStudent");
            const req   = idx.getAll([name, teacher]);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.deleteTransaction = function (txId) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("transactions", "readwrite");
            const store = tx.objectStore("transactions");
            const req   = store.delete(txId);
            req.onsuccess = () => resolve();
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    App.DB.deleteTransactionsByBatch = function (batchId) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("transactions", "readonly");
            const store = tx.objectStore("transactions");
            const idx   = store.index("byBatch");
            const req   = idx.getAllKeys(batchId);

            req.onsuccess = () => {
                const keys = req.result;
                if (keys.length === 0) return resolve();

                const tx2    = db.transaction("transactions", "readwrite");
                const store2 = tx2.objectStore("transactions");
                let done = 0;

                keys.forEach(k => {
                    const d = store2.delete(k);
                    d.onsuccess = () => { if (++done === keys.length) resolve(); };
                    d.onerror   = (e) => reject(e.target.error);
                });
            };

            req.onerror = (e) => reject(e.target.error);
        });
    };

    App.DB.clearTransactions = function () {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction("transactions", "readwrite");
            const store = tx.objectStore("transactions");
            const req   = store.clear();
            req.onsuccess = () => resolve();
            req.onerror   = (e) => reject(e.target.error);
        });
    };

    // ======================================================
    //  COMPUTED TOTALS
    // ======================================================

    App.DB.computeTotalsFromTransactions = async function () {
        const txList = await App.DB.getAllTransactions();
        const map    = {};

        txList.forEach(t => {
            const key = t.name + "|||" + t.teacher;
            if (!map[key]) map[key] = { online: 0, cash: 0 };
            map[key].online += Number(t.online || 0);
            map[key].cash   += Number(t.cash   || 0);
        });

        return map;
    };

    App.DB.getStudentsWithTotals = async function () {
        const [students, totalsMap] = await Promise.all([
            App.DB.getAllStudents(),
            App.DB.computeTotalsFromTransactions()
        ]);

        return students.map(s => {
            const key    = s.name + "|||" + s.teacher;
            const totals = totalsMap[key] || { online: 0, cash: 0 };
            return { ...s, online: totals.online, cash: totals.cash };
        });
    };

})();
