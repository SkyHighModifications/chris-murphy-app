// modules/ui.js
let toastTimer = null;

export function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

export function updateSaveButton(arg = {}) {
    const btn = document.getElementById("saveCustomerBtn");
    const icon = document.getElementById("saveIcon");
    if (!btn || !icon) return;

    const isEditing =
        typeof arg === "boolean" ? arg : Boolean(arg?.isEditing);

    if (isEditing) {
        btn.title = "Update Customer";
        icon.setAttribute("data-lucide", "user-pen");
    } else {
        btn.title = "Save New Customer";
        icon.setAttribute("data-lucide", "user-plus");
    }

    const lucideInstance =
        typeof arg === "object" ? (arg?.lucide ?? window.lucide) : window.lucide;
    lucideInstance?.createIcons?.();
}