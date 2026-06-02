import { state } from "../renderer/state.js";
import { customerInput, addressInput, searchInput } from "../renderer/consts.js";
import { showToast, updateSaveButton } from "./ui.js";
import { fillInvoiceFields } from "./template.js";

const dropdown = document.querySelector(".dropdown");

export async function loadCustomers() {
    try {
        const data = await window.api.loadCustomers();
        state.customers = data || [];
        renderCustomers();
    } catch (err) {
        console.error("Failed to load customers:", err);
        state.customers = [];
    }
}

async function saveCustomersToFile() {
    try {
        await window.api.saveCustomers(state.customers);
    } catch (err) {
        console.error("Failed to save customers:", err);
    }
}

export function renderCustomers(list = state.customers) {
    const box = document.getElementById("customerList");
    if (!box) return;

    box.innerHTML = "";

    list.forEach((c) => {
        const realIndex = state.customers.indexOf(c);

        const div = document.createElement("div");
        div.className = "customer-item";

        div.innerHTML = `
            <div class="customer-avatar">${getInitials(c.name)}</div>
            <div class="customer-info">
                <div class="customer-name">${escapeHtml(c.name)}</div>
                <div class="customer-sub">${escapeHtml(c.address || "")}</div>
            </div>
            <button class="delete-btn" type="button" aria-label="Delete customer">✕</button>
        `;

        div.querySelector(".customer-info").addEventListener("click", () => {
            selectCustomer(realIndex);
        });

        div.querySelector(".delete-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            deleteCustomer(realIndex);
        });

        box.appendChild(div);
    });
}

export function searchCustomer() {
    if (!searchInput) return;

    const q = searchInput.value.toLowerCase();
    renderCustomers(
        state.customers.filter((c) => c.name.toLowerCase().includes(q))
    );
    dropdown?.classList.add("open");
}

export function selectCustomer(i) {
    const customer = state.customers[i];
    if (!customer) return;

    state.editIndex = i;
    state.originalCustomerSnapshot = { ...customer };

    fillInvoiceFields(customer);
    dropdown?.classList.remove("open");

    showToast("Customer loaded");
    updateSaveButton({ isEditing: true });
}

export function deleteCustomer(i) {
    state.customers.splice(i, 1);
    saveCustomersToFile();
    renderCustomers();

    if (state.editIndex === i) {
        state.editIndex = null;
        state.originalCustomerSnapshot = null;
        if (customerInput) customerInput.value = "";
        if (addressInput) addressInput.value = "";
        updateSaveButton({ isEditing: false });
    }

    showToast("Customer deleted");
}

export function saveCustomer() {
    const name = customerInput?.value.trim() ?? "";
    const address = addressInput?.value.trim() ?? "";

    if (!name) {
        showToast("Enter customer name");
        return;
    }

    if (state.editIndex !== null) {
        state.customers[state.editIndex] = { name, address };
        showToast("Customer updated");
    } else {
        let finalName = name;
        let count = 1;

        while (
            state.customers.some(
                (c) => c.name.toLowerCase() === finalName.toLowerCase()
            )
        ) {
            finalName = `${name} (${count})`;
            count++;
        }

        state.customers.push({ name: finalName, address });
        showToast("Customer saved");
    }

    saveCustomersToFile();
    renderCustomers();
    state.currentJobSheetId = null;
    resetCustomerEditState();
    updateSaveButton({ isEditing: false });
}

export function newCustomer() {
    state.editIndex = null;
    state.originalCustomerSnapshot = null;
    state.currentJobSheetId = null;

    if (customerInput) customerInput.value = "";
    if (addressInput) addressInput.value = "";

    fillInvoiceFields({ name: "", address: "" });
    updateSaveButton({ isEditing: false });
    customerInput?.focus();
}

export function isCurrentCustomerSaved() {
    const name = customerInput?.value.trim().toLowerCase() ?? "";
    if (!name) return false;
    return state.customers.some((c) => c.name.toLowerCase() === name);
}

function resetCustomerEditState() {
    state.editIndex = null;
    state.originalCustomerSnapshot = null;
}

function getInitials(name = "") {
    return name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

export function initCustomerDropdown() {
    if (!dropdown || !searchInput) return;

    searchInput.addEventListener("focus", () => {
        dropdown.classList.add("open");
    });

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    });
}
