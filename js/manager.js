// ======================================================
//  App.Manager  —  School Manager Panel
//  v3: Stats first, Teacher table, Student table
//      Import history moved to Fundraiser panel
// ======================================================

window.App = window.App || {};
App.Manager = {};

(function () {

    const studentTableBody  = document.querySelector("#studentTable tbody");
    const teacherTableBody  = document.querySelector("#teacherTable tbody");
    const classListDiv      = document.getElementById("classList");
    const managerStatsDiv   = document.getElementById("managerStats");

    // --------------------------------------------------
    // Render all Manager content
    // --------------------------------------------------
    App.Manager.renderAll = async function () {
        await App.Manager.renderStudentTable();
        await App.Manager.renderTeacherTable();
        await App.Manager.renderClassList();
    };

    // --------------------------------------------------
    // Render Student Table
    // --------------------------------------------------
    App.Manager.renderStudentTable = async function () {
        const raw = await App.DB.getStudentsWithTotals();

        let students = App.StudentModel.build(raw, {
            includeLotteryFields: false,
            teacherFilter: App.State.currentTeacherFilter
        });

        // Apply search filter
        const searchEl = document.getElementById("studentSearch");
        const query    = searchEl ? searchEl.value.trim().toLowerCase() : "";
        if (query) {
            students = students.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.teacher.toLowerCase().includes(query)
            );
        }

        // Update count badge
        const countEl = document.getElementById("studentSearchCount");
        if (countEl) {
            const total = App.StudentModel.build(raw, {
                includeLotteryFields: false,
                teacherFilter: App.State.currentTeacherFilter
            }).length;
            countEl.textContent = query
                ? `${students.length} of ${total} shown`
                : `${total} students`;
        }

        const sortState = App.Renderer.getSortState("studentTable");
        const sorted    = App.Renderer.sortStudents(students, sortState);
        App.Renderer.applySortIndicators("studentTable", sortState);

        App.Renderer.renderStudentTable(studentTableBody, sorted, [
            { type: "index" },
            { type: "text",         key: "name" },
            { type: "text",         key: "teacher" },
            { type: "input-number", key: "online",  class: "onlineInput" },
            { type: "input-number", key: "cash",    class: "cashInput"   },
            { type: "currency",     key: "amount" },
            { type: "checkbox",     key: "exclude", class: "excludeBox"  },
            { type: "input-text",   key: "notes",   class: "noteBox"     },
            { type: "button",       label: "📋",    class: "btnTxDetail", title: "View transactions" },
            { type: "adjust" }
        ]);

        App.Manager.renderStats(students);
        if (App.Manager._updateActiveFiltersDisplay) App.Manager._updateActiveFiltersDisplay();
    };

    // --------------------------------------------------
    // Render Teacher Summary Table
    // --------------------------------------------------
    App.Manager.renderTeacherTable = async function () {
        if (!teacherTableBody) return;

        const raw       = await App.DB.getStudentsWithTotals();
        const students  = App.StudentModel.build(raw, { includeLotteryFields: false });

        // Group by teacher
        const teachers = {};
        students.forEach(s => {
            if (!teachers[s.teacher]) {
                teachers[s.teacher] = { teacher: s.teacher, enrolled: 0, participating: 0, online: 0, cash: 0 };
            }
            const t = teachers[s.teacher];
            t.enrolled++;
            if (s.amount > 0) t.participating++;
            t.online += s.online;
            t.cash   += s.cash;
        });

        const rows = Object.values(teachers).sort((a, b) =>
            a.teacher.localeCompare(b.teacher)
        );

        teacherTableBody.innerHTML = "";

        if (rows.length === 0) {
            teacherTableBody.innerHTML = `<tr><td colspan="7" style="color:#888;text-align:center;">No data</td></tr>`;
            return;
        }

        rows.forEach(t => {
            const total   = t.online + t.cash;
            const pctRate = t.enrolled > 0
                ? ((t.participating / t.enrolled) * 100).toFixed(0) + "%" : "—";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${t.teacher}</td>
                <td style="text-align:center;">${t.enrolled}</td>
                <td style="text-align:center;">${t.participating}</td>
                <td style="text-align:center;">${pctRate}</td>
                <td style="text-align:right;">$${t.online.toFixed(2)}</td>
                <td style="text-align:right;">$${t.cash.toFixed(2)}</td>
                <td style="text-align:right;font-weight:bold;">$${total.toFixed(2)}</td>
            `;
            teacherTableBody.appendChild(tr);
        });

        // Totals row
        const totOnline = rows.reduce((s, r) => s + r.online, 0);
        const totCash   = rows.reduce((s, r) => s + r.cash,   0);
        const totEnroll = rows.reduce((s, r) => s + r.enrolled, 0);
        const totPart   = rows.reduce((s, r) => s + r.participating, 0);
        const totPct    = totEnroll > 0 ? ((totPart / totEnroll) * 100).toFixed(0) + "%" : "—";

        const totRow = document.createElement("tr");
        totRow.style.fontWeight = "bold";
        totRow.style.background = "#f3f4f6";
        totRow.innerHTML = `
            <td>TOTAL</td>
            <td style="text-align:center;">${totEnroll}</td>
            <td style="text-align:center;">${totPart}</td>
            <td style="text-align:center;">${totPct}</td>
            <td style="text-align:right;">$${totOnline.toFixed(2)}</td>
            <td style="text-align:right;">$${totCash.toFixed(2)}</td>
            <td style="text-align:right;">$${(totOnline + totCash).toFixed(2)}</td>
        `;
        teacherTableBody.appendChild(totRow);
    };

    // --------------------------------------------------
    // Render Class List (sidebar)
    // --------------------------------------------------
    App.Manager.renderClassList = async function () {
        const students = await App.DB.getAllStudents();
        const teachers = [...new Set(students.map(s => s.teacher))].sort();

        classListDiv.innerHTML = "";

        teachers.forEach(t => {
            const btn = document.createElement("button");
            btn.className   = "btn-secondary";
            btn.textContent = t;
            btn.style.marginBottom = "4px";
            if (App.State.currentTeacherFilter === t) btn.classList.add("filter-active");

            btn.onclick = () => {
                App.State.currentTeacherFilter = t;
                App.Manager.renderStudentTable();
                App.Manager.renderTeacherTable();
                App.Manager.renderClassList();   // refresh to update badge + active state
            };

            classListDiv.appendChild(btn);
        });

        // Update always-visible active filters display (above sidebar-header)
        _updateActiveFiltersDisplay();
    };

    function _updateActiveFiltersDisplay() {
        const el = document.getElementById("activeFiltersDisplay");
        if (!el) return;
        const teacherF = App.State.currentTeacherFilter;
        const searchEl = document.getElementById("studentSearch");
        const searchQ  = searchEl ? searchEl.value.trim() : "";
        const parts = [];
        if (parts.length === 0 && !teacherF && !searchQ) {
            el.style.display = "none"; return;
        }
        if (teacherF) parts.push(`<div class="afd-item">🏫 Class: <strong>${teacherF}</strong><button class="afd-clear" onclick="App.State.currentTeacherFilter=null;App.Manager.renderAll();">✕</button></div>`);
        if (searchQ)  parts.push(`<div class="afd-item">🔍 Student: <strong>${searchQ}</strong><button class="afd-clear" onclick="(function(){var s=document.getElementById('studentSearch');if(s){s.value='';App.Manager.renderAll();}})()">✕</button></div>`);
        el.style.display = parts.length ? "block" : "none";
        el.innerHTML = (teacherF || searchQ)
            ? `<div class="afd-row-label">Active Filters</div>` + parts.join("")
            : "";
    }

    // Expose so search input can update it
    App.Manager._updateActiveFiltersDisplay = _updateActiveFiltersDisplay;

    // --------------------------------------------------
    // Stats Panel — full 3-row layout
    // --------------------------------------------------
    App.Manager.renderStats = function (students) {
        if (!managerStatsDiv) return;
        if (!students || students.length === 0) {
            managerStatsDiv.innerHTML = "";
            return;
        }

        const filterLabel      = App.State.currentTeacherFilter
            ? ` — ${App.State.currentTeacherFilter}` : " — All Classes";

        const totalOnline      = students.reduce((a, s) => a + s.online, 0);
        const totalCash        = students.reduce((a, s) => a + s.cash,   0);
        const totalAmount      = students.reduce((a, s) => a + s.amount, 0);
        const participating    = students.filter(s => s.amount > 0).length;
        const pctRate          = students.length > 0
            ? ((participating / students.length) * 100).toFixed(1) : "0.0";
        const avgPerStudent    = students.length > 0
            ? (totalAmount / students.length).toFixed(2) : "0.00";
        const avgPerParticipant = participating > 0
            ? (totalAmount / participating).toFixed(2) : "0.00";

        // Leaders (within current filter scope)
        const topStudent = students.length > 0
            ? students.reduce((a, b) => b.amount > a.amount ? b : a, students[0])
            : null;

        const classMap = {};
        students.forEach(s => {
            if (!classMap[s.teacher]) classMap[s.teacher] = { participating: 0, total: 0 };
            classMap[s.teacher].total += s.amount;
            if (s.amount > 0) classMap[s.teacher].participating++;
        });
        const classEntries = Object.entries(classMap);
        const topByRaised  = classEntries.length > 0
            ? classEntries.reduce((a, b) => b[1].total > a[1].total ? b : a, classEntries[0])
            : null;
        const topByPart    = classEntries.length > 0
            ? classEntries.reduce((a, b) => b[1].participating > a[1].participating ? b : a, classEntries[0])
            : null;

        function card(header, body, sub) {
            return `<div class="stats-card">
                <div class="stats-card-header">${header}</div>
                <div class="stats-card-body"><span>${body}</span>${sub ? `<div class="stats-card-sub">${sub}</div>` : ""}</div>
            </div>`;
        }

        managerStatsDiv.innerHTML = `
            <div class="stats-header">SUMMARY${filterLabel}</div>

            <div class="stats-section-label">TOTALS</div>
            <div class="stats-card-grid stats-row-money">
                ${card("Online",      "$" + totalOnline.toFixed(2))}
                ${card("Cash",        "$" + totalCash.toFixed(2))}
                ${card("Total Raised","$" + totalAmount.toFixed(2))}
            </div>

            <div class="stats-section-label" style="margin-top:12px;">PARTICIPATION</div>
            <div class="stats-card-grid">
                ${card("Students",        students.length)}
                ${card("Participating",   `${participating} <small style="font-size:11px;font-weight:normal;">(${pctRate}%)</small>`)}
                ${card("Avg / Student",   "$" + avgPerStudent)}
                ${card("Avg / Participant","$" + avgPerParticipant)}
            </div>

            <div class="stats-section-label" style="margin-top:12px;">LEADERS</div>
            <div class="stats-card-grid">
                ${topStudent && topStudent.amount > 0
                    ? card("Top Student", topStudent.name, "$" + topStudent.amount.toFixed(2))
                    : card("Top Student", "—")}
                ${topByRaised && topByRaised[1].total > 0
                    ? card("Top Class by Raised", topByRaised[0], "$" + topByRaised[1].total.toFixed(2))
                    : card("Top Class by Raised", "—")}
                ${topByPart && topByPart[1].participating > 0
                    ? card("Most Participants", topByPart[0], topByPart[1].participating + " students")
                    : card("Most Participants", "—")}
            </div>
        `;
    };

    // --------------------------------------------------
    // Reset Actions (lightweight — full reset on Fundraiser page)
    // --------------------------------------------------
    App.Manager.resetOnline = async function () {
        if (!confirm("Delete all ONLINE transactions? This cannot be undone.")) return;
        const all = await App.DB.getAllTransactions();
        for (const t of all) {
            if (Number(t.online || 0) > 0) await App.DB.deleteTransaction(t.id);
        }
        App.Manager.renderStudentTable();
        App.Manager.renderTeacherTable();
        App.Lottery.renderLotteryTable();
        App.Fundraiser.renderStats();
    };

    App.Manager.resetCash = async function () {
        if (!confirm("Delete all CASH transactions? This cannot be undone.")) return;
        const all = await App.DB.getAllTransactions();
        for (const t of all) {
            if (Number(t.cash || 0) > 0) await App.DB.deleteTransaction(t.id);
        }
        App.Manager.renderStudentTable();
        App.Manager.renderTeacherTable();
        App.Lottery.renderLotteryTable();
        App.Fundraiser.renderStats();
    };

    // --------------------------------------------------
    // Export CSV
    // --------------------------------------------------
    function toCSV(rows) {
        return rows.map(r =>
            r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
        ).join("\n");
    }

    function downloadCSV(filename, rows) {
        const blob = new Blob([toCSV(rows)], { type: "text/csv" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    }

    App.Manager.exportClass = async function () {
        const raw      = await App.DB.getStudentsWithTotals();
        const students = App.StudentModel.build(raw, {
            teacherFilter: App.State.currentTeacherFilter, includeLotteryFields: false
        });
        const rows = [
            ["Name", "Teacher", "Online", "Cash", "Notes", "Exclude"],
            ...students.map(s => [s.name, s.teacher, s.online, s.cash, s.notes || "", s.exclude ? "Y" : ""])
        ];
        downloadCSV("ClassExport.csv", rows);
    };

    App.Manager.exportAll = async function () {
        const raw      = await App.DB.getStudentsWithTotals();
        const students = App.StudentModel.build(raw, { includeLotteryFields: false });
        const rows = [
            ["Name", "Teacher", "Online", "Cash", "Notes", "Exclude"],
            ...students.map(s => [s.name, s.teacher, s.online, s.cash, s.notes || "", s.exclude ? "Y" : ""])
        ];
        downloadCSV("AllStudents.csv", rows);
    };

    // --------------------------------------------------
    // Export Full Session (for restore / backup)
    // --------------------------------------------------
    App.Manager.exportSession = async function () {
        const [students, txList, batches] = await Promise.all([
            App.DB.getAllStudents(),
            App.DB.getAllTransactions(),
            App.DB.getAllBatches()
        ]);

        const meta        = App.Fundraiser.getMeta();
        const seed        = App.State.currentSeed || App.State.lastSeed || "";
        const ticketsValid = App.State.ticketsValid ? "Y" : "";
        const drawDone    = (window._slm_drawState && window._slm_drawState.done) ? "Y" : "";
        const winners     = (window._slm_drawState && window._slm_drawState.winners) || [];

        const batchMap = {};
        batches.forEach(b => { batchMap[b.id] = b; });

        // Section 1: metadata header
        const rows = [];
        rows.push(["SLM_SESSION_EXPORT", "15.1"]);
        rows.push(["Fundraiser", meta.name || ""]);
        rows.push(["Notes",      meta.notes || ""]);
        rows.push(["CreatedAt",  meta.createdAt || ""]);
        rows.push(["Seed",       seed]);
        rows.push(["TicketsValid", ticketsValid]);
        rows.push(["DrawDone",   drawDone]);
        rows.push(["DollarPerTicket", App.State.dollarPerTicket || 5]);
        rows.push(["TicketRounding",  App.State.ticketRounding  || "floor"]);
        rows.push(["NumPrizes",  document.getElementById("numPrizes")?.value || 5]);
        rows.push([]);

        // Section 2: students
        rows.push(["STUDENTS"]);
        rows.push(["id", "name", "teacher", "notes", "exclude"]);
        students.forEach(s => rows.push([s.id, s.name, s.teacher, s.notes || "", s.exclude ? "Y" : ""]));
        rows.push([]);

        // Section 3: transactions (the full ledger)
        rows.push(["TRANSACTIONS"]);
        rows.push(["batchId", "batchFile", "batchMode", "batchDate", "rowNum", "name", "teacher", "online", "cash", "txDate", "notes"]);
        txList.forEach(t => {
            const b = batchMap[t.batchId] || {};
            rows.push([
                t.batchId, b.filename || "", b.mode || "", b.importedAt || "",
                t.rowNum != null ? t.rowNum : "", t.name, t.teacher,
                Number(t.online || 0).toFixed(2), Number(t.cash || 0).toFixed(2),
                t.txDate || "", t.notes || ""
            ]);
        });
        rows.push([]);

        // Section 4: winners (if draw has run)
        if (winners.length > 0) {
            rows.push(["WINNERS"]);
            rows.push(["prize", "code", "name", "teacher", "amount", "tickets"]);
            winners.forEach((w, i) => rows.push([i + 1, w.code, w.name, w.teacher, Number(w.amount || 0).toFixed(2), w.tickets]));
            rows.push([]);
        }

        const ts   = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const name = (meta.name || "session").replace(/[^a-z0-9_\-]/gi, "_");
        downloadCSV(`${name}_session_${ts}.csv`, rows);
    };

    // --------------------------------------------------
    // Reload Session
    // --------------------------------------------------
    App.Manager.reloadSession = async function (file) {
        if (!confirm(`Restore session from "${file.name}"?\n\nThis will DELETE all current data and replace it with the contents of this file. Make sure this is a valid session export.\n\nContinue?`)) return;

        const text = await file.text();
        const rows = _parseCSVRows(text);
        if (!rows || rows.length < 2) { alert("File appears empty or invalid."); return; }

        // Detect SLM session export format
        if (rows[0][0] === "SLM_SESSION_EXPORT") {
            await _restoreSessionExport(rows, file.name);
        } else {
            await _restoreLegacyFormat(rows, file.name);
        }

        await App.Manager.renderAll();
        await App.Lottery.renderLotteryTable();
        await App.Lottery.renderClassList();
        await App.Fundraiser.render();
    };

    function _parseCSVRows(text) {
        const rows = [];
        let current = [], value = "", inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (inQuotes) {
                if (ch === '"'  && text[i+1] === '"'){ value += '"'; i++; }
                else if (ch === '"'){ inQuotes = false; }
                else { value += ch; }
            } else {
                if      (ch === '"'){ inQuotes = true; }
                else if (ch === ','){ current.push(value); value = ""; }
                else if (ch === '\n' || ch === '\r'){
                    if (value !== "" || current.length > 0){ current.push(value); rows.push(current); current = []; value = ""; }
                } else { value += ch; }
            }
        }
        if (value !== "" || current.length > 0){ current.push(value); rows.push(current); }
        return rows;
    }

    async function _restoreSessionExport(rows, filename) {
        // Parse metadata, students, transactions, winners from SLM session format
        let section = "meta";
        const meta = { fundraiser:"", notes:"", createdAt:"", seed:"", ticketsValid:"", drawDone:"", dollar:5, rounding:"floor", numPrizes:5 };
        const students = [], transactions = [], winners = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0 || (r.length === 1 && !r[0])) continue;

            if (r[0] === "STUDENTS")     { section = "students"; continue; }
            if (r[0] === "TRANSACTIONS") { section = "transactions"; continue; }
            if (r[0] === "WINNERS")      { section = "winners"; continue; }

            if (section === "meta") {
                if (r[0] === "Fundraiser")      meta.fundraiser = r[1] || "";
                if (r[0] === "Notes")            meta.notes      = r[1] || "";
                if (r[0] === "CreatedAt")        meta.createdAt  = r[1] || "";
                if (r[0] === "Seed")             meta.seed       = r[1] || "";
                if (r[0] === "DrawDone")         meta.drawDone   = r[1] || "";
                if (r[0] === "DollarPerTicket")  meta.dollar     = Number(r[1]) || 5;
                if (r[0] === "TicketRounding")   meta.rounding   = r[1] || "floor";
                if (r[0] === "NumPrizes")        meta.numPrizes  = Number(r[1]) || 5;
            } else if (section === "students" && r[0] !== "id") {
                const [, name, teacher, notes, exclude] = r;
                if (name && teacher) students.push({ name, teacher, notes: notes || "", exclude: exclude === "Y" });
            } else if (section === "transactions" && r[0] !== "batchId") {
                const [batchId, batchFile, batchMode, batchDate, rowNum, name, teacher, online, cash, txDate, notes] = r;
                if (name && teacher) transactions.push({ batchId, batchFile, batchMode, batchDate, rowNum: rowNum ? Number(rowNum) : null, name, teacher, online: Number(online || 0), cash: Number(cash || 0), txDate: txDate || null, notes: notes || "" });
            } else if (section === "winners" && r[0] !== "prize") {
                const [prize, code, name, teacher, amount, tickets] = r;
                if (code && name) winners.push({ prizeNum: Number(prize), code, name, teacher, amount: Number(amount || 0), tickets: Number(tickets || 0) });
            }
        }

        // Clear and rebuild
        await App.DB.clearStudents();
        await App.DB.clearTransactions();
        await App.DB.clearBatches();

        for (const s of students) await App.DB.upsertStudent(s);

        // Rebuild batches and transactions grouped by batchFile+batchDate
        const batchKeyMap = {};
        for (const t of transactions) {
            const key = t.batchId + "|" + t.batchFile;
            if (!batchKeyMap[key]) {
                const newId = await App.DB.addBatch({ filename: t.batchFile || filename, importedAt: t.batchDate || new Date().toISOString(), mode: t.batchMode || "session-reload", rowCount: 0 });
                batchKeyMap[key] = newId;
            }
            const newBatchId = batchKeyMap[key];
            await App.DB.addTransaction({ name: t.name, teacher: t.teacher, online: t.online, cash: t.cash, txDate: t.txDate, notes: t.notes, rowNum: t.rowNum, batchId: newBatchId });
        }

        // Restore meta
        localStorage.setItem("slm_fundraiser_meta", JSON.stringify({ name: meta.fundraiser, notes: meta.notes, createdAt: meta.createdAt || new Date().toISOString() }));
        App.State.dollarPerTicket = meta.dollar;
        App.State.ticketRounding  = meta.rounding;
        const dollarEl = document.getElementById("dollarPerTicket");
        if (dollarEl) dollarEl.value = String(meta.dollar);
        const roundEl = document.getElementById("ticketRounding");
        if (roundEl) roundEl.value = meta.rounding;
        const prizesEl = document.getElementById("numPrizes");
        if (prizesEl) prizesEl.value = String(meta.numPrizes);

        // Restore seed
        if (meta.seed) {
            App.State.lastSeed = Number(meta.seed);
            const seedEl = document.getElementById("seedInput");
            if (seedEl) seedEl.value = meta.seed;
        }

        // If draw was done and there are winners, ask the user what to do
        if (meta.drawDone === "Y" && winners.length > 0) {
            await _promptRestoreDraw(winners, meta.seed);
        } else {
            App.Lottery.invalidateTickets();
        }
    }

    function _promptRestoreDraw(winners, seed) {
        return new Promise(resolve => {
            const overlay = document.createElement("div");
            overlay.style.cssText = "position:fixed;inset:0;z-index:9900;background:rgba(15,23,42,0.88);display:flex;align-items:center;justify-content:center;padding:16px;";
            overlay.innerHTML = `
                <div style="background:#1e293b;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:24px;max-width:420px;width:100%;color:#f1f5f9;">
                    <div style="font-size:28px;text-align:center;margin-bottom:10px;">🏆</div>
                    <h3 style="margin:0 0 8px;text-align:center;">Previous Draw Detected</h3>
                    <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;text-align:center;">
                        This session had <strong style="color:#f1f5f9;">${winners.length} winner${winners.length!==1?"s":""}</strong> drawn with seed <code style="color:#fbbf24;">${seed}</code>.
                    </p>
                    <p style="color:#94a3b8;font-size:12px;margin:0 0 18px;text-align:center;">What would you like to do?</p>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <button id="_rdRestore" style="padding:10px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;">
                            🏆 Restore draw results (view winners)
                        </button>
                        <button id="_rdFresh" style="padding:10px;background:rgba(255,255,255,.08);color:#cbd5e1;border:1px solid rgba(255,255,255,.15);border-radius:8px;cursor:pointer;font-size:13px;">
                            🎲 Re-run the draw (same seed, new shuffle)
                        </button>
                        <button id="_rdBlank" style="padding:10px;background:rgba(255,255,255,.05);color:#64748b;border:1px solid rgba(255,255,255,.08);border-radius:8px;cursor:pointer;font-size:13px;">
                            📋 Leave blank — I'll generate tickets manually
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector("#_rdRestore").onclick = async () => {
                document.body.removeChild(overlay);
                // Regenerate tickets with saved seed, then inject winners
                await App.Lottery.recalcTickets();
                if (window._slm_drawState) {
                    window._slm_drawState.winners = winners;
                    window._slm_drawState.done = true;
                    window._slm_drawState.hasRun = true;
                }
                App.Lottery.renderLotteryTable();
                resolve();
            };
            overlay.querySelector("#_rdFresh").onclick = async () => {
                document.body.removeChild(overlay);
                // Keep seed but invalidate so user regenerates
                App.Lottery.invalidateTickets();
                resolve();
            };
            overlay.querySelector("#_rdBlank").onclick = () => {
                document.body.removeChild(overlay);
                App.Lottery.invalidateTickets();
                resolve();
            };
        });
    }

    async function _restoreLegacyFormat(rows, filename) {
        // Original simple CSV: Name,Teacher,Online,Cash,Notes,Exclude
        await App.DB.clearStudents();
        await App.DB.clearTransactions();
        await App.DB.clearBatches();

        const batchId = await App.DB.addBatch({
            filename, importedAt: new Date().toISOString(),
            mode: "session-reload", rowCount: rows.length - 1
        });

        for (let i = 1; i < rows.length; i++) {
            const [name, teacher, online, cash, notes, exclude] = rows[i];
            if (!name || !teacher) continue;
            await App.DB.upsertStudent({ name, teacher, notes: notes || "", exclude: exclude === "Y" });
            const onlineVal = Number(online || 0), cashVal = Number(cash || 0);
            if (onlineVal > 0 || cashVal > 0) {
                await App.DB.addTransaction({ name, teacher, online: onlineVal, cash: cashVal, txDate: null, notes: "(session reload)", rowNum: i, batchId });
            }
        }
        App.Lottery.invalidateTickets();
    }

    // --------------------------------------------------
    // Transaction Drill-Down Modal
    // --------------------------------------------------
    App.Manager.openStudentTransactions = async function (name, teacher) {
        const modal = document.getElementById("txModal");
        const title = document.getElementById("txModalTitle");
        const tbody = document.querySelector("#txModalTable tbody");

        title.textContent   = `Transactions: ${name} (${teacher})`;
        tbody.innerHTML     = "<tr><td colspan='7'>Loading…</td></tr>";
        modal.style.display = "flex";

        await _renderTxModalRows(name, teacher, tbody);
    };

    async function _renderTxModalRows(name, teacher, tbody) {
        const [txList, batches] = await Promise.all([
            App.DB.getTransactionsByStudent(name, teacher),
            App.DB.getAllBatches()
        ]);

        const batchMap = {};
        batches.forEach(b => { batchMap[b.id] = b.filename; });

        if (txList.length === 0) {
            tbody.innerHTML = "<tr><td colspan='7' style='color:#888'>No transactions found.</td></tr>";
            return;
        }

        tbody.innerHTML = "";
        let totalOnline = 0, totalCash = 0;

        txList.forEach(t => {
            totalOnline += Number(t.online || 0);
            totalCash   += Number(t.cash   || 0);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${batchMap[t.batchId] || "(unknown)"}</td>
                <td style="text-align:center;">${t.rowNum != null ? t.rowNum : "—"}</td>
                <td>${t.txDate || ""}</td>
                <td>$${Number(t.online || 0).toFixed(2)}</td>
                <td>$${Number(t.cash   || 0).toFixed(2)}</td>
                <td>${t.notes || ""}</td>
                <td><button class="btn-danger btn-sm btnRemoveTx"
                    data-tx-id="${t.id}" data-name="${name}" data-teacher="${teacher}">Remove</button></td>
            `;
            tbody.appendChild(tr);
        });

        const totalsRow = document.createElement("tr");
        totalsRow.style.cssText = "font-weight:bold;background:#f3f4f6;";
        totalsRow.innerHTML = `
            <td colspan="3">TOTAL</td>
            <td>$${totalOnline.toFixed(2)}</td>
            <td>$${totalCash.toFixed(2)}</td>
            <td colspan="2"></td>
        `;
        tbody.appendChild(totalsRow);
    }

    // --------------------------------------------------
    // Inline Edit Handlers + Delegated Clicks
    // --------------------------------------------------
    document.addEventListener("change", async (e) => {
        const t = e.target;

        if (t.classList.contains("onlineInput") || t.classList.contains("cashInput")) {
            const isOnline = t.classList.contains("onlineInput");
            const newVal   = Number(t.value) || 0;
            const name     = t.dataset.name;
            const teacher  = t.dataset.teacher;

            // Capture the DB-true current value BEFORE the dialog, so we can revert on cancel
            const allTxPre    = await App.DB.getTransactionsByStudent(name, teacher);
            const prevOnline  = allTxPre.reduce((s, tx) => s + Number(tx.online || 0), 0);
            const prevCash    = allTxPre.reduce((s, tx) => s + Number(tx.cash   || 0), 0);
            const prevVal     = isOnline ? prevOnline : prevCash;

            await App.Lottery.warnDataChange("Editing student amounts", async () => {
            const batches   = await App.DB.getAllBatches();
            const today     = new Date().toDateString();
            let manualBatch = batches.find(b =>
                b.mode === "manual" && new Date(b.importedAt).toDateString() === today
            );

            if (!manualBatch) {
                const bid = await App.DB.addBatch({
                    filename: "(manual adjustments)", importedAt: new Date().toISOString(),
                    mode: "manual", rowCount: 0
                });
                manualBatch = { id: bid };
            }

            const allTx        = await App.DB.getTransactionsByStudent(name, teacher);
            const existingTx   = allTx.find(tx => tx.batchId === manualBatch.id);
            const currentOnline = allTx.reduce((s, tx) => s + Number(tx.online || 0), 0);
            const currentCash   = allTx.reduce((s, tx) => s + Number(tx.cash   || 0), 0);

            // Compute totals EXCLUDING any existing manual tx (which we may replace)
            const baseOnline = allTx.reduce((s, tx) => tx === existingTx ? s : s + Number(tx.online || 0), 0);
            const baseCash   = allTx.reduce((s, tx) => tx === existingTx ? s : s + Number(tx.cash   || 0), 0);

            if (existingTx) {
                await App.DB.deleteTransaction(existingTx.id);
            }

            // The delta needed to make the total equal newVal
            const deltaOnline = isOnline ? (newVal - baseOnline) : 0;
            const deltaCash   = isOnline ? 0 : (newVal - baseCash);

            if (deltaOnline !== 0 || deltaCash !== 0) {
                await App.DB.addTransaction({
                    name, teacher,
                    online: deltaOnline,
                    cash:   deltaCash,
                    txDate: null, notes: "manual edit", rowNum: null, batchId: manualBatch.id
                });
            }

            await App.Manager.renderStudentTable();
            await App.Manager.renderTeacherTable();
            await App.Lottery.renderLotteryTable();
            await App.Fundraiser.renderStats();
            }, () => {
                // Cancel: revert input to its true DB value
                t.value = String(prevVal);
            }); // end warnDataChange
        }

        if (t.classList.contains("excludeBox")) {
            await App.DB.updateStudent(Number(t.dataset.id), { exclude: t.checked });
            App.Manager.renderStudentTable();
            App.Lottery.renderLotteryTable();
        }

        if (t.classList.contains("noteBox")) {
            await App.DB.updateStudent(Number(t.dataset.id), { notes: t.value });
            App.Manager.renderStudentTable();
        }
    });

    document.addEventListener("click", async (e) => {
        // Tx detail button
        if (e.target.classList.contains("btnTxDetail")) {
            const name    = e.target.dataset.name;
            const teacher = e.target.dataset.teacher;
            if (name && teacher) App.Manager.openStudentTransactions(name, teacher);
        }

        // Remove tx from modal — with confirmation
        if (e.target.classList.contains("btnRemoveTx")) {
            const txId    = Number(e.target.dataset.txId);
            const name    = e.target.dataset.name;
            const teacher = e.target.dataset.teacher;
            if (!confirm(`Remove this transaction?\n\nThis will update ${name}'s total and appear in Import History as a removed entry.`)) return;
            await App.DB.deleteTransaction(txId);
            const tbody = document.querySelector("#txModalTable tbody");
            await _renderTxModalRows(name, teacher, tbody);
            await App.Manager.renderStudentTable();
            await App.Manager.renderTeacherTable();
            await App.Lottery.renderLotteryTable();
            await App.Fundraiser.renderStats();
        }

        // Close modal
        if (e.target.id === "txModalClose" || e.target.id === "txModalOverlay") {
            document.getElementById("txModal").style.display = "none";
        }
    });

})();
