<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  ArcElement,
  Chart,
  DoughnutController,
  Legend,
  Tooltip
} from "chart.js";

Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

const props = defineProps({
  categories: {
    type: Array,
    required: true
  }
});

const canvas = ref(null);
let chart = null;

const chartData = computed(() => {
  if (props.categories.length === 0) {
    return {
      labels: ["Sem gastos"],
      values: [1],
      colors: ["#dbe3ef"]
    };
  }

  return {
    labels: props.categories.map(category => category.name),
    values: props.categories.map(category => category.total),
    colors: ["#0f766e", "#2563eb", "#10b981", "#ef4444", "#f59e0b", "#6366f1", "#14b8a6", "#64748b"]
  };
});

function renderChart() {
  if (!canvas.value) return;

  if (chart) {
    chart.data.labels = chartData.value.labels;
    chart.data.datasets[0].data = chartData.value.values;
    chart.data.datasets[0].backgroundColor = chartData.value.colors;
    chart.update();
    return;
  }

  chart = new Chart(canvas.value, {
    type: "doughnut",
    data: {
      labels: chartData.value.labels,
      datasets: [
        {
          data: chartData.value.values,
          backgroundColor: chartData.value.colors,
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: "#475569",
            font: { weight: 700 }
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              if (props.categories.length === 0) return "Sem gastos";

              return `${context.label}: ${Number(context.raw).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}`;
            }
          }
        }
      }
    }
  });
}

onMounted(() => nextTick(renderChart));
watch(chartData, renderChart);
onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});
</script>

<template>
  <div class="chart-shell doughnut">
    <canvas ref="canvas" aria-label="Grafico de despesas por categoria"></canvas>
  </div>
</template>
