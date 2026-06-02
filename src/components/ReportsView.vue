<script setup>
import { computed } from "vue";
import { Activity, BarChart3, Percent, ReceiptText } from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";
import CashFlowLineChart from "./CashFlowLineChart.vue";
import ExpenseDoughnut from "./ExpenseDoughnut.vue";
import StatCard from "./StatCard.vue";
import { categoryToneClass, resolveIcon } from "./icons";

const store = useFinanceStore();

const categoriesInPeriod = computed(() => {
  return store.monthlyCategorySummary.filter(category => category.spent > 0);
});

const averageExpense = computed(() => {
  const count = store.monthExpenses.length;
  return count > 0 ? store.monthExpensesTotal / count : 0;
});

const flowTotals = computed(() => {
  const daysWithEntries = store.cashFlowSeries.filter(day => day.entradas > 0).length;
  const daysWithExpenses = store.cashFlowSeries.filter(day => day.gastos > 0).length;
  const bestDay = store.cashFlowSeries.reduce((best, day) => {
    return day.resultado > best.resultado ? day : best;
  }, { label: "--", resultado: 0 });
  const heaviestDay = store.cashFlowSeries.reduce((heavy, day) => {
    return day.gastos > heavy.gastos ? day : heavy;
  }, { label: "--", gastos: 0 });

  return {
    daysWithEntries,
    daysWithExpenses,
    bestDay,
    heaviestDay
  };
});

function statusFor(category) {
  if (category.overBudget) return { label: "Acima", className: "danger" };
  if (category.unplanned) return { label: "Sem limite", className: "warning" };
  if (category.limit > 0) return { label: "No plano", className: "success" };
  return { label: "Pendente", className: "muted" };
}

function usageWidth(category) {
  const value = category.limit > 0 ? category.percentOfBudget : category.percentOfSpending;
  return `${Math.min(Math.max(value, 4), 100)}%`;
}
</script>

<template>
  <section class="workspace-section">
    <div class="section-heading">
      <div>
        <span class="kicker">Relatorios</span>
        <h1>Analise do mes</h1>
        <p>Fluxo acumulado, composicao das saidas e detalhamento organizado por categoria.</p>
      </div>
    </div>

    <div class="stat-grid four compact">
      <StatCard label="Resultado do mes" :value="store.money(store.monthResult)" icon="Sigma" tone="blue" />
      <StatCard label="Maior saida" :value="store.money(store.monthBiggestExpense)" icon="ReceiptText" tone="red" />
      <StatCard label="Media por saida" :value="store.money(averageExpense)" icon="BarChart3" tone="green" />
      <StatCard label="Categorias ativas" :value="categoriesInPeriod.length" icon="ListChecks" tone="amber" />
    </div>

    <div class="dashboard-grid reports-workbench">
      <article class="panel chart-panel flow-panel">
        <div class="panel-heading">
          <div>
            <span>Fluxo</span>
            <h2>Entradas e saidas acumuladas</h2>
          </div>
          <Activity :size="22" />
        </div>

        <CashFlowLineChart :series="store.cashFlowSeries" />

        <div class="flow-insights">
          <div>
            <span>Dias com entrada</span>
            <strong>{{ flowTotals.daysWithEntries }}</strong>
          </div>
          <div>
            <span>Dias com saida</span>
            <strong>{{ flowTotals.daysWithExpenses }}</strong>
          </div>
          <div>
            <span>Melhor dia</span>
            <strong>{{ flowTotals.bestDay.label }} - {{ store.money(flowTotals.bestDay.resultado) }}</strong>
          </div>
          <div>
            <span>Maior saida diaria</span>
            <strong>{{ flowTotals.heaviestDay.label }} - {{ store.money(flowTotals.heaviestDay.gastos) }}</strong>
          </div>
        </div>
      </article>

      <article class="panel chart-panel">
        <div class="panel-heading">
          <div>
            <span>Composicao</span>
            <h2>Saidas por categoria</h2>
          </div>
          <Percent :size="22" />
        </div>
        <ExpenseDoughnut :categories="store.groupedExpenses" />
      </article>
    </div>

    <article class="panel report-category-panel">
      <div class="panel-heading">
        <div>
          <span>Detalhamento</span>
          <h2>Categorias no periodo</h2>
        </div>
        <ReceiptText :size="22" />
      </div>

      <div v-if="categoriesInPeriod.length === 0" class="empty-state">
        Nenhuma saida registrada neste mes.
      </div>

      <div v-else class="report-category-table">
        <div class="report-category-head">
          <span>Categoria</span>
          <span>Status</span>
          <span>Lancamentos</span>
          <span>Saida</span>
          <span>Limite</span>
          <span>Restante</span>
          <span>%</span>
        </div>

        <div
          v-for="category in categoriesInPeriod"
          :key="category.name"
          class="report-category-row"
          :class="{ danger: category.overBudget, warning: category.unplanned }"
        >
          <div class="report-category-name">
            <span class="category-mini-icon" :class="categoryToneClass(category.tone)">
              <component :is="resolveIcon(category.icon)" :size="18" />
            </span>
            <div>
              <strong>{{ category.name }}</strong>
              <small>{{ store.money(category.average) }} em media</small>
            </div>
          </div>

          <span class="report-status" :class="statusFor(category).className">
            {{ statusFor(category).label }}
          </span>
          <strong>{{ category.count }}</strong>
          <strong class="negative">{{ store.money(category.spent) }}</strong>
          <span>{{ category.limit > 0 ? store.money(category.limit) : "Sem limite" }}</span>
          <strong :class="{ negative: category.remaining < 0, positive: category.remaining >= 0 }">
            {{ category.limit > 0 ? store.money(category.remaining) : "Pendente" }}
          </strong>
          <span>{{ category.percentOfSpending.toFixed(1) }}%</span>

          <div class="report-progress">
            <i :style="{ width: usageWidth(category) }"></i>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>
