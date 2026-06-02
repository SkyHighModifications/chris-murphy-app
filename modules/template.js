import {
    invoiceEl,
    customerInput,
    addressInput,
    addJobRowBtn,
    addTimeRowBtn
} from "../renderer/consts.js";
import { state } from "../renderer/state.js";
import { getCurrentYear, setTodayDate, formatDate } from "../renderer/globals.js";
import { showToast } from "./ui.js";
import { initJobSheet, bindJobSheetToolbar, loadJobSheet } from "./jobsheet.js";
import { initTimeSheet } from "./timesheet.js";
import { initPaymentSystem } from "./payment.js";

export async function loadTemplate(type) {
    if (!type || !invoiceEl) return;

    const templateType = String(type).toLowerCase();
    state.currentDocType = templateType;

    try {
        const response = await fetch(`templates/${templateType}.html`);
        if (!response.ok) throw new Error(`Template not found: ${templateType}`);

        invoiceEl.innerHTML = await response.text();

        const paymentSection = document.getElementById("paymentSection");
        const footerTerms = document.getElementById("footerTerms");
        const isQuote = templateType === "quote";

        if (paymentSection) {
            paymentSection.style.display = isQuote ? "none" : "block";
        }
        if (footerTerms) {
            footerTerms.style.display = isQuote ? "none" : "block";
        }

        getCurrentYear();

        const dateEl = document.getElementById("p-date");
        if (dateEl) setTodayDate(dateEl);

        updatePreviewFromInputs();

        setTimeout(() => {
            initPaymentSystem();

            if (templateType === "job-sheet") {
                initJobSheet();
                bindJobSheetToolbar();

                if (state.currentJobSheetId) {
                    requestAnimationFrame(() => {
                        loadJobSheet(state.currentJobSheetId);
                    });
                }
            }
        }, 0);

        requestAnimationFrame(() => {
            if (templateType === "time-sheet") initTimeSheet();
        });

        const payment = document.getElementById("payment");
        if (payment) {
            payment.style.display = templateType === "invoice" ? "block" : "none";
        }

        const saveJobSheetBtn = document.getElementById("saveJobSheetBtn");
        if (saveJobSheetBtn) {
            saveJobSheetBtn.style.display =
                templateType === "job-sheet" ? "block" : "none";
        }

        const loadJobSheetBtn = document.getElementById("loadJobSheetBtn");
        if (loadJobSheetBtn) {
            loadJobSheetBtn.style.display =
                templateType === "job-sheet" ? "block" : "none";
        }

        if (addJobRowBtn) {
            addJobRowBtn.style.display =
                templateType === "job-sheet" ? "block" : "none";
        }

        if (addTimeRowBtn) {
            addTimeRowBtn.style.display =
                templateType === "time-sheet" ? "block" : "none";
        }
    } catch (err) {
        console.error("Failed to load template:", err);
        showToast("Failed to load document template");
    }
}

export function switchDocument(type) {
    state.originalCustomerSnapshot = null;
    state.currentJobSheetId = null;

    loadTemplate(type);

    if (customerInput) customerInput.value = "";
    if (addressInput) addressInput.value = "";

    const ref = document.getElementById("p-ref");
    const job = document.getElementById("p-job");
    if (ref) ref.value = "";
    if (job) job.value = "";

    updatePreviewFromInputs();
    showToast(`New ${type} created`);
}

export function updatePreviewFromInputs() {
    const dateField = document.getElementById("p-date");
    const dateValue = dateField?.value ?? dateField?.innerText ?? "";

    const map = {
        "p-customer": customerInput?.value || "",
        "p-address": addressInput?.value || "",
        "p-date": dateValue ? formatDate(dateValue) : "",
        "p-ref": document.getElementById("p-ref")?.value || "",
        "p-job": document.getElementById("p-job")?.value || "",
        "p-payment": document.getElementById("payment")?.value || ""
    };

    Object.entries(map).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    });
}

export function fillInvoiceFields(customer) {
    if (!customer) return;

    if (customerInput) customerInput.value = customer.name || "";
    if (addressInput) addressInput.value = customer.address || "";

    updatePreviewFromInputs();
}
