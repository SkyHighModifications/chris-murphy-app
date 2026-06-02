import { customerInput, addressInput } from "./consts.js";
import { getCurrentYear } from "./globals.js";
import { initPaymentSystem } from "../modules/payment.js";
import { loadTemplate, switchDocument, updatePreviewFromInputs } from "../modules/template.js";
import {
    loadCustomers,
    saveCustomer,
    newCustomer,
    searchCustomer,
    initCustomerDropdown
} from "../modules/customers.js";
import { openNewDocumentFlow, handleModalSaveCustomer } from "../modules/documents.js";
import { initNewDocumentModal } from "../modules/modal.js";
import { savePDFToDesktop, printInvoice } from "../modules/pdf.js";
import { updateSaveButton } from "../modules/ui.js";
import { initUpdates } from "../modules/updates.js";
import { state } from "./state.js";

function initWindowControls() {
    document.getElementById("minimize")?.addEventListener("click", () => {
        window.api.minimize();
    });

    document.getElementById("maximize")?.addEventListener("click", async () => {
        await window.api.maximize();
        const isMaximized = await window.api.isMaximized?.();
        const btn = document.getElementById("maximize");
        if (btn) {
            const icon = btn.querySelector("[data-lucide]");
            if (icon) {
                icon.setAttribute(
                    "data-lucide",
                    isMaximized ? "copy" : "square"
                );
                window.lucide?.createIcons?.();
            }
        }
    });

    document.getElementById("close")?.addEventListener("click", () => {
        window.api.close();
    });
}

function initToolbar() {
    document.getElementById("printBtn")?.addEventListener("click", printInvoice);
    document.getElementById("pdfBtn")?.addEventListener("click", savePDFToDesktop);
    document.getElementById("newBtn")?.addEventListener("click", openNewDocumentFlow);
    document.getElementById("newCustomerBtn")?.addEventListener("click", newCustomer);
    document.getElementById("saveCustomerBtn")?.addEventListener("click", saveCustomer);
    document.getElementById("search")?.addEventListener("keyup", searchCustomer);

    document.querySelectorAll("input, textarea").forEach((el) => {
        el.addEventListener("input", updatePreviewFromInputs);
    });

    customerInput?.addEventListener("input", () => {
        updateSaveButton({ isEditing: state.editIndex !== null });
    });

    addressInput?.addEventListener("input", () => {
        updateSaveButton({ isEditing: state.editIndex !== null });
    });
}

export function initApp() {
    state.editIndex = null;
    state.originalCustomerSnapshot = null;
    state.currentJobSheetId = null;

    getCurrentYear();
    window.lucide?.createIcons?.();

    initWindowControls();
    initToolbar();
    initCustomerDropdown();
    initPaymentSystem();

    initNewDocumentModal({
        onSelectDocument: (type) => switchDocument(type),
        onSaveCustomer: handleModalSaveCustomer
    });

    loadTemplate("invoice");
    loadCustomers();
    updateSaveButton({ isEditing: false });
    initUpdates();
}
