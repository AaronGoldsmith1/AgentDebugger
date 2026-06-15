import { callGithubMcpTool } from "../mcp/githubMcpClient.js";
import { createPullRequest, searchIssues } from "./mockGithub.js";
import { readFile as mockReadFile, writeFile as mockWriteFile } from "./mockFilesystem.js";
import { readFile as realReadFile, writeFile as realWriteFile } from "./realFilesystem.js";

const mockGithubHandlers = {
  "github.searchIssues": searchIssues,
  "github.createPullRequest": createPullRequest,
};

const mockFilesystemHandlers = {
  "filesystem.readFile": mockReadFile,
  "filesystem.writeFile": mockWriteFile,
};

const realFilesystemHandlers = {
  "filesystem.readFile": realReadFile,
  "filesystem.writeFile": realWriteFile,
};

function getFilesystemHandlers(session) {
  return session?.filesystemBackend === "real"
    ? realFilesystemHandlers
    : mockFilesystemHandlers;
}

async function runGithubTool(toolCall, session) {
  if (session?.githubBackend === "mcp") {
    return callGithubMcpTool(toolCall.name, toolCall.args ?? {});
  }

  const handler = mockGithubHandlers[toolCall.name];
  if (!handler) {
    throw new Error(`Unknown GitHub tool: ${toolCall.name}`);
  }

  return handler(toolCall.args ?? {});
}

export async function runTool(toolCall, session = null) {
  const name = toolCall.name;

  if (name.startsWith("filesystem.")) {
    const handler = getFilesystemHandlers(session)[name];
    if (!handler) {
      throw new Error(`Unknown filesystem tool: ${name}`);
    }
    return handler(toolCall.args ?? {});
  }

  if (name.startsWith("github.")) {
    return runGithubTool(toolCall, session);
  }

  throw new Error(`Unknown tool: ${name}`);
}
