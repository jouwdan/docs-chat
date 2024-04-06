<script lang="ts">
	import type { Message } from '$lib/types';
	import { MarkdownRenderer } from '$lib/components';
	import { BotMessageSquare, UserCircle2 } from 'lucide-svelte';

	export let message: Message;
</script>

{#if message.role === 'assistant'}
	<div class="grid w-full grid-cols-[auto_1fr] gap-2 p-4">
		<div class="mb-6 mt-auto rounded-full border p-2">
			<BotMessageSquare />
		</div>
		<div class="flex flex-col">
			<div class="max-w-prose space-y-2 rounded-xl rounded-bl-none bg-muted p-4">
				<header class="flex items-center justify-between">
					<p class="font-bold">Assistant</p>
				</header>
				<MarkdownRenderer markdown={message.content} />
			</div>
			<small class="opacity-50">{new Date(message.timestamp).toLocaleString()}</small>
		</div>
	</div>
{:else}
	<div class="ml-auto grid w-full grid-cols-[1fr_auto] gap-2">
		<div class="flex flex-col">
			<div class="ml-auto max-w-prose space-y-2 rounded-xl rounded-br-none bg-muted p-4">
				<header class="flex items-center justify-between">
					<p class="font-bold">You</p>
				</header>
				<MarkdownRenderer markdown={message.content} />
			</div>
			<small class="ml-auto opacity-50">{new Date(message.timestamp).toLocaleString()}</small>
		</div>
		<div class="mb-6 mt-auto rounded-full border p-2">
			<UserCircle2 />
		</div>
	</div>
{/if}
