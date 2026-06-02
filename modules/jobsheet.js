import { state } from "../renderer/state.js";
import { addJobRowBtn, loadBtn } from "../renderer/consts.js";
import { formatDate, togglePaid } from "../renderer/globals.js";
import { showToast } from "./ui.js";

const RECENT_STORAGE_KEY = "cmurphy:lastJobSheet";
let modalInitialized = false;

/** Wire sidebar job-sheet buttons (call when template is job-sheet). */
export function bindJobSheetToolbar() {
    const saveBtn = document.getElementById("saveJobSheetBtn");
    if (saveBtn) saveBtn.onclick = saveJobSheet;

    if (loadBtn) {
        loadBtn.onclick = async () => {
            try {
                const sheets = await window.api.getJobSheets();
                showJobSheetPicker(Array.isArray(sheets) ? sheets : []);
            } catch (err) {
                console.error("Failed to list job sheets:", err);
                showToast("Could not load job sheet list");
            }
        };
    }
}

export function getRecentJobSheet() {
    try {
        const raw = localStorage.getItem(RECENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.id) return null;
        return parsed;
    } catch {
        return null;
    }
}

function setRecentJobSheet(id) {
    if (!id) return;
    try {
        localStorage.setItem(
            RECENT_STORAGE_KEY,
            JSON.stringify({ id: String(id), openedAt: Date.now() })
        );
    } catch (err) {
        console.warn("Could not store recent job sheet:", err);
    }
}

export function initJobSheet() {
    const table = document.getElementById("jobTable");
    if (!table || !addJobRowBtn) {
        console.warn("Job sheet table not ready");
        return;
    }

    addJobRowBtn.onclick = addJobRow;

    if (table.dataset.bound === "1") return;
    table.dataset.bound = "1";

    table.addEventListener("click", (e) => {
        if (e.target.classList.contains("paid-cell")) {
            togglePaid(e.target);
        }
    });

    table.addEventListener("input", (e) => {
        if (e.target.classList.contains("job-date")) {
            const value = e.target.innerText.trim();
            const formatted = formatDate(value);
            if (formatted) e.target.dataset.raw = value;
        }
    });

    table.querySelectorAll("tbody tr").forEach((row) => hydrateJobRowDefaults(row));
}

function isPaidCell(cell) {
    const text = cell?.innerText?.trim() ?? "🔴";
    return text === "🟢" || text.includes("🟢");
}

function getTodayDateDisplay() {
    const now = new Date();
    return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
}

function getCurrency() {
    return `£`;
}

function getSidebarCustomerName() {
    return document.getElementById("customer")?.value?.trim() || "";
}

function hydrateJobRowDefaults(row) {
    if (!row?.cells) return;

    if (!row.cells[1]?.innerText.trim()) {
        row.cells[1].innerText = getSidebarCustomerName();
    }

    if (!row.cells[3]?.innerText.trim()) {
        row.cells[3].innerText = getTodayDateDisplay();
    }

    if (!row.cells[2]?.innerText.trim()) {
        row.cells[2].innerText = getCurrency();
    }
}

function addJobRow() {
    const tbody = document.querySelector("#jobTable tbody");
    if (!tbody) return;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td contenteditable="true"></td>
        <td id="p-customer" class="job-customer" data-placeholder="Customer Name" contenteditable="true"></td>
        <td contenteditable="true"><span class="currency">£</span> </td>
        <td contenteditable="true"></td>
        <td class="paid-cell unpaid" title="Click to mark paid">🔴</td>
        <td contenteditable="true"></td>
    `;
    hydrateJobRowDefaults(row);
    tbody.appendChild(row);
}

export function getJobSheetData() {
    const rows = document.querySelectorAll("#jobTable tbody tr");
    return Array.from(rows).map((row) => {
        const cells = row.cells;
        return {
            jobNo: cells[0]?.innerText.trim() ?? "",
            customer: cells[1]?.innerText.trim() ?? "",
            amount: cells[2]?.innerText.trim() ?? "",
            date: cells[3]?.innerText.trim() ?? "",
            paid: isPaidCell(cells[4]),
            description: cells[5]?.innerText.trim() ?? ""
        };
    });
}

export async function saveJobSheet() {
    const rows = getJobSheetData();
    const data = {
        id: state.currentJobSheetId || undefined,
        rows
    };

    if (!data.id) {
        showToast("Saving new job sheet…");
    }

    try {
        const id = await window.api.saveJobSheet(data);
        state.currentJobSheetId = id;
        showToast(`Job sheet saved · ${formatJobSheetDisplayId(id)}`);
    } catch (err) {
        console.error("Save job sheet failed:", err);
        showToast("Failed to save job sheet");
    }
}

export async function loadJobSheet(id) {
    if (!id) return;

    try {
        const data = await window.api.loadJobSheet(id);
        if (!data?.rows) {
            showToast("Job sheet not found");
            return;
        }

        state.currentJobSheetId = data.id ?? id;
        setRecentJobSheet(state.currentJobSheetId);

        const tbody = document.querySelector("#jobTable tbody");
        if (!tbody) {
            console.warn("Job table missing — load after template is ready");
            return;
        }

        tbody.innerHTML = "";

        data.rows.forEach((r) => {
            const row = document.createElement("tr");
            const paidClass = r.paid ? "paid" : "unpaid";
            row.innerHTML = `
                <td contenteditable="true">${escapeHtml(r.jobNo ?? "")}</td>
                <td contenteditable="true">${escapeHtml(r.customer ?? "")}</td>
                <td contenteditable="true">${escapeHtml(r.amount ?? "")}</td>
                <td contenteditable="true">${escapeHtml(r.date ?? "")}</td>
                <td class="paid-cell ${paidClass}" title="Click to mark paid">${r.paid ? "🟢" : "🔴"}</td>
                <td contenteditable="true">${escapeHtml(r.description ?? "")}</td>
            `;
            tbody.appendChild(row);
        });

        if (tbody.rows.length === 0) addJobRow();

        showToast("Job sheet loaded");
    } catch (err) {
        console.error("Load job sheet failed:", err);
        showToast("Failed to load job sheet");
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

function ensureJobSheetModalHandlers() {
    if (modalInitialized) return;
    modalInitialized = true;

    const modal = document.getElementById("jobSheetModal");
    const closeBtn = document.getElementById("closeJobSheetModal");

    closeBtn?.addEventListener("click", () => hideJobSheetModal());
    modal?.addEventListener("click", (e) => {
        if (e.target === modal) hideJobSheetModal();
    });
}

function hideJobSheetModal() {
    const modal = document.getElementById("jobSheetModal");
    if (modal) {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }
}

async function openSheetFromPicker(id) {
    hideJobSheetModal();
    await loadJobSheet(id);
}

function formatJobSheetDisplayId(id) {
    if (!id) return "Untitled sheet";

    const str = String(id);
    const match =
        str.match(/^JS-(\d{4})-(\d{2})-(\d{2})-(\d{3})$/) ||
        str.match(/^JobSheet-(\d{2})-(\d{2})-(\d{4})-(\d{3})$/);

    if (match) {
        const [, a, b, c, seq] = match;
        const fromJsPattern = str.startsWith("JS-");
        const y = fromJsPattern ? a : c;
        const m = fromJsPattern ? b : b;
        const d = fromJsPattern ? c : a;
        const date = `${Number(d)}/${Number(m)}/${y}`;
        return `${date} · Sheet ${seq}`;
    }

    if (/^\d{10,}$/.test(str)) {
        const dt = new Date(Number(str));
        const legacyDate = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
        return `Legacy sheet · ${legacyDate}`;
    }

    return str;
}

function formatSheetLabel(sheet) {
    const saved = sheet.updatedAt
        ? new Date(sheet.updatedAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
          })
        : "Unknown date";
    const rows = sheet.rows?.length ?? 0;
    return { saved, rows };
}

function renderRecentBanner(recentSheet, recentMeta) {
    const banner = document.getElementById("jobSheetRecent");
    if (!banner) return;

    if (!recentSheet) {
        banner.hidden = true;
        banner.innerHTML = "";
        return;
    }

    const opened = recentMeta?.openedAt
        ? new Date(recentMeta.openedAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
          })
        : null;

    const { saved, rows } = formatSheetLabel(recentSheet);

    banner.hidden = false;
    banner.innerHTML = `
        <div class="job-sheet-recent-inner">
            <div class="job-sheet-recent-text">
                <span class="job-sheet-recent-label">Recently opened</span>
                <strong class="job-sheet-recent-title">${escapeHtml(formatJobSheetDisplayId(recentSheet.id))}</strong>
                <span class="job-sheet-recent-id">${escapeHtml(recentSheet.id)}</span>
                <span class="job-sheet-recent-meta">
                    ${rows} row${rows === 1 ? "" : "s"} · Saved ${escapeHtml(saved)}
                    ${opened ? ` · Opened ${escapeHtml(opened)}` : ""}
                </span>
            </div>
            <button type="button" class="job-sheet-recent-open btn-primary">Open again</button>
        </div>
    `;

    banner.querySelector(".job-sheet-recent-open")?.addEventListener("click", (e) => {
        e.stopPropagation();
        openSheetFromPicker(recentSheet.id);
    });
}

function createListItem(sheet, { isRecent }) {
    const { saved, rows } = formatSheetLabel(sheet);

    const div = document.createElement("button");
    div.type = "button";
    div.className = "modal-list-item";
    if (isRecent) div.classList.add("is-recent");
    if (String(state.currentJobSheetId) === String(sheet.id)) {
        div.classList.add("is-active");
    }

    div.innerHTML = `
        <span class="modal-list-item-main">
            <span class="modal-list-item-title">
                ${escapeHtml(formatJobSheetDisplayId(sheet.id))}
                ${isRecent ? '<span class="badge badge-recent">Recent</span>' : ""}
                ${String(state.currentJobSheetId) === String(sheet.id) ? '<span class="badge badge-current">Current</span>' : ""}
            </span>
            <span class="modal-list-meta">${rows} row${rows === 1 ? "" : "s"} · ${escapeHtml(saved)} · <span class="sheet-id-code">${escapeHtml(sheet.id)}</span></span>
        </span>
        <span class="modal-list-chevron" aria-hidden="true">›</span>
    `;

    div.addEventListener("click", () => openSheetFromPicker(sheet.id));

    return div;
}

export function showJobSheetPicker(sheets) {
    ensureJobSheetModalHandlers();

    const container = document.getElementById("jobSheetList");
    const modal = document.getElementById("jobSheetModal");

    if (!container || !modal) {
        showToast("Job sheet picker UI missing");
        return;
    }

    const recentMeta = getRecentJobSheet();
    const recentId = recentMeta?.id;
    const recentSheet = recentId
        ? sheets.find((s) => String(s.id) === String(recentId))
        : null;

    renderRecentBanner(recentSheet, recentMeta);
    container.innerHTML = "";

    if (!sheets.length) {
        container.innerHTML =
            '<p class="job-sheet-empty">No saved job sheets yet. Use <strong>Save Job Sheet</strong> to create one.</p>';
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
        return;
    }

    const sorted = sheets
        .slice()
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const others = sorted.filter(
        (s) => !recentSheet || String(s.id) !== String(recentSheet.id)
    );

    if (others.length) {
        const heading = document.createElement("p");
        heading.className = "job-sheet-list-heading";
        heading.textContent = recentSheet ? "All saved sheets" : "Saved sheets";
        container.appendChild(heading);
    }

    others.forEach((sheet) => {
        container.appendChild(
            createListItem(sheet, {
                isRecent: String(sheet.id) === String(recentId)
            })
        );
    });

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
}
