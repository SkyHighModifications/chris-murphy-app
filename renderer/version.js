window.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.getElementById("version");
    window.api.onVersion((version) => {
        if (versionElement) {
            versionElement.textContent = version;
        }
    });
});   