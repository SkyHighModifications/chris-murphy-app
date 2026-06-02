import { invoiceEl, customerInput } from "../renderer/consts.js";
import { state } from "../renderer/state.js";
import { showToast } from "./ui.js";

async function generatePDFBuffer() {
    if (!invoiceEl) throw new Error("Preview element not found");

    const worker = html2pdf().from(invoiceEl).set({
        margin: 0,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "px", format: [794, 1123] }
    });

    return await worker.outputPdf("arraybuffer");
}

export async function savePDFToDesktop() {
    try {
        const buffer = await generatePDFBuffer();

        const customerValue = customerInput?.value || "customer";
        const refValue = document.getElementById("p-ref")?.value || "ref";
        const type = state.currentDocType || "document";

        let filename;

        switch (type) {
            case "quote":
                filename = `Quote_${customerValue}_${refValue}.pdf`;
                break;
            case "invoice":
                filename = `Invoice_${customerValue}_${refValue}.pdf`;
                break;
            case "job-sheet":
                filename = `JobSheet.pdf`;
                break;
            case "time-sheet":
                filename = `TimeSheet.pdf`;
                break;
            default:
                filename = `Document_${refValue}.pdf`;
        }

        filename = filename.replace(/\s+/g, "_");

        await window.api.savePdfToDesktop({ buffer, filename, type });
        showToast(`${filename} saved`);
    } catch (err) {
        console.error("PDF save failed:", err);
        showToast("Failed to generate PDF");
    }
}

export async function printInvoice() {
    try {
        if (!invoiceEl) return;

        const type = state.currentDocType || "invoice";
        const title =
            type === "quote"
                ? "Quote"
                : type === "job-sheet"
                  ? "Job Sheet"
                  : type === "time-sheet"
                    ? "Time Sheet"
                    : "Invoice";

        const worker = html2pdf().from(invoiceEl).set({
            margin: 0,
            image: { type: "jpeg", quality: 1 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "px", format: [794, 1123] }
        });

        const pdfBuffer = await worker.outputPdf("arraybuffer");
        const blob = new Blob([pdfBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const printWindow = window.open(url);
        if (!printWindow) {
            showToast("Popup blocked — allow popups to print");
            return;
        }

        printWindow.onload = () => {
            printWindow.document.title = title;
            printWindow.focus();
        };
    } catch (err) {
        console.error("Print failed:", err);
        showToast("Print failed");
    }
}
