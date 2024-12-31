<script lang="ts">
	import { browser } from '$app/environment';
	import * as echarts from 'echarts';
	import { onDestroy } from 'svelte';

	let { data } = $props();
	// $inspect(data);
	let divRef: HTMLDivElement | null = $state(null);
	let echartsRef: echarts.ECharts | null = $state(null);
	let resizeObserver: ResizeObserver | null = $state(null);
	let selectedNode: string | null = $state(null);

	let formNodeName = $state('');
	let formNodeDescription = $state('');
	let formNodeType = $state('qualitative');

	$effect(() => {
		if (browser && divRef && data.nodes) {
			if (!echartsRef) {
				echartsRef = echarts.init(divRef, 'dark', {
					renderer: 'svg'
				});

				// Handle both node clicks and background clicks through echarts
				echartsRef.getZr().on('click', (params) => {
					// If clicking on empty area, params.target will be null
					if (!params.target) {
						selectedNode = null;
					}
				});

				echartsRef.on('click', (params) => {
					if (params.dataType === 'node') {
						const nodeData = params?.data as { id: string };
						if (!nodeData.id) return;
						selectedNode = nodeData.id;
					}
				});
			} else {
				const nodes = data.nodes.map((goal, idx) => ({
					id: goal.id.toLocaleString(),
					name: goal.name,
					label: {
						show: true,
						position: 'inside',
						formatter: goal.name
					},
					draggable: !goal.isRoot,
					itemStyle: {
						color: goal.isRoot ? 'red' : goal.goalType === 'qualitative' ? 'blue' : 'green',
						borderWidth: selectedNode === goal.id.toLocaleString() ? 3 : 0,
						borderColor: '#fff'
					},
					symbolSize: 50
				})) as NonNullable<echarts.GraphSeriesOption['data']>;
				const linkSum = data.relationships.reduce((acc, link) => {
					return acc + link.weight;
				}, 0);
				const links = data.relationships.map((link) => ({
					source: link.fromGoalId?.toLocaleString(),
					target: link.toGoalId?.toLocaleString(),
					lineStyle: {
						width: Math.ceil((5 * link.weight) / linkSum),
						color: link.relationshipType.name === 'contributes' ? 'red' : 'green',
						opacity: 0.5
					}
				})) as NonNullable<echarts.GraphSeriesOption['links']>;
				const option = {
					animationDuration: 1500,
					animationEasingUpdate: 'quinticInOut',
					series: [
						{
							type: 'graph',
							edgeSymbol: ['none', 'arrow'],
							layout: 'force',
							data: nodes,
							links,
							symbolSize: 50,
							roam: true,
							label: {
								show: true,
								position: 'inside',
								formatter: '{b}'
							},
							force: {
								repulsion: 500,
								edgeLength: 150,
								gravity: 0.2
							},
							emphasis: {
								focus: 'adjacency',
								lineStyle: {
									width: 10
								},
								itemStyle: {
									borderWidth: 3,
									borderColor: '#fff'
								}
							}
						}
					]
				} as echarts.EChartsOption;
				echartsRef.setOption(option);
			}
		}
	});

	$effect(() => {
		if (selectedNode) {
			formNodeName = data.nodes.find((node) => node.id.toString() === selectedNode)?.name ?? '';
			formNodeType =
				data.nodes.find((node) => node.id.toString() === selectedNode)?.goalType ?? 'qualitative';
		}
	});

	$effect(() => {
		if (browser && divRef) {
			if (!resizeObserver) {
				resizeObserver = new ResizeObserver(() => {
					if (echartsRef) {
						echartsRef.resize();
					}
				});
				resizeObserver.observe(divRef);
			}
		}
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
		if (echartsRef) {
			echartsRef.dispose();
		}
	});
</script>

<main class="flex h-screen w-screen grow items-center justify-center">
	<div bind:this={divRef} class="h-full w-0 grow bg-red-800"></div>
	<form
		class="flex w-32 flex-col p-2"
		onsubmit={async (e) => {
			e.preventDefault();
			console.log(formNodeName, formNodeDescription, formNodeType);
			const resp = await fetch('/api/node',{
				method: 'POST',
				body: JSON.stringify({
					type: formNodeType,
					name: formNodeName,
					description: formNodeDescription,
				})
			})
			const data = await resp.json()
			console.log(data)
		}}
	>
		<label for="name">Name</label>
		<input type="text" id="name" name="name" bind:value={formNodeName} />
		<label for="description">Description</label>
		<textarea id="description" name="description" bind:value={formNodeDescription}></textarea>
		<div>
			<label for="type">Type</label>
			<select id="type" name="type" class="w-full" bind:value={formNodeType}>
				<option value="qualitative">Qualitative</option>
				<option value="quantitative">Quantitative</option>
			</select>
		</div>
		{#if formNodeType === 'quantitative'}
			<label for="value">Value</label>
			<input type="number" id="value" name="value" />
			<label for="unit">Unit</label>
			<input type="text" id="unit" name="unit" />
			<label for="min">Min</label>
			<input type="number" id="min" name="min" />
			<label for="max">Max</label>
			<input type="number" id="max" name="max" />
		{/if}
		<button type="submit">Submit</button>
	</form>
</main>
