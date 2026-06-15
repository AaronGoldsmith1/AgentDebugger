export const toolRegistry = {
  "github.searchIssues": {
    namespace: "github",
    capability: "read",
    risk: "low",
    description: "Search GitHub issues",
  },
  "github.createPullRequest": {
    namespace: "github",
    capability: "write",
    risk: "medium",
    description: "Create a pull request",
  },
  "filesystem.readFile": {
    namespace: "filesystem",
    capability: "read",
    risk: "low",
    description: "Read a file",
  },
  "filesystem.writeFile": {
    namespace: "filesystem",
    capability: "write",
    risk: "high",
    description: "Write a file",
  },
  "shell.run": {
    namespace: "shell",
    capability: "execute",
    risk: "high",
    description: "Run shell command",
  },
};
