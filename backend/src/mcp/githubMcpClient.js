import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  mapGithubToolCall,
  normalizeMcpGithubResult,
} from "./githubToolMap.js";

let client = null;
let transport = null;
let initPromise = null;
let mcpStatus = {
  available: false,
  tools: [],
  error: null,
};

const REQUIRED_TOOLS = ["search_issues", "create_pull_request"];

function parseMcpArgs() {
  const raw = process.env.GITHUB_MCP_ARGS ?? "-y,@modelcontextprotocol/server-github";
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildMcpEnv() {
  const token =
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN ?? process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN (or GITHUB_PERSONAL_ACCESS_TOKEN) is required for GitHub MCP mode."
    );
  }

  return {
    ...process.env,
    GITHUB_PERSONAL_ACCESS_TOKEN: token,
    GITHUB_TOKEN: token,
  };
}

function parseMcpPayload(result) {
  if (result.isError) {
    const message =
      result.content
        ?.map((item) => item.text)
        .filter(Boolean)
        .join("\n") || "GitHub MCP tool returned an error";
    throw new Error(message);
  }

  if (result.structuredContent) {
    return result.structuredContent;
  }

  const text = result.content
    ?.map((item) => item.text)
    .filter(Boolean)
    .join("\n");

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export function getGithubMcpStatus() {
  return { ...mcpStatus };
}

export async function initGithubMcp() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const command = process.env.GITHUB_MCP_COMMAND || "npx";
      const args = parseMcpArgs();

      transport = new StdioClientTransport({
        command,
        args,
        env: buildMcpEnv(),
        stderr: "pipe",
      });

      client = new Client({ name: "agent-debugger", version: "0.1.0" });
      await client.connect(transport);

      const listed = await client.listTools();
      const toolNames = listed.tools.map((tool) => tool.name);
      const missing = REQUIRED_TOOLS.filter((name) => !toolNames.includes(name));

      if (missing.length > 0) {
        throw new Error(
          `GitHub MCP server missing required tools: ${missing.join(", ")}`
        );
      }

      mcpStatus = {
        available: true,
        tools: toolNames,
        error: null,
      };

      console.log("GitHub MCP connected. Tools:", toolNames.join(", "));
      return mcpStatus;
    } catch (err) {
      mcpStatus = {
        available: false,
        tools: [],
        error: err.message,
      };
      console.warn("GitHub MCP unavailable:", err.message);
      return mcpStatus;
    }
  })();

  return initPromise;
}

async function ensureClient() {
  await initGithubMcp();

  if (!client || !mcpStatus.available) {
    throw new Error(
      mcpStatus.error ||
        "GitHub MCP is not available. Use GitHub Mock mode or fix MCP configuration."
    );
  }

  return client;
}

export async function callGithubMcpTool(agentToolName, args = {}) {
  const activeClient = await ensureClient();
  const { mcpTool, mcpArgs } = mapGithubToolCall(agentToolName, args);

  const result = await activeClient.callTool({
    name: mcpTool,
    arguments: mcpArgs,
  });

  const raw = parseMcpPayload(result);
  return normalizeMcpGithubResult(agentToolName, mcpTool, raw);
}

export async function closeGithubMcp() {
  if (client) {
    await client.close();
    client = null;
  }

  if (transport) {
    await transport.close();
    transport = null;
  }

  initPromise = null;
  mcpStatus = { available: false, tools: [], error: null };
}
