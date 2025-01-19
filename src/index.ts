// index.ts
import { createWorkersAI } from 'workers-ai-provider';
import { streamText } from 'ai';

type Env = {
	AI: Ai;
};

export default {
	async fetch(req: Request, env: Env) {
		const path = new URL(req.url).pathname;

		if (path == '/ai-sdk') {
			const workersai = createWorkersAI({ binding: env.AI });
			// Use the AI provider to interact with the Vercel AI SDK
			// Here, we generate a chat stream based on a prompt
			const text = await streamText({
				model: workersai('@cf/meta/llama-2-7b-chat-int8'),
				messages: [
					{
						role: 'user',
						content: 'Write an essay about hello world',
					},
				],
			});

			return text.toTextStreamResponse({
				headers: {
					// add these headers to ensure that the
					// response is chunked and streamed
					'Content-Type': 'text/x-unknown',
					'content-encoding': 'identity',
					'transfer-encoding': 'chunked',
				},
			});
		} else if (path === '/vanilla-ai-binding') {
			const responseStream = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
				stream: true,
				messages: [{ role: 'user', content: 'Write an essay about hello world' }],
				max_tokens: 512,
			});

			return new Response(responseStream as ReadableStream, {
				headers: {
					'content-type': 'text/event-stream',
					'cache-control': 'no-cache',
					connection: 'keep-alive',
				},
			});
		}

		return new Response('<a href="/ai-sdk">AI SDK</a><br /><a href="/vanilla-ai-binding">Vanilla AI Binding</a>', {
			status: 200,
			headers: { 'content-type': 'text/html' },
		});
	},
};
