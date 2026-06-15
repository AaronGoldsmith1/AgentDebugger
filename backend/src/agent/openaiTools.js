export const openaiTools = [
  {
    type: "function",
    function: {
      name: "github.searchIssues",
      description: "Search GitHub issues in a repository",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Issue search query" },
          repo: { type: "string", description: "Repository name" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filesystem.readFile",
      description: "Read a file from the workspace",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filesystem.writeFile",
      description: "Write content to a file in the workspace",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path" },
          content: { type: "string", description: "Full file content" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "github.createPullRequest",
      description: "Create a pull request on GitHub",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          head: { type: "string", description: "Source branch" },
          base: { type: "string", description: "Target branch" },
        },
        required: ["title", "head", "base"],
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are a coding/API agent working on a mock Fox Local backend API.
Use tools to inspect files, propose code changes, and create a mock PR.
Before each tool call, provide a concise public status message in your assistant text.
Make exactly one tool call per turn. Wait for the tool result before calling the next tool.
Do not reveal hidden chain-of-thought.
When the task is complete, respond with a concise final summary and no further tool calls.`;
