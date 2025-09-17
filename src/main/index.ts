import { app, shell, BrowserWindow, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import icon from '../../resources/icon.ico?asset'

// Configure electron-log
log.transports.file.level = 'info'
log.transports.console.level = 'info'

// Set log file location and name
log.transports.file.fileName = 'acta-electoral.log'
log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB

// Add timestamp format
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// Catch and log unhandled errors
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

log.info('Application starting...')

let mainWindow: BrowserWindow;

function createWindow(): BrowserWindow {
  // Create the browser window.
  const newWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: false, // Show menu bar to access developer options
    resizable: false,
    maximizable: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
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
          click: async () => {
            // First get the current active category
            const getCurrentCategoryScript = `
              const activeCategory = localStorage.getItem('electoral_active_category');
              const categoryData = localStorage.getItem('electoral_category_data');
              let parsedData = null;
              let categoryLabel = 'actual';
              
              try {
                parsedData = categoryData ? JSON.parse(categoryData) : {};
                // Map category keys to user-friendly labels
                const categoryLabels = {
                  'presidencial': 'Presidencial',
                  'senadoresNacional': 'Senadores Nacional',
                  'senadoresRegional': 'Senadores Regional',
                  'diputados': 'Diputados',
                  'parlamentoAndino': 'Parlamento Andino'
                };
                categoryLabel = categoryLabels[activeCategory] || activeCategory || 'actual';
              } catch (e) {
                console.error('Error parsing category data:', e);
              }
              
              JSON.stringify({ activeCategory, categoryData: parsedData, categoryLabel });
            `;

            const result = await mainWindow.webContents.executeJavaScript(getCurrentCategoryScript);
            const { activeCategory, categoryData, categoryLabel } = JSON.parse(result);

            if (!activeCategory) {
              dialog.showErrorBox('Error', 'No se pudo determinar la categoría actual.');
              return;
            }

            const response = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['Cancelar', 'Reiniciar Datos'],
              defaultId: 0,
              title: `Reiniciar Datos - ${categoryLabel}`,
              message: `¿Está seguro de que desea eliminar los datos de "${categoryLabel}"?`,
              detail: 'Esta acción eliminará:\n- Todos los votos ingresados en esta categoría\n- Configuraciones específicas de esta categoría\n- Límites configurados para esta categoría\n\nEsta acción no se puede deshacer.'
            });

            if (response.response === 1) {
              try {
                // Clear only the current category data
                await mainWindow.webContents.executeJavaScript(`
                  const activeCategory = localStorage.getItem('electoral_active_category');
                  const categoryDataString = localStorage.getItem('electoral_category_data');
                  
                  if (activeCategory && categoryDataString) {
                    try {
                      const categoryData = JSON.parse(categoryDataString);
                      
                      // Delete the current category data
                      delete categoryData[activeCategory];
                      
                      // Save the updated data back to localStorage
                      localStorage.setItem('electoral_category_data', JSON.stringify(categoryData));
                      
                      // Clear the active category since we deleted its data
                      localStorage.removeItem('electoral_active_category');
                      
                      console.log('Deleted category data for:', activeCategory);
                      console.log('Remaining categories:', Object.keys(categoryData));
                    } catch (e) {
                      console.error('Error processing category data:', e);
                      // Fallback: clear everything if parsing fails
                      localStorage.removeItem('electoral_category_data');
                      localStorage.removeItem('electoral_active_category');
                    }
                  }
                  
                  // Dispatch a custom event to trigger app remount
                  window.dispatchEvent(new CustomEvent('app-reset'));
                `);
                
                // After a delay, simulate minimize/restore to fix input events
                setTimeout(() => {
                  mainWindow.blur();
                  setTimeout(() => {
                    mainWindow.focus();
                    log.info('Window focus cycle completed');
                  }, 100);
                }, 500);
                
                log.info(`Category data cleared for: ${activeCategory}`);
              } catch (error) {
                log.error('Error clearing category data:', error);
                dialog.showErrorBox('Error', 'Error al eliminar datos de la categoría. Intente cerrar y reabrir la aplicación.');
              }
            }
          }
        },
        {
          label: 'Recargar Aplicación',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload()
          }
        },
        {
          label: 'Ver Ubicación de Logs',
          click: () => {
            const logPath = log.transports.file.getFile().path
            shell.showItemInFolder(logPath)
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

  newWindow.on('ready-to-show', () => {
    newWindow.maximize()
    newWindow.show()
    log.info('Main window shown')
  })

  // Log renderer process console messages
  newWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const logLevel = level === 0 ? 'info' : level === 1 ? 'warn' : 'error'
    log[logLevel](`Renderer [${sourceId}:${line}]: ${message}`)
  })

  newWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    newWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    newWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow = newWindow;
  return newWindow;
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

  mainWindow = createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
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