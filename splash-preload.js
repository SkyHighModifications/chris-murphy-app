const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("splashApi", {
    onStatus: (callback) => {
        ipcRenderer.on("splash-status", (_, message) => callback(message));
    },
    onVersion: (callback) => {
        ipcRenderer.on("splash-version", (_, version) => callback(version));
    }
});
