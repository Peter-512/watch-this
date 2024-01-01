<script lang="ts">
	import BotImage from '$lib/images/bot.png';
	import UserImage from '$lib/images/user.png';
	import { useChat } from 'ai/svelte';
	import type { ActionData } from './$types';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { enhance } from '$app/forms';
	import { Separator } from '$lib/components/ui/separator';
	import { addToast } from '$lib/toastStore';

	const { input, handleSubmit, messages } = useChat();
	export let form: ActionData;

	$: {
		if (form && form.error) {
			addToast({ title: 'Error', message: form.message, type: 'destructive' });
		}

		if (form && form.errors) {
			for (const error of form.errors) {
				addToast({ title: 'Error', message: error.message, type: 'destructive' });
			}
		}
	}
</script>

<svelte:head>
	<title>Chat</title>
	<meta name="chat with a movie expert" content="Movie ChatBot" />
</svelte:head>

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
				<form
					action="?/file-upload"
					method="POST"
					class="flex gap-2"
					enctype="multipart/form-data"
					use:enhance
				>
					<Input accept=".txt" name="file" type="file" />
					<AlertDialog.Action type="submit">Upload movies</AlertDialog.Action>
				</form>
				<div class="flex items-center gap-2">
					<Separator /> or <Separator />
				</div>
				<form action="?/text-input" method="POST" class="flex gap-2" use:enhance>
					<Input name="movies" placeholder="Add comma-separated movies" type="text" />
					<AlertDialog.Action type="submit">Add movies</AlertDialog.Action>
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
					<div
						class="p-3 rounded-lg bg-gray-200 dark:bg-gray-800 whitespace-break-spaces bot-messages"
					>
						<!--				eslint-disable-next-line		-->
						{@html message.content}
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
		<Input bind:value={$input} placeholder="Describe the movie you want to watch..." />
		<Button type="submit">Send</Button>
	</form>
</div>

<style>
	:global(.youtube-trailer) {
		color: #3894ea;
		text-decoration: underline;
	}
</style>
