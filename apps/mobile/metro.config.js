const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const monorepoRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// Watch the monorepo packages directory so NativewindUI components resolve
config.watchFolders = [monorepoRoot];

// Ensure node_modules resolve from the app and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Redirect native-only modules to pure-JS shims for Expo Go compatibility
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "burnt") {
    return {
      filePath: path.resolve(__dirname, "src/lib/burnt-shim.ts"),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
