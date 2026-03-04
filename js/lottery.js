// ======================================================
//  App.Lottery  —  Lottery Draw Logic  v15
//
//  TICKET STATE MACHINE
//  ticketsValid = false on init, after data/seed/$/ticket changes
//  ticketsValid = true only after successful Recalculate
//  Run Draw button disabled while !ticketsValid
//  Seed input always shows current numeric seed value
//
//  DRAW MODAL
//  Spinner shows name/teacher only if reveal controls checked
//  Running list in modal also respects reveal controls
// ======================================================

window.App = window.App || {};
App.Lottery = {};

(function () {

    const lotteryTableBody = document.querySelector("#lotteryStudentTable tbody");
    const winnersTableHead = document.getElementById("winnersTableHead");
    const winnersTableBody = document.querySelector("#winnersTable tbody");
    const ticketPoolBody   = document.getElementById("ticketPoolBody");
    const btnAudit         = document.getElementById("btnDownloadAudit");
    const btnPrintTickets  = document.getElementById("btnPrintTickets");
    const btnRunDraw       = document.getElementById("btnRunDraw");
    const lotteryClassList = document.getElementById("lotteryClassList");

    const drawModal         = document.getElementById("drawModal");
    const drawModeModal     = document.getElementById("drawModeModal");
    const drawSpinnerCode   = document.getElementById("drawSpinnerCode");
    const drawSpinnerMeta   = document.getElementById("drawSpinnerMeta");   // NEW: name/teacher line
    const drawWinnerBanner  = document.getElementById("drawWinnerBanner");
    const drawPrizeLabel    = document.getElementById("drawPrizeLabel");
    const drawWinnersList   = document.getElementById("drawWinnersList");
    const btnCloseDraw      = document.getElementById("btnCloseDraw");
    const btnCloseDrawTop   = document.getElementById("btnCloseDrawTop");
    const btnDrawModalAudit = document.getElementById("btnDrawModalAudit");
    const confettiCanvas    = document.getElementById("confettiCanvas");
    const seedInput         = document.getElementById("seedInput");

    // --------------------------------------------------
    // Ticket validity state
    // --------------------------------------------------
    function _setTicketsValid(valid) {
        App.State.ticketsValid = valid;
        _updateRunDrawBtn();
        _updateRecalcBtn(valid);

        const poolSection = document.getElementById("ticketPoolSection");
        if (poolSection) {
            poolSection.style.opacity = valid ? "1" : "0.45";
        }

        // Show/hide stale banners (on both lottery and school pages)
        const staleBanner = document.getElementById("poolStaleBanner");
        if (staleBanner) staleBanner.style.display = valid ? "none" : "block";
        const lotteryBanner = document.getElementById("lotteryPoolStaleBanner");
        if (lotteryBanner) lotteryBanner.style.display = valid ? "none" : "block";
    }

    function _updateRecalcBtn(valid) {
        const btn = document.getElementById("btnRecalcTickets");
        if (!btn) return;
        // If tickets have been generated before (pool exists in state), show Regenerate
        const hasEverGenerated = App.State.ticketPool !== null || (drawState && drawState.hasRun);
        btn.textContent = (valid || hasEverGenerated) ? "🔄 Regenerate Tickets" : "⚡ Generate Tickets";
        btn.title       = valid ? "Tickets are up to date — regenerate to use a new seed" : "";
    }

    function _updateRunDrawBtn() {
        if (!btnRunDraw) return;
        const valid = App.State.ticketsValid;
        const done  = drawState.done && drawState.winners.length > 0;
        if (done) {
            // Reopen mode — always allowed
            btnRunDraw.disabled = false;
            btnRunDraw.title    = "View previous draw results";
        } else if (valid) {
            btnRunDraw.disabled = false;
            btnRunDraw.title    = "";
        } else {
            btnRunDraw.disabled = true;
            btnRunDraw.title    = "Recalculate tickets first";
        }
    }

    // --------------------------------------------------
    // Invalidate tickets (data changed, seed changed, etc.)
    // --------------------------------------------------
    App.Lottery.invalidateTickets = function () {
        App.State.ticketPool   = null;
        App.State.ticketsValid = false;
        drawState.hasRun       = false;
        _setTicketsValid(false);
        _clearPoolTable();
        if (btnPrintTickets) btnPrintTickets.disabled = true;
    };

    function _clearPoolTable() {
        if (ticketPoolBody) {
            ticketPoolBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;padding:16px;">
                Tickets need to be recalculated. Click <strong>Recalculate Tickets</strong>.
            </td></tr>`;
        }
    }

    // --------------------------------------------------
    // Watch seed input — invalidate if it changes
    // --------------------------------------------------
    let _lastSeedInputValue = "";
    if (seedInput) {
        seedInput.addEventListener("input", () => {
            const current = seedInput.value.trim();
            if (current !== _lastSeedInputValue) {
                _lastSeedInputValue = current;
                if (App.State.ticketsValid) {
                    App.Lottery.invalidateTickets();
                }
            }
        });
    }

    // --------------------------------------------------
    // Watch dollar-per-ticket + rounding — invalidate on change
    // --------------------------------------------------
    const dollarInput    = document.getElementById("dollarPerTicket");
    const roundingSelect = document.getElementById("ticketRounding");

    if (dollarInput) {
        dollarInput.addEventListener("change", async () => {
            const newVal  = Number(dollarInput.value) || 5;
            const oldVal  = App.State.dollarPerTicket;
            if (newVal === oldVal) return;
            const ok = await _warnSettingChange("$ per ticket changed");
            if (!ok) { dollarInput.value = String(oldVal); return; }
            App.State.dollarPerTicket = newVal;
            App.Lottery.invalidateTickets();
            App.Lottery.renderLotteryTable();
        });
    }
    if (roundingSelect) {
        roundingSelect.addEventListener("change", async () => {
            const newVal = roundingSelect.value;
            const oldVal = App.State.ticketRounding || "floor";
            if (newVal === oldVal) return;
            const ok = await _warnSettingChange("Ticket rounding changed");
            if (!ok) { roundingSelect.value = oldVal; return; }
            App.State.ticketRounding = newVal;
            App.Lottery.invalidateTickets();
            App.Lottery.renderLotteryTable();
        });
    }

    // Async dark-modal warning for settings that invalidate the ticket pool.
    // Shows seed + download option. Returns Promise<boolean>.
    function _warnSettingChange(label) {
        // If no valid tickets, no warning needed
        if (!App.State.ticketsValid || !App.State.ticketPool || App.State.ticketPool.length === 0) {
            return Promise.resolve(true);
        }
        const seedStr = App.State.currentSeed
            ? `Current seed: ${App.State.currentSeed}`
            : App.State.lastSeed
                ? `Current seed: ${App.State.lastSeed}`
                : "No seed recorded.";
        return new Promise(resolve => {
            const overlay = document.createElement("div");
            overlay.style.cssText = "position:fixed;inset:0;z-index:9900;background:rgba(10,15,30,0.88);display:flex;align-items:center;justify-content:center;";
            overlay.innerHTML = `
                <div class="draw-mode-dialog" style="max-width:440px;">
                    <h3 style="margin:0 0 8px;font-size:18px;color:#f1f5f9;">⚠ Tickets Already Generated</h3>
                    <p style="color:#94a3b8;font-size:13px;margin:0 0 6px;">
                        <strong style="color:#f1f5f9;">${label}</strong> will invalidate the current ticket pool.
                        You will need to <strong style="color:#fbbf24;">Regenerate Tickets</strong> before running a draw.
                    </p>
                    <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);border-radius:6px;padding:10px 14px;margin:10px 0 16px;font-size:12px;color:#fbbf24;font-family:monospace;">
                        ${seedStr}
                    </div>
                    <button id="_settingDownload" class="btn-secondary" style="width:100%;margin-bottom:10px;">⬇ Download current audit before continuing</button>
                    <div style="display:flex;gap:10px;">
                        <button id="_settingProceed" class="btn-reveal"    style="flex:1;">Proceed (invalidate tickets)</button>
                        <button id="_settingCancel"  class="btn-secondary" style="flex:1;">Cancel</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector("#_settingDownload").onclick = () => App.Lottery.downloadAudit();
            overlay.querySelector("#_settingProceed").onclick = () => { document.body.removeChild(overlay); resolve(true);  };
            overlay.querySelector("#_settingCancel").onclick  = () => { document.body.removeChild(overlay); resolve(false); };
        });
    }

    // --------------------------------------------------
    // Draw state — exposed globally for session export/restore
    // --------------------------------------------------
    let drawState = {
        pool:[], remainingPool:[], winners:[],
        prizeIndex:0, numPrizes:0,
        seed:0, done:false, autoMode:false, hasRun:false
    };
    // Expose for session export
    Object.defineProperty(window, "_slm_drawState", { get: () => drawState });

    // --------------------------------------------------
    // Pool fingerprint
    // --------------------------------------------------
    function _poolFingerprint(pool) {
        return pool.map(t => t.code + t.name).join("|");
    }

    // --------------------------------------------------
    // Reveal fields helper
    // --------------------------------------------------
    function getRevealFields() {
        const f = [];
        if (document.getElementById("revealCode")?.checked)     f.push("code");
        if (document.getElementById("revealStudent")?.checked)  f.push("student");
        if (document.getElementById("revealTeacher")?.checked)  f.push("teacher");
        if (document.getElementById("revealPosition")?.checked) f.push("position");
        if (document.getElementById("revealAmount")?.checked)   f.push("amount");
        return f.length > 0 ? f : ["code"];
    }

    function fieldLabel(f) {
        return f==="code"?"Ticket Code":f==="student"?"Student":f==="teacher"?"Teacher"
             : f==="position"?"Position":f==="amount"?"Amount":f;
    }

    // --------------------------------------------------
    // Winners table header + rows
    // --------------------------------------------------
    function rebuildWinnersHeader() {
        if (!winnersTableHead) return;
        const fields = getRevealFields();
        winnersTableHead.innerHTML =
            `<th>#</th>` + fields.map(f=>`<th>${fieldLabel(f)}</th>`).join("") + `<th>Tickets</th>`;
    }

    function rebuildWinnersTable() {
        rebuildWinnersHeader();
        if (!drawState.winners.length) { winnersTableBody.innerHTML = ""; return; }
        const fields = getRevealFields();
        winnersTableBody.innerHTML = drawState.winners.map((w,i) => {
            const cells = fields.map(f => {
                if (f==="code")     return `<td><code>${w.code}</code></td>`;
                if (f==="student")  return `<td>${w.name}</td>`;
                if (f==="teacher")  return `<td>${w.teacher}</td>`;
                if (f==="amount")   return `<td>$${Number(w.amount).toFixed(2)}</td>`;
                if (f==="position") {
                    const pos = drawState.pool.findIndex(t=>t.code===w.code)+1;
                    return `<td>#${pos}</td>`;
                }
                return "<td></td>";
            }).join("");
            return `<tr><td>${i+1}</td>${cells}<td>${w.tickets}</td></tr>`;
        }).join("");
    }

    document.addEventListener("change", e => {
        if (e.target.closest("#pageRevealControls")) {
            rebuildWinnersHeader();
            rebuildWinnersTable();
        }
    });

    // --------------------------------------------------
    // Ticket Pool Table
    // --------------------------------------------------
    function renderPoolTable(pool) {
        if (!ticketPoolBody) return;
        if (!pool || pool.length === 0) {
            _clearPoolTable();
            return;
        }
        const studentTotals = {}, studentCounts = {};
        pool.forEach(t => {
            const k = t.name + "|||" + t.teacher;
            studentTotals[k] = (studentTotals[k] || 0) + 1;
            studentCounts[k] = 0;
        });
        ticketPoolBody.innerHTML = pool.map((t, i) => {
            const k = t.name + "|||" + t.teacher;
            studentCounts[k]++;
            return `<tr>
                <td style="text-align:center;color:#6b7280;">${i + 1}</td>
                <td><code style="font-size:12px;letter-spacing:0.05em;">${t.code}</code></td>
                <td>${t.name}</td>
                <td>${t.teacher}</td>
                <td style="text-align:center;font-size:11px;color:#6b7280;">${studentCounts[k]} / ${studentTotals[k]}</td>
            </tr>`;
        }).join("");
    }

    // --------------------------------------------------
    // Prize Summary Cards
    // --------------------------------------------------
    function renderPrizeCards(students) {
        const el = document.getElementById("lotteryPrizeCards");
        if (!el) return;

        const numPrizesInput = document.getElementById("numPrizes");
        const numPrizes = parseInt(numPrizesInput?.value || "5") || 5;
        const totalTickets = students.reduce((s, st) => s + (st.totalTickets || 0), 0);
        const oddsPerTicket = totalTickets > 0
            ? ((1 / totalTickets) * 100).toFixed(numPrizes > 10 ? 1 : 2)
            : "0";

        el.innerHTML = `
            <div class="prize-card">
                <div class="prize-card-label">Total Tickets</div>
                <div class="prize-card-value">${totalTickets.toLocaleString()}</div>
                <div class="prize-card-sub">in the draw pool</div>
            </div>
            <div class="prize-card">
                <div class="prize-card-label">Odds / Ticket</div>
                <div class="prize-card-value">${oddsPerTicket}<span style="font-size:16px;font-weight:500;">%</span></div>
                <div class="prize-card-sub">chance per ticket</div>
            </div>
            <div class="prize-card">
                <div class="prize-card-label">Prizes to Draw</div>
                <div class="prize-card-value">${numPrizes}</div>
                <div class="prize-card-sub">winners selected</div>
            </div>
        `;
    }

    // Update prize cards when numPrizes changes
    document.getElementById("numPrizes")?.addEventListener("input", async () => {
        const raw = await App.DB.getStudentsWithTotals();
        const students = App.StudentModel.build(raw, {
            includeLotteryFields: true,
            dollarPerTicket:  App.State.dollarPerTicket,
            ticketRounding:   App.State.ticketRounding || "floor"
        });
        renderPrizeCards(students);
    });

    // --------------------------------------------------
    // Class List
    // --------------------------------------------------
    App.Lottery.renderClassList = async function () {
        if (!lotteryClassList) return;
        const students = await App.DB.getAllStudents();
        const teachers = [...new Set(students.map(s=>s.teacher))].sort();
        lotteryClassList.innerHTML = "";

        const allBtn = document.createElement("button");
        allBtn.className = "btn-secondary";
        allBtn.textContent = "All Classes";
        allBtn.style.marginBottom = "4px";
        if (!App.State.lotteryTeacherFilter) allBtn.classList.add("filter-active");
        allBtn.onclick = () => {
            App.State.lotteryTeacherFilter = null;
            App.Lottery.renderLotteryTable();
            App.Lottery.renderClassList();
        };
        lotteryClassList.appendChild(allBtn);

        teachers.forEach(t => {
            const btn = document.createElement("button");
            btn.className = "btn-secondary";
            btn.textContent = t;
            btn.style.marginBottom = "4px";
            if (App.State.lotteryTeacherFilter === t) btn.classList.add("filter-active");
            btn.onclick = () => {
                App.State.lotteryTeacherFilter = t;
                App.Lottery.renderLotteryTable();
                App.Lottery.renderClassList();
            };
            lotteryClassList.appendChild(btn);
        });

        // Update always-visible active filters display above sidebar-header
        _updateLotteryFiltersDisplay();
    };

    function _updateLotteryFiltersDisplay() {
        const el = document.getElementById("lotteryActiveFilters");
        if (!el) return;
        const f = App.State.lotteryTeacherFilter;
        el.style.display = f ? "block" : "none";
        el.innerHTML = f
            ? `<div class="afd-row-label">Active Filters</div><div class="afd-item">🏫 Class: <strong>${f}</strong><button class="afd-clear" onclick="App.State.lotteryTeacherFilter=null;App.Lottery.renderLotteryTable();App.Lottery.renderClassList();">✕</button></div>`
            : "";
    }

    // --------------------------------------------------
    // Render Lottery Table
    // --------------------------------------------------
    App.Lottery.renderLotteryTable = async function () {
        const rawAll = await App.DB.getStudentsWithTotals();
        const all = App.StudentModel.build(rawAll, {
            includeLotteryFields: true,
            dollarPerTicket:      App.State.dollarPerTicket,
            ticketRounding:       App.State.ticketRounding || "floor"
        });
        const withOdds = App.StudentModel.computeOdds(all);
        const filter   = App.State.lotteryTeacherFilter;
        const display  = filter ? withOdds.filter(s=>s.teacher===filter) : withOdds;

        const sortState = App.Renderer.getSortState("lotteryStudentTable");
        const sorted    = App.Renderer.sortStudents(display, sortState);
        App.Renderer.applySortIndicators("lotteryStudentTable", sortState);

        const lbl = document.getElementById("lotteryFilterLabel");
        if (lbl) lbl.textContent = filter
            ? `Viewing: ${filter} — odds reflect full school pool` : "Viewing: All Classes";

        App.Renderer.renderStudentTable(lotteryTableBody, sorted, [
            {type:"index"}, {type:"text",key:"name"}, {type:"text",key:"teacher"},
            {type:"currency",key:"amount"}, {type:"text",key:"base"}, {type:"text",key:"extra"},
            {type:"text",key:"totalTickets"}, {type:"text",key:"odds"}
        ]);

        rebuildWinnersHeader();
        renderPrizeCards(all);
    };

    // --------------------------------------------------
    // Recalculate Tickets
    // --------------------------------------------------
    App.Lottery.recalcTickets = async function () {
        const raw = await App.DB.getStudentsWithTotals();
        const students = App.StudentModel.build(raw, {
            includeLotteryFields:true,
            dollarPerTicket:  App.State.dollarPerTicket,
            ticketRounding:   App.State.ticketRounding || "floor"
        });
        const withOdds = App.StudentModel.computeOdds(students);

        // Warn whenever tickets exist (valid) OR a draw has already run
        const _ticketsExist = App.State.ticketsValid && App.State.ticketPool && App.State.ticketPool.length > 0;
        const _drawRan      = (drawState.hasRun || drawState.done) && drawState.winners.length > 0;
        if (_ticketsExist || _drawRan) {
            const seedStr = (App.State.currentSeed || App.State.lastSeed || drawState.seed)
                ? `Seed: ${App.State.currentSeed || App.State.lastSeed || drawState.seed}`
                : "No seed recorded.";
            const doIt = await _showRecalcWarning(seedStr);
            if (!doIt) return;
        }

        // Always fully reset draw state when generating/regenerating tickets
        drawState = { pool:[],remainingPool:[],winners:[],prizeIndex:0,numPrizes:0,seed:0,done:false,autoMode:false,hasRun:false };
        if (winnersTableBody) winnersTableBody.innerHTML = "";
        if (btnAudit) { btnAudit.disabled = true; }

        // Determine seed — typed value takes priority, else generate/keep random
        const typedInput = seedInput?.value.trim() || "";
        let   useSeed;
        if (typedInput) {
            useSeed = App.StudentModel.seedFromString(typedInput);
        } else {
            // Always generate a fresh random seed when recalculating without a typed seed
            useSeed = Math.floor(Math.random() * 99999999);
            App.State.lastSeed = useSeed;
            // Show it in the input box so the user can record it
            if (seedInput) {
                seedInput.value = String(useSeed);
                _lastSeedInputValue = String(useSeed);
            }
        }

        let pool = App.StudentModel.buildTicketPool(withOdds, useSeed);
        pool     = App.StudentModel.shufflePool(pool, App.StudentModel.mulberry32(useSeed));

        App.State.ticketPool   = pool;
        App.State.currentSeed  = useSeed;

        _setTicketsValid(true);
        renderPoolTable(pool);
        App.Lottery.renderLotteryTable();
        if (btnPrintTickets) btnPrintTickets.disabled = false;
    };

    // --------------------------------------------------
    // Recalc warning dialog
    // --------------------------------------------------
    function _showRecalcWarning(seedStr) {
        return new Promise(resolve => {
            const overlay = document.createElement("div");
            overlay.style.cssText = "position:fixed;inset:0;z-index:9800;background:rgba(10,15,30,0.88);display:flex;align-items:center;justify-content:center;";
            overlay.innerHTML = `
                <div class="draw-mode-dialog" style="max-width:440px;">
                    <h3 style="margin:0 0 8px;font-size:18px;color:#f1f5f9;">⚠ Recalculate Tickets?</h3>
                    <p style="color:#94a3b8;font-size:13px;margin:0 0 6px;">
                        This will generate new ticket codes and clear the previous draw results.
                        <strong style="color:#fbbf24;">This cannot be undone.</strong>
                    </p>
                    <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);border-radius:6px;padding:10px 14px;margin:10px 0 16px;font-size:12px;color:#fbbf24;font-family:monospace;">
                        ${seedStr}
                    </div>
                    <button id="_recalcDownload" class="btn-secondary" style="width:100%;margin-bottom:10px;">⬇ Download Audit CSV before continuing</button>
                    <div style="display:flex;gap:10px;">
                        <button id="_recalcConfirm" class="btn-reveal"    style="flex:1;">Recalculate</button>
                        <button id="_recalcCancel"  class="btn-secondary" style="flex:1;">Cancel</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector("#_recalcDownload").onclick = () => App.Lottery.downloadAudit();
            overlay.querySelector("#_recalcConfirm").onclick  = () => { document.body.removeChild(overlay); resolve(true);  };
            overlay.querySelector("#_recalcCancel").onclick   = () => { document.body.removeChild(overlay); resolve(false); };
        });
    }

    // --------------------------------------------------
    // Warning when data changes after tickets generated
    // --------------------------------------------------
    App.Lottery.warnDataChange = async function (actionLabel, proceedFn, onCancel) {
        if (!App.State.ticketsValid || !App.State.ticketPool || App.State.ticketPool.length === 0) {
            await proceedFn();
            return;
        }

        const seedStr = App.State.currentSeed
            ? `Current seed: ${App.State.currentSeed}`
            : App.State.lastSeed
                ? `Current seed: ${App.State.lastSeed}`
                : "No seed recorded.";

        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;inset:0;z-index:9800;background:rgba(10,15,30,0.88);display:flex;align-items:center;justify-content:center;";
        overlay.innerHTML = `
            <div class="draw-mode-dialog" style="max-width:440px;">
                <h3 style="margin:0 0 8px;font-size:18px;color:#f1f5f9;">⚠ Tickets Already Generated</h3>
                <p style="color:#94a3b8;font-size:13px;margin:0 0 6px;">
                    <strong style="color:#f1f5f9;">${actionLabel}</strong> will change student amounts.
                    The current ticket codes will be <strong style="color:#fbbf24;">invalidated</strong> and must be recalculated before a draw can run.
                </p>
                <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);border-radius:6px;padding:10px 14px;margin:10px 0 16px;font-size:12px;color:#fbbf24;font-family:monospace;">
                    ${seedStr}
                </div>
                <button id="_dataChangeDownload" class="btn-secondary" style="width:100%;margin-bottom:10px;">⬇ Download current audit before continuing</button>
                <div style="display:flex;gap:10px;">
                    <button id="_dataChangeProceed" class="btn-reveal"    style="flex:1;">Proceed (invalidate tickets)</button>
                    <button id="_dataChangeCancel"  class="btn-secondary" style="flex:1;">Cancel</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        overlay.querySelector("#_dataChangeDownload").onclick = () => App.Lottery.downloadAudit();
        overlay.querySelector("#_dataChangeProceed").onclick = async () => {
            document.body.removeChild(overlay);
            App.Lottery.invalidateTickets();  // full invalidation
            await proceedFn();
        };
        overlay.querySelector("#_dataChangeCancel").onclick = () => {
            document.body.removeChild(overlay);
            if (typeof onCancel === "function") onCancel();
        };
    };

    // --------------------------------------------------
    // Run Draw — blocked if tickets not valid
    // --------------------------------------------------
    App.Lottery.runDraw = function () {
        // Reopen completed draw
        if (drawState.done && drawState.winners.length > 0) {
            _reopenResults();
            return;
        }
        if (!App.State.ticketsValid) {
            // Shouldn't reach here (button disabled), but guard anyway
            alert("Please recalculate tickets before running the draw.");
            return;
        }
        drawModeModal.style.display = "flex";
    };

    function _reopenResults() {
        drawModal.style.display        = "flex";
        drawSpinnerCode.textContent    = "——";
        if (drawSpinnerMeta) drawSpinnerMeta.textContent = "";
        drawPrizeLabel.textContent     = "All prizes drawn";
        btnCloseDraw.style.display     = "inline-block";
        if (btnDrawModalAudit) btnDrawModalAudit.style.display = "inline-block";
        drawWinnerBanner.innerHTML = `
            <div class="winner-crown">🏆</div>
            <div class="winner-name" style="font-size:22px;">Draw Complete</div>
            <div class="winner-sub">${drawState.winners.length} winner${drawState.winners.length!==1?"s":""} drawn</div>`;
        drawWinnerBanner.style.display = "block";
        drawWinnersList.innerHTML = "";
        drawState.winners.forEach((w,i) => {
            const li = document.createElement("div");
            li.className = "draw-winners-item";
            li.innerHTML = _winnerListHTML(w, i+1);
            drawWinnersList.appendChild(li);
        });
    }

    // --------------------------------------------------
    // Running list item — respects reveal controls
    // --------------------------------------------------
    function _winnerListHTML(w, prizeNum) {
        const fields = getRevealFields();
        const showStudent = fields.includes("student");
        const showTeacher = fields.includes("teacher");
        const showCode    = fields.includes("code");

        let parts = [`<span class="draw-prize-badge">#${prizeNum}</span>`];
        if (showCode)    parts.push(`<span class="draw-code-badge">${w.code}</span>`);
        if (showStudent) parts.push(`<strong>${w.name}</strong>`);
        if (showTeacher) parts.push(`<span style="color:#94a3b8;font-size:11px;">${w.teacher}</span>`);
        return parts.join(" ");
    }

    // --------------------------------------------------
    // Draw mode buttons
    // --------------------------------------------------
    document.getElementById("btnDrawModeManual")?.addEventListener("click", () => {
        drawModeModal.style.display = "none";
        _startDraw(false);
    });
    document.getElementById("btnDrawModeAuto")?.addEventListener("click", () => {
        drawModeModal.style.display = "none";
        _startDraw(true);
    });
    document.getElementById("btnDrawModeCancel")?.addEventListener("click", () => {
        drawModeModal.style.display = "none";
    });

    async function _startDraw(autoMode) {
        const pool = App.State.ticketPool;
        if (!pool || pool.length === 0) { alert("No tickets available."); return; }

        const numPrizes = Number(document.getElementById("numPrizes").value) || 1;
        const noRepeat  = document.getElementById("noRepeatWinners").checked;
        const seed      = App.State.currentSeed || App.State.lastSeed || 1;

        drawState = {
            pool, remainingPool:[...pool], winners:[],
            prizeIndex:0, numPrizes, noRepeat,
            seed, done:false, autoMode, hasRun:true
        };

        drawModal.style.display        = "flex";
        drawWinnerBanner.style.display = "none";
        btnCloseDraw.style.display     = "none";
        if (btnDrawModalAudit) btnDrawModalAudit.style.display = "none";
        const btnNextPrize0 = document.getElementById("btnNextPrize");
        if (btnNextPrize0) btnNextPrize0.style.display = "none";
        drawWinnersList.innerHTML      = "";
        drawSpinnerCode.textContent    = "——";
        if (drawSpinnerMeta) drawSpinnerMeta.textContent = "";
        stopConfetti();

        await _drawNext();
    }

    // --------------------------------------------------
    // Draw next prize
    // --------------------------------------------------
    async function _drawNext() {
        if (drawState.prizeIndex >= drawState.numPrizes || drawState.remainingPool.length === 0) {
            _finalizeDraw();
            return;
        }

        const prizeNum = drawState.prizeIndex + 1;
        drawPrizeLabel.textContent     = `Drawing Prize #${prizeNum} of ${drawState.numPrizes}…`;
        drawWinnerBanner.style.display = "none";
        if (drawSpinnerMeta) drawSpinnerMeta.textContent = "";

        const rng      = App.StudentModel.mulberry32(drawState.seed + prizeNum * 7919);
        const duration = 1600 + Math.random() * 800;
        const pool     = drawState.remainingPool;

        // Spin — only show code during spin
        await new Promise(resolve => {
            let elapsed = 0;
            drawSpinnerCode.classList.add("spinning");
            const timer = setInterval(() => {
                drawSpinnerCode.textContent = pool[Math.floor(rng() * pool.length)].code;
                elapsed += 60;
                if (elapsed >= duration) {
                    clearInterval(timer);
                    drawSpinnerCode.classList.remove("spinning");
                    resolve();
                }
            }, 60);
        });

        // Pick winner
        const winnerRng = App.StudentModel.mulberry32(drawState.seed + prizeNum * 13337);
        const winner    = { ...pool[Math.floor(winnerRng() * pool.length)], prizeNum };

        drawState.winners.push(winner);
        drawSpinnerCode.textContent = winner.code;

        // Show name/teacher under code only if reveal controls say so
        if (drawSpinnerMeta) {
            const fields      = getRevealFields();
            const showStudent = fields.includes("student");
            const showTeacher = fields.includes("teacher");
            let metaParts = [];
            if (showStudent) metaParts.push(winner.name);
            if (showTeacher) metaParts.push(winner.teacher);
            drawSpinnerMeta.textContent = metaParts.join("  ·  ");
        }

        if (drawState.noRepeat) {
            drawState.remainingPool = drawState.remainingPool.filter(t => t.name !== winner.name);
        }

        // Prize label — show name only if student reveal is on
        const fields = getRevealFields();
        drawPrizeLabel.textContent = fields.includes("student")
            ? `Prize #${prizeNum} → ${winner.name}`
            : `Prize #${prizeNum} drawn`;

        // Add to running list
        const li = document.createElement("div");
        li.className = "draw-winners-item draw-winners-item-new";
        li.innerHTML = _winnerListHTML(winner, prizeNum);
        drawWinnersList.appendChild(li);
        setTimeout(() => li.classList.remove("draw-winners-item-new"), 500);

        rebuildWinnersTable();
        drawState.prizeIndex++;

        const isLast = drawState.prizeIndex >= drawState.numPrizes || drawState.remainingPool.length === 0;

        if (isLast) {
            await new Promise(r => setTimeout(r, 800));
            _finalizeDraw();
        } else if (drawState.autoMode) {
            await new Promise(r => setTimeout(r, 1200));
            await _drawNext();
        } else {
            // Manual mode — show Next Prize button, wait for click
            const btnNext = document.getElementById("btnNextPrize");
            if (btnNext) {
                btnNext.style.display   = "inline-block";
                btnNext.textContent     = `Next Prize ▶`;
                // resolve on click — one-shot
                await new Promise(resolve => {
                    btnNext.onclick = () => {
                        btnNext.style.display = "none";
                        btnNext.onclick = null;
                        resolve();
                    };
                });
            }
            await _drawNext();
        }
    }

    function _finalizeDraw() {
        drawState.done             = true;
        drawPrizeLabel.textContent = "All prizes drawn!";
        btnCloseDraw.style.display = "inline-block";
        if (btnDrawModalAudit) btnDrawModalAudit.style.display = "inline-block";

        drawWinnerBanner.innerHTML = `
            <div class="winner-crown">🎉</div>
            <div class="winner-name" style="font-size:28px;">Congratulations!</div>
            <div class="winner-sub">to all our winners!</div>`;
        drawWinnerBanner.style.display = "block";

        startConfetti(6000);
        rebuildWinnersTable();
        if (btnAudit) btnAudit.disabled = false;
        _updateRunDrawBtn(); // re-enable reopen mode
        _buildAuditInBackground();
    }

    async function _buildAuditInBackground() {
        await App.Lottery.buildAuditCSV(drawState.pool, drawState.winners, drawState.seed);
    }

    // --------------------------------------------------
    // Close modal
    // --------------------------------------------------
    function _closeModal() { drawModal.style.display = "none"; stopConfetti(); }
    if (btnCloseDraw)     btnCloseDraw.addEventListener("click",     _closeModal);
    if (btnCloseDrawTop)  btnCloseDrawTop.addEventListener("click",  _closeModal);
    if (btnDrawModalAudit) btnDrawModalAudit.addEventListener("click", () => App.Lottery.downloadAudit());

    // --------------------------------------------------
    // Confetti
    // --------------------------------------------------
    let confettiTimer=null, confettiCtx=null, confettiPieces=[], confettiRunning=false;

    function startConfetti(duration=4000) {
        if (!confettiCanvas) return;
        confettiCanvas.width=window.innerWidth; confettiCanvas.height=window.innerHeight;
        confettiCtx = confettiCanvas.getContext("2d");
        const colors=["#f59e0b","#ef4444","#10b981","#3b82f6","#8b5cf6","#ec4899","#fbbf24"];
        for (let i=0;i<220;i++) {
            confettiPieces.push({
                x:Math.random()*confettiCanvas.width, y:Math.random()*-confettiCanvas.height,
                w:6+Math.random()*10, h:4+Math.random()*6,
                color:colors[Math.floor(Math.random()*colors.length)],
                rot:Math.random()*360, vx:-2+Math.random()*4, vy:3+Math.random()*5, vr:-3+Math.random()*6
            });
        }
        confettiCanvas.style.display="block"; confettiRunning=true; _animateConfetti();
        if (confettiTimer) clearTimeout(confettiTimer);
        confettiTimer = setTimeout(stopConfetti, duration);
    }
    function _animateConfetti() {
        if (!confettiRunning||!confettiCtx) return;
        confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
        confettiPieces.forEach(p=>{
            p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
            if (p.y>confettiCanvas.height){p.y=-20;p.x=Math.random()*confettiCanvas.width;}
            confettiCtx.save(); confettiCtx.translate(p.x,p.y); confettiCtx.rotate(p.rot*Math.PI/180);
            confettiCtx.fillStyle=p.color; confettiCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
            confettiCtx.restore();
        });
        requestAnimationFrame(_animateConfetti);
    }
    function stopConfetti() {
        confettiRunning=false; confettiPieces=[];
        if (confettiTimer){clearTimeout(confettiTimer);confettiTimer=null;}
        if (confettiCanvas) confettiCanvas.style.display="none";
        if (confettiCtx) confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    }

    // --------------------------------------------------
    // Audit CSV
    // --------------------------------------------------
    App.Lottery.buildAuditCSV = async function (pool, winners, seed) {
        const meta = App.Fundraiser.getMeta();
        const rows = [];
        rows.push(["Fundraiser",meta.name||"(unnamed)"]);
        rows.push(["Notes",meta.notes||""]);
        rows.push(["Seed",seed]);
        rows.push(["Generated",new Date().toLocaleString()]);
        rows.push([]);

        rows.push(["WINNERS"]);
        rows.push(["#","Ticket Code","Name","Teacher","Amount","Tickets"]);
        winners.forEach((w,i)=>rows.push([i+1,w.code,w.name,w.teacher,Number(w.amount).toFixed(2),w.tickets]));
        rows.push([]);

        rows.push(["FULL TICKET POOL"]);
        rows.push(["Position","Ticket Code","Name","Teacher","Ticket X of Y"]);
        const sc={},st={};
        pool.forEach(t=>{const k=t.name+"|||"+t.teacher; st[k]=(st[k]||0)+1; sc[k]=0;});
        pool.forEach((t,i)=>{const k=t.name+"|||"+t.teacher; sc[k]++; rows.push([i+1,t.code,t.name,t.teacher,`${sc[k]} / ${st[k]}`]);});
        rows.push([]);

        rows.push(["DONATION TRANSACTION LOG"]);
        rows.push(["Import File","Row #","Student","Teacher","Online","Cash","Date","Notes"]);
        const [txList,batches]=await Promise.all([App.DB.getAllTransactions(),App.DB.getAllBatches()]);
        const batchMap={};
        batches.forEach(b=>{batchMap[b.id]=b.filename;});
        txList.sort((a,b)=>a.batchId!==b.batchId?a.batchId-b.batchId:(a.rowNum||0)-(b.rowNum||0));
        txList.forEach(t=>rows.push([
            batchMap[t.batchId]||"(unknown)",t.rowNum!=null?t.rowNum:"",
            t.name,t.teacher,
            Number(t.online||0).toFixed(2),Number(t.cash||0).toFixed(2),
            t.txDate||"",t.notes||""
        ]));

        App.State.auditCSV = rows;
    };

    App.Lottery.downloadAudit = function () {
        const rows = App.State.auditCSV;
        if (!rows) { alert("No audit data yet — run a draw first."); return; }
        const meta = App.Fundraiser.getMeta();
        const name = (meta.name||"LotteryAudit").replace(/[^a-z0-9_\-]/gi,"_");
        const csv  = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
        const blob = new Blob([csv],{type:"text/csv"});
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href=url; a.download=name+"_audit.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    // --------------------------------------------------
    // Button wiring — owned here to guarantee lottery.js is loaded
    // --------------------------------------------------
    document.getElementById("btnRecalcTickets")?.addEventListener("click", () => App.Lottery.recalcTickets());
    document.getElementById("btnRunDraw")?.addEventListener("click",        () => App.Lottery.runDraw());
    document.getElementById("btnDownloadAudit")?.addEventListener("click",  () => App.Lottery.downloadAudit());
    document.getElementById("btnPrintTickets")?.addEventListener("click",   () => App.Tickets.openModal());

    // --------------------------------------------------
    // Init — set initial disabled state
    // --------------------------------------------------
    _setTicketsValid(false);
    _clearPoolTable();

})();
