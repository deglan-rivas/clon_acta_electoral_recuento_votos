import { app, shell, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { writeFile, unlink, readFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import icon from '../../resources/icon.ico?asset'
import { getExpirationChecker, getExpirationStatus, ExpirationStatus } from './utils/expiration-checker'
import { exec } from 'child_process'
import { promisify } from 'util'
import { ELECTORAL_CATEGORIES } from '../renderer/config/electoralCategories'

const execPromise = promisify(exec)

// Initialize electron-log immediately - MUST be done before any other operations
log.initialize({ preload: true })

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

// Check trial expiration on startup
const expirationChecker = getExpirationChecker();
const expirationResult = expirationChecker.checkExpiration();
log.info(`Trial status: ${expirationResult.status}, Days remaining: ${expirationResult.daysRemaining}`);

let mainWindow: BrowserWindow;

function createWindow(): BrowserWindow {
  // Check expiration before creating window
  const status = getExpirationStatus();

  // If expired, show dialog and prevent window creation
  if (status.status === ExpirationStatus.EXPIRED) {
    log.error('Application expired, blocking startup');
    dialog.showErrorBox(
      'Aplicación Expirada',
      status.message
    );
    app.quit();
    // Return a dummy window object (will never be used due to app.quit())
    return null as any;
  }

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
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
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
            let activeCategory, categoryData, categoryLabel;
            
            try {
              const result = await mainWindow.webContents.executeJavaScript(`
                (() => {
                  const activeCategory = localStorage.getItem('electoral_active_category');
                  const categoryData = localStorage.getItem('electoral_category_data');
                  let parsedData = null;

                  try {
                    parsedData = categoryData ? JSON.parse(categoryData) : {};
                  } catch (e) {
                    console.error('Error parsing category data:', e);
                  }

                  return { activeCategory, categoryData: parsedData };
                })()
              `);

              activeCategory = result.activeCategory;
              categoryData = result.categoryData;

              // Remove any quotes from the category name
              if (activeCategory && typeof activeCategory === 'string') {
                activeCategory = activeCategory.replace(/^["']|["']$/g, '');
              }

              // Find the category label from ELECTORAL_CATEGORIES
              const categoryRecord = ELECTORAL_CATEGORIES.find(cat => cat.key === activeCategory);
              categoryLabel = categoryRecord?.label || activeCategory || 'actual';

            } catch (error) {
              log.error('Error getting category info:', error);
              dialog.showErrorBox('Error', 'Error al obtener información de la categoría.');
              return;
            }

            if (!activeCategory) {
              dialog.showErrorBox('Error', 'No se pudo determinar la categoría actual.');
              return;
            }

            const response = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['Cancelar', 'Reiniciar Datos'],
              defaultId: 0,
              title: `Reiniciar Datos - ${categoryLabel}`,
              message: `¿Está seguro de que desea eliminar los datos del tipo de elección ${categoryLabel}?`,
              detail: 'Esta acción eliminará:\n- Todos los votos ingresados en esta categoría\n- Configuraciones específicas de esta categoría\n- Límites configurados para esta categoría\n\nEsta acción no se puede deshacer.'
            });

            if (response.response === 1) {
              try {
                // Clear only the current category data by resetting its actas array
                const clearResult = await mainWindow.webContents.executeJavaScript(`
                  ((categoryToDelete) => {
                    try {
                      const categoryDataString = localStorage.getItem('electoral_category_data');

                      if (categoryDataString) {
                        const categoryData = JSON.parse(categoryDataString);

                        // Reset the category's actas array to a single empty acta
                        if (categoryData[categoryToDelete]) {
                          categoryData[categoryToDelete] = {
                            actas: []
                          };
                        }

                        // Save the updated data back to localStorage
                        localStorage.setItem('electoral_category_data', JSON.stringify(categoryData));
                      }

                      // Reset the active acta index for this category to 0
                      const activeActaIndices = localStorage.getItem('electoral_active_acta_index');
                      if (activeActaIndices) {
                        try {
                          const indices = JSON.parse(activeActaIndices);
                          if (indices[categoryToDelete] !== undefined) {
                            indices[categoryToDelete] = 0;
                            localStorage.setItem('electoral_active_acta_index', JSON.stringify(indices));
                          }
                        } catch (e) {
                          console.error('Error clearing active acta index:', e);
                        }
                      }

                      return { success: true };
                    } catch (e) {
                      console.error('Error in clearing script:', e);
                      return { success: false, error: e.message };
                    }
                  })('${activeCategory}')
                `);

                if (clearResult.success) {
                  // Reload the window to refresh the UI
                  mainWindow.reload();
                  log.info(`Category data cleared for: ${activeCategory}`);
                } else {
                  throw new Error(`Clear operation failed: ${clearResult.error}`);
                }
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
        },
        {
          label: 'Abrir DevTools (Debug)',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.openDevTools()
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

    // Show warning dialog if in warning period
    const status = getExpirationStatus();
    if (status.status === ExpirationStatus.WARNING) {
      log.warn('Showing expiration warning dialog');
      dialog.showMessageBox(newWindow, {
        type: 'warning',
        title: 'Aviso de Expiración',
        message: 'Período de Prueba Próximo a Expirar',
        detail: status.message,
        buttons: ['Entendido']
      });
    }
  })

  // Note: Console message logging disabled to prevent feedback loops with electron-log/renderer
  // Renderer logs are already forwarded via electron-log's IPC transport
  // newWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
  //   const logLevel = level === 0 ? 'info' : level === 1 ? 'warn' : 'error'
  //   log[logLevel](`Renderer [${sourceId}:${line}]: ${message}`)
  // })

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

// IPC handlers for trial expiration
ipcMain.handle('check-expiration', async () => {
  try {
    const status = getExpirationStatus();
    log.info(`Expiration check requested: ${status.status}`);
    return {
      success: true,
      status: status.status,
      daysRemaining: status.daysRemaining,
      expirationDate: status.expirationDate.toISOString(),
      message: status.message,
      allowAccess: status.allowAccess
    };
  } catch (error) {
    log.error('Error checking expiration:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
});

// IPC handler for confirmation dialogs
ipcMain.handle('show-confirm-dialog', async (_event, title: string, message: string, detail?: string) => {
  try {
    log.info(`Showing confirmation dialog: ${title}`);
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Cancelar', 'Aceptar'],
      defaultId: 0,
      cancelId: 0,
      title: title,
      message: message,
      detail: detail || ''
    });

    // response.response is 0 for Cancel, 1 for Accept
    const confirmed = response.response === 1;
    log.info(`User response: ${confirmed ? 'Confirmed' : 'Cancelled'}`);
    return { success: true, confirmed };
  } catch (error) {
    log.error('Error showing confirmation dialog:', error);
    return { success: false, confirmed: false, error: (error as Error).message };
  }
});

// IPC handlers for PDF operations
ipcMain.handle('save-pdf', async (_event, pdfBytes: Uint8Array, filename: string) => {
  try {
    // Get user's Desktop directory
    const desktopPath = app.getPath('desktop')
    const filePath = join(desktopPath, filename)

    // Save the PDF file
    await writeFile(filePath, Buffer.from(pdfBytes))

    log.info(`PDF saved successfully: ${filePath}`)
    return { success: true, filePath }
  } catch (error) {
    log.error('Error saving PDF:', error)
    const errorMessage = (error as Error).message

    // Check for EBUSY error (file is open)
    if (errorMessage.includes('EBUSY') || errorMessage.includes('resource busy') || errorMessage.includes('locked')) {
      return {
        success: false,
        error: 'El archivo PDF ya está abierto. Por favor, cierre el archivo anterior antes de generar uno nuevo.'
      }
    }

    return { success: false, error: errorMessage }
  }
})

ipcMain.handle('open-pdf', async (_event, filePath: string) => {
  try {
    // Open the PDF file with the default PDF viewer
    await shell.openPath(filePath)

    log.info(`PDF opened successfully: ${filePath}`)
    return { success: true }
  } catch (error) {
    log.error('Error opening PDF:', error)
    return { success: false, error: (error as Error).message }
  }
})

// IPC handler for converting DOCX to PDF using Microsoft Word COM automation
ipcMain.handle('convert-docx-to-pdf', async (_event, docxBytes: Uint8Array, filename: string) => {
  let tempDocxPath: string | null = null;
  let outputPdfPath: string | null = null;

  try {
    log.info(`Starting DOCX to PDF conversion using MS Word for: ${filename}`)

    // Create temp directory path
    const tempDir = app.getPath('temp')
    const timestamp = Date.now()
    const baseName = filename.replace(/\.docx$/i, '')

    // Create temporary DOCX file
    tempDocxPath = join(tempDir, `${baseName}_${timestamp}.docx`)
    await writeFile(tempDocxPath, Buffer.from(docxBytes))
    log.info(`Temporary DOCX file created: ${tempDocxPath}`)

    // Output PDF path
    outputPdfPath = join(tempDir, `${baseName}_${timestamp}.pdf`)

    // PowerShell script to convert DOCX to PDF using Word COM
    // Using separate script file approach for better error handling
    const psScriptPath = join(tempDir, `convert_${timestamp}.ps1`)
    const psScript = `
$ErrorActionPreference = "Stop"
$word = $null
try {
    Write-Host "Creating Word COM object..."
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    Write-Host "Word application created"

    Write-Host "Opening DOCX file: ${tempDocxPath.replace(/\\/g, '\\\\')}"
    $doc = $word.Documents.Open("${tempDocxPath.replace(/\\/g, '\\\\')}")
    Write-Host "Document opened successfully"

    Write-Host "Saving as PDF: ${outputPdfPath.replace(/\\/g, '\\\\')}"
    # Format 17 = wdFormatPDF
    $pdfFormat = 17
    $doc.SaveAs([ref]"${outputPdfPath.replace(/\\/g, '\\\\')}", [ref]$pdfFormat)
    Write-Host "SaveAs completed"

    Write-Host "Closing document..."
    $doc.Close([ref]$false)
    Write-Host "Document closed"

    Write-Host "Quitting Word..."
    $word.Quit([ref]$false)
    Write-Host "Word quit"

    # Wait for file system to sync
    Start-Sleep -Milliseconds 1000

    Write-Host "Verifying PDF exists..."
    if (Test-Path "${outputPdfPath.replace(/\\/g, '\\\\')}") {
        $fileSize = (Get-Item "${outputPdfPath.replace(/\\/g, '\\\\')}").Length
        Write-Host "PDF created successfully, size: $fileSize bytes"
        Write-Output "SUCCESS"
    } else {
        throw "PDF file was not created at expected location"
    }
} catch {
    $errorMsg = $_.Exception.Message
    $errorDetails = $_.Exception | Format-List -Force | Out-String
    Write-Host "ERROR: $errorMsg"
    Write-Host "Details: $errorDetails"
    throw $errorMsg
} finally {
    if ($word -ne $null) {
        try {
            [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
        } catch {
            Write-Host "Warning: Could not release COM object"
        }
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    Write-Host "Cleanup completed"
}
`

    // Write PowerShell script to file for better error handling
    await writeFile(psScriptPath, psScript, 'utf8')
    log.info(`PowerShell script written to: ${psScriptPath}`)

    // Execute PowerShell script from file
    log.info('Executing PowerShell script for Word COM automation...')
    const { stdout, stderr } = await execPromise(
      `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}"`,
      { timeout: 60000 } // Increased timeout to 60 seconds
    )

    log.info(`PowerShell stdout:\n${stdout}`)
    if (stderr) {
      log.error(`PowerShell stderr:\n${stderr}`)
    }

    // Clean up script file
    try {
      await unlink(psScriptPath)
    } catch (e) {
      log.warn('Could not delete PowerShell script file:', e)
    }

    if (stderr) {
      throw new Error(`PowerShell error: ${stderr}`)
    }

    if (!stdout.includes('SUCCESS')) {
      throw new Error(`PDF conversion did not complete successfully. Output: ${stdout}`)
    }

    log.info(`DOCX converted to PDF using MS Word: ${outputPdfPath}`)

    // Verify the file exists before reading
    try {
      const fs = await import('fs/promises')
      await fs.access(outputPdfPath)
      log.info('PDF file verified to exist')
    } catch (accessError) {
      log.error('PDF file does not exist after conversion:', accessError)
      throw new Error(`PDF file was not created at: ${outputPdfPath}`)
    }

    // Read the PDF file
    const pdfBuffer = await readFile(outputPdfPath)
    log.info(`PDF file read successfully, size: ${pdfBuffer.length} bytes`)

    // Clean up temporary files
    try {
      if (tempDocxPath) await unlink(tempDocxPath)
      if (outputPdfPath) await unlink(outputPdfPath)
      log.info('Temporary files cleaned up')
    } catch (cleanupError) {
      log.warn('Error cleaning up temporary files:', cleanupError)
    }

    log.info(`DOCX to PDF conversion successful for: ${filename}`)
    return { success: true, pdfBytes: Array.from(pdfBuffer) }
  } catch (error) {
    log.error('Error converting DOCX to PDF:', error)

    // Clean up temporary files on error
    try {
      if (tempDocxPath) await unlink(tempDocxPath).catch(() => {})
      if (outputPdfPath) await unlink(outputPdfPath).catch(() => {})
    } catch (cleanupError) {
      log.warn('Error during error cleanup:', cleanupError)
    }

    // Check for specific error types to provide better error messages
    const errorMessage = (error as Error).message || ''
    let userMessage = errorMessage

    // Detect MS Office not installed errors
    if (errorMessage.includes('0x80040154') ||
        errorMessage.includes('REGDB_E_CLASSNOTREG') ||
        errorMessage.includes('Clase no registrada')) {
      userMessage = 'OFFICE_NOT_INSTALLED'
    }

    return { success: false, error: userMessage }
  }
})

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