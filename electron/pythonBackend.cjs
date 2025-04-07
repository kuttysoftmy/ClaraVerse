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
    this.status = {
      status: 'stopped',
      port: null,
      isReady: false,
      retryCount: 0,
      pid: null
    };
    
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
    
    this.logger.info('Python backend service initialized');
  }

  /**
   * Start the Python backend service
   */
  async start() {
    try {
      this.status.status = 'starting';
      this.emit('status-change', this.status);
      
      // Get Python executable path
      const pythonPath = await this.pythonSetup.getPythonPath();
      
      // Determine backend script path
      let backendPath;
      if (process.env.NODE_ENV === 'development') {
        backendPath = path.join(__dirname, '..', 'py_backend');
      } else {
        // In production, look in both possible locations
        const possiblePaths = [
          path.join(process.resourcesPath, 'py_backend'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'py_backend')
        ];
        
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(path.join(possiblePath, 'main.py'))) {
            backendPath = possiblePath;
            break;
          }
        }
        
        if (!backendPath) {
          throw new Error(`Python backend script not found in any of the expected locations: ${possiblePaths.join(', ')}`);
        }
      }
      
      // Select a port
      this.port = await this.selectPort();
      log.info(`Selected port ${this.port} for Python backend`);
      
      // Start the Python backend
      const mainPyPath = path.join(backendPath, 'main.py');
      if (!fs.existsSync(mainPyPath)) {
        throw new Error(`Python backend script not found: ${mainPyPath}`);
      }
      
      // Set environment variables
      const env = {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PYTHONIOENCODING: 'utf-8',
        PORT: this.port.toString()
      };
      
      // Start the process
      this.process = spawn(pythonPath, [mainPyPath], {
        cwd: backendPath,
        env,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Handle process events
      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        log.info(`Python backend: ${output}`);
        
        // Check for port announcement
        const portMatch = output.match(/CLARA_PORT:(\d+)/);
        if (portMatch) {
          this.port = parseInt(portMatch[1], 10);
          this.emit('port-detected', this.port);
        }
        
        // Check for startup complete
        if (output.includes('Application startup complete')) {
          this.isReady = true;
          this.status.status = 'running';
          this.status.isReady = true;
          this.status.pid = this.process.pid;
          this.status.port = this.port;
          this.emit('status-change', this.status);
          this.emit('ready', { port: this.port });
        }
      });
      
      this.process.stderr.on('data', (data) => {
        const output = data.toString();
        
        // Only log real errors, filter out normal uvicorn startup info
        if (!output.startsWith('INFO:') && !output.includes('Uvicorn running')) {
          log.error(`Python backend error: ${output}`);
          this.emit('error', new Error(output));
        } else {
          log.info(`Python backend: ${output}`);
          
          // Check for startup complete in stderr (uvicorn logs to stderr)
          if (output.includes('Application startup complete')) {
            this.isReady = true;
            this.status.status = 'running';
            this.status.isReady = true;
            this.status.pid = this.process.pid;
            this.status.port = this.port;
            this.emit('status-change', this.status);
            this.emit('ready', { port: this.port });
          }
        }
      });
      
      this.process.on('close', (code) => {
        log.info(`Python backend process exited with code ${code}`);
        this.status.status = code === 0 ? 'stopped' : 'crashed';
        this.status.isReady = false;
        this.status.pid = null;
        this.emit('status-change', this.status);
        
        if (code !== 0 && this.retryCount < this.maxRetries) {
          this.retryCount++;
          log.info(`Retrying Python backend (attempt ${this.retryCount}/${this.maxRetries})`);
          setTimeout(() => this.start(), 2000);
        }
      });
      
    } catch (error) {
      log.error(`Failed to start Python backend: ${error.message}`);
      this.status.status = 'failed';
      this.status.error = error.message;
      this.emit('status-change', this.status);
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
    this.status.status = 'stopping';
    this.emit('status-change', this.status);
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
          this.status.status = 'stopped';
          this.status.pid = null;
          this.emit('status-change', this.status);
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
  async selectPort() {
    for (let port = 8090; port <= 8199; port++) {
      try {
        await new Promise((resolve, reject) => {
          const server = net.createServer();
          server.unref();
          
          server.on('error', reject);
          
          server.listen(port, '127.0.0.1', () => {
            server.close(() => resolve(port));
          });
        });
        
        return port;
      } catch (err) {
        // Port in use, try next one
      }
    }
    
    throw new Error('No available ports found between 8090 and 8199');
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
    return this.status;
  }
}

module.exports = PythonBackendService;