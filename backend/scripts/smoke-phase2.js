/**
 * Day 12 smoke test: real filesystem read → diff at write pause → reset.
 * Run: node scripts/smoke-phase2.js
 * Requires backend running on PORT (default 3001) with WORKSPACE_ROOT set.
 */

const API = process.env.API_BASE || "http://localhost:3001";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `${response.status} ${path}`);
  }
  return data;
}

async function main() {
  const { sessionId } = await request("/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filesystemBackend: "real",
      breakpoints: { afterPlan: false, beforeGithubMutation: false },
    }),
  });

  await request(`/sessions/${sessionId}/start`, { method: "POST" });
  await sleep(3500);

  let session = await request(`/sessions/${sessionId}`);

  if (session.status !== "paused") {
    throw new Error(`Expected paused before write, got ${session.status}`);
  }

  if (!session.diffPreview?.path) {
    throw new Error("Expected diffPreview at file-write breakpoint");
  }

  console.log("✓ Paused at write with diff:", session.diffPreview.path);
  console.log("  before lines:", session.diffPreview.before.split("\n").length);
  console.log("  after includes demo:", session.diffPreview.after.includes("Agent Debugger"));

  await request(`/sessions/${sessionId}/reset`, { method: "POST" });
  session = await request(`/sessions/${sessionId}`);

  if (session.status !== "idle" || session.events.length !== 0) {
    throw new Error("Reset did not clear session");
  }

  console.log("✓ Reset demo cleared session");
  console.log("Day 12 smoke test passed (dry run — write not executed).");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Smoke test failed:", err.message);
  process.exit(1);
});
