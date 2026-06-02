/** Shared renderer state (single source of truth). */
export const state = {
    customers: [],
    editIndex: null,
    originalCustomerSnapshot: null,
    currentJobSheetId: null,
    currentDocType: "invoice"
};

export const DOC_TYPES = {
    INVOICE: "invoice",
    QUOTE: "quote",
    TIMESHEET: "time-sheet",
    JOBSHEET: "job-sheet"
};
