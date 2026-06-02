export function togglePaid(cell) {
    const text = cell.innerText.trim();
    const isPaid =
        text === "🟢" ||
        text.includes("🟢");

    if (isPaid) {
        cell.innerText = "🔴";
        cell.classList.remove("paid");
        cell.classList.add("unpaid");
    } else {
        cell.innerText = "🟢";
        cell.classList.remove("unpaid");
        cell.classList.add("paid");
    }
}

export function setTodayDate(cell) {
    if (!cell) return;

    // only auto-fill if empty
    if (!cell.value) {

        const today = new Date();

        const formatted =
            today.toISOString().split("T")[0];

        cell.value = formatted;
    }
}

export function formatDate(dateString) {

    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB");
}

export function getCurrentYear() {
    const yearElement = document.getElementById("currentYear");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    return yearElement;
}
