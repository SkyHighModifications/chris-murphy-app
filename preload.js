const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    saveJobSheet: (data) => ipcRenderer.invoke("save-job-sheet", data),
    loadJobSheet: (id) => ipcRenderer.invoke("load-job-sheet", id),
    getJobSheets: () => ipcRenderer.invoke("load-job-sheets"),

    onVersion: (callback) => ipcRenderer.on("app-version", (_, version) => callback(version)),
    loadCustomers: () => ipcRenderer.invoke("customers:load"),
    saveCustomers: (data) => ipcRenderer.invoke("customers:save", data),

    sendInvoiceEmail: (data) => ipcRenderer.invoke("mail:sendInvoice", data),
    savePdfToDesktop: (data) => ipcRenderer.invoke("pdf:saveDesktop", data),

    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),

    getWhatsNew: () => ipcRenderer.invoke("changelog:get-current"),
    dismissWhatsNew: (version) => ipcRenderer.invoke("changelog:dismiss", version),
    checkForUpdates: () => ipcRenderer.invoke("update:check"),
    installUpdate: () => ipcRenderer.invoke("update:install"),

    onUpdateStatus: (callback) =>
        ipcRenderer.on("update-status", (_, status) => callback(status)),
    onUpdateDownloaded: (callback) =>
        ipcRenderer.on("update-downloaded", (_, info) => callback(info))
});
