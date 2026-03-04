// ======================================================
//  App Main — v15  (App / App.State defined in app.js)
// ======================================================

App.UI = {
    toggleSidebar: function (sidebarId) {
        const aside   = document.getElementById(sidebarId);
        if (!aside) return;
        const body    = aside.querySelector(".sidebar-body");
        const chevron = aside.querySelector(".sidebar-chevron");
        if (!body) return;
        const nowOpen = body.classList.toggle("open");
        if (chevron) chevron.style.transform = nowOpen ? "rotate(180deg)" : "";
    },

    // Collapsible section inside sidebar (teacher list etc.)
    toggleSection: function (headerEl) {
        const body   = headerEl.nextElementSibling;
        const chev   = headerEl.querySelector(".section-chev");
        if (!body) return;
        const nowOpen = body.classList.toggle("open");
        if (chev) chev.style.transform = nowOpen ? "rotate(180deg)" : "";
    }
};

(function () {

    // ── Panel elements ──
    const panelMap = {
        manager:    document.getElementById("panelManager"),
        lottery:    document.getElementById("panelLottery"),
        fundraiser: document.getElementById("panelFundraiser"),
        howto:      document.getElementById("panelHowTo"),
        wizard:     document.getElementById("panelWizard")
    };

    // ── Nav button sets ──
    const headerBtns = {
        manager:    document.getElementById("navManager"),
        lottery:    document.getElementById("navLottery"),
        fundraiser: document.getElementById("navFundraiser"),
        howto:      document.getElementById("navHowTo")
    };
    const bottomBtns = {
        manager:    document.getElementById("navManager2"),
        lottery:    document.getElementById("navLottery2"),
        fundraiser: document.getElementById("navFundraiser2"),
        howto:      document.getElementById("navHowTo2")
    };

    // ── Switch panel ──
    function switchPanel(name) {
        App.State.activePanel = name;
        // panels
        Object.entries(panelMap).forEach(([k,el]) => el && el.classList.toggle("active", k === name));
        // header nav
        Object.entries(headerBtns).forEach(([k,btn]) => btn && btn.classList.toggle("active-tab", k === name));
        // bottom nav
        Object.entries(bottomBtns).forEach(([k,btn]) => btn && btn.classList.toggle("active-tab", k === name));
        // side effects
        if (name === "fundraiser") { App.Fundraiser.render(); _buildTeacherDatalist(); }
        if (name === "lottery")    App.Lottery.renderClassList();
    }

    App.showPanel = switchPanel;   // exposed for other modules


    // ── Splash Screen ──────────────────────────────────────────
    (function initSplash() {
        const splash  = document.getElementById("splashScreen");
        const btn     = document.getElementById("splashEnter");
        const dismiss = document.getElementById("splashDismiss");
        if (!splash) return;

        let dismissed = false;
        function hideSplash() {
            if (dismissed) return;
            dismissed = true;
            splash.classList.add("hiding");
            setTimeout(() => { splash.style.display = "none"; }, 1150);
        }

        // Auto-dismiss countdown
        let secs = 3;
        dismiss.textContent = `Auto-loading in ${secs}s…`;
        const timer = setInterval(() => {
            secs--;
            if (secs <= 0) {
                clearInterval(timer);
                hideSplash();
            } else {
                dismiss.textContent = `Auto-loading in ${secs}s…`;
            }
        }, 1000);

        // Manual dismiss
        btn.addEventListener("click", () => { clearInterval(timer); hideSplash(); });
        splash.addEventListener("click", (e) => {
            if (e.target === splash) { clearInterval(timer); hideSplash(); }
        });
    })();
    // ───────────────────────────────────────────────────────────

    // ── Wire nav buttons ──
    Object.entries(headerBtns).forEach(([p, btn]) => btn && btn.addEventListener("click", () => switchPanel(p)));
    Object.entries(bottomBtns).forEach(([p, btn]) => btn && btn.addEventListener("click", () => switchPanel(p)));

    // ── School Logo Upload ──────────────────────────────────────
    (function initImages() {
        const LS_LOGO   = "slm_school_logo";
        const LS_SPLASH = "slm_splash_image";

        // ── Header spacer sync (keeps nav centered) ──
        function _syncHeaderSpacer() {
            const logoDiv = document.querySelector(".header-logo");
            const spacer  = document.getElementById("headerRightSpacer");
            if (logoDiv && spacer) spacer.style.width = logoDiv.offsetWidth + "px";
        }
        window.addEventListener("resize", _syncHeaderSpacer);
        setTimeout(_syncHeaderSpacer, 200);

        // ── Header Logo ──────────────────────────────────────────
        const logoInput    = document.getElementById("logoFileInput");
        const logoPreview  = document.getElementById("logoPreview");
        const logoPrevWrap = document.getElementById("logoPreviewWrap");
        const headerLogo   = document.getElementById("schoolLogo");
        const logoClearBtn = document.getElementById("btnClearLogo");

        function applyLogo(dataUrl) {
            if (!dataUrl) return;
            if (headerLogo)   headerLogo.src = dataUrl;
            if (logoPreview)  logoPreview.src = dataUrl;
            if (logoPrevWrap) logoPrevWrap.style.display = "block";
            _syncHeaderSpacer();
        }
        function clearLogo() {
            localStorage.removeItem(LS_LOGO);
            if (headerLogo)   headerLogo.src = "";
            if (logoPreview)  logoPreview.src = "";
            if (logoPrevWrap) logoPrevWrap.style.display = "none";
            if (logoInput)    logoInput.value = "";
            _syncHeaderSpacer();
        }
        const savedLogo = localStorage.getItem(LS_LOGO);
        if (savedLogo) applyLogo(savedLogo);

        if (logoInput) {
            logoInput.addEventListener("change", () => {
                const file = logoInput.files[0];
                if (!file) return;
                const r = new FileReader();
                r.onload = (e) => { localStorage.setItem(LS_LOGO, e.target.result); applyLogo(e.target.result); };
                r.readAsDataURL(file);
            });
        }
        if (logoClearBtn) logoClearBtn.addEventListener("click", clearLogo);

        // ── Splash Image ─────────────────────────────────────────
        const splashInput    = document.getElementById("splashFileInput");
        const splashPreview  = document.getElementById("splashPreview");
        const splashPrevWrap = document.getElementById("splashPreviewWrap");
        const splashImg      = document.getElementById("splashImg");
        const splashClearBtn = document.getElementById("btnClearSplash");
        const DEFAULT_SPLASH = "assets/splash.svg";

        function applySplash(dataUrl) {
            if (!dataUrl) return;
            if (splashImg)      splashImg.src = dataUrl;
            if (splashPreview)  splashPreview.src = dataUrl;
            if (splashPrevWrap) splashPrevWrap.style.display = "block";
        }
        function clearSplash() {
            localStorage.removeItem(LS_SPLASH);
            if (splashImg)      splashImg.src = DEFAULT_SPLASH;
            if (splashPreview)  splashPreview.src = "";
            if (splashPrevWrap) splashPrevWrap.style.display = "none";
            if (splashInput)    splashInput.value = "";
        }
        const savedSplash = localStorage.getItem(LS_SPLASH);
        if (savedSplash) applySplash(savedSplash);

        if (splashInput) {
            splashInput.addEventListener("change", () => {
                const file = splashInput.files[0];
                if (!file) return;
                const r = new FileReader();
                r.onload = (e) => { localStorage.setItem(LS_SPLASH, e.target.result); applySplash(e.target.result); };
                r.readAsDataURL(file);
            });
        }
        if (splashClearBtn) splashClearBtn.addEventListener("click", clearSplash);
    })();
    // ────────────────────────────────────────────────────────────


    // ── Amount Adjustment Modal ─────────────────────────────────
    (function initAmountModal() {
        const modal       = document.getElementById("amountModal");
        const nameEl      = document.getElementById("amountModalName");
        const subEl       = document.getElementById("amountModalSub");
        const onlineEl    = document.getElementById("amountModalOnlineVal");
        const cashEl      = document.getElementById("amountModalCashVal");
        const totalEl     = document.getElementById("amountModalCurrentVal");
        const inputEl     = document.getElementById("amountModalInput");
        const fieldLabel  = document.getElementById("amountModalFieldLabel");
        const btnInc      = document.getElementById("btnAmountIncrease");
        const btnDec      = document.getElementById("btnAmountDecrease");
        const btnFieldCash   = document.getElementById("btnAmountFieldCash");
        const btnFieldOnline = document.getElementById("btnAmountFieldOnline");
        const btnApply    = document.getElementById("amountModalApply");
        const btnCancel   = document.getElementById("amountModalCancel");
        if (!modal) return;

        let _mode  = "increase";  // "increase" | "decrease"
        let _field = "cash";      // "cash" | "online"
        let _name = "", _teacher = "", _onlineAmt = 0, _cashAmt = 0;

        function openModal(name, teacher, online, cash) {
            _name      = name;
            _teacher   = teacher;
            _onlineAmt = Number(online) || 0;
            _cashAmt   = Number(cash)   || 0;

            if (nameEl) nameEl.textContent = name;
            if (subEl)  subEl.textContent  = teacher;
            _refreshBalances();
            if (inputEl) { inputEl.value = ""; inputEl.placeholder = "0.00"; }
            _setMode("increase");
            _setField("cash");
            modal.style.display = "flex";
            setTimeout(() => inputEl && inputEl.focus(), 80);
        }

        function _refreshBalances() {
            if (onlineEl) onlineEl.textContent = "$" + _onlineAmt.toFixed(2);
            if (cashEl)   cashEl.textContent   = "$" + _cashAmt.toFixed(2);
            if (totalEl)  totalEl.textContent  = "$" + (_onlineAmt + _cashAmt).toFixed(2);
        }

        function _setMode(mode) {
            _mode = mode;
            if (btnInc) btnInc.className = "amount-type-btn" + (mode === "increase" ? " active-increase" : "");
            if (btnDec) btnDec.className = "amount-type-btn" + (mode === "decrease" ? " active-decrease" : "");
            _updateFieldLabel();
        }

        function _setField(field) {
            _field = field;
            if (btnFieldCash)   btnFieldCash.className   = "amount-type-btn" + (field === "cash"   ? " active-field" : "");
            if (btnFieldOnline) btnFieldOnline.className = "amount-type-btn" + (field === "online" ? " active-field" : "");
            _updateFieldLabel();
        }

        function _updateFieldLabel() {
            const dir   = _mode  === "increase" ? "add to" : "subtract from";
            const field = _field === "cash"     ? "Cash"   : "Online";
            if (fieldLabel) fieldLabel.textContent = `Amount to ${dir} ${field}:`;
        }

        if (btnInc)      btnInc.addEventListener("click",      () => _setMode("increase"));
        if (btnDec)      btnDec.addEventListener("click",      () => _setMode("decrease"));
        if (btnFieldCash)   btnFieldCash.addEventListener("click",   () => _setField("cash"));
        if (btnFieldOnline) btnFieldOnline.addEventListener("click", () => _setField("online"));

        if (btnCancel) btnCancel.addEventListener("click", () => { modal.style.display = "none"; });
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

        if (btnApply) {
            btnApply.addEventListener("click", async () => {
                const amt = parseFloat(inputEl?.value) || 0;
                if (amt <= 0) {
                    inputEl.style.borderColor = "#ef4444";
                    setTimeout(() => inputEl.style.borderColor = "", 1000);
                    return;
                }
                const delta  = _mode === "increase" ? amt : -amt;
                const isOnline = _field === "online";

                await App.Lottery.warnDataChange("Manual amount adjustment", async () => {
                    const batches   = await App.DB.getAllBatches();
                    const today     = new Date().toDateString();
                    let manualBatch = batches.find(b => b.mode === "manual" && new Date(b.importedAt).toDateString() === today);
                    if (!manualBatch) {
                        const bid = await App.DB.addBatch({
                            filename: "(manual adjustments)",
                            importedAt: new Date().toISOString(),
                            mode: "manual", rowCount: 0
                        });
                        manualBatch = { id: bid };
                    }
                    await App.DB.addTransaction({
                        name: _name, teacher: _teacher,
                        online: isOnline ? delta : 0,
                        cash:   isOnline ? 0 : delta,
                        txDate: null,
                        notes:  `manual ${_mode} ${_field} via popup`,
                        rowNum: null, batchId: manualBatch.id
                    });
                    await App.Manager.renderAll();
                    await App.Lottery.renderLotteryTable();
                    await App.Fundraiser.renderStats();
                    await App.Fundraiser.renderImportHistory();
                    modal.style.display = "none";
                });
            });
        }

        // Open from 💰 button — now passes online + cash separately
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".btnAdjustAmount");
            if (!btn) return;
            openModal(btn.dataset.name, btn.dataset.teacher,
                      btn.dataset.online, btn.dataset.cash);
        });

        App.AmountModal = { open: openModal };
    })();
    // ────────────────────────────────────────────────────────────



    // ── Manager sidebar buttons ──
    document.getElementById("btnViewAllClasses").addEventListener("click", () => {
        App.State.currentTeacherFilter = null;
        App.Manager.renderStudentTable();
        App.Manager.renderTeacherTable();
        App.Manager.renderClassList();
    });
    document.getElementById("btnResetOnline").addEventListener("click",    () => App.Manager.resetOnline());
    document.getElementById("btnResetCash").addEventListener("click",      () => App.Manager.resetCash());
    document.getElementById("btnExportClass").addEventListener("click",    () => App.Manager.exportClass());
    document.getElementById("btnExportAll").addEventListener("click",      () => App.Manager.exportAll());
    document.getElementById("btnReloadSession").addEventListener("click",  () => {
        const f = document.getElementById("fileReload").files[0];
        if (f) App.Manager.reloadSession(f);
        else   alert("Please select a session export CSV file first.");
    });
    document.getElementById("btnExportSession")?.addEventListener("click", () => App.Manager.exportSession());
    // Import buttons now wired under Fundraiser buttons below

    // ── Fundraiser buttons ──
    document.getElementById("btnResetAllData").addEventListener("click", () => App.Fundraiser.resetAll());

    // ── Quick Add Student (Fundraiser page) ──
    document.getElementById("btnQuickAddStudent")?.addEventListener("click", async () => {
        const nameEl    = document.getElementById("quickAddName");
        const teacherEl = document.getElementById("quickAddTeacher");
        const onlineEl  = document.getElementById("quickAddOnline");
        const cashEl    = document.getElementById("quickAddCash");
        const statusEl  = document.getElementById("quickAddStatus");

        const name    = nameEl?.value.trim();
        const teacher = teacherEl?.value.trim();
        const online  = Number(onlineEl?.value || 0);
        const cash    = Number(cashEl?.value   || 0);

        if (!name)    { if (statusEl) { statusEl.textContent = "⚠ Student name is required."; statusEl.style.color = "#dc2626"; } return; }
        if (!teacher) { if (statusEl) { statusEl.textContent = "⚠ Teacher / class is required."; statusEl.style.color = "#dc2626"; } return; }

        await App.DB.upsertStudent({ name, teacher, notes: "", exclude: false });

        if (online > 0 || cash > 0) {
            const batches = await App.DB.getAllBatches();
            const today   = new Date().toDateString();
            let manualBatch = batches.find(b => b.mode === "manual" && new Date(b.importedAt).toDateString() === today);
            if (!manualBatch) {
                const bid = await App.DB.addBatch({ filename: "(manual add)", importedAt: new Date().toISOString(), mode: "manual", rowCount: 0 });
                manualBatch = { id: bid };
            }
            await App.DB.addTransaction({ name, teacher, online, cash, txDate: null, notes: "manual add", rowNum: null, batchId: manualBatch.id });
        }

        // Clear inputs except teacher (likely adding multiple students to same class)
        if (nameEl)   nameEl.value   = "";
        if (onlineEl) onlineEl.value = "";
        if (cashEl)   cashEl.value   = "";

        // Status message
        const moneyStr = (online + cash) > 0 ? ` ($${(online+cash).toFixed(2)} recorded)` : "";
        if (statusEl) { statusEl.textContent = `✓ ${name} added to ${teacher}${moneyStr}`; statusEl.style.color = "#16a34a"; }

        await App.Manager.renderAll();
        await App.Lottery.renderLotteryTable();
        await App.Lottery.renderClassList();
        await App.Fundraiser.renderStats();
        await App.Fundraiser.renderImportHistory();

        // Rebuild teacher datalist
        _buildTeacherDatalist();
    });

    async function _buildTeacherDatalist() {
        const dl = document.getElementById("quickTeacherList");
        if (!dl) return;
        const students = await App.DB.getAllStudents();
        const teachers = [...new Set(students.map(s => s.teacher))].sort();
        dl.innerHTML = teachers.map(t => `<option value="${t}">`).join("");
    }

    // Build datalist when fundraiser panel is opened
    const _origSwitchSideEffect = App.showPanel;
    App.showPanel = function(name) {
        _origSwitchSideEffect(name);
        if (name === "fundraiser") _buildTeacherDatalist();
    };

    // ── Import / Load buttons (live in Fundraiser sidebar) ──
    document.getElementById("btnLoadSchool").addEventListener("click",     () => App.Wizard.open("school-master"));
    document.getElementById("btnAddToSchool").addEventListener("click",    () => App.Wizard.open("school-merge"));
    document.getElementById("btnLoadCashOnline").addEventListener("click", () => App.Wizard.open("cash-online"));

    // ── Student search ──
    document.getElementById("studentSearch")?.addEventListener("input", () => {
        App.Manager.renderStudentTable();
    });

    // ── Column sort ──
    document.addEventListener("click", (e) => {
        const th = e.target.closest("th[data-sort-key]");
        if (!th) return;
        const tableId = th.closest("table").id;
        const key     = th.getAttribute("data-sort-key");
        const state   = App.Renderer.setSortState(tableId, key);
        if      (tableId === "studentTable")         App.Manager.renderStudentTable();
        else if (tableId === "lotteryStudentTable")  App.Lottery.renderLotteryTable();
        else { App.Renderer.sortRowsInDOM(tableId, state); App.Renderer.applySortIndicators(tableId, state); }
    });

    // ── Tooltips — hoist to body, smart fixed positioning ──
    // We move all .info-tooltip elements to document.body so they have
    // no parent stacking context, overflow, or transform interference.
    (function hoistTooltips() {
        document.querySelectorAll(".info-icon").forEach((icon, idx) => {
            const tip = icon.querySelector(".info-tooltip");
            if (!tip) return;
            // Tag icon and tip with matching id so we can reconnect them on click
            const id = "_tip_" + idx;
            icon.dataset.tipId = id;
            tip.dataset.tipId  = id;
            // Remove from icon, append to body at top level
            icon.removeChild(tip);
            tip.style.display = "none";
            tip.style.position = "fixed";
            document.body.appendChild(tip);
        });
    })();

    function _closeAllTips() {
        document.querySelectorAll(".info-tooltip").forEach(t => {
            t.style.display = "none";
            t.classList.remove("tip-visible");
        });
    }

    function _showTip(icon) {
        const tipId = icon.dataset.tipId;
        if (!tipId) return;
        const tip = document.querySelector(`.info-tooltip[data-tip-id="${tipId}"]`);
        if (!tip) return;

        const wasVisible = tip.style.display === "block";
        _closeAllTips();
        if (wasVisible) return;

        // Measure icon position
        const iconRect = icon.getBoundingClientRect();
        const vw       = window.innerWidth;
        const vh       = window.innerHeight;
        const margin   = 12;
        const tipW     = 260;

        // Render hidden to measure true height
        tip.style.visibility = "hidden";
        tip.style.display    = "block";
        tip.style.left       = "-9999px";
        tip.style.top        = "0";
        const tipH = tip.offsetHeight;

        const iconMidX = iconRect.left + iconRect.width / 2;
        let left, top;

        if (iconMidX < vw / 2) {
            // Left side of screen: open BELOW the icon, aligned to icon left
            left = iconRect.left;
            top  = iconRect.bottom + margin;
            if (left + tipW > vw - margin) left = vw - tipW - margin;
            if (left < margin) left = margin;
            if (top + tipH > vh - margin) top = iconRect.top - tipH - margin;
        } else {
            // Right side of screen: open to the LEFT of the icon
            left = iconRect.left - tipW - margin;
            top  = iconRect.top;
            if (left < margin) left = iconRect.right + margin; // fallback: right
            if (top + tipH > vh - margin) top = vh - tipH - margin;
        }
        if (top < margin) top = margin;

        tip.style.left       = left + "px";
        tip.style.top        = top  + "px";
        tip.style.visibility = "";
        tip.classList.add("tip-visible");
    }

    document.addEventListener("click", (e) => {
        const icon = e.target.closest(".info-icon");
        if (!e.target.closest(".info-tooltip") && !icon) {
            _closeAllTips();
            return;
        }
        if (icon) {
            _showTip(icon);
            e.stopPropagation();
        }
    });

    // ── Header title follows fundraiser name ──
    document.addEventListener("input", (e) => {
        if (e.target.id !== "fundraiserName") return;
        const el = document.getElementById("headerTitle");
        if (el) el.textContent = e.target.value.trim()
            ? e.target.value.trim() + " — School Lottery Manager"
            : "School Lottery Manager";
    });

    // ── Init ──
    async function init() {
        await App.DB.open();
        await App.DefaultData.loadIfEmpty();
        App.Fundraiser.init();
        const meta = App.Fundraiser.getMeta();
        const titleEl = document.getElementById("headerTitle");
        if (titleEl && meta.name) titleEl.textContent = meta.name + " — School Lottery Manager";
        await App.Manager.renderAll();
        await App.Lottery.renderLotteryTable();
        await App.Lottery.renderClassList();
        await _buildTeacherDatalist();   // pre-populate on load
        console.log("School Lottery Manager v15.1 ready");
    }

    init();
})();
