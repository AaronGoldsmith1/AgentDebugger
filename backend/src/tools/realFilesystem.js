import fs from "node:fs/promises";
import { resolveWorkspacePath } from "./resolveWorkspacePath.js";

export async function readFile(args) {
  const absPath = resolveWorkspacePath(args.path);
  const content = await fs.readFile(absPath, "utf8");
  return { path: args.path, content };
}

export async function writeFile(args) {
  const absPath = resolveWorkspacePath(args.path);
  const content = args.content ?? "";
  await fs.writeFile(absPath, content, "utf8");
  return {
    success: true,
    path: args.path,
    changedLines: content.split("\n").length,
    content,
  };
}
