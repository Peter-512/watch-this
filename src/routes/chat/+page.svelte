<script lang="ts">
	import { useChat } from 'ai/svelte';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';

	const { input, handleSubmit, messages } = useChat();
</script>

<svelte:head>
	<title>Chat</title>
	<meta name="chat with a movie expert" content="Movie ChatBot" />
</svelte:head>

<!--
// v0 by Vercel.
// https://v0.dev/t/754Sd48ZTtg
-->
<div class="flex flex-col h-full">
	<div class="flex flex-col p-4 space-y-4 overflow-y-auto">
		{#each $messages as message}
			{#if message.role === 'assistant'}
				<div class="flex items-end space-x-2">
					<Avatar>
						<AvatarImage src="/placeholder-bot.jpg" alt="Bot Avatar" />
						<AvatarFallback>B</AvatarFallback>
					</Avatar>
					<div class="p-3 rounded-lg bg-gray-200 dark:bg-gray-800 text-black">
						{message.content}
					</div>
				</div>
			{/if}
			{#if message.role === 'user'}
				<div class="flex items-end justify-end space-x-2">
					<div class="p-3 rounded-lg bg-blue-500 text-white dark:bg-blue-400">
						{message.content}
					</div>
					<Avatar>
						<AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
						<AvatarFallback>U</AvatarFallback>
					</Avatar>
				</div>
			{/if}
		{/each}
	</div>
	<form on:submit={handleSubmit} class="flex items-center p-4 space-x-4 border-t">
		<input
			bind:value={$input}
			class="flex h-10 text-black w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			placeholder="Type your message..."
		/><button
			type="submit"
			class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
			>Send</button
		>
	</form>
</div>
