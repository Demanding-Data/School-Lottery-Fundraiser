// ======================================================
//  App.Wizard  —  Import Wizard (CSV/XLSX)
//  v2: transaction-based import, accumulate vs reset mode
// ======================================================

window.App = window.App || {};
App.Wizard = {};

(function () {

    const wizardFile          = document.getElementById("wizardFile");
    const wizardModeLabel     = document.getElementById("wizardModeLabel");
    const wizardMappingSection= document.getElementById("wizardMappingSection");
    const mappingContainer    = document.getElementById("mappingContainer");

    const previewTableHead    = document.querySelector("#wizardPreviewTable thead");
    const previewTableBody    = document.querySelector("#wizardPreviewTable tbody");
    const mappedTableBody     = document.querySelector("#wizardMappedTable tbody");
    const btnImport           = document.getElementById("wizardImport");
    const importModeSection   = document.getElementById("wizardImportModeSection");

    // --------------------------------------------------
    // Wizard State
    // --------------------------------------------------
    App.Wizard.state = {
        mode:         null,
        rawRows:      [],
        header:       [],
        mapping:      {},
        importMode:   "accumulate",   // "accumulate" | "reset"
        savedMappings: JSON.parse(localStorage.getItem("wizard_mappings_v2") || "{}")
    };

    // --------------------------------------------------
    // Open Wizard
    // --------------------------------------------------
    App.Wizard.open = function (mode) {
        App.Wizard.state.mode = mode;

        wizardModeLabel.textContent =
            mode === "school-master" ? "Mode: School Master Import (replaces roster)" :
            mode === "school-merge"  ? "Mode: School Merge Import (adds to roster)"   :
            mode === "cash-online"   ? "Mode: Cash/Online Import"                     :
            "Mode: (unknown)";

        wizardFile.value = "";
        wizardMappingSection.style.display = "none";

        // Show the accumulate/reset toggle only for cash-online imports
        if (importModeSection) {
            importModeSection.style.display = mode === "cash-online" ? "block" : "none";
        }

        // Default to accumulate
        App.Wizard.state.importMode = "accumulate";
        const radioAcc = document.getElementById("importModeAccumulate");
        if (radioAcc) radioAcc.checked = true;

        App.State.activePanel = "wizard";
        App.showPanel("wizard");
    };

    // --------------------------------------------------
    // Import Mode radio listener
    // --------------------------------------------------
    document.addEventListener("change", (e) => {
        if (e.target.name === "importMode") {
            App.Wizard.state.importMode = e.target.value;
        }
    });

    // --------------------------------------------------
    // File Input Handler
    // --------------------------------------------------
    // Also re-parse when no-header toggle changes
    document.getElementById("wizardNoHeader")?.addEventListener("change", () => {
        if (wizardFile.files[0]) wizardFile.dispatchEvent(new Event("change"));
    });

    wizardFile.addEventListener("change", async () => {
        const file = wizardFile.files[0];
        if (!file) return;

        let rows = await readFile(file);
        if (!rows || rows.length === 0) {
            alert("File appears empty.");
            return;
        }

        // If no header row, synthesize column names
        const noHeader = document.getElementById("wizardNoHeader")?.checked;
        if (noHeader) {
            const numCols = rows[0].length;
            const syntheticHeader = Array.from({length: numCols}, (_, i) => `Column ${i + 1}`);
            rows = [syntheticHeader, ...rows];
        }

        App.Wizard.state.rawRows = rows;
        App.Wizard.state.header  = rows[0];

        buildMappingUI(rows[0]);
        buildPreviewTable(rows);

        wizardMappingSection.style.display = "block";

        tryAutoApplyMapping();
        buildMappedPreviewTable();
    });

    // --------------------------------------------------
    // Read File (CSV or XLSX)
    // --------------------------------------------------
    async function readFile(file) {
        const name = file.name.toLowerCase();

        if (name.endsWith(".csv")) {
            const text = await file.text();
            return parseCSV(text);
        }

        const data     = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { header: 1 });
    }

    // --------------------------------------------------
    // CSV Parser
    // --------------------------------------------------
    function parseCSV(text) {
        const rows = [];
        let current = [], value = "", inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const c = text[i];

            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { value += '"'; i++; }
                    else { inQuotes = false; }
                } else { value += c; }
            } else {
                if      (c === '"')                     { inQuotes = true; }
                else if (c === ",")                     { current.push(value); value = ""; }
                else if (c === "\n" || c === "\r")      {
                    if (value !== "" || current.length > 0) {
                        current.push(value);
                        rows.push(current);
                        current = []; value = "";
                    }
                } else { value += c; }
            }
        }

        if (value !== "" || current.length > 0) { current.push(value); rows.push(current); }

        return rows;
    }

    // --------------------------------------------------
    // Build Mapping UI
    // --------------------------------------------------
    const TARGET_DESCS = {
        name:    "Student's full name",
        teacher: "Teacher / class name",
        online:  "Online payment amount ($)",
        cash:    "Cash payment amount ($)",
        notes:   "Free-text notes",
        exclude: "Exclude from draw (Y/blank)",
        date:    "Transaction date"
    };
    const TARGET_LABELS = {
        name:"Name", teacher:"Teacher", online:"Online $", cash:"Cash $",
        notes:"Notes", exclude:"Exclude", date:"Date"
    };

    function buildMappingUI(header) {
        mappingContainer.innerHTML   = "";
        App.Wizard.state.mapping = {};

        const targets = ["name", "teacher", "online", "cash", "notes", "exclude", "date"];

        header.forEach((col, i) => {
            const row = document.createElement("div");
            row.className = "mapping-row";
            row.innerHTML = `
                <div>
                    <div class="mapping-row-label">Col ${i+1}: ${col}</div>
                </div>
                <select data-index="${i}" title="Map this column to a field">
                    <option value="">(ignore)</option>
                    ${targets.map(t => `<option value="${t}">${TARGET_LABELS[t]}</option>`).join("")}
                </select>
            `;
            // Show description under the select based on selection
            const sel = row.querySelector("select");
            const descDiv = document.createElement("div");
            descDiv.className = "mapping-row-desc";
            descDiv.style.gridColumn = "1 / -1";
            descDiv.style.marginTop = "-4px";
            descDiv.style.paddingTop = "0";
            row.appendChild(descDiv);

            sel.addEventListener("change", () => {
                const idx = Number(sel.dataset.index);
                App.Wizard.state.mapping[idx] = sel.value || null;
                descDiv.textContent = sel.value ? TARGET_DESCS[sel.value] : "";
                buildMappedPreviewTable();
            });
            mappingContainer.appendChild(row);
        });
    }

    // --------------------------------------------------
    // Auto-Apply Saved Mapping
    // --------------------------------------------------
    function tryAutoApplyMapping() {
        const mode  = App.Wizard.state.mode;
        const saved = App.Wizard.state.savedMappings[mode];
        if (!saved) return;

        const header = App.Wizard.state.header;
        if (!arraysMatch(header, saved.header)) return;

        mappingContainer.querySelectorAll("select").forEach(sel => {
            const idx    = Number(sel.dataset.index);
            const mapped = saved.mapping[idx];
            if (mapped) sel.value = mapped;
        });

        App.Wizard.state.mapping = saved.mapping;
    }

    function arraysMatch(a, b) {
        if (a.length !== b.length) return false;
        return a.every((v, i) => v === b[i]);
    }

    // --------------------------------------------------
    // Raw Preview Table
    // --------------------------------------------------
    function buildPreviewTable(rows) {
        previewTableHead.innerHTML = "";
        previewTableBody.innerHTML = "";

        const header  = rows[0];
        const first10 = rows.slice(1, 11);

        previewTableHead.innerHTML = `<tr>${header.map(h => `<th>${h}</th>`).join("")}</tr>`;
        first10.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = r.map(v => `<td>${v}</td>`).join("");
            previewTableBody.appendChild(tr);
        });
    }

    // --------------------------------------------------
    // Mapped Preview Table — shows summed values per student
    // --------------------------------------------------
    function buildMappedPreviewTable() {
        mappedTableBody.innerHTML = "";

        const rows    = App.Wizard.state.rawRows;
        const mapping = App.Wizard.state.mapping;

        // Show raw mapped rows (first 10) in preview
        const first10 = rows.slice(1, 11);
        first10.forEach(r => {
            const obj = mapRow(r, mapping);
            const tr  = document.createElement("tr");
            tr.innerHTML = `
                <td>${obj.name    || ""}</td>
                <td>${obj.teacher || ""}</td>
                <td>${obj.online  != null ? "$" + Number(obj.online).toFixed(2) : ""}</td>
                <td>${obj.cash    != null ? "$" + Number(obj.cash).toFixed(2)   : ""}</td>
                <td>${obj.date    || ""}</td>
                <td>${obj.notes   || ""}</td>
                <td>${obj.exclude ? "Y" : ""}</td>
            `;
            mappedTableBody.appendChild(tr);
        });

        // Show import summary below preview
        const summaryDiv = document.getElementById("wizardImportSummary");
        if (!summaryDiv) return;

        const allRows = rows.slice(1).map(r => mapRow(r, mapping)).filter(o => o.name && o.teacher);
        const grouped = {};

        allRows.forEach(o => {
            const key = o.name + "|||" + o.teacher;
            if (!grouped[key]) grouped[key] = { name: o.name, teacher: o.teacher, online: 0, cash: 0, count: 0 };
            grouped[key].online += Number(o.online || 0);
            grouped[key].cash   += Number(o.cash   || 0);
            grouped[key].count++;
        });

        const entries     = Object.values(grouped);
        const multiEntry  = entries.filter(e => e.count > 1);
        const totalOnline = entries.reduce((s, e) => s + e.online, 0);
        const totalCash   = entries.reduce((s, e) => s + e.cash,   0);

        summaryDiv.innerHTML = `
            <div class="wizard-summary-box">
                <strong>Import Summary</strong>
                <span>${allRows.length} row${allRows.length !== 1 ? "s" : ""} → ${entries.length} unique student${entries.length !== 1 ? "s" : ""}</span>
                ${multiEntry.length > 0 ? `<span style="color:#d97706;">⚠ ${multiEntry.length} student${multiEntry.length !== 1 ? "s" : ""} appear multiple times — each row will be stored separately</span>` : ""}
                <span>Total Online: <strong>$${totalOnline.toFixed(2)}</strong> &nbsp; Total Cash: <strong>$${totalCash.toFixed(2)}</strong></span>
            </div>
        `;
    }

    function mapRow(row, mapping) {
        const obj = {};

        Object.keys(mapping).forEach(idx => {
            const target = mapping[idx];
            if (!target) return;

            let val = row[idx];

            if (target === "online" || target === "cash") {
                val = Number(String(val || "").replace(/[^0-9.-]/g, "")) || 0;
            }
            if (target === "exclude") {
                val = String(val).trim().toUpperCase() === "Y";
            }

            obj[target] = val;
        });

        return obj;
    }

    // --------------------------------------------------
    // Import Button
    // --------------------------------------------------
    btnImport.addEventListener("click", async () => {
        const mode       = App.Wizard.state.mode;
        const rows       = App.Wizard.state.rawRows;
        const mapping    = App.Wizard.state.mapping;
        const importMode = App.Wizard.state.importMode;
        const filename   = wizardFile.files[0]?.name || "(unknown file)";

        if (!rows || rows.length < 2) {
            alert("Nothing to import.");
            return;
        }

        // Save mapping for next time
        App.Wizard.state.savedMappings[mode] = {
            header:  App.Wizard.state.header,
            mapping: { ...mapping }
        };
        localStorage.setItem("wizard_mappings_v2", JSON.stringify(App.Wizard.state.savedMappings));

        const dataRows = rows.slice(1)
            .map(r => mapRow(r, mapping))
            .filter(o => o.name && o.teacher);

        if (dataRows.length === 0) {
            alert("No valid rows found. Make sure Name and Teacher columns are mapped.");
            return;
        }

        // -----------------------------------------------
        // School Master — clears everything, rebuilds roster
        // -----------------------------------------------
        if (mode === "school-master") {
            if (!confirm(`This will DELETE all existing students, transactions, and import history, then reload ${dataRows.length} students. Continue?`)) return;

            await App.DB.clearStudents();
            await App.DB.clearTransactions();
            await App.DB.clearBatches();

            const hasMoney = dataRows.some(o => Number(o.online||0) + Number(o.cash||0) > 0);
            let batchId = null;
            if (hasMoney) {
                batchId = await App.DB.addBatch({
                    filename:   filename,
                    importedAt: new Date().toISOString(),
                    mode:       "school-master",
                    rowCount:   0
                });
            }

            let txCount = 0;
            for (const obj of dataRows) {
                await App.DB.upsertStudent(obj);
                if (hasMoney && batchId) {
                    const online = Number(obj.online || 0);
                    const cash   = Number(obj.cash   || 0);
                    if (online > 0 || cash > 0) {
                        await App.DB.addTransaction({
                            name: obj.name, teacher: obj.teacher,
                            online, cash,
                            txDate: obj.date || null,
                            notes:  obj.notes || "school roster import",
                            rowNum: ++txCount,
                            batchId
                        });
                    }
                }
            }

            if (batchId) await App.DB.updateBatch(batchId, { rowCount: txCount });
            alert(`School master import complete. ${dataRows.length} students loaded${hasMoney ? `, ${txCount} money rows imported` : ""}.`);
        }

        // -----------------------------------------------
        // School Merge — adds/updates roster, imports money if present
        // -----------------------------------------------
        else if (mode === "school-merge") {
            const hasMoney = dataRows.some(o => Number(o.online||0) + Number(o.cash||0) > 0);
            let batchId = null;
            if (hasMoney) {
                batchId = await App.DB.addBatch({
                    filename:   filename,
                    importedAt: new Date().toISOString(),
                    mode:       "school-merge",
                    rowCount:   0
                });
            }

            let txCount = 0;
            for (const obj of dataRows) {
                await App.DB.upsertStudent(obj);
                if (hasMoney && batchId) {
                    const online = Number(obj.online || 0);
                    const cash   = Number(obj.cash   || 0);
                    if (online > 0 || cash > 0) {
                        await App.DB.addTransaction({
                            name: obj.name, teacher: obj.teacher,
                            online, cash,
                            txDate: obj.date || null,
                            notes:  obj.notes || "school merge import",
                            rowNum: ++txCount,
                            batchId
                        });
                    }
                }
            }

            if (batchId) await App.DB.updateBatch(batchId, { rowCount: txCount });
            alert(`School merge complete. ${dataRows.length} students processed${hasMoney ? `, ${txCount} money rows imported` : ""}.`);
        }

        // -----------------------------------------------
        // Cash/Online — transaction-based import
        // One transaction stored per raw row (preserves duplicates)
        // -----------------------------------------------
        else if (mode === "cash-online") {

            // If Reset mode: wipe all existing transactions & batches first
            if (importMode === "reset") {
                if (!confirm("This will delete ALL existing transactions and import history, then re-import from this file. Continue?")) return;
                await App.DB.clearTransactions();
                await App.DB.clearBatches();
            }

            // Create the batch record
            const batchId = await App.DB.addBatch({
                filename:   filename,
                importedAt: new Date().toISOString(),
                mode:       "cash-online-" + importMode,
                rowCount:   dataRows.length
            });

            // Track unique students for roster check
            const seenStudents = {};
            let txCount = 0;

            // Store every row individually — row number is 1-based from original file
            for (let i = 0; i < dataRows.length; i++) {
                const o      = dataRows[i];
                const rowNum = i + 2; // +2: 1-based + skip header row

                // Ensure student exists in roster
                const key = o.name + "|||" + o.teacher;
                if (!seenStudents[key]) {
                    seenStudents[key] = true;
                    const existing = await _findStudent(o.name, o.teacher);
                    if (!existing) {
                        await App.DB.upsertStudent({ name: o.name, teacher: o.teacher });
                    }
                }

                // Store transaction for every row, even $0 rows (visible in history)
                await App.DB.addTransaction({
                    name:    o.name,
                    teacher: o.teacher,
                    online:  Number(o.online || 0),
                    cash:    Number(o.cash   || 0),
                    txDate:  o.date  || null,
                    notes:   o.notes || "",
                    rowNum,
                    batchId
                });

                txCount++;
            }

            const uniqueCount = Object.keys(seenStudents).length;
            const dupeNote    = dataRows.length !== uniqueCount
                ? ` — ${dataRows.length - uniqueCount} duplicate student row${dataRows.length - uniqueCount !== 1 ? "s" : ""} preserved as separate entries`
                : "";

            alert(`Import complete. ${txCount} rows imported across ${uniqueCount} unique student${uniqueCount !== 1 ? "s" : ""}${dupeNote}.`);
        }

        // Re-render everything (data already written — no need to gate on warnDataChange)
        App.Lottery.invalidateTickets();   // tickets stale after any import
        await App.Manager.renderAll();
        await App.Lottery.renderLotteryTable();
        await App.Lottery.renderClassList();
        await App.Fundraiser.render();

        // Route to most relevant panel after import
        App.showPanel(mode === "cash-online" ? "fundraiser" : "manager");
    });

    // --------------------------------------------------
    // Helper: find student by name+teacher
    // --------------------------------------------------
    async function _findStudent(name, teacher) {
        const all = await App.DB.getAllStudents();
        return all.find(s =>
            s.name.toLowerCase()    === name.toLowerCase() &&
            s.teacher.toLowerCase() === teacher.toLowerCase()
        );
    }

})();
