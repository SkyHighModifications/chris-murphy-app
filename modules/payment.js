const PAYMENT_DATA = {
    dad: {
        name: "Mr C Murphy",
        number: "80507730",
        sort: "09-01-27"
    },
    joint: {
        name: "Mr C Murphy",
        number: "80501516",
        sort: "09-01-27"
    }
};

export function updatePaymentDetails() {
    const account = document.getElementById("account");
    const accName = document.getElementById("accName");
    const accNumber = document.getElementById("accNumber");
    const sortCode = document.getElementById("sortCode");

    if (!account || !accName || !accNumber || !sortCode) return;

    const selected = PAYMENT_DATA[account.value] || PAYMENT_DATA.dad;

    accName.textContent = selected.name;
    accNumber.textContent = selected.number;
    sortCode.textContent = selected.sort;
}

export function initPaymentSystem() {
    const account = document.getElementById("account");
    if (!account) return;

    if (account.dataset.paymentBound === "1") {
        updatePaymentDetails();
        return;
    }

    account.dataset.paymentBound = "1";
    account.addEventListener("change", updatePaymentDetails);
    updatePaymentDetails();
}
