import { showToast } from "./ui.js";

export function initUpdates() {
    initWhatsNew();
    initUpdateListeners();
}

async function initWhatsNew() {
    if (!window.api?.getWhatsNew) return;

    try {
        const data = await window.api.getWhatsNew();
        if (!data?.shouldShow) return;

        showWhatsNewModal(data);
    } catch (err) {
        console.error("What's new check failed:", err);
    }
}

function showWhatsNewModal(data) {
    const modal = document.getElementById("whatsNewModal");
    const title = document.getElementById("whatsNewTitle");
    const version = document.getElementById("whatsNewVersion");
    const list = document.getElementById("whatsNewList");
    const dismiss = document.getElementById("whatsNewDismiss");

    if (!modal || !list) return;

    const release = data.release;
    const ver = data.version || release?.version || "";

    if (title) {
        title.textContent = release?.title || "What's New";
    }

    if (version) {
        version.textContent = ver ? `Version ${ver}` : "";
    }

    const changes = release?.changes?.length
        ? release.changes
        : ["Thanks for updating! This version includes improvements and fixes."];

    list.innerHTML = changes
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    window.lucide?.createIcons?.();

    const close = async () => {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
        try {
            await window.api.dismissWhatsNew(ver);
        } catch (err) {
            console.error("Failed to dismiss what's new:", err);
        }
    };

    dismiss?.addEventListener("click", close, { once: true });
    modal.addEventListener(
        "click",
        (e) => {
            if (e.target === modal) close();
        },
        { once: true }
    );
}

function initUpdateListeners() {
    window.api?.onUpdateStatus?.((status) => {
        if (status?.state === "error" && !status?.silent) {
            console.warn("Update:", status.message);
        }
    });

    window.api?.onUpdateDownloaded?.((info) => {
        showUpdateReadyBanner(info);
    });
}

function showUpdateReadyBanner(info) {
    let banner = document.getElementById("updateReadyBanner");

    if (!banner) {
        banner = document.createElement("div");
        banner.id = "updateReadyBanner";
        banner.className = "update-ready-banner";
        banner.innerHTML = `
            <span class="update-ready-text"></span>
            <button type="button" class="update-ready-btn" id="updateRestartBtn">Restart to update</button>
            <button type="button" class="update-ready-dismiss" id="updateDismissBtn" aria-label="Dismiss">✕</button>
        `;
        document.body.appendChild(banner);
    }

    banner.querySelector(".update-ready-text").textContent =
        `Update v${info.version} is ready to install.`;

    banner.classList.add("is-visible");

    banner.querySelector("#updateRestartBtn")?.addEventListener("click", () => {
        window.api.installUpdate?.();
    });

    banner.querySelector("#updateDismissBtn")?.addEventListener("click", () => {
        banner.classList.remove("is-visible");
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}
