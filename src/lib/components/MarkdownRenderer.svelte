<script lang="ts">
	import { marked } from 'marked';
	import { onMount } from 'svelte';

	export let markdown = '';

	let compiledContent = '';

	async function compileContent(text: string) {
		const result = await marked(text);
		return result;
	}

	onMount(() => {
		compileContent(markdown).then((result) => {
			compiledContent = result;
		});
	});
</script>

<article class="prose w-full dark:text-slate-200">
	{@html compiledContent}
</article>
