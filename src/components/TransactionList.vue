<script setup>
import { computed } from "vue";
import { Calendar, Edit3, Eye, Trash2 } from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";
import { categoryToneClass, resolveIcon } from "./icons";

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 0
  },
  emptyText: {
    type: String,
    default: "Nenhuma transacao encontrada."
  }
});

const emit = defineEmits(["delete", "edit", "view"]);
const store = useFinanceStore();

const visibleTransactions = computed(() => {
  return props.limit > 0 ? props.transactions.slice(0, props.limit) : props.transactions;
});

function iconFor(categoryName) {
  return resolveIcon(store.categoryByName(categoryName)?.icon);
}

function toneFor(categoryName) {
  return categoryToneClass(store.categoryByName(categoryName)?.tone);
}
</script>

<template>
  <div class="transaction-list">
    <div v-if="visibleTransactions.length === 0" class="empty-state">
      {{ emptyText }}
    </div>

    <article
      v-for="transaction in visibleTransactions"
      v-else
      :key="transaction.id"
      class="transaction-row"
      :class="transaction.tipo"
    >
      <div class="transaction-icon" :class="toneFor(transaction.categoria)">
        <component :is="iconFor(transaction.categoria)" :size="21" />
      </div>

      <div class="transaction-info">
        <div class="transaction-meta">
          <span class="pill" :class="transaction.tipo">
            {{ transaction.tipo === "entrada" ? "Entrada" : "Gasto" }}
          </span>
          <span>{{ transaction.categoria }}</span>
        </div>
        <strong>{{ transaction.descricao }}</strong>
        <small>
          <Calendar :size="14" />
          {{ store.dateTime(transaction.data) }}
        </small>
      </div>

      <div class="transaction-side">
        <strong :class="transaction.tipo">
          {{ transaction.tipo === "entrada" ? "+" : "-" }} {{ store.money(transaction.valor) }}
        </strong>
        <button
          v-if="!readonly"
          class="icon-button small"
          type="button"
          title="Visualizar transacao"
          @click="emit('view', transaction)"
        >
          <Eye :size="17" />
        </button>
        <button
          v-if="!readonly"
          class="icon-button small"
          type="button"
          title="Editar transacao"
          @click="emit('edit', transaction)"
        >
          <Edit3 :size="17" />
        </button>
        <button
          v-if="!readonly"
          class="icon-button small danger"
          type="button"
          title="Excluir transacao"
          @click="emit('delete', transaction)"
        >
          <Trash2 :size="18" />
        </button>
      </div>
    </article>
  </div>
</template>
