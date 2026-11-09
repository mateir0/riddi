import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const client = createAnthropic({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const result = await generateText({
  model: client("nvidia/llama-3.1-nemotron-70b-instruct"),
  prompt: "say hello in 3 words",
});

console.log("Result:", result);
