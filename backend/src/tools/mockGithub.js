export async function searchIssues(args) {
  return {
    issues: [
      {
        number: 123,
        title: "Add video metadata to mobile API",
      },
    ],
    query: args.query,
    repo: args.repo,
  };
}

export async function createPullRequest(args) {
  return {
    success: true,
    url: "https://github.com/example/fox-local-api/pull/456",
    title: args.title,
  };
}
