<script>
	import '../app.css';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import Header from '$lib/Header.svelte';
	import Footer from '$lib/Footer.svelte';
	import { page } from '$app/stores';
	import Toasts from '$lib/Toasts.svelte';

	inject({ mode: dev ? 'development' : 'production' });
</script>

<div class="h-screen w-full bg-cover" style="background-image: url(/background.png)">
	<div
		class="flex flex-col items-center justify-center min-h-screen w-full h-full bg-gradient-to-br from-slate-900/80 to-black/90"
		class:backdrop-blur-md={$page.route.id !== '/'}
	>
		<div class="min-h-screen m-32 flex flex-col justify-between">
			<Header />
			<slot />
			<Toasts />
			<Footer />
		</div>
	</div>
</div>

<style>
	:global(body) {
		font-family: 'Inter', sans-serif;
	}
</style>
