const FAKE_VIDEO_FILE = `package api

type VideoResponse struct {
\tID    string \`json:"id"\`
\tTitle string \`json:"title"\`
}
`;

const UPDATED_VIDEO_FILE = `package api

type VideoResponse struct {
\tID              string \`json:"id"\`
\tTitle           string \`json:"title"\`
\tDurationSeconds int    \`json:"durationSeconds,omitempty"\`
}
`;

export async function readFile(args) {
  return {
    path: args.path,
    content: FAKE_VIDEO_FILE,
  };
}

export async function writeFile(args) {
  return {
    success: true,
    path: args.path,
    changedLines: 4,
    content: args.content ?? UPDATED_VIDEO_FILE,
  };
}
