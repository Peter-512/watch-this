<script lang="ts">
	import BotImage from '$lib/images/bot.png';
	import UserImage from '$lib/images/user.png';
	import { useChat } from 'ai/svelte';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { enhance } from '$app/forms';

	const { input, handleSubmit, messages } = useChat();
</script>

<svelte:head>
	<title>Chat</title>
	<meta name="chat with a movie expert" content="Movie ChatBot" />
</svelte:head>

<Button on:click={() => fetch(`api/saveMovie/Batman`, {method: 'POST'})}>test</Button>

<AlertDialog.Root>
	<AlertDialog.Trigger class="fixed top-4 left-4"><Button>Upload</Button></AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Upload a file with movies</AlertDialog.Title>
			<AlertDialog.Description class="flex flex-col space-y-2">
				The file should be a .txt file with a movie title on each line. Remember to be accurate with
				your movie titles.
				<br />
				E.g.
				<pre>
Avengers: Endgame
Avengers: Infinity War
Avengers: Age of Ultron
Avengers
...
				</pre>
				<form method="POST" class="flex gap-2" enctype="multipart/form-data" use:enhance>
					<Input accept=".txt" name="file" type="file" />
					<AlertDialog.Action type="submit">Upload</AlertDialog.Action>
				</form>
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

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
						<AvatarImage src={BotImage} alt="Bot Avatar" />
						<AvatarFallback>B</AvatarFallback>
					</Avatar>
					<div class="p-3 rounded-lg bg-gray-200 dark:bg-gray-800">
						{message.content}
					</div>
				</div>
			{/if}
			{#if message.role === 'user'}
				<div class="flex items-end justify-end space-x-2">
					<div class="p-3 rounded-lg bg-blue-500 dark:bg-blue-400">
						{message.content}
					</div>
					<Avatar>
						<AvatarImage src={UserImage} alt="User Avatar" />
						<AvatarFallback>U</AvatarFallback>
					</Avatar>
				</div>
			{/if}
		{/each}
	</div>
	<form on:submit={handleSubmit} class="flex items-center p-4 space-x-4 border-t">
		<input
			bind:value={$input}
			class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			placeholder="Type your message..."
		/><button
			type="submit"
			class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
			>Send</button
		>
	</form>
</div>
