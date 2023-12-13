<script lang="ts">
	import { AlertTitle, AlertDescription, Alert } from '$lib/components/ui/alert';
	import { Bell } from 'radix-icons-svelte';
	import { fly, slide } from 'svelte/transition';

	import { dismissToast, toasts } from '$lib/toastStore';
</script>

{#if $toasts}
	<section class="fixed bottom-0 right-0 max-w-md w-[20rem] flex m-4 justify-center flex-col z-50">
		{#each $toasts as toast, i (toast.id)}
			<div in:fly={{ x: 200, delay: 200 * i }} out:slide>
				<Alert variant={toast.type} class="mt-2 bg-black" on:dismiss={() => dismissToast(toast.id)}>
					<Bell size={30} />
					<AlertTitle class="ms-4">{toast.title}</AlertTitle>
					<AlertDescription class="ms-4">{toast.message}</AlertDescription>
				</Alert>
			</div>
		{/each}
	</section>
{/if}
