const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Configure update events
function setupAutoUpdater(mainWindow) {
  // Disable auto download
  autoUpdater.autoDownload = false;

  // Handle update errors gracefully
  autoUpdater.on('error', (error) => {
    // Log the error but don't show to user
    log.info('Update check failed:', error.message);
    
    // Don't show error popup for 404 errors (no updates available)
    if (error.code === 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND') {
      log.info('No updates available');
      return;
    }
    
    // For other errors, just log them
    log.error('Update error:', error);
  });
  
  // Handle update available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    // Don't show popup, just log
  });
  
  // Handle update not available
  autoUpdater.on('update-not-available', (info) => {
    log.info('No updates available');
  });
  
  // Handle download progress
  autoUpdater.on('download-progress', (progress) => {
    log.info('Download progress:', progress);
  });
  
  // Handle update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    // Don't show popup, just log
  });
  
  // Check for updates silently
  autoUpdater.checkForUpdates().catch(error => {
    // Log but don't show error
    log.info('Update check failed:', error.message);
  });
}

// Manual check for updates
function checkForUpdates() {
  return autoUpdater.checkForUpdates().then(() => {
    // Pass true to indicate this is a manual check
    autoUpdater.emit('update-not-available', null, true);
  });
}

module.exports = { setupAutoUpdater, checkForUpdates };