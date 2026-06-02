const { autoUpdater } = require("electron-updater");
const { app, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

const LAST_SEEN_FILE = "last-seen-version.json";

let mainWindowRef = null;
let splashStatusFn = null;
let updateCheckPromise = null;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.autoRunAppAfterInstall = true;

function setRefs({ mainWindow, setSplashStatus }) {
    mainWindowRef = mainWindow;
    splashStatusFn = setSplashStatus;
}

function send(channel, payload) {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
        mainWindowRef.webContents.send(channel, payload);
    }
}

function splash(message) {
    splashStatusFn?.(message);
}

function getLastSeenPath() {
    return path.join(app.getPath("userData"), LAST_SEEN_FILE);
}

function readLastSeenVersion() {
    try {
        const raw = fs.readFileSync(getLastSeenPath(), "utf-8");
        return JSON.parse(raw)?.version ?? null;
    } catch {
        return null;
    }
}

function writeLastSeenVersion(version) {
    fs.writeFileSync(
        getLastSeenPath(),
        JSON.stringify({ version, seenAt: Date.now() }, null, 2)
    );
}

function loadChangelog() {
    const changelogPath = path.join(app.getAppPath(), "changelog.json");
    try {
        return JSON.parse(fs.readFileSync(changelogPath, "utf-8"));
    } catch (err) {
        console.error("Failed to read changelog.json:", err);
        return { releases: [] };
    }
}

function getReleaseForVersion(version) {
    const changelog = loadChangelog();
    return (
        changelog.releases?.find((r) => r.version === version) ??
        null
    );
}

function shouldShowWhatsNew() {
    if (!app.isPackaged) return false;

    const current = app.getVersion();
    const lastSeen = readLastSeenVersion();

    if (!lastSeen) return true;
    return lastSeen !== current;
}

function registerUpdaterHandlers() {
    autoUpdater.on("checking-for-update", () => {
        splash("Checking for updates…");
        send("update-status", { state: "checking" });
    });

    autoUpdater.on("update-available", (info) => {
        splash(`Update found — v${info.version} downloading…`);
        send("update-status", {
            state: "available",
            version: info.version
        });
    });

    autoUpdater.on("update-not-available", () => {
        splash("You're on the latest version");
        send("update-status", { state: "not-available" });
    });

    autoUpdater.on("download-progress", (progress) => {
        const pct = Math.round(progress.percent || 0);
        splash(`Downloading update… ${pct}%`);
        send("update-status", { state: "downloading", percent: pct });
    });

    autoUpdater.on("update-downloaded", (info) => {
        splash("Update downloaded — ready to install");
        send("update-downloaded", {
            version: info.version,
            releaseNotes: info.releaseNotes
        });

        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            dialog
                .showMessageBox(mainWindowRef, {
                    type: "info",
                    title: "Update Ready",
                    message: `Version ${info.version} has been downloaded.`,
                    detail: "Restart the app to install the update.",
                    buttons: ["Restart Now", "Later"],
                    defaultId: 0,
                    cancelId: 1
                })
                .then(({ response }) => {
                    if (response === 0) {
                        autoUpdater.quitAndInstall(false, true);
                    }
                });
        }
    });

    autoUpdater.on("error", (err) => {
        console.error("Auto-update error:", err);
        splash("Loading application…");
        send("update-status", {
            state: "error",
            message: err?.message ?? "Update check failed"
        });
    });
}

function checkForUpdates({ silent = false } = {}) {
    if (!app.isPackaged) {
        return Promise.resolve(null);
    }

    if (updateCheckPromise) return updateCheckPromise;

    updateCheckPromise = autoUpdater
        .checkForUpdates()
        .catch((err) => {
            console.error("checkForUpdates failed:", err);
            if (!silent) {
                send("update-status", {
                    state: "error",
                    message: err?.message ?? "Could not check for updates"
                });
            }
            return null;
        })
        .finally(() => {
            updateCheckPromise = null;
        });

    return updateCheckPromise;
}

function checkForUpdatesAndNotify() {
    if (!app.isPackaged) return Promise.resolve(null);
    return autoUpdater.checkForUpdatesAndNotify();
}

function initUpdater(refs) {
    setRefs(refs);
    registerUpdaterHandlers();
}

function setupWhatsNewHandlers(ipcMain) {
    ipcMain.handle("changelog:get-current", () => {
        const version = app.getVersion();
        return {
            version,
            release: getReleaseForVersion(version),
            shouldShow: shouldShowWhatsNew()
        };
    });

    ipcMain.handle("changelog:dismiss", (_, version) => {
        writeLastSeenVersion(version || app.getVersion());
        return true;
    });

    ipcMain.handle("update:check", () => checkForUpdates({ silent: false }));

    ipcMain.handle("update:install", () => {
        autoUpdater.quitAndInstall(false, true);
        return true;
    });
}

module.exports = {
    initUpdater,
    checkForUpdates,
    checkForUpdatesAndNotify,
    setupWhatsNewHandlers,
    shouldShowWhatsNew,
    splash
};
