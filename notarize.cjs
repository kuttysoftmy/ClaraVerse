const { notarize } = require('@electron/notarize');
const path = require('path');
const fs = require('fs');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Skip notarization for non-macOS platforms
  if (electronPlatformName === 'win32' || electronPlatformName !== 'darwin') {
    console.log('Skipping notarization for non-macOS platform');
    return;
  }

  console.log('Notarizing macOS application...');
  
  // The packaging's output directory
  const appPath = path.join(appOutDir, `${context.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  // Check for required environment variables
  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn('Skipping notarization: Required environment variables missing');
    return;
  }

  try {
    console.log(`Notarizing ${path.basename(appPath)}...`);
    
    await notarize({
      tool: 'notarytool',
      appPath,
      appleId: APPLE_ID,
      appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
      teamId: APPLE_TEAM_ID,
    });
    
    console.log(`Successfully notarized ${path.basename(appPath)}`);
  } catch (error) {
    console.error(`Notarization failed: ${error.message}`);
    throw error;
  }
};
