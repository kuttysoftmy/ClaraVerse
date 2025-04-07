const { app, BrowserWindow, ipcMain, dialog, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const PythonSetup = require('./pythonSetup.cjs');
const PythonBackendService = require('./pythonBackend.cjs');
const { setupAutoUpdater } = require('./updateService.cjs');
const SplashScreen = require('./splash.cjs');
const os = require('os');
const { spawn } = require('child_process');
const net = require('net');
const https = require('https');
const { execSync } = require('child_process');

// Configure the main process logger
log.transports.file.level = 'info';
log.info('Application starting...');

// Global variables
let pythonBackend;
let mainWindow;
let splash;
let n8nProcess = null;

// Initialize Python setup
const pythonSetup = new PythonSetup();

async function initializeApp() {
  try {
    // Show splash screen
    splash = new SplashScreen();
    splash.setStatus('Starting Clara...', 'info');
    
    // Check if we can write to the home directory
    try {
      const testPath = path.join(os.homedir(), '.clara-test');
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath);
    } catch (error) {
      log.error('Permission error:', error);
      splash.setStatus('Error: Cannot write to home directory. Please check permissions.', 'error');
      setTimeout(() => {
        app.quit();
      }, 5000);
      return;
    }
    
    // Always setup Python environment on first run
    splash.setStatus('Setting up Python environment...', 'info');
    await pythonSetup.setup((status) => {
      splash.setStatus(status, 'info');
    });
    
    // Initialize Python backend service
    pythonBackend = new PythonBackendService(pythonSetup);
    
    // Set up event listeners for the backend service
    pythonBackend.on('status-change', (status) => {
      log.info(`Backend status changed: ${JSON.stringify(status)}`);
      
      if (status.status === 'running') {
        splash?.setStatus('Backend services started', 'success');
        // Start n8n setup after Python backend is running
        setupN8N();
      } else if (status.status === 'failed' || status.status === 'crashed') {
        splash?.setStatus(`Backend error: ${status.message || status.status}`, 'error');
      }
      
      // Forward status to the renderer
      mainWindow?.webContents.send('backend-status', status);
    });
    
    pythonBackend.on('ready', (data) => {
      log.info(`Backend ready on port ${data.port}`);
      if (splash && !mainWindow) {
        splash.setStatus('Starting main application...', 'success');
        createMainWindow();
      }
    });
    
    pythonBackend.on('error', (error) => {
      log.error(`Backend error: ${error.message}`);
      splash?.setStatus(`Backend error: ${error.message}`, 'error');
    });
    
    pythonBackend.on('port-detected', (port) => {
      log.info(`Backend running on port: ${port}`);
    });
    
    // Start the Python backend
    splash.setStatus('Starting backend services...', 'info');
    await pythonBackend.start();
    
    // Set a timeout in case backend doesn't report ready
    setTimeout(() => {
      if (splash && !mainWindow) {
        splash.setStatus('Backend is taking longer than expected...', 'warning');
        createMainWindow();
        setTimeout(() => {
          splash.close();
        }, 2000);
      }
    }, 20000);
    
  } catch (error) {
    log.error(`Initialization error: ${error.message}`, error);
    splash?.setStatus(`Error: ${error.message}`, 'error');
    
    // Show error but continue to the main window anyway
    setTimeout(() => {
      if (!mainWindow) {
        createMainWindow();
      }
      setTimeout(() => {
        splash?.close();
      }, 3000);
    }, 5000);
  }
}

function createMainWindow() {
  if (mainWindow) return;
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: true,
      partition: 'persist:n8n'
    },
    show: false,
    backgroundColor: '#f5f5f5'
  });
  
  // Development mode with hot reload
  if (process.env.NODE_ENV === 'development') {
    const devServerUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
    
    log.info('Loading development server:', devServerUrl);
    mainWindow.loadURL(devServerUrl).catch(err => {
      log.error('Failed to load dev server:', err);
      // Fallback to local file if dev server fails
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });

    // Enable hot reload by watching the renderer process
    mainWindow.webContents.on('did-fail-load', () => {
      log.warn('Page failed to load, retrying...');
      setTimeout(() => {
        mainWindow?.webContents.reload();
      }, 1000);
    });

    // Open DevTools automatically in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - use development-like loading
    const protocol = require('electron').protocol;
    
    // Register a secure protocol for loading files
    protocol.registerFileProtocol('app', (request, callback) => {
      const url = request.url.substr(6); // Remove 'app://'
      const filePath = path.join(__dirname, '../dist', url);
      log.info(`Loading file: ${filePath}`);
      callback({ path: filePath });
    });

    // Load the main window using the app protocol
    mainWindow.loadURL('app://index.html').catch(err => {
      log.error('Failed to load app://index.html:', err);
      // Fallback to direct file loading
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });

    // Enable web security but allow loading local resources
    mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      callback({ requestHeaders: { ...details.requestHeaders } });
    });

    // Allow loading local resources
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*']
        }
      });
    });
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Initialize auto-updater when window is ready
    if (process.env.NODE_ENV !== 'development') {
      setupAutoUpdater(mainWindow);
    }
    
    // Send complete backend status to renderer
    if (pythonBackend) {
      const status = pythonBackend.getStatus();
      log.info(`Sending initial backend status to renderer: ${JSON.stringify(status)}`);
      mainWindow.webContents.send('backend-status', status);
    }

    // Close splash screen after main window is fully ready
    setTimeout(() => {
      if (splash) {
        splash.close();
        splash = null;
      }
    }, 1000);
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Log window events
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error(`Window failed to load: ${errorCode} - ${errorDescription}`);
  });
  
  mainWindow.webContents.on('crashed', () => {
    log.error('Window crashed');
  });
}

// Add development mode watcher
if (process.env.NODE_ENV === 'development') {
  const { watch } = require('fs');
  
  // Watch for changes in the renderer process
  watch(path.join(__dirname, '../dist'), (event, filename) => {
    if (mainWindow && mainWindow.webContents) {
      log.info('Detected renderer change:', filename);
      mainWindow.webContents.reload();
    }
  });

  // Watch for changes in the main process
  watch(__dirname, (event, filename) => {
    if (filename && !filename.includes('node_modules')) {
      log.info('Detected main process change:', filename);
      app.relaunch();
      app.quit();
    }
  });
}

// IPC handlers
ipcMain.handle('get-python-port', () => {
  const port = pythonBackend ? pythonBackend.getPort() : null;
  log.info(`Renderer requested Python port: ${port}`);
  return port;
});

// Add a new handler for health check
ipcMain.handle('check-python-backend', async () => {
  if (!pythonBackend) {
    return { status: 'not_initialized' };
  }
  
  try {
    const status = pythonBackend.getStatus();
    
    // Test connection directly using Node's http instead of fetch
    if (status.port) {
      try {
        const http = require('http');
        const result = await new Promise((resolve, reject) => {
          const req = http.get(`http://localhost:${status.port}/`, {
            timeout: 2000,
            headers: { 'Accept': 'application/json' }
          }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
              data += chunk;
            });
            
            res.on('end', () => {
              try {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve({ success: true, data: JSON.parse(data) });
                } else {
                  reject(new Error(`HTTP status ${res.statusCode}`));
                }
              } catch (e) {
                reject(e);
              }
            });
          });
          
          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
        });
        
        if (result && result.success) {
          return { 
            status: 'running', 
            port: status.port,
            available: true,
            serverInfo: result.data
          };
        }
      } catch (error) {
        log.warn(`Backend connection test failed: ${error.message}`);
      }
    }
    
    return {
      ...status,
      available: false
    };
  } catch (error) {
    log.error(`Error checking Python backend: ${error.message}`);
    return { status: 'error', error: error.message };
  }
});

// Add Node.js version check and installation
async function checkAndInstallNode() {
  try {
    const nodeVersion = execSync('node -v').toString().trim();
    const versionMatch = nodeVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
    
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      if (major >= 14) {
        return { installed: true, version: nodeVersion };
      }
    }
    
    // If we get here, we need to install a newer version
    const platform = process.platform;
    const arch = process.arch;
    
    // Get the latest LTS version
    const response = await new Promise((resolve, reject) => {
      https.get('https://nodejs.org/dist/index.json', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
        res.on('error', reject);
      });
    });
    
    const ltsVersion = response.find(v => v.lts).version;
    
    if (platform === 'linux') {
      // For Linux, we'll download and extract Node.js directly
      try {
        // Create a directory in the user's home folder
        const nodeDir = path.join(os.homedir(), '.clara-node');
        if (!fs.existsSync(nodeDir)) {
          fs.mkdirSync(nodeDir, { recursive: true });
        }

        // Download Node.js binary
        const downloadUrl = `https://nodejs.org/dist/${ltsVersion}/node-${ltsVersion}-linux-x64.tar.xz`;
        const archivePath = path.join(nodeDir, 'node.tar.xz');
        
        await new Promise((resolve, reject) => {
          const file = fs.createWriteStream(archivePath);
          https.get(downloadUrl, (res) => {
            res.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', reject);
        });

        // Extract the archive
        execSync(`tar -xf ${archivePath} -C ${nodeDir}`, { stdio: 'inherit' });
        
        // Clean up the archive
        fs.unlinkSync(archivePath);
        
        // Add Node.js to PATH
        const nodePath = path.join(nodeDir, `node-${ltsVersion}-linux-x64`, 'bin');
        const envPath = process.env.PATH || '';
        process.env.PATH = `${nodePath}:${envPath}`;
        
        // Verify installation
        const newVersion = execSync('node -v').toString().trim();
        return { installed: true, version: newVersion };
      } catch (error) {
        return { installed: false, error: error.message };
      }
    } else if (platform === 'win32') {
      // Windows installation code (existing)
      const downloadUrl = `https://nodejs.org/dist/${ltsVersion}/node-${ltsVersion}-${platform}-${arch}.msi`;
      const installerPath = path.join(os.tmpdir(), 'node-installer.msi');
      
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(installerPath);
        https.get(downloadUrl, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      });
      
      execSync(`msiexec /i "${installerPath}" /quiet`);
      fs.unlinkSync(installerPath);
      
      return { installed: true, version: ltsVersion };
    } else {
      return { installed: false, error: `Unsupported platform: ${platform}` };
    }
  } catch (error) {
    return { installed: false, error: error.message };
  }
}

// Add the check-node-installation handler
ipcMain.handle('check-node-installation', async () => {
  try {
    const result = await checkAndInstallNode();
    
    if (result.installed) {
      const nodeVersion = execSync('node -v').toString().trim();
      const npmVersion = execSync('npm -v').toString().trim();
      
      return {
        installed: true,
        nodeVersion,
        npmVersion
      };
    } else {
      return {
        installed: false,
        error: result.error || 'Failed to install Node.js',
        nodeVersion: null,
        npmVersion: null
      };
    }
  } catch (error) {
    return {
      installed: false,
      error: error.message,
      nodeVersion: null,
      npmVersion: null
    };
  }
});

// Add n8n setup function
async function setupN8N() {
  try {
    splash?.setStatus('Setting up n8n...', 'info');
    
    // Kill any existing n8n process
    if (n8nProcess) {
      log.info('Killing existing n8n process...');
      n8nProcess.kill('SIGTERM');
      n8nProcess = null;
      // Wait a moment for the process to fully terminate
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Check if port 5678 is in use and kill any process using it
    try {
      const portCheck = await checkN8NRunning();
      if (portCheck.running) {
        log.info('Port 5678 is in use, attempting to free it...');
        // Try to find and kill the process using port 5678
        if (process.platform === 'linux') {
          try {
            const pid = execSync(`lsof -i :5678 -t`).toString().trim();
            if (pid) {
              execSync(`kill -9 ${pid}`);
              log.info(`Killed process ${pid} using port 5678`);
              // Wait for port to be freed
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (error) {
            log.warn('Could not find process using port 5678:', error.message);
          }
        }
      }
    } catch (error) {
      log.warn('Error checking port 5678:', error.message);
    }
    
    // Check and install Node.js if needed
    const nodeCheck = await checkAndInstallNode();
    if (!nodeCheck.installed) {
      throw new Error(nodeCheck.error);
    }
    
    // Check if n8n is already installed
    try {
      execSync('n8n --version', { stdio: 'ignore' });
      log.info('n8n is already installed');
    } catch (error) {
      // If n8n is not installed, install it
      log.info('Installing n8n...');
      execSync('npm install -g n8n', { stdio: 'inherit' });
    }

    // Create n8n config directory if it doesn't exist
    const n8nConfigDir = path.join(os.homedir(), '.n8n');
    if (!fs.existsSync(n8nConfigDir)) {
      fs.mkdirSync(n8nConfigDir, { recursive: true });
    }

    // Create or update n8n config file
    const n8nConfig = {
      N8N_EDITOR_BASE_URL: 'http://localhost:5678',
      N8N_ENDPOINT_WEBHOOK: 'http://localhost:5678/webhook',
      N8N_HOST: 'localhost',
      N8N_PORT: 5678,
      N8N_PROTOCOL: 'http',
      N8N_USER_FOLDER: n8nConfigDir,
      N8N_CUSTOM_EXTENSIONS: path.join(n8nConfigDir, 'custom'),
      N8N_DIAGNOSTICS_ENABLED: false,
      N8N_METRICS: false,
      N8N_PAYLOAD_SIZE_MAX: 16
    };

    // Write config to .env file
    const envContent = Object.entries(n8nConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    fs.writeFileSync(path.join(n8nConfigDir, '.env'), envContent);
    
    // Start n8n in a separate process with the config
    n8nProcess = spawn('n8n', ['start'], {
      stdio: 'inherit',
      detached: true,
      env: {
        ...process.env,
        ...n8nConfig
      }
    });
    
    // Handle process exit
    n8nProcess.on('exit', (code) => {
      console.log(`n8n process exited with code ${code}`);
      n8nProcess = null;
    });
    
    splash?.setStatus('n8n is ready!', 'success');
  } catch (error) {
    log.error('Error setting up n8n:', error);
    splash?.setStatus(`Error setting up n8n: ${error.message}`, 'error');
  }
}

// Update the install-n8n handler to just check status
ipcMain.handle('install-n8n', async () => {
  try {
    const status = await checkN8NRunning();
    return { success: true, running: status.running };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Function to check if n8n is running
function checkN8NRunning() {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.on('error', () => {
      client.destroy();
      resolve({ running: false });
    });
    client.connect(5678, '127.0.0.1', () => {
      client.destroy();
      resolve({ running: true });
    });
  });
}

// Register IPC handlers
ipcMain.handle('check-n8n-running', async () => {
  return await checkN8NRunning();
});

// App lifecycle events
app.whenReady().then(() => {
  initializeApp();
});

// App lifecycle events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', async (event) => {
  if (pythonBackend) {
    event.preventDefault();
    try {
      await pythonBackend.stop();
    } catch (error) {
      log.error(`Error stopping Python backend: ${error.message}`);
    }
    app.exit(0);
  }
  if (n8nProcess) {
    n8nProcess.kill();
    n8nProcess = null;
  }
});

// Error handling for the main process
process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`, error);
});

process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled promise rejection: ${reason}`);
});