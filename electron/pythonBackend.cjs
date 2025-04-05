const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const EventEmitter = require('events');
const log = require('electron-log');

/**
 * Industry-standard Python backend service manager
 * Handles process lifecycle, port management, and health monitoring
 */
class PythonBackendService extends EventEmitter {
  constructor(pythonSetup) {
    super();
    this.pythonSetup = pythonSetup;
    this.process = null;
    this.port = null;
    this.isReady = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.healthCheckInterval = null;
    this.status = 'stopped';
    this.childProcesses = new Set(); // Track all child processes
    
    // Configure logger properly
    this.logger = {
      info: (message, data) => {
        console.log(`[Python Backend] ${message}`, data || '');
        log.info(`[Python Backend] ${message}`, data || '');
      },
      warn: (message, data) => {
        console.warn(`[Python Backend] ${message}`, data || '');
        log.warn(`[Python Backend] ${message}`, data || '');
      },
      error: (message, data) => {
        console.error(`[Python Backend] ${message}`, data || '');
        log.error(`[Python Backend] ${message}`, data || '');
      },
      debug: (message, data) => {
        console.debug(`[Python Backend] ${message}`, data || '');
        log.debug(`[Python Backend] ${message}`, data || '');
      }
    };
    
    // Handle process cleanup on exit
    process.on('exit', () => {
      this.cleanup();
    });

    // Handle CTRL+C and other signals
    process.on('SIGINT', () => {
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.cleanup();
      process.exit(0);
    });
    
    this.logger.info('Python backend service initialized');
  }

  cleanup() {
    this.logger.info('Cleaning up Python processes...');
    
    // Kill all child processes
    for (const proc of this.childProcesses) {
      try {
        if (proc.pid) {
          process.kill(proc.pid, 'SIGTERM');
        }
      } catch (err) {
        this.logger.error(`Error killing process ${proc.pid}: ${err.message}`);
      }
    }
    
    this.childProcesses.clear();
    
    // Kill main process if it exists
    if (this.process) {
      try {
        // On Windows, we need to kill the entire process tree
        if (process.platform === 'win32') {
          const { execSync } = require('child_process');
          try {
            execSync(`taskkill /pid ${this.process.pid} /T /F`);
          } catch (err) {
            // Ignore errors if process is already gone
          }
        } else {
          process.kill(-this.process.pid, 'SIGTERM');
        }
      } catch (err) {
        this.logger.error(`Error killing main process: ${err.message}`);
      }
      this.process = null;
    }
    
    this.stopHealthCheck();
    this.isReady = false;
    this.status = 'stopped';
  }

  /**
   * Start the Python backend service
   */
  async start(options = {}) {
    if (this.process) {
      this.logger.info('Python process already running');
      return;
    }

    try {
      this.status = 'starting';
      this.emit('status-change', { status: 'starting' });
      
      // Get available port
      let currentPort = options.port;
      let startAttempts = 0;
      const maxAttempts = 10;
      
      while (startAttempts < maxAttempts) {
        try {
          if (!currentPort) {
            currentPort = await this.findAvailablePort(8090, 8199);
          }
          this.port = currentPort;
          this.logger.info(`Attempting to start Python backend on port ${this.port}`);
          
          // Get the Python executable
          const pythonExe = await this.pythonSetup.getPythonPath();
          
          // Get the path to the Python backend
          const isDev = process.env.NODE_ENV === 'development';
          const isWin = process.platform === 'win32';
          const isMac = process.platform === 'darwin';
          
          const backendPath = isDev 
            ? path.join(__dirname, '..', 'py_backend')
            : isWin || isMac
              ? path.join(process.resourcesPath, 'py_backend')
              : path.join(process.resourcesPath, 'app.asar.unpacked', 'py_backend');
          
          const mainPyPath = path.join(backendPath, 'main.py');
          
          if (!fs.existsSync(mainPyPath)) {
            throw new Error(`Python backend script not found: ${mainPyPath}`);
          }
          
          // Add more robust validation for Python environment
          if (!pythonExe || typeof pythonExe !== 'string') {
            throw new Error('Python executable path is invalid or not available. Environment setup may not be complete.');
          }
          
          this.logger.info(`Starting Python backend from: ${mainPyPath} using Python: ${pythonExe}`);
          
          // Set environment variables
          const env = {
            ...process.env,
            PYTHONUNBUFFERED: '1',
            PYTHONIOENCODING: 'utf-8',
            CLARA_PORT: this.port.toString(),
            PYTHONPATH: process.platform === 'win32'
              ? `${backendPath};${this.pythonSetup.pythonPath || ''}`
              : `${backendPath}:${this.pythonSetup.pythonPath || ''}`,
            PATH: process.platform === 'win32'
              ? `${this.pythonSetup.envPath};${path.join(this.pythonSetup.envPath, 'Scripts')};${process.env.PATH || ''}`
              : `${this.pythonSetup.envPath}/bin:${process.env.PATH || ''}`
          };
          
          // Start the process with -m uvicorn to run the ASGI app
          this.process = spawn(pythonExe, [
            '-m', 'uvicorn',
            '--app-dir', backendPath,
            'main:app',
            '--host', '127.0.0.1',
            '--port', this.port.toString(),
            '--forwarded-allow-ips', '127.0.0.1',
            ...(isDev ? ['--reload'] : []) // Only use --reload in development
          ], {
            cwd: backendPath,
            env,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: isWin
          });
          
          // Create a promise that resolves when the server starts or rejects on error
          const serverStartPromise = new Promise((resolve, reject) => {
            let startTimeout = setTimeout(() => {
              reject(new Error('Timeout waiting for Python backend to start'));
            }, 30000);
            
            // Set up stdout handler
            this.process.stdout.on('data', (data) => {
              const output = data.toString().trim();
              this.logger.info(`Python stdout: ${output}`);
              
              // Check for port announcement in output
              const portMatch = output.match(/CLARA_PORT:(\d+)/);
              if (portMatch && portMatch[1]) {
                this.port = parseInt(portMatch[1], 10);
                this.logger.info(`Python service running on port: ${this.port}`);
                this.emit('port-detected', this.port);
              }
              
              // Check for ready signal
              if (output.includes('Application startup complete')) {
                clearTimeout(startTimeout);
                this.status = 'running';
                this.isReady = true;
                this.retryCount = 0;
                this.startHealthCheck();
                this.emit('ready', { port: this.port });
                this.emit('status-change', { status: 'running', port: this.port });
                resolve();
              }
            });
            
            // Set up stderr handler
            this.process.stderr.on('data', (data) => {
              const output = data.toString().trim();
              
              // Only log real errors, filter out normal uvicorn startup info
              if (!output.startsWith('INFO:') && !output.includes('Uvicorn running')) {
                this.logger.error(`Python stderr: ${output}`);
              } else {
                this.logger.debug(`Python stderr: ${output}`);
              }
              
              // Check for startup complete message in stderr (uvicorn logs to stderr)
              if (output.includes('Application startup complete')) {
                clearTimeout(startTimeout);
                this.status = 'running';
                this.isReady = true;
                this.retryCount = 0;
                this.startHealthCheck();
                this.emit('ready', { port: this.port });
                this.emit('status-change', { status: 'running', port: this.port });
                resolve();
              }
            });
            
            // Handle process exit during startup
            this.process.once('exit', (code) => {
              clearTimeout(startTimeout);
              if (code !== 0) {
                reject(new Error(`Python process exited with code ${code}`));
              }
            });
          });
          
          // Wait for server to start
          await serverStartPromise;
          break; // Success - exit the retry loop
          
        } catch (error) {
          this.logger.error(`Failed to start Python backend on port ${currentPort}: ${error.message}`);
          
          // Clean up the process if it exists
          if (this.process) {
            this.process.removeAllListeners();
            this.process.kill();
            this.process = null;
          }
          
          // Try next port
          currentPort = null;
          startAttempts++;
          
          if (startAttempts >= maxAttempts) {
            throw new Error(`Failed to start Python backend after ${maxAttempts} attempts`);
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Set up process exit handler for runtime crashes
      this.process.on('exit', (code, signal) => {
        this.logger.info(`Python process exited with code ${code} and signal ${signal}`);
        
        this.stopHealthCheck();
        this.process = null;
        this.isReady = false;
        
        if (this.status !== 'stopping') {
          this.status = 'crashed';
          this.emit('status-change', { status: 'crashed', code, signal });
          
          // Auto-restart on crash (with limits)
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.logger.info(`Attempting to restart Python backend (${this.retryCount}/${this.maxRetries})`);
            setTimeout(() => this.start(), 2000);
          } else {
            this.status = 'failed';
            this.emit('status-change', { status: 'failed', message: 'Maximum retry attempts reached' });
          }
        } else {
          this.status = 'stopped';
          this.emit('status-change', { status: 'stopped' });
        }
      });
      
      return { port: this.port };
      
    } catch (error) {
      this.logger.error(`Failed to start Python backend: ${error.message}`);
      this.status = 'failed';
      this.emit('status-change', { status: 'failed', error: error.message });
      throw error;
    }
  }

  /**
   * Stop the Python backend service
   */
  async stop() {
    if (!this.process) {
      this.logger.info('No Python process to stop');
      return;
    }
    
    this.logger.info('Stopping Python backend');
    this.status = 'stopping';
    this.emit('status-change', { status: 'stopping' });
    this.stopHealthCheck();
    
    // Graceful shutdown with timeout
    return new Promise((resolve) => {
      // Set a timeout for force kill
      const killTimeout = setTimeout(() => {
        this.logger.warn('Force killing Python process after timeout');
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
      
      // Try graceful exit first
      if (this.process) {
        // Listen for exit
        this.process.once('exit', () => {
          clearTimeout(killTimeout);
          this.process = null;
          this.isReady = false;
          this.status = 'stopped';
          this.emit('status-change', { status: 'stopped' });
          resolve();
        });
        
        // Send SIGTERM for graceful shutdown
        this.process.kill('SIGTERM');
      } else {
        clearTimeout(killTimeout);
        resolve();
      }
    });
  }

  /**
   * Find an available port in the specified range
   */
  async findAvailablePort(startPort, endPort) {
    const tcpPortUsed = require('tcp-port-used');
    
    for (let port = startPort; port <= endPort; port++) {
      try {
        const inUse = await tcpPortUsed.check(port, '127.0.0.1');
        if (!inUse) {
          // Double check with a socket
          await new Promise((resolve, reject) => {
            const server = net.createServer();
            server.unref();
            
            server.on('error', reject);
            
            server.listen(port, '127.0.0.1', () => {
              server.close(() => {
                // Add a small delay before resolving
                setTimeout(() => resolve(port), 100);
              });
            });
          });
          
          return port;
        }
      } catch (err) {
        // Port in use or error, continue to next
        continue;
      }
    }
    
    throw new Error(`No available ports found between ${startPort} and ${endPort}`);
  }

  /**
   * Start periodic health check
   */
  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      if (!this.isReady || !this.port) return;
      
      try {
        // Use Node's built-in http module instead of fetch
        const http = require('http');
        
        await new Promise((resolve, reject) => {
          const req = http.get(`http://localhost:${this.port}/health`, {
            timeout: 3000,
            headers: { 'Accept': 'application/json' }
          }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
              data += chunk;
            });
            
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                this.retryCount = 0;
                this.logger.debug('Health check passed');
                this.emit('health-check', { status: 'ok' });
                resolve(data);
              } else {
                this.logger.warn(`Health check failed with status: ${res.statusCode}`);
                this.emit('health-check', { status: 'failed', code: res.statusCode });
                reject(new Error(`HTTP status ${res.statusCode}`));
              }
            });
          });
          
          req.on('error', (error) => {
            reject(error);
          });
          
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
        });
      } catch (error) {
        this.logger.warn(`Health check error: ${error.message}`);
        this.emit('health-check', { status: 'error', message: error.message });
        
        // Check if process is still running but not responding
        if (this.process && this.isReady && this.retryCount >= 3) {
          this.logger.error('Backend not responding after multiple health checks');
          this.emit('status-change', { status: 'unresponsive', port: this.port });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop the health check interval
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get the current port
   */
  getPort() {
    return this.port;
  }

  /**
   * Get the current status
   */
  getStatus() {
    return {
      status: this.status,
      port: this.port,
      isReady: this.isReady,
      retryCount: this.retryCount,
      pid: this.process ? this.process.pid : null
    };
  }
}

module.exports = PythonBackendService;
