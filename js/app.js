// ======================================================
//  app.js — Global namespace and state
//  MUST load first before all other scripts
// ======================================================

window.App = window.App || {};

App.State = {
    activePanel:          "manager",
    currentTeacherFilter: null,
    lotteryTeacherFilter: null,
    dollarPerTicket:      5,
    ticketRounding:       "floor",
    auditCSV:             null,
    ticketsValid:         false,
    ticketPool:           null,
    currentSeed:          null,
    lastSeed:             null
};
