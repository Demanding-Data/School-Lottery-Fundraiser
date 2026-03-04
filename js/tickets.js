// ======================================================
//  App.Tickets  —  Ticket PDF Generation  v2
//  Print-friendly: white backgrounds, black text
//  Per-student: ticket list style (like by-class), spills to next page
//  Tickets sorted alphabetically by code within each student
//  Stubs: white with bordered cells
// ======================================================

window.App = window.App || {};
App.Tickets = {};

(function () {

    const modal         = document.getElementById("ticketPrintModal");
    const btnGenerate   = document.getElementById("btnTicketPrintGenerate");
    const btnCancel     = document.getElementById("btnTicketPrintCancel");
    const progressEl    = document.getElementById("ticketPrintProgress");
    const groupSelect   = document.getElementById("ticketPrintGroup");
    const teacherSelect = document.getElementById("ticketPrintTeacher");

    if (groupSelect) {
        groupSelect.addEventListener("change", () => {
            teacherSelect.style.display = groupSelect.value === "teacher" ? "block" : "none";
        });
    }

    // Detect environments where PDF download is unreliable
    function _isMobileBrowser() {
        const ua = navigator.userAgent || "";
        return /iPhone|iPad|iPod|Android/i.test(ua);
    }
    function _isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent || "") ||
               (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    }

    App.Tickets.openModal = async function () {
        if (!modal) return;
        const students = await App.DB.getAllStudents();
        const teachers = [...new Set(students.map(s => s.teacher))].sort();
        if (teacherSelect) {
            teacherSelect.innerHTML = teachers.map(t => `<option value="${t}">${t}</option>`).join("");
        }
        progressEl.style.display = "none";
        btnGenerate.disabled     = false;

        // Show mobile compatibility warning if needed
        let mobileWarningEl = document.getElementById("_ticketMobileWarning");
        if (!mobileWarningEl) {
            mobileWarningEl = document.createElement("div");
            mobileWarningEl.id = "_ticketMobileWarning";
            mobileWarningEl.style.cssText = "display:none;margin-bottom:14px;padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.5;";
            btnGenerate.parentElement.insertBefore(mobileWarningEl, btnGenerate.parentElement.firstChild);
        }

        if (_isIOS()) {
            mobileWarningEl.style.display = "block";
            mobileWarningEl.style.background = "rgba(239,68,68,0.15)";
            mobileWarningEl.style.border = "1px solid rgba(239,68,68,0.4)";
            mobileWarningEl.style.color = "#fca5a5";
            mobileWarningEl.innerHTML = "<strong>⚠ iOS / Safari not supported</strong><br>PDF downloads do not work on iPhones or iPads due to browser restrictions. To print tickets, open this app on a desktop or laptop computer (Windows, Mac, or Chromebook).";
            btnGenerate.disabled = true;
        } else if (_isMobileBrowser()) {
            mobileWarningEl.style.display = "block";
            mobileWarningEl.style.background = "rgba(251,191,36,0.12)";
            mobileWarningEl.style.border = "1px solid rgba(251,191,36,0.35)";
            mobileWarningEl.style.color = "#fbbf24";
            mobileWarningEl.innerHTML = "<strong>⚠ Mobile browser detected</strong><br>PDF generation may not work on all Android browsers. If the download doesn't appear, try opening this app in Chrome on a desktop or laptop.";
        } else {
            mobileWarningEl.style.display = "none";
            btnGenerate.disabled = false;
        }

        modal.style.display = "flex";
    };

    if (btnCancel) btnCancel.addEventListener("click", () => { modal.style.display = "none"; });

    if (btnGenerate) {
        btnGenerate.addEventListener("click", async () => {
            btnGenerate.disabled     = true;
            progressEl.style.display = "block";
            progressEl.textContent   = "Building ticket data…";
            try {
                await _generate();
            } catch (err) {
                console.error("Ticket PDF error:", err);
                alert("Error generating PDF: " + err.message);
            }
            btnGenerate.disabled     = false;
            progressEl.style.display = "none";
            modal.style.display      = "none";
        });
    }

    async function _generate() {
        const layout  = document.querySelector('input[name="ticketLayout"]:checked')?.value || "one-per-student";
        const group   = groupSelect?.value || "all";
        const teacher = teacherSelect?.value || null;
        const meta    = App.Fundraiser.getMeta();

        let pool = App.State.ticketPool;
        if (!pool || pool.length === 0) {
            alert("Please generate tickets first using 'Recalculate Tickets'.");
            return;
        }

        const filteredPool = (group === "teacher" && teacher)
            ? pool.filter(t => t.teacher === teacher)
            : pool;

        if (filteredPool.length === 0) { alert("No tickets found for the selected filter."); return; }

        progressEl.textContent = "Generating PDF…";

        if (layout === "one-per-student") await _generatePerStudent(filteredPool, meta);
        else if (layout === "stubs-per-page") await _generateStubs(filteredPool, meta);
        else if (layout === "by-class") await _generateByClass(filteredPool, meta);
    }

    // --------------------------------------------------
    // QR Code helper
    // --------------------------------------------------
    async function _qrDataURL(text, size) {
        return new Promise(resolve => {
            const div = document.createElement("div");
            div.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
            document.body.appendChild(div);
            try {
                new QRCode(div, {
                    text, width: size, height: size,
                    colorDark: "#000000", colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.M
                });
                setTimeout(() => {
                    const canvas = div.querySelector("canvas");
                    const img    = div.querySelector("img");
                    const url    = canvas ? canvas.toDataURL("image/png") : (img ? img.src : null);
                    try { document.body.removeChild(div); } catch {}
                    resolve(url);
                }, 150);
            } catch (e) {
                try { document.body.removeChild(div); } catch {}
                resolve(null);
            }
        });
    }

    function _newPDF() {
        const { jsPDF } = window.jspdf;
        return new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    }

    // Print-friendly color palette — white background
    const C = {
        black:   [0,   0,   0  ],
        dark:    [30,  30,  30 ],
        mid:     [90,  90,  90 ],
        light:   [150, 150, 150],
        rule:    [200, 200, 200],
        bgLight: [245, 245, 245],
        bgBand:  [230, 235, 245],  // very light blue for header bands
        accent:  [26,  86,  219],  // blue — used sparingly for borders/lines only
        white:   [255, 255, 255]
    };

    const PW = 215.9, PH = 279.4;
    const ML = 14, MR = 14, MT = 14;  // margins

    // --------------------------------------------------
    // Shared: page header (lightweight, print-friendly)
    // --------------------------------------------------
    function _pageHeader(pdf, fundraiserName, title, subtitle) {
        // Light blue band at top
        pdf.setFillColor(...C.bgBand);
        pdf.rect(0, 0, PW, 22, "F");

        // Blue left accent bar
        pdf.setFillColor(...C.accent);
        pdf.rect(0, 0, 4, 22, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(...C.dark);
        pdf.text(fundraiserName || "School Lottery", ML + 4, 9);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...C.mid);
        pdf.text(title || "", ML + 4, 15);

        if (subtitle) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(...C.dark);
            pdf.text(subtitle, PW - MR, 15, { align: "right" });
        }

        // Bottom rule
        pdf.setDrawColor(...C.accent);
        pdf.setLineWidth(0.5);
        pdf.line(0, 22, PW, 22);
        pdf.setLineWidth(0.2);
        pdf.setDrawColor(...C.rule);
    }

    function _pageFooter(pdf, text) {
        pdf.setDrawColor(...C.rule);
        pdf.setLineWidth(0.3);
        pdf.line(ML, PH - 10, PW - MR, PH - 10);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...C.light);
        pdf.text(text, PW / 2, PH - 5, { align: "center" });
    }

    // --------------------------------------------------
    // Layout 1: Per student — ticket list style, spills to next page
    // --------------------------------------------------
    async function _generatePerStudent(pool, meta) {
        const pdf = _newPDF();

        // Group pool by student, sort alphabetically within each student
        const studentMap = {};
        pool.forEach(t => {
            const key = t.name + "|||" + t.teacher;
            if (!studentMap[key]) studentMap[key] = { name: t.name, teacher: t.teacher, amount: t.amount, tickets: [] };
            studentMap[key].tickets.push(t);
        });

        // Sort tickets alphabetically by code within each student
        Object.values(studentMap).forEach(s => {
            s.tickets.sort((a, b) => a.code.localeCompare(b.code));
        });

        // Sort students by teacher then name
        const students = Object.values(studentMap).sort((a, b) =>
            a.teacher.localeCompare(b.teacher) || a.name.localeCompare(b.name)
        );

        let isFirstPage = true;

        for (let si = 0; si < students.length; si++) {
            const s = students[si];
            progressEl.textContent = `Generating PDF… student ${si + 1} / ${students.length}`;
            await new Promise(r => setTimeout(r, 0));

            if (!isFirstPage) pdf.addPage();
            isFirstPage = false;

            // White background (explicit for print)
            pdf.setFillColor(...C.white);
            pdf.rect(0, 0, PW, PH, "F");

            _pageHeader(pdf, meta.name, "LOTTERY TICKET CERTIFICATE", `${s.tickets.length} ticket${s.tickets.length !== 1 ? "s" : ""}`);

            // Student name block
            let curY = 30;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(20);
            pdf.setTextColor(...C.dark);
            pdf.text(s.name, ML, curY);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(...C.mid);
            pdf.text(`Class: ${s.teacher}   ·   Amount raised: $${Number(s.amount).toFixed(2)}`, ML, curY + 6);

            // Divider
            curY += 11;
            pdf.setDrawColor(...C.rule);
            pdf.setLineWidth(0.3);
            pdf.line(ML, curY, PW - MR, curY);
            curY += 5;

            // Column header
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(7);
            pdf.setTextColor(...C.mid);
            pdf.text("TICKET CODE", ML, curY);
            pdf.text("TICKET #", PW / 2, curY);
            pdf.text("POOL POSITION", PW - MR, curY, { align: "right" });
            curY += 2;
            pdf.setDrawColor(...C.rule);
            pdf.line(ML, curY, PW - MR, curY);
            curY += 4;

            const rowH     = 7;
            const pageBase = PH - 16; // leave room for footer
            let pageNum    = 1;

            for (let ti = 0; ti < s.tickets.length; ti++) {
                const t = s.tickets[ti];

                // Page overflow
                if (curY + rowH > pageBase) {
                    _pageFooter(pdf, `${s.name}  ·  ${meta.name || "Lottery"}  ·  Page ${pageNum}`);
                    pdf.addPage();
                    pdf.setFillColor(...C.white);
                    pdf.rect(0, 0, PW, PH, "F");
                    pageNum++;

                    _pageHeader(pdf, meta.name,
                        `LOTTERY TICKET CERTIFICATE — continued`,
                        `${s.name}`);

                    curY = 30;
                    // Repeat column headers
                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(7);
                    pdf.setTextColor(...C.mid);
                    pdf.text("TICKET CODE", ML, curY);
                    pdf.text("TICKET #", PW / 2, curY);
                    pdf.text("POOL POSITION", PW - MR, curY, { align: "right" });
                    curY += 2;
                    pdf.setDrawColor(...C.rule);
                    pdf.line(ML, curY, PW - MR, curY);
                    curY += 4;
                }

                // Alternating row shade
                if (ti % 2 === 0) {
                    pdf.setFillColor(...C.bgLight);
                    pdf.rect(ML, curY - 3, PW - ML - MR, rowH, "F");
                }

                // Ticket code — monospace style
                pdf.setFont("courier", "bold");
                pdf.setFontSize(9);
                pdf.setTextColor(...C.accent);
                pdf.text(t.code, ML + 1, curY + 2);

                // Ticket X of Y
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(...C.dark);
                pdf.text(`${ti + 1} of ${s.tickets.length}`, PW / 2, curY + 2);

                // Pool position
                const poolPos = pool.findIndex(p => p.code === t.code) + 1;
                pdf.setTextColor(...C.mid);
                pdf.text(`#${poolPos} / ${pool.length}`, PW - MR - 1, curY + 2, { align: "right" });

                curY += rowH;
            }

            // QR code at bottom of last page if space
            const qrText = `${meta.name || "Lottery"} | ${s.name} | ${s.teacher} | Tickets: ${s.tickets.map(t => t.code).join(", ")}`;
            const qrURL  = await _qrDataURL(qrText, 100);
            if (qrURL && curY + 30 < pageBase) {
                curY += 6;
                const qrSize = 22;
                pdf.addImage(qrURL, "PNG", ML, curY, qrSize, qrSize);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(6);
                pdf.setTextColor(...C.light);
                pdf.text("Scan to verify", ML + qrSize / 2, curY + qrSize + 3, { align: "center" });
            }

            _pageFooter(pdf, `${s.name}  ·  ${meta.name || "Lottery"}  ·  Keep this sheet — ticket codes are your draw entries`);
        }

        const fname = (meta.name || "Lottery").replace(/[^a-z0-9_\-]/gi, "_");
        pdf.save(`${fname}_tickets_per_student.pdf`);
    }

    // --------------------------------------------------
    // Layout 2: Stubs — 4 across, 8 rows, cut lines, white bg
    // --------------------------------------------------
    async function _generateStubs(pool, meta) {
        const pdf = _newPDF();

        // Sort alphabetically by teacher → student name → code
        const sorted = [...pool].sort((a, b) =>
            a.teacher.localeCompare(b.teacher) ||
            a.name.localeCompare(b.name) ||
            a.code.localeCompare(b.code)
        );

        const cols    = 4;
        const rows    = 8;
        const perPage = cols * rows;
        const stubW   = (PW - 20) / cols;   // ~49mm each
        const stubH   = (PH - 20) / rows;   // ~32mm each
        const padX    = 10;
        const padY    = 10;

        for (let i = 0; i < sorted.length; i++) {
            const t    = sorted[i];
            const slot = i % perPage;
            const col  = slot % cols;
            const row  = Math.floor(slot / cols);

            if (slot === 0) {
                if (i > 0) pdf.addPage();

                // White background
                pdf.setFillColor(...C.white);
                pdf.rect(0, 0, PW, PH, "F");

                // Cut lines — light gray dashed
                pdf.setDrawColor(...C.rule);
                pdf.setLineWidth(0.15);
                for (let c = 1; c < cols; c++) {
                    pdf.setLineDash([1.5, 1.5]);
                    pdf.line(padX + c * stubW, padY, padX + c * stubW, PH - padY);
                }
                for (let r = 1; r < rows; r++) {
                    pdf.setLineDash([1.5, 1.5]);
                    pdf.line(padX, padY + r * stubH, padX + cols * stubW, padY + r * stubH);
                }
                pdf.setLineDash([]);

                progressEl.textContent = `Generating stubs… page ${Math.floor(i / perPage) + 1}`;
                await new Promise(r => setTimeout(r, 0));
            }

            const bx = padX + col * stubW + 1.5;
            const by = padY + row * stubH  + 1.5;
            const bw = stubW - 3;
            const bh = stubH - 3;

            // Stub border
            pdf.setDrawColor(...C.accent);
            pdf.setLineWidth(0.4);
            pdf.roundedRect(bx, by, bw, bh, 1.5, 1.5, "S");

            // Top accent line
            pdf.setFillColor(...C.accent);
            pdf.rect(bx, by, bw, 4, "F");

            // Fundraiser name in accent bar
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(5);
            pdf.setTextColor(...C.white);
            pdf.text((meta.name || "School Lottery").substring(0, 24), bx + bw / 2, by + 3, { align: "center" });

            // Student name
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(7.5);
            pdf.setTextColor(...C.dark);
            const nameStr = t.name.length > 20 ? t.name.substring(0, 19) + "…" : t.name;
            pdf.text(nameStr, bx + bw / 2, by + 10, { align: "center" });

            // Teacher
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(6);
            pdf.setTextColor(...C.mid);
            pdf.text(t.teacher.substring(0, 22), bx + bw / 2, by + 15, { align: "center" });

            // Divider
            pdf.setDrawColor(...C.rule);
            pdf.setLineWidth(0.2);
            pdf.line(bx + 3, by + 17, bx + bw - 3, by + 17);

            // Ticket code — bold, prominent
            pdf.setFont("courier", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(...C.dark);
            pdf.text(t.code, bx + bw / 2, by + 23, { align: "center" });

            // Ticket X of Y + pool pos
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(5.5);
            pdf.setTextColor(...C.light);
            const studentTickets = sorted.filter(p => p.name === t.name && p.teacher === t.teacher);
            const sTicketNum     = studentTickets.findIndex(p => p.code === t.code) + 1;
            const poolPos        = sorted.findIndex(p => p.code === t.code) + 1;
            pdf.text(`Ticket ${sTicketNum} of ${studentTickets.length}  ·  Pool #${poolPos}`, bx + bw / 2, by + bh - 2, { align: "center" });
        }

        const fname = (meta.name || "Lottery").replace(/[^a-z0-9_\-]/gi, "_");
        pdf.save(`${fname}_tickets_stubs.pdf`);
    }

    // --------------------------------------------------
    // Layout 3: By class — one section per teacher, spills pages
    // --------------------------------------------------
    async function _generateByClass(pool, meta) {
        const pdf = _newPDF();

        // Group by teacher, students sorted alphabetically, codes sorted alphabetically
        const classMap = {};
        pool.forEach(t => {
            if (!classMap[t.teacher]) classMap[t.teacher] = {};
            if (!classMap[t.teacher][t.name]) classMap[t.teacher][t.name] = { amount: t.amount, codes: [] };
            classMap[t.teacher][t.name].codes.push(t.code);
        });
        Object.values(classMap).forEach(tc => {
            Object.values(tc).forEach(s => s.codes.sort((a, b) => a.localeCompare(b)));
        });

        const teachers = Object.keys(classMap).sort();
        let isFirstPage = true;
        let curY        = 0;
        let pageNum     = 1;

        const pageBase  = PH - 14;
        const rowH      = 7;
        const studentHeaderH = 10;

        function startNewPage(isFirstTeacherPage, teacher) {
            if (!isFirstPage) pdf.addPage();
            isFirstPage = false;
            pdf.setFillColor(...C.white);
            pdf.rect(0, 0, PW, PH, "F");
        }

        function startTeacherSection(teacher, numStudents, numTickets, isContinued) {
            startNewPage();
            _pageHeader(pdf, meta.name,
                "CLASS TICKET LIST" + (isContinued ? " — continued" : ""),
                teacher);
            curY = 30;

            if (!isContinued) {
                // Teacher summary line
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(...C.mid);
                pdf.text(`${numStudents} students  ·  ${numTickets} tickets total`, ML, curY);
                curY += 6;
                pdf.setDrawColor(...C.rule);
                pdf.line(ML, curY, PW - MR, curY);
                curY += 5;
            }
        }

        for (let ti = 0; ti < teachers.length; ti++) {
            const teacher  = teachers[ti];
            const smap     = classMap[teacher];
            const snames   = Object.keys(smap).sort();
            const numTickets = snames.reduce((sum, n) => sum + smap[n].codes.length, 0);

            progressEl.textContent = `Generating PDF… class ${ti + 1} / ${teachers.length}`;
            await new Promise(r => setTimeout(r, 0));

            // Start first page for this teacher
            startTeacherSection(teacher, snames.length, numTickets, false);

            for (let si = 0; si < snames.length; si++) {
                const sname  = snames[si];
                const sdata  = smap[sname];
                const codes  = sdata.codes;
                const neededH = studentHeaderH + codes.length * rowH + 4;

                // If the whole student block won't fit, go to new page
                if (curY + neededH > pageBase) {
                    _pageFooter(pdf, `${teacher}  ·  ${meta.name || "Lottery"}  ·  Page ${pageNum}`);
                    pageNum++;
                    startTeacherSection(teacher, snames.length, numTickets, true);
                }

                // Student name header row
                pdf.setFillColor(...C.bgBand);
                pdf.rect(ML, curY, PW - ML - MR, studentHeaderH - 2, "F");
                pdf.setFillColor(...C.accent);
                pdf.rect(ML, curY, 3, studentHeaderH - 2, "F");

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(9);
                pdf.setTextColor(...C.dark);
                pdf.text(sname, ML + 6, curY + 6);

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7.5);
                pdf.setTextColor(...C.mid);
                pdf.text(
                    `$${Number(sdata.amount).toFixed(2)} raised  ·  ${codes.length} ticket${codes.length !== 1 ? "s" : ""}`,
                    PW - MR, curY + 6, { align: "right" }
                );
                curY += studentHeaderH;

                // Ticket rows
                for (let ci = 0; ci < codes.length; ci++) {
                    const code = codes[ci];

                    if (curY + rowH > pageBase) {
                        _pageFooter(pdf, `${teacher}  ·  ${meta.name || "Lottery"}  ·  Page ${pageNum}`);
                        pageNum++;
                        startTeacherSection(teacher, snames.length, numTickets, true);
                        // Re-print student context
                        pdf.setFillColor(...C.bgLight);
                        pdf.rect(ML, curY, PW - ML - MR, 7, "F");
                        pdf.setFont("helvetica", "italic");
                        pdf.setFontSize(7);
                        pdf.setTextColor(...C.mid);
                        pdf.text(`${sname} (continued)`, ML + 4, curY + 5);
                        curY += 8;
                    }

                    if (ci % 2 === 0) {
                        pdf.setFillColor(...C.bgLight);
                        pdf.rect(ML + 3, curY - 1.5, PW - ML - MR - 3, rowH, "F");
                    }

                    pdf.setFont("courier", "bold");
                    pdf.setFontSize(8.5);
                    pdf.setTextColor(...C.accent);
                    pdf.text(code, ML + 5, curY + 3.5);

                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(7);
                    pdf.setTextColor(...C.mid);
                    pdf.text(`${ci + 1} of ${codes.length}`, PW / 2, curY + 3.5);

                    // Pool position
                    const poolPos = pool.findIndex(p => p.code === code) + 1;
                    pdf.text(`Pool #${poolPos} / ${pool.length}`, PW - MR, curY + 3.5, { align: "right" });

                    curY += rowH;
                }

                curY += 4; // gap between students
            }

            _pageFooter(pdf, `${teacher}  ·  ${meta.name || "Lottery"}  ·  Page ${pageNum}`);
            pageNum++;
        }

        const fname = (meta.name || "Lottery").replace(/[^a-z0-9_\-]/gi, "_");
        pdf.save(`${fname}_tickets_by_class.pdf`);
    }

})();
