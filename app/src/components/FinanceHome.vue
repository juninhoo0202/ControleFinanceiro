<script setup>
import {
  AlertTriangle,
  BarChart3,
  ListChecks,
  Plus,
  ReceiptText,
  Wallet
} from "lucide-vue-next";
import { computed } from "vue";
import { useFinanceStore } from "../stores/financeStore";
import { categoryToneClass, resolveIcon } from "./icons";
import StatCard from "./StatCard.vue";
import TransactionList from "./TransactionList.vue";

defineProps({
  displayBalance: {
    type: String,
    required: true
  }
});

const emit = defineEmits([
  "open-transaction",
  "open-budget",
  "open-account",
  "select-view",
  "edit-transaction",
  "delete-transaction",
  "view-transaction"
]);
const store = useFinanceStore();

const budgetProgress = computed(() => `${Math.min(Math.max(store.budgetUsage, 0), 100)}%`);
const alerts = computed(() => {
  const items = [];

  if (store.currentBalance < 0) {
    items.push({
      tone: "danger",
      title: "Saldo em deficit",
      copy: `O saldo consolidado esta em ${store.money(store.currentBalance)}.`
    });
  }

  if (store.overBudgetCategories.length > 0) {
    items.push({
      tone: "warning",
      title: "Categorias acima do limite",
      copy: `${store.overBudgetCategories.length} categoria(s) passaram do orcamento do mes.`
    });
  }

  if (store.unplannedCategories.length > 0) {
    items.push({
      tone: "muted",
      title: "Gastos sem orcamento",
      copy: `${store.unplannedCategories.length} categoria(s) tem gastos sem limite definido.`
    });
  }

  if (items.length === 0) {
    items.push({
      tone: "good",
      title: store.health.status,
      copy: store.health.copy
    });
  }

  return items.slice(0, 3);
});
</script>

<template>
  <section class="workspace-section">
    <div class="section-heading">
      <div>
        <span class="kicker">Este mes</span>
        <h1>Resumo financeiro</h1>
        <p>{{ store.activeMonthLabel }} com foco em saldo, limites e proximas decisoes.</p>
      </div>

      <div class="section-actions">
        <button class="button success" type="button" @click="emit('open-transaction')">
          <Plus :size="18" />
          Lancar
        </button>
        <button class="button" type="button" @click="emit('open-account')">
          <Wallet :size="18" />
          Ajustar saldo
        </button>
        <button class="button neutral" type="button" @click="emit('open-budget')">
          <ListChecks :size="18" />
          Orcamento
        </button>
      </div>
    </div>

    <div class="stat-grid four compact">
      <StatCard label="Saldo disponivel" :value="displayBalance" icon="Wallet" tone="blue" />
      <StatCard label="Entradas do mes" :value="store.money(store.monthEntriesTotal)" icon="TrendingUp" tone="green" />
      <StatCard label="Saidas do mes" :value="store.money(store.monthExpensesTotal)" icon="TrendingDown" tone="red" />
      <StatCard label="Restante do orcamento" :value="store.money(store.budgetRemaining)" icon="PiggyBank" tone="amber" />
    </div>

    <div class="home-grid">
      <article class="panel balance-panel">
        <div class="panel-heading">
          <div>
            <span>Plano mensal</span>
            <h2>Uso do orcamento</h2>
          </div>
          <Wallet :size="22" />
        </div>

        <div class="balance-number">
          <span>{{ store.money(store.budgetedSpending) }} usado</span>
          <strong>{{ store.money(store.budgetTotal) }}</strong>
        </div>

        <div class="progress-track large">
          <i :style="{ width: budgetProgress }"></i>
        </div>

        <div class="split-metrics">
          <div>
            <span>Uso</span>
            <strong>{{ Math.round(store.budgetUsage) }}%</strong>
          </div>
          <div>
            <span>Resultado do mes</span>
            <strong :class="{ negative: store.monthResult < 0, positive: store.monthResult >= 0 }">
              {{ store.money(store.monthResult) }}
            </strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span>Alertas</span>
            <h2>Prioridades</h2>
          </div>
          <AlertTriangle :size="22" />
        </div>

        <div class="alert-list">
          <div v-for="alert in alerts" :key="alert.title" class="alert-item" :class="alert.tone">
            <strong>{{ alert.title }}</strong>
            <span>{{ alert.copy }}</span>
          </div>
        </div>
      </article>
    </div>

    <div class="home-grid secondary">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <span>Orcamento</span>
            <h2>Categorias em destaque</h2>
          </div>
          <BarChart3 :size="22" />
        </div>

        <div v-if="store.monthlyCategorySummary.filter(category => category.spent > 0 || category.limit > 0).length === 0" class="empty-state compact">
          Defina limites por categoria para acompanhar o mes.
        </div>

        <div v-else class="budget-list">
          <div
            v-for="category in store.monthlyCategorySummary.filter(item => item.spent > 0 || item.limit > 0).slice(0, 5)"
            :key="category.name"
            class="budget-row operational"
            :class="{ danger: category.overBudget, pending: category.unplanned }"
          >
            <div class="category-cell">
              <span class="category-mini-icon" :class="categoryToneClass(category.tone)">
                <component :is="resolveIcon(category.icon)" :size="18" />
              </span>
              <strong>{{ category.name }}</strong>
            </div>
            <span>{{ store.money(category.spent) }} / {{ category.limit > 0 ? store.money(category.limit) : "sem limite" }}</span>
            <i :style="{ width: `${Math.min(Math.max(category.percentOfBudget || category.percentOfSpending, 4), 100)}%` }"></i>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span>Movimento</span>
            <h2>Ultimas transacoes</h2>
          </div>
          <ReceiptText :size="22" />
        </div>

        <TransactionList
          :transactions="store.monthTransactions"
          :limit="4"
          empty-text="Nenhuma transacao neste mes."
          @view="emit('view-transaction', $event)"
          @edit="emit('edit-transaction', $event)"
          @delete="emit('delete-transaction', $event)"
        />
      </article>
    </div>

    <div class="quick-actions">
      <button type="button" @click="emit('select-view', 'orcamento')">
        <ListChecks :size="19" />
        Revisar orcamento
      </button>
      <button type="button" @click="emit('select-view', 'transacoes')">
        <ReceiptText :size="19" />
        Ver transacoes
      </button>
      <button type="button" @click="emit('open-account')">
        <Wallet :size="19" />
        Ajustar saldo
      </button>
    </div>
  </section>
</template>
