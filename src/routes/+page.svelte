<script lang="ts">
	import { browser } from '$app/environment';
	import * as echarts from 'echarts';
	import { onDestroy } from 'svelte';

	let { data } = $props();
	$inspect(data);
	let divRef: HTMLDivElement | null = $state(null);
	let echartsRef: echarts.ECharts | null = $state(null);
	let resizeObserver: ResizeObserver | null = $state(null);

	$effect(() => {
		if (browser && divRef && data.nodes) {
			if (!echartsRef) {
				echartsRef = echarts.init(divRef, 'dark', {
					renderer: 'svg'
				});
			} else {
				const nodes = data.nodes.map((goal, idx) => ({
					// fixed: goal.isRoot,
					id: goal.id.toLocaleString(),
					name: goal.name,
					label: {
						show: true,
						position: 'inside',
						formatter: goal.name
					},
					draggable: !goal.isRoot,
					itemStyle: {
						color: goal.isRoot ? 'red' : goal.goalType === 'qualitative' ? 'blue' : 'green'
					},
					symbolSize: 50
					// x: goal.isRoot ? 300 : 800,
					// y: goal.isRoot ? 300 : 300
				})) as NonNullable<echarts.GraphSeriesOption['data']>;
				const linkSum = data.relationships.reduce((acc, link) => {
					return acc + link.weight;
				}, 0);
				const links = data.relationships.map((link) => ({
					source: link.fromGoalId?.toLocaleString(),
					target: link.toGoalId?.toLocaleString(),
					// label: {
					// 	show: true,
					// 	formatter: link.relationshipType.name
					// },
					lineStyle: {
						width: Math.ceil((5 * link.weight) / linkSum),
						color: link.relationshipType.name === 'contributes' ? 'red' : 'green',
						opacity: 0.5
					}
				})) as NonNullable<echarts.GraphSeriesOption['links']>;
				// console.log(links, nodes);
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
		if (browser && divRef) {
			if (!resizeObserver) {
				resizeObserver = new ResizeObserver(() => {
					if (echartsRef) {
						// console.log('resize');
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

<main class="flex h-screen w-screen">
	<div bind:this={divRef} class="h-full w-full"></div>
</main>
