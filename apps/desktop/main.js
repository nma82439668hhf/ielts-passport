const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");

function siteEntry() {
  if (app.isPackaged) return path.join(process.resourcesPath, "site", "index.html");
  const candidates = [
    path.resolve(__dirname, "web", "index.html"),
    path.resolve(__dirname, "..", "..", "site", "index.html"),
    path.resolve(__dirname, "..", "..", "index.html")
  ];
  return candidates.find((candidate) => require("fs").existsSync(candidate)) || candidates[0];
}

function allowMediaPermissions(ses) {
  const allowed = new Set(["media", "microphone", "audioCapture", "mediaKeySystem"]);
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(allowed.has(permission));
  });
  if (ses.setPermissionCheckHandler) {
    ses.setPermissionCheckHandler((webContents, permission) => allowed.has(permission));
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 980,
    minHeight: 700,
    backgroundColor: "#eef3ef",
    title: "IELTS Passport",
    icon: path.resolve(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  allowMediaPermissions(session.defaultSession);
  win.loadFile(siteEntry());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
