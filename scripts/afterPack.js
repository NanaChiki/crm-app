const fs = require('fs');
const path = require('path');

/**
 * electron-builder afterPack hook
 * Copies .prisma directory to the app bundle since electron-builder ignores hidden directories
 */
exports.default = async function (context) {
  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;

  console.log(`\n[afterPack] Running for platform: ${platform}`);
  console.log(`[afterPack] App output directory: ${appOutDir}`);

  // Determine app path based on platform
  let appPath;
  if (platform === 'darwin') {
    const appName = context.packager.appInfo.productFilename;
    appPath = path.join(appOutDir, `${appName}.app`, 'Contents', 'Resources', 'app');
  } else if (platform === 'win32') {
    appPath = path.join(appOutDir, 'resources', 'app');
  } else {
    appPath = path.join(appOutDir, 'resources', 'app');
  }

  console.log(`[afterPack] App path: ${appPath}`);

  // Source and destination paths
  const sourcePrismaDir = path.join(process.cwd(), 'node_modules', '.prisma');
  const destNodeModules = path.join(appPath, 'node_modules');
  const destPrismaDir = path.join(destNodeModules, '.prisma');

  // Check if source .prisma exists
  if (!fs.existsSync(sourcePrismaDir)) {
    console.warn(`[afterPack] Warning: Source .prisma directory not found at ${sourcePrismaDir}`);
    return;
  }

  // Create node_modules directory if it doesn't exist
  if (!fs.existsSync(destNodeModules)) {
    console.log(`[afterPack] Creating node_modules directory: ${destNodeModules}`);
    fs.mkdirSync(destNodeModules, { recursive: true });
  }

  // Copy .prisma directory
  console.log(`[afterPack] Copying .prisma directory...`);
  console.log(`[afterPack]   From: ${sourcePrismaDir}`);
  console.log(`[afterPack]   To: ${destPrismaDir}`);

  try {
    copyDirRecursive(sourcePrismaDir, destPrismaDir);
    console.log(`[afterPack] Successfully copied .prisma directory`);

    // Verify the copy
    if (fs.existsSync(destPrismaDir)) {
      const clientPath = path.join(destPrismaDir, 'client');
      if (fs.existsSync(clientPath)) {
        console.log(`[afterPack] ✓ Verified: .prisma/client directory exists`);
      } else {
        console.warn(`[afterPack] ⚠ Warning: .prisma/client directory not found after copy`);
      }
    } else {
      console.error(`[afterPack] ✗ Error: .prisma directory not found after copy`);
    }
  } catch (error) {
    console.error(`[afterPack] Error copying .prisma directory:`, error);
    throw error;
  }
};

/**
 * Recursively copy directory
 */
function copyDirRecursive(src, dest) {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDirRecursive(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
