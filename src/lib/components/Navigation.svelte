<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	import { BotMessageSquare, Moon, Sun } from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';
</script>

<header class="top-0 h-16 min-h-16 w-full content-center border-b bg-background px-4">
	<div class="flex w-full gap-4">
		<a href="/" class="items-center md:text-base">
			<BotMessageSquare class="h-6 w-6" />
		</a>
		<div class="ml-auto">
			<Button on:click={toggleMode} variant="outline" size="icon" class="align-middle">
				<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
	</div>
</header>
