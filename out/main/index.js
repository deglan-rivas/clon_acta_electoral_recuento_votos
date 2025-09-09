import { app, session, ipcMain, BrowserWindow, Menu, shell } from "electron";
import { join } from "path";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const is = {
  dev: !app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      app.setLoginItemSettings({ openAtLogin: auto });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "KeyI" && (input.alt && input.meta || input.control && input.shift)) {
            event.preventDefault();
          }
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    ipcMain.on("win:invoke", (event, action) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
const icon = join(__dirname, "../../resources/icon.ico");
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: false,
    // Show menu bar to access developer options
    resizable: false,
    maximizable: true,
    icon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  const template = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Salir",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: "Herramientas",
      submenu: [
        {
          label: "Reiniciar Datos de la Aplicación",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              const confirmed = confirm('¿Está seguro de que desea eliminar todos los datos guardados?\\n\\nEsta acción eliminará:\\n- Todas las configuraciones\\n- Todos los votos ingresados\\n- Límites configurados\\n\\nEsta acción no se puede deshacer.');
              
              if (confirmed) {
                if (window.clearElectoralData) {
                  window.clearElectoralData();
                } else {
                  localStorage.clear();
                }
                alert('Datos eliminados exitosamente. La aplicación se reiniciará.');
                location.reload();
              }
            `);
          }
        },
        {
          label: "Recargar Aplicación",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.reload();
          }
        }
      ]
    }
  ];
  if (is.dev) {
    template.push({
      label: "Desarrollador",
      submenu: [
        {
          label: "Ver Datos en Consola",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.debugElectoralData) {
                window.debugElectoralData();
              } else {
                console.log('LocalStorage contents:', {...localStorage});
              }
            `);
          }
        },
        {
          label: "Abrir DevTools",
          accelerator: "F12",
          click: () => {
            mainWindow.webContents.openDevTools();
          }
        }
      ]
    });
  }
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  mainWindow.on("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
