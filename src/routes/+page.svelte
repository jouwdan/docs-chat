<script lang="ts">
	import { onMount } from 'svelte';
	import { conversations } from '$lib/stores';
	import { Navigation } from '$lib/components';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ChatBubble from '$lib/components/ChatBubble.svelte';

	let question = '';
	let isLoading = false;
	let error: string | null = null;
	let currentConversationId: number;
	let chatElement: HTMLElement;

	onMount(() => {
		if (
			$conversations.length === 0 ||
			$conversations[$conversations.length - 1].messages.length > 0
		) {
			conversations.addConversation();
			currentConversationId = $conversations[$conversations.length].id;
		} else {
			currentConversationId = $conversations[$conversations.length - 1].id;
		}
	});

	$: currentConversation = $conversations.find((convo) => convo.id === currentConversationId);

	async function ask() {
		if (currentConversationId === null) return;
		isLoading = true;
		try {
			conversations.addMessageToConversation(currentConversationId, {
				role: 'user',
				content: question,
				timestamp: new Date().toISOString()
			});
			if (
				$conversations.find((convo) => convo.id === currentConversationId)?.messages.length === 1
			) {
				const title = await createTitle();
				conversations.addTitleToConversation(currentConversationId, {
					title: title
				});
			}
			const data = await postToAPI();
			conversations.addMessageToConversation(currentConversationId, {
				role: 'assistant',
				content: data,
				timestamp: new Date().toISOString()
			});
		} catch (e) {
			error = 'An error occurred. Please try again later.';
		} finally {
			question = '';
			isLoading = false;
		}
	}

	async function createTitle() {
		const response = await fetch('/api/title', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ question })
		});
		if (!response.ok) {
			throw new Error('Failed to fetch data');
		}
		return await response.text();
	}

	async function postToAPI() {
		if (currentConversationId === null) return null;
		const response = await fetch('/api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ question })
		});
		if (!response.ok) {
			throw new Error('Failed to fetch data');
		}
		return await response.json();
	}
</script>

<div class="flex h-screen max-h-screen w-full max-w-full">
	<Sidebar bind:currentConversationId />
	<main class="flex h-screen w-full flex-col">
		<Navigation />
		<ScrollArea class="h-full w-full overflow-y-auto">
			<div class="p-4" bind:this={chatElement}>
				{#if currentConversation}
					{#each currentConversation.messages as message, i}
						<ChatBubble {message} />
					{/each}
				{/if}
				{#if isLoading}
					<ChatBubble
						message={{
							role: 'assistant',
							content: 'Typing...',
							timestamp: new Date().toISOString()
						}}
					/>
				{/if}
			</div>
		</ScrollArea>
		<footer class="bottom-0 flex h-32 flex-row gap-4 border-t p-4">
			<Textarea
				name="prompt"
				id="prompt"
				placeholder="Write a message..."
				class="resize-none"
				bind:value={question}
				disabled={isLoading}
			/>
			<Button type="submit" on:click={ask} disabled={isLoading}>Send</Button>
		</footer>
	</main>
</div>
