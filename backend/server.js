import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  getGithubMcpStatus,
  initGithubMcp,
} from "./src/mcp/githubMcpClient.js";
import sessionsRouter from "./src/routes/sessions.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    githubMcp: getGithubMcpStatus(),
  });
});

app.use("/sessions", sessionsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

app.listen(PORT, async () => {
  console.log(`Agent Debugger API listening on http://localhost:${PORT}`);
  await initGithubMcp();
});
