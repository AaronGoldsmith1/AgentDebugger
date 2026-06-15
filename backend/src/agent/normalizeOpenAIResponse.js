export function normalizeOpenAIResponse(response) {
  const choice = response.choices?.[0];
  if (!choice?.message) {
    throw new Error("OpenAI returned an empty response");
  }

  const message = choice.message;
  const statusMessage = message.content?.trim() || "Model responded";

  if (message.tool_calls?.length) {
    if (message.tool_calls.length > 1) {
      console.warn(
        "OpenAI returned multiple tool calls; processing only the first"
      );
    }

    const toolCall = message.tool_calls[0];
    let args = {};

    try {
      args = JSON.parse(toolCall.function.arguments || "{}");
    } catch {
      throw new Error(
        `Invalid tool arguments JSON for ${toolCall.function.name}`
      );
    }

    return {
      type: "tool_call",
      statusMessage,
      toolCall: {
        id: toolCall.id,
        name: toolCall.function.name,
        args,
      },
      messagesToAppend: [message],
    };
  }

  return {
    type: "final",
    content: message.content || "",
    statusMessage,
    messagesToAppend: [{ role: "assistant", content: message.content || "" }],
  };
}
