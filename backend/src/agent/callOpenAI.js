import OpenAI from "openai";
import { openaiTools } from "./openaiTools.js";

let client;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in backend/.env");
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function callOpenAI(messages) {
  const openai = getClient();
  return openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    tools: openaiTools,
    tool_choice: "auto",
  });
}
