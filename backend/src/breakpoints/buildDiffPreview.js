import { readFile } from "../tools/realFilesystem.js";

export async function buildDiffPreview(session, toolCall) {
  const relPath = toolCall.args?.path;
  const after = toolCall.args?.content ?? "";

  if (!relPath) {
    return null;
  }

  let before = session.fileCache[relPath];

  if (before == null && session.filesystemBackend === "real") {
    try {
      const result = await readFile({ path: relPath });
      before = result.content;
      session.fileCache[relPath] = before;
    } catch {
      before = "";
    }
  }

  if (before == null) {
    before = "";
  }

  return { path: relPath, before, after };
}
