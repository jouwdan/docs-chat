<script lang="ts">
	import { conversations } from '$lib/stores';
	import { SquarePen, Trash2 } from 'lucide-svelte';
	import { Button } from './ui/button';
	import type { ButtonEventHandler } from 'bits-ui';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	export let currentConversationId: number | null;

	let hoveredConversationId: number | null = null;

	function selectConversation(id: number) {
		currentConversationId = id;
	}

	function handleDelete(e: ButtonEventHandler<MouseEvent>, id: number) {
		e.stopPropagation();
		conversations.removeConversation(id);
		currentConversationId =
			$conversations.length > 0 ? $conversations[$conversations.length - 1].id : null;
	}

	function createConversation() {
		const newId = conversations.addConversation();
		currentConversationId = newId;
	}
</script>

<aside class="flex h-screen w-64 flex-col border-r">
	<button
		class="flex h-16 w-full items-center justify-center border-b"
		on:click={createConversation}
	>
		<SquarePen class="h-4 w-4" />&nbsp; New Conversation
	</button>
	<ScrollArea class="flex-1 overflow-y-auto">
		{#each $conversations.slice().reverse() as { id, title }, i}
			<button
				class="flex h-16 w-64 flex-1 items-center px-4 text-left transition-colors hover:bg-accent {currentConversationId ===
				id
					? 'bg-accent'
					: ''}"
				on:click={() => selectConversation(id)}
				on:mouseenter={() => (hoveredConversationId = id)}
				on:mouseleave={() => (hoveredConversationId = null)}
			>
				<span class="flex-1 truncate">
					{title || `Conversation ${id}`}
				</span>
				{#if hoveredConversationId === id}
					<Button
						variant="outline"
						size="icon"
						class="my-auto ml-auto transform hover:bg-red-600"
						on:click={(e) => {
							e.stopPropagation();
							handleDelete(e, id);
						}}
					>
						<Trash2 class="mx-auto h-4 w-4" />
					</Button>
				{/if}
			</button>
		{/each}
	</ScrollArea>
</aside>
