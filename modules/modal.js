import { modal } from "../renderer/consts.js";

const DOC_BUTTONS = {
    modalInvoice: "invoice",
    modalQuote: "quote",
    modalJobsheet: "job-sheet",
    modalTimesheet: "time-sheet"
};

export function showNewDocumentModal() {
    if (modal) modal.style.display = "flex";
}

export function hideNewDocumentModal() {
    if (modal) modal.style.display = "none";
}

export function initNewDocumentModal({ onSelectDocument, onSaveCustomer }) {
    document.getElementById("newBtn")?.addEventListener("click", () => {
        // openNewDocumentFlow is wired from documents module via app
    });

    document
        .getElementById("modalCancel")
        ?.addEventListener("click", hideNewDocumentModal);

    for (const [buttonId, docType] of Object.entries(DOC_BUTTONS)) {
        document.getElementById(buttonId)?.addEventListener("click", () => {
            hideNewDocumentModal();
            onSelectDocument?.(docType);
        });
    }

    document.getElementById("modalSaveCustomer")?.addEventListener("click", () => {
        hideNewDocumentModal();
        onSaveCustomer?.();
    });

    modal?.addEventListener("click", (e) => {
        if (e.target === modal) hideNewDocumentModal();
    });
}
