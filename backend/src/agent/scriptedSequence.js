export const SEARCH_ISSUES_CALL = {
  id: "call_scripted_1",
  name: "github.searchIssues",
  args: {
    query: "durationSeconds video metadata",
    repo: "fox-local-api",
  },
};

export const READ_FILE_CALL = {
  id: "call_scripted_2",
  name: "filesystem.readFile",
  args: { path: "internal/api/videos.go" },
};

export const WRITE_FILE_CALL = {
  id: "call_scripted_3",
  name: "filesystem.writeFile",
  args: {
    path: "internal/api/videos.go",
    content: `package api

type VideoResponse struct {
\tID              string \`json:"id"\`
\tTitle           string \`json:"title"\`
\tDurationSeconds int    \`json:"durationSeconds,omitempty"\`
}
`,
  },
};

export const CREATE_PR_CALL = {
  id: "call_scripted_4",
  name: "github.createPullRequest",
  args: {
    title: "Add durationSeconds to video API response",
    body: "Adds optional durationSeconds field to VideoResponse for backward-compatible mobile metadata.",
    head: "feat/video-duration-seconds",
    base: "main",
  },
};
