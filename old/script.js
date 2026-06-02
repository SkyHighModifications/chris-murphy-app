/* =========================
   OUTLOOK EMAIL (ELECTRON SAFE)
========================= 
async function sendEmail() {

    const typeValue = document.getElementById("type").value;
    const customerValue = customerInput.value;
    const addressValue = addressInput.value;
    const refValue = document.getElementById("ref").value;

    let subject = `${typeValue} - Chris Murphy - ${customerValue} - Ref ${refValue}`;

    let body =
`Hello ${customerValue},

${typeValue} attached details:

Customer: ${customerValue || "N/A"}
Address: ${addressValue || "N/A"}
Reference: ${refValue || "N/A"}

Kind regards,
Chris Murphy`;

    // 1. create PDF buffer
    const buffer = await generatePDFBuffer();

    const filename =
        `${typeValue}_${customerValue}_${refValue}.pdf`
            .replace(/\s+/g, "_");

    // 2. send to Electron
    await window.api.sendInvoiceEmail({
        buffer,
        filename,
        subject,
        body
    });
    showToast("Opening & Sending PDF to Outlook")
}


function loadAllDocuments() {
    
    document.getElementById("emailBtn").addEventListener("click", (e) => { e.preventDefault(); sendEmail(); });
    
}
*/