function getScriptedReadPath() {
  return process.env.SCRIPTED_READ_PATH || "internal/api/videos.go";
}

function getScriptedWritePath() {
  return process.env.SCRIPTED_WRITE_PATH || getScriptedReadPath();
}

export const SEARCH_ISSUES_CALL = {
  id: "call_scripted_1",
  name: "github.searchIssues",
  args: {
    query: "durationSeconds video metadata",
    repo: "fox-local-api",
  },
};

export function getReadFileCall() {
  return {
    id: "call_scripted_2",
    name: "filesystem.readFile",
    args: { path: getScriptedReadPath() },
  };
}

export const READ_FILE_CALL = getReadFileCall();

const MOCK_WRITE_CONTENT = `package api

type VideoResponse struct {
\tID              string \`json:"id"\`
\tTitle           string \`json:"title"\`
\tDurationSeconds int    \`json:"durationSeconds,omitempty"\`
}
`;

export function buildWriteFileCall(session) {
  const writePath = getScriptedWritePath();

  if (session?.filesystemBackend === "real") {
    const before = session.fileCache[writePath] ?? "";
    const content =
      before +
      (before.endsWith("\n") ? "" : "\n") +
      "\n<!-- Agent Debugger demo edit -->\n";

    return {
      id: "call_scripted_3",
      name: "filesystem.writeFile",
      args: { path: writePath, content },
    };
  }

  return {
    id: "call_scripted_3",
    name: "filesystem.writeFile",
    args: {
      path: writePath,
      content: MOCK_WRITE_CONTENT,
    },
  };
}

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

export { getScriptedReadPath, getScriptedWritePath };
