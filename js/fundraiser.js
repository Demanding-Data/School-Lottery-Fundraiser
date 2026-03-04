// ======================================================
//  App.Fundraiser  —  Fundraiser Manager Panel
//  Handles: project name/notes, created date, import
//  history, reset, and fundraiser-level stats
// ======================================================

window.App = window.App || {};
App.Fundraiser = {};

(function () {

    const LS_KEY = "slm_fundraiser_meta";

    // --------------------------------------------------
    // Load / Save meta (name, notes, createdAt)
    // --------------------------------------------------
    function loadMeta() {
        try {
            return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        } catch { return {}; }
    }

    function saveMeta(meta) {
        localStorage.setItem(LS_KEY, JSON.stringify(meta));
    }

    App.Fundraiser.getMeta = loadMeta;

    // --------------------------------------------------
    // Render full Fundraiser panel
    // --------------------------------------------------
    App.Fundraiser.render = async function () {
        await App.Fundraiser.renderMeta();
        await App.Fundraiser.renderStats();
        await App.Fundraiser.renderImportHistory();
    };

    // --------------------------------------------------
    // Render project name / notes / created date
    // --------------------------------------------------
    App.Fundraiser.renderMeta = function () {
        const meta       = loadMeta();
        const nameEl     = document.getElementById("fundraiserName");
        const notesEl    = document.getElementById("fundraiserNotes");
        const createdEl  = document.getElementById("fundraiserCreated");

        if (nameEl)    nameEl.value    = meta.name    || "";
        if (notesEl)   notesEl.value   = meta.notes   || "";
        if (createdEl) {
            if (meta.createdAt) {
                const d = new Date(meta.createdAt);
                createdEl.textContent = "Created: " + d.toLocaleDateString() + " " +
                    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            } else {
                createdEl.textContent = "";
            }
        }
    };

    // --------------------------------------------------
    // Fundraiser-level stats
    // --------------------------------------------------
    App.Fundraiser.renderStats = async function () {
        const container = document.getElementById("fundraiserStats");
        if (!container) return;

        const [students, totalsMap, batches, txList] = await Promise.all([
            App.DB.getAllStudents(),
            App.DB.computeTotalsFromTransactions(),
            App.DB.getAllBatches(),
            App.DB.getAllTransactions()
        ]);

        const enriched = students.map(s => {
            const key    = s.name + "|||" + s.teacher;
            const totals = totalsMap[key] || { online: 0, cash: 0 };
            return { ...s, online: totals.online, cash: totals.cash, amount: totals.online + totals.cash };
        });

        const totalStudents = enriched.length;
        const participating = enriched.filter(s => s.amount > 0).length;
        const totalOnline   = enriched.reduce((a, s) => a + s.online, 0);
        const totalCash     = enriched.reduce((a, s) => a + s.cash,   0);
        const totalRaised   = totalOnline + totalCash;
        const participationPct = totalStudents > 0
            ? ((participating / totalStudents) * 100).toFixed(1) : "0.0";
        const avgPerStudent    = totalStudents > 0
            ? (totalRaised / totalStudents).toFixed(2) : "0.00";
        const avgPerParticipant = participating > 0
            ? (totalRaised / participating).toFixed(2) : "0.00";

        // Top student
        const topStudent = enriched.length > 0
            ? enriched.reduce((a, b) => b.amount > a.amount ? b : a, enriched[0])
            : null;

        // Class rollups
        const classMap = {};
        enriched.forEach(s => {
            if (!classMap[s.teacher]) classMap[s.teacher] = { enrolled: 0, participating: 0, total: 0 };
            classMap[s.teacher].enrolled++;
            classMap[s.teacher].total += s.amount;
            if (s.amount > 0) classMap[s.teacher].participating++;
        });

        const classEntries = Object.entries(classMap);

        const topClassByRaised = classEntries.length > 0
            ? classEntries.reduce((a, b) => b[1].total > a[1].total ? b : a, classEntries[0])
            : null;

        const topClassByParticipants = classEntries.length > 0
            ? classEntries.reduce((a, b) => b[1].participating > a[1].participating ? b : a, classEntries[0])
            : null;

        // Import info
        const lastBatch = batches.length > 0
            ? [...batches].sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt))[0]
            : null;
        const lastImport = lastBatch
            ? new Date(lastBatch.importedAt).toLocaleDateString() + " " +
              new Date(lastBatch.importedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "None";

        const donationTxCount = txList.filter(t =>
            (Number(t.online || 0) + Number(t.cash || 0)) > 0
        ).length;

        function card(header, body, sub) {
            return `
                <div class="stats-card">
                    <div class="stats-card-header">${header}</div>
                    <div class="stats-card-body">
                        <span>${body}</span>
                        ${sub ? `<div class="stats-card-sub">${sub}</div>` : ""}
                    </div>
                </div>`;
        }

        container.innerHTML = `
            <!-- Row 1: Money totals — full width -->
            <div class="stats-section-label">FUNDRAISING TOTALS</div>
            <div class="stats-card-grid stats-row-money">
                ${card("Online",  "$" + totalOnline.toFixed(2))}
                ${card("Cash",    "$" + totalCash.toFixed(2))}
                ${card("Total Raised", "$" + totalRaised.toFixed(2))}
            </div>

            <!-- Row 2: Participation -->
            <div class="stats-section-label" style="margin-top:14px;">PARTICIPATION</div>
            <div class="stats-card-grid">
                ${card("Students",     totalStudents)}
                ${card("Participating", `${participating} <small style="font-size:11px;font-weight:normal;">(${participationPct}%)</small>`)}
                ${card("Avg / Student",     "$" + avgPerStudent)}
                ${card("Avg / Participant",  "$" + avgPerParticipant)}
                ${card("Donations",    donationTxCount)}
                ${card("Imports",      batches.length)}
            </div>

            <!-- Row 3: Leaders -->
            <div class="stats-section-label" style="margin-top:14px;">LEADERS</div>
            <div class="stats-card-grid">
                ${topStudent && topStudent.amount > 0
                    ? card("Top Student", topStudent.name, "$" + topStudent.amount.toFixed(2) + " &bull; " + topStudent.teacher)
                    : card("Top Student", "—")}
                ${topClassByRaised && topClassByRaised[1].total > 0
                    ? card("Top Class by Raised", topClassByRaised[0], "$" + topClassByRaised[1].total.toFixed(2))
                    : card("Top Class by Raised", "—")}
                ${topClassByParticipants && topClassByParticipants[1].participating > 0
                    ? card("Most Participants", topClassByParticipants[0], topClassByParticipants[1].participating + " students")
                    : card("Most Participants", "—")}
                ${card("Last Import", lastImport)}
            </div>
        `;
    };

    // --------------------------------------------------
    // Import History (moved from Manager)
    // --------------------------------------------------
    App.Fundraiser.renderImportHistory = async function () {
        const container = document.getElementById("fundraiserImportHistory");
        if (!container) return;

        const batches = await App.DB.getAllBatches();
        batches.sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt));

        if (batches.length === 0) {
            container.innerHTML = "<p style='color:#888;font-size:12px;'>No imports yet.</p>";
            return;
        }

        container.innerHTML = "";

        for (const batch of batches) {
            const txList      = await App.DB.getTransactionsByBatch(batch.id);
            const totalOnline = txList.reduce((s, t) => s + Number(t.online || 0), 0);
            const totalCash   = txList.reduce((s, t) => s + Number(t.cash   || 0), 0);
            const dt          = new Date(batch.importedAt);
            const dtStr       = dt.toLocaleDateString() + " " +
                dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const modeLabel   =
                batch.mode === "cash-online-accumulate" ? "Accumulate"  :
                batch.mode === "cash-online-reset"      ? "Reset & Re-sum" :
                batch.mode === "legacy-migration"       ? "Legacy Migration" :
                batch.mode === "session-reload"         ? "Session Reload" :
                batch.mode === "manual"                 ? "Manual Adjustment" :
                batch.mode;

            const card = document.createElement("div");
            card.className = "batch-card";
            card.innerHTML = `
                <div class="batch-card-header">
                    <div>
                        <span class="batch-filename">${batch.filename}</span>
                        <span class="batch-mode-tag">${modeLabel}</span>
                    </div>
                    <div class="batch-meta">${dtStr}</div>
                </div>
                <div class="batch-stats">
                    <span>${txList.length} row${txList.length !== 1 ? "s" : ""}</span>
                    <span>Online: <strong>$${totalOnline.toFixed(2)}</strong></span>
                    <span>Cash: <strong>$${totalCash.toFixed(2)}</strong></span>
                </div>
                <div class="batch-actions">
                    <button class="btn-secondary btn-sm btnExpandBatchFR" data-batch-id="${batch.id}">Show Rows</button>
                    <button class="btn-danger btn-sm btnDeleteBatchFR" data-batch-id="${batch.id}">Delete Batch</button>
                </div>
                <div class="batch-rows" id="frBatchRows_${batch.id}" style="display:none;"></div>
            `;
            container.appendChild(card);
        }
    };

    // --------------------------------------------------
    // Expand batch rows (Fundraiser page version)
    // --------------------------------------------------
    async function renderFRBatchRows(batchId, container) {
        const txList = await App.DB.getTransactionsByBatch(batchId);

        if (txList.length === 0) {
            container.innerHTML = "<p style='font-size:11px;color:#888;'>No rows.</p>";
            return;
        }

        let html = `
            <table class="batch-tx-table">
                <thead>
                    <tr>
                        <th>Row #</th><th>Student</th><th>Teacher</th>
                        <th>Online</th><th>Cash</th><th>Date</th><th>Notes</th><th></th>
                    </tr>
                </thead><tbody>
        `;

        txList.forEach(t => {
            html += `
                <tr>
                    <td style="text-align:center;color:#6b7280;">${t.rowNum != null ? t.rowNum : "—"}</td>
                    <td>${t.name}</td><td>${t.teacher}</td>
                    <td>$${Number(t.online || 0).toFixed(2)}</td>
                    <td>$${Number(t.cash   || 0).toFixed(2)}</td>
                    <td>${t.txDate || ""}</td>
                    <td>${t.notes  || ""}</td>
                    <td>
                        <button class="btn-danger btn-sm btnRemoveFRTx"
                            data-tx-id="${t.id}" data-batch-id="${batchId}">✕</button>
                    </td>
                </tr>
            `;
        });

        html += "</tbody></table>";
        container.innerHTML = html;

        container.querySelectorAll(".btnRemoveFRTx").forEach(btn => {
            btn.addEventListener("click", async () => {
                await App.DB.deleteTransaction(Number(btn.dataset.txId));
                await renderFRBatchRows(batchId, container);
                App.Manager.renderStudentTable();
                App.Lottery.renderLotteryTable();
                App.Fundraiser.renderStats();
            });
        });
    }

    // --------------------------------------------------
    // Delegated click handler for Fundraiser panel
    // --------------------------------------------------
    document.addEventListener("click", async (e) => {

        if (e.target.classList.contains("btnExpandBatchFR")) {
            const batchId = Number(e.target.dataset.batchId);
            const rowsDiv = document.getElementById("frBatchRows_" + batchId);
            const isOpen  = rowsDiv.style.display !== "none";

            if (isOpen) {
                rowsDiv.style.display = "none";
                e.target.textContent  = "Show Rows";
            } else {
                rowsDiv.style.display = "block";
                e.target.textContent  = "Hide Rows";
                await renderFRBatchRows(batchId, rowsDiv);
            }
        }

        if (e.target.classList.contains("btnDeleteBatchFR")) {
            const batchId = Number(e.target.dataset.batchId);
            if (!confirm("Delete this entire import batch and all its transactions?")) return;
            await App.DB.deleteTransactionsByBatch(batchId);
            await App.DB.deleteBatch(batchId);
            await App.Fundraiser.render();
            App.Manager.renderStudentTable();
            App.Lottery.renderLotteryTable();
        }
    });

    // --------------------------------------------------
    // Save name / notes on input
    // --------------------------------------------------
    document.addEventListener("input", (e) => {
        if (e.target.id === "fundraiserName" || e.target.id === "fundraiserNotes") {
            const meta = loadMeta();
            if (e.target.id === "fundraiserName")  meta.name  = e.target.value;
            if (e.target.id === "fundraiserNotes") meta.notes = e.target.value;
            saveMeta(meta);
        }
    });

    // --------------------------------------------------
    // Reset all data (from Fundraiser page)
    // --------------------------------------------------
    App.Fundraiser.resetAll = async function () {
        if (!confirm(
            "This will permanently delete ALL students, transactions, import history, and fundraiser info.\n\nAre you absolutely sure?"
        )) return;

        await App.DB.clearStudents();
        await App.DB.clearTransactions();
        await App.DB.clearBatches();

        // Reset meta but record new creation time
        saveMeta({ createdAt: new Date().toISOString() });

        App.State.currentTeacherFilter      = null;
        App.State.lotteryTeacherFilter      = null;

        await App.Fundraiser.render();
        await App.Manager.renderStudentTable();
        await App.Manager.renderClassList();
        await App.Manager.renderTeacherTable();
        await App.Lottery.renderLotteryTable();
        await App.Lottery.renderClassList();
    };

    // --------------------------------------------------
    // Initialize: set createdAt if first ever open
    // --------------------------------------------------
    App.Fundraiser.init = function () {
        const meta = loadMeta();
        if (!meta.createdAt) {
            meta.createdAt = new Date().toISOString();
            saveMeta(meta);
        }
    };

})();
