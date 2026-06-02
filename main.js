const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const mainPath = path.join(app.getPath("desktop"), "Chris Murphy Work");
const keepPath = path.join(mainPath, "keep");
const filePath = path.join(keepPath, "customers.json");
const jobsheetDir = path.join(keepPath, "job-sheets");

fs.mkdirSync(jobsheetDir, { recursive: true });
fs.mkdirSync(mainPath, { recursive: true });
fs.mkdirSync(keepPath, { recursive: true });

const { initUpdater, checkForUpdates, setupWhatsNewHandlers } = require("./updater");

const isDev = !app.isPackaged;

let mainWindow;
let splashWindow;

function setSplashStatus(message) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send("splash-status", message);
    }
}

function setSplashVersion(label) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send("splash-version", label);
    }
}

function closeSplash() {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
    }
}

function sendVersion(win) {
    if (isDev) {
        win.webContents.send("app-version", "Development");
        return;
    } else {
    win.webContents.send("app-version", "V" + app.getVersion());    
    }
}

// --------------------
// LOAD CUSTOMERS
// --------------------
ipcMain.handle("customers:load", async () => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data || "[]");
    } catch (err) {
        console.error("Load error:", err);
        return [];
    }
});

// --------------------
// SAVE CUSTOMERS
// --------------------
ipcMain.handle("customers:save", async (event, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error("Save error:", err);
        return false;
    }
});

/*
// --------------------
// OPEN MAIL CLIENT
// --------------------
ipcMain.handle("mail:open", async (event, mailto) => {
    if (!mailto || typeof mailto !== "string") return false;
    return shell.openExternal(mailto);
});

ipcMain.handle("mail:sendInvoice", async (event, data) => {

    const fs = require("fs");
    const path = require("path");

    const desktopPath = app.getPath("desktop");
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString("en-GB", { month: "long" });
    const folderType = data.type === "quote" ? "Quotes" : "Invoices";
    const baseFolder = path.join(
        desktopPath,
        "Chris Murphy Work",
        "Files sent via email",
        folderType,
        String(year),
        month
    );

    const filePath = path.join(baseFolder, data.filename);

    // Save PDF
    fs.writeFileSync(filePath, Buffer.from(data.buffer));

    console.log("PDF saved:", filePath);

    const ps1Path = path.join(app.getPath("temp"), "send_invoice.ps1");

    const script = `
$outlook = New-Object -ComObject Outlook.Application
$mail = $outlook.CreateItem(0)

$mail.Subject = "${data.subject}"
$mail.Body = @"
${data.body}
"@

$mail.Attachments.Add("${filePath}")
$mail.Display()
`;

    fs.writeFileSync(ps1Path, script);

    const { exec } = require("child_process");

    exec(`powershell -ExecutionPolicy Bypass -File "${ps1Path}"`, (err, stdout, stderr) => {
        if (err) console.error("PS ERROR:", err);
        if (stderr) console.error("PS STDERR:", stderr);
        if (stdout) console.log("PS OUT:", stdout);
    });
});
*/

function getVersionedFilePath(baseFolder, filename) {

    const name = path.parse(filename).name;
    const ext = path.parse(filename).ext;

    let finalPath = path.join(baseFolder, filename);

    let counter = 1;

    // If file exists, keep adding (1), (2), (3)...
    while (fs.existsSync(finalPath)) {
        finalPath = path.join(
            baseFolder,
            `${name} (${counter})${ext}`
        );
        counter++;
    }

    return finalPath;
}

ipcMain.handle("pdf:saveDesktop", async (event, data) => {

    const fs = require("fs");
    const path = require("path");

    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString("en-GB", { month: "long" });

    let folderType;
    // Decide folder based on type
    if (data.type === "time-sheet") {
        folderType = "Timesheet";
    } else if (data.type === "job-sheet") {
        folderType = "JobSheet";
    } else {
        folderType = data.type === "quote" ? "Quotes" : "Invoices";
    }

    const baseFolder = path.join(
        mainPath,
        folderType,
        month + " - " + String(year)
    );

    fs.mkdirSync(baseFolder, { recursive: true });

     const filePath = getVersionedFilePath(baseFolder, data.filename);

    fs.writeFileSync(filePath, Buffer.from(data.buffer));

    console.log("Saved PDF to:", filePath);

    return filePath;
});

function generateJobSheetId() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const datePart = `${y}-${m}-${d}`;
    const prefix = `JS-${datePart}`;

    let maxSeq = 0;

    if (fs.existsSync(jobsheetDir)) {
        for (const file of fs.readdirSync(jobsheetDir)) {
            if (!file.endsWith(".json")) continue;

            const id = path.basename(file, ".json");
            const match = id.match(/^JS-\d{4}-\d{2}-\d{2}-(\d{3})$/);

            if (match && id.startsWith(prefix)) {
                const seq = parseInt(match[1], 10);
                if (seq > maxSeq) maxSeq = seq;
            }
        }
    }

    return `${prefix}-${String(maxSeq + 1).padStart(3, "0")}`;
}

ipcMain.handle("save-job-sheet", (_, data) => {
    const id = data.id || generateJobSheetId();
    const file = path.join(jobsheetDir, `${id}.json`);

    fs.writeFileSync(
        file,
        JSON.stringify(
            {
                ...data,
                id,
                updatedAt: Date.now()
            },
            null,
            2
        )
    );

    return id;
});

ipcMain.handle("load-job-sheets", () => {

    if (!fs.existsSync(jobsheetDir)) return [];

    const files = fs.readdirSync(jobsheetDir);

    return files.map(file => {
        const raw = fs.readFileSync(path.join(jobsheetDir, file), "utf-8");
        return JSON.parse(raw);
    });
});

ipcMain.handle("load-job-sheet", (_, id) => {

    const file = path.join(jobsheetDir, `${id}.json`);

    if (!fs.existsSync(file)) return null;

    return JSON.parse(fs.readFileSync(file, "utf-8"));
});

ipcMain.handle("window:minimize", () => {
    mainWindow.minimize();
});

ipcMain.handle("window:maximize", () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.handle("window:isMaximized", () => {
    return mainWindow.isMaximized();
});

ipcMain.handle("window:close", () => {
    mainWindow.close();
});

// --------------------
// WINDOW
// --------------------
function createWindow() {
    const versionLabel = isDev ? "Development" : `V${app.getVersion()}`;

    splashWindow = new BrowserWindow({
        width: 400,
        height: 480,
        frame: false,
        show: true,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        center: true,
        webPreferences: {
            preload: path.join(__dirname, "splash-preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile("splash.html");

    splashWindow.webContents.once("did-finish-load", () => {
        setSplashVersion(versionLabel);
        setSplashStatus("Initialising…");
    });

    mainWindow = new BrowserWindow({
        show: false,
        frame: isDev,
        fullscreenable: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    initUpdater({
        mainWindow,
        setSplashStatus
    });

    setupWhatsNewHandlers(ipcMain);

    if (!isDev) {
        mainWindow.setMenu(null);
        mainWindow.setMenuBarVisibility(false);
    }

    mainWindow.loadFile("index.html");

    mainWindow.webContents.on("dom-ready", () => sendVersion(mainWindow));

    mainWindow.webContents.on("ready-to-show", async () => {
        setSplashStatus("Loading application…");

        if (app.isPackaged) {
            try {
                await Promise.race([
                    checkForUpdates(),
                    new Promise((resolve) => setTimeout(resolve, 8000))
                ]);
            } catch (err) {
                console.error("Update check during splash failed:", err);
            }
        }

        const minSplashMs = isDev ? 400 : 3500;

        setTimeout(() => {
            mainWindow.maximize();
            mainWindow.show();
            closeSplash();
        }, minSplashMs);
    });
}

app.whenReady().then(() => {
    createWindow();
});