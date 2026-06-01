<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

const props = defineProps({
  series: {
    type: Array,
    required: true
  }
});

const canvas = ref(null);
let chart = null;

const flowRows = computed(() => {
  let running = 0;

  return props.series.map(item => {
    running += item.resultado;
    return {
      ...item,
      acumulado: running
    };
  });
});

const chartData = computed(() => ({
  labels: flowRows.value.map(item => item.label),
  values: flowRows.value.map(item => item.acumulado),
  rows: flowRows.value
}));

function money(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function renderChart() {
  if (!canvas.value) return;

  if (chart) {
    chart.data.labels = chartData.value.labels;
    chart.data.datasets[0].data = chartData.value.values;
    chart.update();
    return;
  }

  chart = new Chart(canvas.value, {
    type: "line",
    data: {
      labels: chartData.value.labels,
      datasets: [
        {
          data: chartData.value.values,
          borderColor: "#2563eb",
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor(context) {
            return Number(context.raw) >= 0 ? "#10b981" : "#ef4444";
          },
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          tension: 0.36,
          fill: true,
          backgroundColor: "rgba(37, 99, 235, .08)",
          segment: {
            borderColor(context) {
              const from = context.p0.parsed.y;
              const to = context.p1.parsed.y;
              return to >= from ? "#10b981" : "#ef4444";
            }
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index"
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(items) {
              return `Dia ${items[0].label}`;
            },
            label(context) {
              const row = chartData.value.rows[context.dataIndex];
              return [
                `Saldo acumulado: ${money(row.acumulado)}`,
                `Entradas: ${money(row.entradas)}`,
                `Saidas: ${money(row.gastos)}`,
                `Resultado do dia: ${money(row.resultado)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#647084",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
            font: { weight: 800 }
          }
        },
        y: {
          ticks: {
            color: "#647084",
            callback(value) {
              return money(value);
            }
          },
          grid: { color: "#e8edf4" }
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
  <div class="chart-shell cash-flow-line">
    <canvas ref="canvas" aria-label="Grafico de fluxo acumulado do mes"></canvas>
  </div>
</template>
