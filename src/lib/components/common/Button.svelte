<script lang="ts">
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let variant: 'primary' | 'secondary' | 'danger' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let onClick: (() => void) | undefined = undefined;
	export let stopPropagation: boolean = false;

	const handleClick = (event?: MouseEvent) => {
		if (stopPropagation && event) {
			event.stopPropagation();
		}
		if (!disabled && onClick) {
			onClick();
		}
	};
</script>

<button
	{type}
	class="btn btn-{variant} btn-{size}"
	{disabled}
	on:click={handleClick}
>
	<slot />
</button>
