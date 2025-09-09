import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: false, // Show menu bar to access developer options
    resizable: false,
    maximizable: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Create application menu
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Herramientas',
      submenu: [
        {
          label: 'Reiniciar Datos de la Aplicación',
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
            `)
          }
        },
        {
          label: 'Recargar Aplicación',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload()
          }
        }
      ]
    }
  ]
  
  // Add developer options only in development
  if (is.dev) {
    template.push({
      label: 'Desarrollador',
      submenu: [
        {
          label: 'Ver Datos en Consola',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.debugElectoralData) {
                window.debugElectoralData();
              } else {
                console.log('LocalStorage contents:', {...localStorage});
              }
            `)
          }
        },
        {
          label: 'Abrir DevTools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.openDevTools()
          }
        }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})