function getGithubEnv() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!owner || !repo) {
    throw new Error(
      "GITHUB_OWNER and GITHUB_REPO must be set in backend/.env for GitHub MCP mode."
    );
  }

  return { owner, repo };
}

export function mapGithubToolCall(toolName, args = {}) {
  const { owner, repo } = getGithubEnv();

  if (toolName === "github.searchIssues") {
    return {
      mcpTool: "search_issues",
      mcpArgs: {
        owner,
        repo,
        query: args.query ?? "",
      },
    };
  }

  if (toolName === "github.createPullRequest") {
    return {
      mcpTool: "create_pull_request",
      mcpArgs: {
        owner,
        repo,
        title: args.title,
        body: args.body,
        head: args.head,
        base: args.base ?? "main",
      },
    };
  }

  throw new Error(`No GitHub MCP mapping for tool: ${toolName}`);
}

export function normalizeMcpGithubResult(toolName, mcpTool, raw) {
  if (toolName === "github.searchIssues") {
    const issues = Array.isArray(raw?.items)
      ? raw.items.map((item) => ({
          number: item.number,
          title: item.title,
          state: item.state,
          url: item.html_url,
        }))
      : Array.isArray(raw?.issues)
        ? raw.issues
        : [];

    return {
      issues,
      query: raw?.query,
      repo: raw?.repo ?? process.env.GITHUB_REPO,
      mcpTool,
      source: "github-mcp",
    };
  }

  if (toolName === "github.createPullRequest") {
    const url =
      raw?.html_url ?? raw?.url ?? raw?.pull_request?.html_url ?? raw?.pullRequestUrl;

    return {
      success: true,
      url,
      title: raw?.title ?? raw?.pull_request?.title,
      number: raw?.number ?? raw?.pull_request?.number,
      mcpTool,
      source: "github-mcp",
    };
  }

  return { ...raw, mcpTool, source: "github-mcp" };
}
