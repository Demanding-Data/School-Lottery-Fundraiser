// ======================================================
//  App.StudentModel  —  Unified Student View Model
//  v3: ticket codes (2-letter + 6-digit, seeded, per slot)
// ======================================================

window.App = window.App || {};
App.StudentModel = {};

(function () {

    const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion

    // --------------------------------------------------
    // Build unified student view models
    // --------------------------------------------------
    App.StudentModel.build = function (students, options = {}) {
        const {
            teacherFilter        = null,
            dollarPerTicket      = App.State?.dollarPerTicket || 5,
            ticketRounding       = App.State?.ticketRounding  || "floor",
            includeLotteryFields = true
        } = options;

        const roundFn = ticketRounding === "ceil"  ? Math.ceil
                      : ticketRounding === "round" ? Math.round
                      :                              Math.floor;

        let filtered = teacherFilter
            ? students.filter(s => s.teacher === teacherFilter)
            : students;

        return filtered.map(s => {
            const online = Number(s.online || 0);
            const cash   = Number(s.cash   || 0);
            const amount = online + cash;

            let base = null, extra = null, totalTickets = null;

            if (includeLotteryFields) {
                base         = 1;
                extra        = dollarPerTicket > 0 ? roundFn(amount / dollarPerTicket) : 0;
                totalTickets = base + extra;
            }

            return { ...s, online, cash, amount, base, extra, totalTickets };
        });
    };

    // --------------------------------------------------
    // Compute odds (based on full pool passed in)
    // --------------------------------------------------
    App.StudentModel.computeOdds = function (students) {
        const totalTickets = students.reduce((sum, s) => sum + (s.totalTickets || 0), 0);

        return students.map(s => ({
            ...s,
            odds: totalTickets > 0
                ? Number(((s.totalTickets / totalTickets) * 100).toFixed(2))
                : 0
        }));
    };

    // --------------------------------------------------
    // Generate a deterministic ticket code from index + seed
    // Format: 2 letters + 6 digits  e.g. "KR-048271"
    // --------------------------------------------------
    function makeTicketCode(index, rng) {
        const l1  = LETTERS[Math.floor(rng() * LETTERS.length)];
        const l2  = LETTERS[Math.floor(rng() * LETTERS.length)];
        const num = Math.floor(rng() * 1000000).toString().padStart(6, "0");
        return `${l1}${l2}-${num}`;
    }

    // --------------------------------------------------
    // Build ticket pool with unique codes per slot
    // Must be called with the same seed to get same codes
    // --------------------------------------------------
    App.StudentModel.buildTicketPool = function (students, seed) {
        const pool = [];

        // Collect all slots first (sorted deterministically)
        const sorted = [...students]
            .filter(s => !s.exclude)
            .sort((a, b) => a.name.localeCompare(b.name) || a.teacher.localeCompare(b.teacher));

        // Count total slots to size the code space
        sorted.forEach(s => {
            const total = s.totalTickets || 0;
            for (let i = 0; i < total; i++) {
                pool.push({
                    name:    s.name,
                    teacher: s.teacher,
                    amount:  s.amount,
                    tickets: total,
                    code:    null  // assigned next
                });
            }
        });

        // Assign codes using seeded RNG — same seed = same codes every time
        const codeSeed = seed != null ? seed : 0;
        const rng      = App.StudentModel.mulberry32(codeSeed + 0xDEADBEEF);

        pool.forEach((t, i) => {
            t.code = makeTicketCode(i, rng);
        });

        return pool;
    };

    // --------------------------------------------------
    // Deterministic RNG (Mulberry32)
    // --------------------------------------------------
    App.StudentModel.mulberry32 = function (seed) {
        let t = seed >>> 0;
        return function () {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    };

    App.StudentModel.seedFromString = function (str) {
        let h = 1779033703 ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return h >>> 0;
    };

    App.StudentModel.shufflePool = function (pool, rng) {
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool;
    };

})();
