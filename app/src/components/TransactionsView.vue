<script setup>
import { computed, ref } from "vue";
import { CalendarDays, ListFilter, Plus, Search, Tag } from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";
import TransactionList from "./TransactionList.vue";

const emit = defineEmits(["open-transaction", "edit-transaction", "delete-transaction", "view-transaction"]);
const store = useFinanceStore();

const search = ref("");
const typeFilter = ref("todos");
const categoryFilter = ref("todas");

const filteredTransactions = computed(() => {
  const term = search.value.trim().toLowerCase();

  return store.monthTransactions.filter(transaction => {
    const matchesSearch = !term || `${transaction.categoria} ${transaction.descricao}`
      .toLowerCase()
      .includes(term);
    const matchesType = typeFilter.value === "todos" || transaction.tipo === typeFilter.value;
    const matchesCategory = categoryFilter.value === "todas" || transaction.categoria === categoryFilter.value;

    return matchesSearch && matchesType && matchesCategory;
  });
});
</script>

<template>
  <section class="workspace-section">
    <div class="section-heading">
      <div>
        <span class="kicker">Transacoes</span>
        <h1>Historico do mes</h1>
        <p>Busque, filtre, visualize, edite e exclua lancamentos de {{ store.activeMonthLabel }}.</p>
      </div>

      <button class="button success" type="button" @click="emit('open-transaction')">
        <Plus :size="18" />
        Nova transacao
      </button>
    </div>

    <article class="panel">
      <div class="filter-grid">
        <label class="field">
          <span>Mes</span>
          <div class="input-with-icon">
            <CalendarDays :size="18" />
            <input
              :value="store.activeMonth"
              type="month"
              @input="store.setActiveMonth($event.target.value)"
            />
          </div>
        </label>

        <label class="field wide-filter">
          <span>Busca</span>
          <div class="input-with-icon">
            <Search :size="18" />
            <input v-model="search" type="text" placeholder="Categoria ou descricao" />
          </div>
        </label>

        <label class="field">
          <span>Tipo</span>
          <div class="select-with-icon">
            <ListFilter :size="18" />
            <select v-model="typeFilter">
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="gasto">Gastos</option>
            </select>
          </div>
        </label>

        <label class="field">
          <span>Categoria</span>
          <div class="select-with-icon">
            <Tag :size="18" />
            <select v-model="categoryFilter">
              <option value="todas">Todas</option>
              <option
                v-for="category in store.state.categories"
                :key="category.id"
                :value="category.name"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </label>
      </div>
    </article>

    <article class="panel">
      <TransactionList
        :transactions="filteredTransactions"
        empty-text="Nenhuma transacao encontrada para os filtros."
        @view="emit('view-transaction', $event)"
        @edit="emit('edit-transaction', $event)"
        @delete="emit('delete-transaction', $event)"
      />
    </article>
  </section>
</template>
