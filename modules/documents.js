import { modal, customerInput } from "../renderer/consts.js";
import { saveCustomer, isCurrentCustomerSaved } from "./customers.js";
import { switchDocument } from "./template.js";
import { showNewDocumentModal } from "./modal.js";

export function openNewDocumentFlow() {
    const name = customerInput?.value.trim() ?? "";
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");

    if (modalTitle) modalTitle.innerText = "New Document";

    if (modalMessage) {
        if (!name) {
            modalMessage.innerText =
                "No customer name entered. Would you like to continue?";
        } else if (!isCurrentCustomerSaved()) {
            modalMessage.innerHTML = `"<span class="modal-highlight">${escapeHtml(name.toUpperCase())}</span>" is not saved. Save them before continuing?`;
        } else {
            modalMessage.innerText = "Create a new document?";
        }
    }

    showNewDocumentModal();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

export function handleModalSaveCustomer() {
    if (!isCurrentCustomerSaved()) {
        saveCustomer();
    }
    switchDocument("invoice");
}
