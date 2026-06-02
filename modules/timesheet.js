import { addTimeRowBtn } from "../renderer/consts.js";

export function initTimeSheet() {
    const table = document.getElementById("timeTable");

    if (!table || !addTimeRowBtn) {
        console.warn("Time sheet not ready");
        return;
    }

    addTimeRowBtn.onclick = addTimeRow;

    if (table.dataset.bound === "1") {
        hydrateTimeRowDates();
        updateTotalHours();
        return;
    }

    table.dataset.bound = "1";

    table.addEventListener("input", () => {
        updateTotalHours();
    });

    hydrateTimeRowDates();
    updateTotalHours();
}

export function addTimeRow() {
    const tbody = document.querySelector("#timeTable tbody");
    if (!tbody) return;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td contenteditable="true">${getTodayDateDisplay()}</td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
    `;

    tbody.appendChild(row);
    updateTotalHours();
}

function getTodayDateDisplay() {
    const now = new Date();
    return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
}

function hydrateTimeRowDates() {
    const rows = document.querySelectorAll("#timeTable tbody tr");
    rows.forEach((row) => {
        const dateCell = row?.cells?.[0];
        if (dateCell && !dateCell.innerText.trim()) {
            dateCell.innerText = getTodayDateDisplay();
        }
    });
}

function updateTotalHours() {
    const rows = document.querySelectorAll("#timeTable tbody tr");
    let total = 0;

    rows.forEach((row) => {
        const cell = row?.cells?.[2];
        if (!cell) return;
        const value = parseFloat(cell.innerText.trim());
        if (!isNaN(value)) total += value;
    });

    const output = document.getElementById("totalHours");
    if (output) output.innerText = total.toFixed(2);
}
