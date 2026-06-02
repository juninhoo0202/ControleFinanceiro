<script setup>
import { computed } from "vue";
import { Edit3, ListChecks, Plus, Trash2 } from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";
import { categoryToneClass, resolveIcon } from "./icons";
import StatCard from "./StatCard.vue";

const emit = defineEmits(["open-budget", "delete-budget"]);
const store = useFinanceStore();

const plannedCategories = computed(() => {
  return store.monthlyCategorySummary.filter(category => category.limit > 0 || category.spent > 0);
});
const pendingCategories = computed(() => {
  return store.monthlyCategorySummary.filter(category => category.limit <= 0 && category.spent <= 0);
});

function budgetFor(categoryName) {
  return store.monthBudgets.find(budget => budget.categoria === categoryName);
}
</script>

<template>
  <section class="workspace-section">
    <div class="section-heading">
      <div>
        <span class="kicker">Orcamento</span>
        <h1>Limites por categoria</h1>
        <p>{{ store.activeMonthLabel }} organizado por limite, gasto e restante.</p>
      </div>

      <button class="button success" type="button" @click="emit('open-budget')">
        <Plus :size="18" />
        Definir limite
      </button>
    </div>

    <div class="stat-grid four compact">
      <StatCard label="Orcamento total" :value="store.money(store.budgetTotal)" icon="ListChecks" tone="blue" />
      <StatCard label="Gasto orcado" :value="store.money(store.budgetedSpending)" icon="ReceiptText" tone="red" />
      <StatCard label="Restante" :value="store.money(store.budgetRemaining)" icon="PiggyBank" tone="green" />
      <StatCard label="Acima do limite" :value="store.overBudgetCategories.length" icon="AlertTriangle" tone="amber" />
    </div>

    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Plano do mes</span>
          <h2>Categorias acompanhadas</h2>
        </div>
        <ListChecks :size="22" />
      </div>

      <div v-if="plannedCategories.length === 0" class="empty-state">
        Nenhum limite definido para este mes.
      </div>

      <div v-else class="budget-table">
        <div class="budget-table-head">
          <span>Categoria</span>
          <span>Gasto</span>
          <span>Limite</span>
          <span>Restante</span>
          <span></span>
        </div>

        <div
          v-for="category in plannedCategories"
          :key="category.name"
          class="budget-table-row"
          :class="{ danger: category.overBudget, pending: category.unplanned }"
        >
          <div class="category-cell">
            <span class="category-mini-icon" :class="categoryToneClass(category.tone)">
              <component :is="resolveIcon(category.icon)" :size="18" />
            </span>
            <div>
              <strong>{{ category.name }}</strong>
              <small v-if="category.overBudget">Acima do limite</small>
              <small v-else-if="category.unplanned">Sem limite definido</small>
              <small v-else>{{ category.count }} lancamento(s)</small>
            </div>
          </div>

          <span>{{ store.money(category.spent) }}</span>
          <span>{{ category.limit > 0 ? store.money(category.limit) : "Pendente" }}</span>
          <strong :class="{ negative: category.remaining < 0, positive: category.remaining >= 0 }">
            {{ category.limit > 0 ? store.money(category.remaining) : "Definir" }}
          </strong>

          <div class="row-actions">
            <button class="icon-button small" type="button" title="Editar limite" @click="emit('open-budget', category)">
              <Edit3 :size="16" />
            </button>
            <button
              v-if="budgetFor(category.name)"
              class="icon-button small danger"
              type="button"
              title="Remover limite"
              @click="emit('delete-budget', budgetFor(category.name))"
            >
              <Trash2 :size="16" />
            </button>
          </div>

          <div class="progress-track">
            <i :style="{ width: `${Math.min(Math.max(category.percentOfBudget || category.percentOfSpending, 4), 100)}%` }"></i>
          </div>
        </div>
      </div>
    </article>

    <article class="panel pending-panel">
      <div class="panel-heading">
        <div>
          <span>Pendentes</span>
          <h2>Categorias sem limite</h2>
        </div>
      </div>

      <div class="category-chip-grid">
        <button
          v-for="category in pendingCategories"
          :key="category.name"
          type="button"
          @click="emit('open-budget', category)"
        >
          <span class="category-chip-icon" :class="categoryToneClass(category.tone)">
            <component :is="resolveIcon(category.icon)" :size="17" />
          </span>
          {{ category.name }}
        </button>
      </div>
    </article>
  </section>
</template>
