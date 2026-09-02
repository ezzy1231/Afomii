const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the whole workspace so shared package edits hot-reload,
// and resolve deps from both the app and the hoisted root.
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, "packages/shared"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.unstable_enableSymlinks = true;

// The file-editing tool writes atomically via "<file>.<pid>.<uuid>.tmpdir"
// temp files inside watched folders; the haste-map crawler (walker) races
// the rename and crashes Metro with ENOENT. Block those temp files so the
// watcher ignores them. Equivalent to a watchman-backed watcher.
config.resolver.blockList = [
  /[.]tmpdir$/,
  /.tmpdir$/,
  /\.tmpdir$/,
];

module.exports = config;
