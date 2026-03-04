// ======================================================
//  App.Renderer  —  Shared table rendering & sorting
//  v2: adds button column type, name/teacher data attrs
// ======================================================

window.App = window.App || {};
App.Renderer = {};

(function () {

    const sortState = {};

    App.Renderer.getSortState = function (tableId) {
        return sortState[tableId] || null;
    };

    App.Renderer.setSortState = function (tableId, key) {
        const current = sortState[tableId];
        if (!current || current.key !== key) {
            sortState[tableId] = { key, direction: "asc" };
        } else {
            sortState[tableId].direction = current.direction === "asc" ? "desc" : "asc";
        }
        return sortState[tableId];
    };

    App.Renderer.applySortIndicators = function (tableId, state) {
        const table = document.getElementById(tableId);
        if (!table) return;

        table.querySelectorAll("th[data-sort-key]").forEach(th => {
            th.classList.remove("sort-asc", "sort-desc");
            const key = th.getAttribute("data-sort-key");
            if (state && state.key === key) {
                th.classList.add(state.direction === "asc" ? "sort-asc" : "sort-desc");
            }
        });
    };

    App.Renderer.sortStudents = function (students, state) {
        if (!state) return students;

        const key = state.key;
        const dir = state.direction === "asc" ? 1 : -1;

        return [...students].sort((a, b) => {
            let va = a[key], vb = b[key];
            if (typeof va === "string") va = va.toLowerCase();
            if (typeof vb === "string") vb = vb.toLowerCase();
            if (va < vb) return -1 * dir;
            if (va > vb) return  1 * dir;
            return 0;
        });
    };

    App.Renderer.sortRowsInDOM = function (tableId, state) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        const rows    = Array.from(tbody.querySelectorAll("tr"));
        const key     = state.key;
        const dir     = state.direction === "asc" ? 1 : -1;
        const thIndex = Array.from(table.querySelectorAll("th"))
            .findIndex(th => th.getAttribute("data-sort-key") === key);

        if (thIndex < 0) return;

        rows.sort((ra, rb) => {
            let va = ra.children[thIndex]?.textContent.trim() || "";
            let vb = rb.children[thIndex]?.textContent.trim() || "";

            const na = parseFloat(va.replace(/[^0-9.\-]/g, ""));
            const nb = parseFloat(vb.replace(/[^0-9.\-]/g, ""));

            if (!isNaN(na) && !isNaN(nb)) {
                if (na < nb) return -1 * dir;
                if (na > nb) return  1 * dir;
                return 0;
            }

            va = va.toLowerCase(); vb = vb.toLowerCase();
            if (va < vb) return -1 * dir;
            if (va > vb) return  1 * dir;
            return 0;
        });

        tbody.innerHTML = "";
        rows.forEach(r => tbody.appendChild(r));
    };

    // -----------------------------------------------
    // Shared student table renderer
    // Column types:
    //   { type: "index" }
    //   { type: "text", key }
    //   { type: "input-number", key, class }
    //   { type: "input-text",   key, class }
    //   { type: "checkbox",     key, class }
    //   { type: "button", label, class, title }
    // -----------------------------------------------
    App.Renderer.renderStudentTable = function (targetTbody, students, columns) {
        targetTbody.innerHTML = "";

        students.forEach((s, i) => {
            const tr = document.createElement("tr");
            let html = "";

            columns.forEach(col => {
                if (col.type === "index") {
                    html += `<td>${i + 1}</td>`;

                } else if (col.type === "text") {
                    const isName    = col.key === "name";
                    const isTeacher = col.key === "teacher";
                    const cssClass  = isName    ? " class=\"col-name\""
                                   : isTeacher ? " class=\"col-teacher\""
                                   : "";
                    html += `<td${cssClass}>${s[col.key] != null ? s[col.key] : ""}</td>`;

                } else if (col.type === "currency") {
                    const val = Number(s[col.key] || 0);
                    html += `<td style="text-align:right;">$${val.toFixed(2)}</td>`;

                } else if (col.type === "input-number") {
                    html += `
                        <td>
                            <input type="number"
                                   class="${col.class}"
                                   data-id="${s.id}"
                                   data-name="${s.name}"
                                   data-teacher="${s.teacher}"
                                   value="${s[col.key] || 0}">
                        </td>`;

                } else if (col.type === "input-text") {
                    html += `
                        <td>
                            <input type="text"
                                   class="${col.class}"
                                   data-id="${s.id}"
                                   value="${s[col.key] || ""}">
                        </td>`;

                } else if (col.type === "checkbox") {
                    html += `
                        <td>
                            <input type="checkbox"
                                   class="${col.class}"
                                   data-id="${s.id}"
                                   ${s[col.key] ? "checked" : ""}>
                        </td>`;

                } else if (col.type === "button") {
                    html += `
                        <td>
                            <button class="${col.class} btn-sm"
                                    title="${col.title || ""}"
                                    data-name="${s.name}"
                                    data-teacher="${s.teacher}">${col.label}</button>
                        </td>`;

                } else if (col.type === "adjust") {
                    html += `
                        <td>
                            <button class="btnAdjustAmount btn-sm btn-primary"
                                    title="Adjust donation amount"
                                    data-name="${s.name}"
                                    data-teacher="${s.teacher}"
                                    data-online="${s.online || 0}"
                                    data-cash="${s.cash || 0}"
                                    data-total="${s.amount || 0}">💰</button>
                        </td>`;
                }
            });

            tr.innerHTML = html;
            targetTbody.appendChild(tr);
        });
    };

})();
