import { createPullRequest, searchIssues } from "./mockGithub.js";
import { readFile, writeFile } from "./mockFilesystem.js";

const handlers = {
  "github.searchIssues": searchIssues,
  "github.createPullRequest": createPullRequest,
  "filesystem.readFile": readFile,
  "filesystem.writeFile": writeFile,
};

export async function runTool(toolCall) {
  const handler = handlers[toolCall.name];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }
  return handler(toolCall.args ?? {});
}
