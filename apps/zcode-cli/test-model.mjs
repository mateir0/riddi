import { createAnthropic } from '@ai-sdk/anthropic';

const client = createAnthropic({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const result = await client('nvidia/llama-3.1-nemotron-70b-instruct').generateText({
  prompt: 'say hello in 3 words',
});

console.log('Result:', result);
