import path from "node:path";

export function getWorkspaceRoot() {
  const root = process.env.WORKSPACE_ROOT;
  if (!root) {
    throw new Error(
      "WORKSPACE_ROOT is not set. Add it to backend/.env for real filesystem mode."
    );
  }
  return path.resolve(root);
}

export function resolveWorkspacePath(relativePath) {
  if (!relativePath || typeof relativePath !== "string") {
    throw new Error("File path is required");
  }

  const root = getWorkspaceRoot();
  const resolved = path.resolve(root, relativePath);

  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`Path escapes workspace: ${relativePath}`);
  }

  return resolved;
}
