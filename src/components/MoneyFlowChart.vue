<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

const props = defineProps({
  entradas: {
    type: Number,
    required: true
  },
  gastos: {
    type: Number,
    required: true
  },
  resultado: {
    type: Number,
    required: true
  }
});

const canvas = ref(null);
let chart = null;

const dataset = computed(() => [
  props.entradas,
  props.gastos,
  Math.max(props.resultado, 0)
]);

function renderChart() {
  if (!canvas.value) return;

  if (chart) {
    chart.data.datasets[0].data = dataset.value;
    chart.update();
    return;
  }

  chart = new Chart(canvas.value, {
    type: "bar",
    data: {
      labels: ["Entradas", "Gastos", "Resultado"],
      datasets: [
        {
          data: dataset.value,
          backgroundColor: ["#10b981", "#ef4444", "#2563eb"],
          borderRadius: 10,
          maxBarThickness: 72
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return Number(context.raw).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              });
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748b", font: { weight: 700 } }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#64748b" },
          grid: { color: "#e2e8f0" }
        }
      }
    }
  });
}

onMounted(() => nextTick(renderChart));
watch(dataset, renderChart);
onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});
</script>

<template>
  <div class="chart-shell">
    <canvas ref="canvas" aria-label="Grafico de entradas, gastos e resultado"></canvas>
  </div>
</template>
