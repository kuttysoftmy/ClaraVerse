import { notarize } from '@electron/notarize';
import path from 'path';
import fs from 'fs';

export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Skip notarization for non-macOS platforms
  if (electronPlatformName === 'win32' || electronPlatformName !== 'darwin') {
    console.log('Skipping notarization for non-macOS platform');
    return;
  }

  console.log('Notarizing macOS application...');
  
  // Get application name from package.json if not provided
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);
  
  // Check if app exists
  if (!fs.existsSync(appPath)) {
    console.error(`Cannot find application at: ${appPath}`);
    return;
  }

  // Get credentials from environment variables
  const { 
    APPLE_ID, 
    APPLE_APP_SPECIFIC_PASSWORD, 
    APPLE_TEAM_ID 
  } = process.env;

  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn('Skipping notarization - missing required environment variables');
    return;
  }

  console.log(`Notarizing ${appName} with Apple ID: ${APPLE_ID}`);

  try {
    // Start notarization
    await notarize({
      tool: 'notarytool',
      appPath,
      appleId: APPLE_ID,
      appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
      teamId: APPLE_TEAM_ID,
    });
    
    console.log(`Successfully notarized ${appName}`);
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
};
