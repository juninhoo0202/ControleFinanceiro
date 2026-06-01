<script setup>
import { Calendar, Edit3, Tag, Trash2 } from "lucide-vue-next";
import { computed } from "vue";
import { useFinanceStore } from "../stores/financeStore";
import BaseModal from "./BaseModal.vue";
import { categoryToneClass, resolveIcon } from "./icons";

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  transaction: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["close", "edit", "delete"]);
const store = useFinanceStore();

const CategoryIcon = computed(() => {
  return resolveIcon(store.categoryByName(props.transaction?.categoria)?.icon);
});

const categoryTone = computed(() => {
  return categoryToneClass(store.categoryByName(props.transaction?.categoria)?.tone);
});
</script>

<template>
  <BaseModal
    :open="open"
    title="Detalhes da transacao"
    kicker="Visualizacao"
    size="wide"
    @close="emit('close')"
  >
    <div v-if="transaction" class="transaction-detail">
      <div class="detail-hero" :class="transaction.tipo">
        <span class="detail-icon" :class="categoryTone">
          <component :is="CategoryIcon" :size="26" />
        </span>

        <div>
          <span class="pill" :class="transaction.tipo">
            {{ transaction.tipo === "entrada" ? "Entrada" : "Saida" }}
          </span>
          <h3>{{ transaction.descricao }}</h3>
          <strong :class="transaction.tipo">
            {{ transaction.tipo === "entrada" ? "+" : "-" }} {{ store.money(transaction.valor) }}
          </strong>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <Tag :size="18" />
          <span>Categoria</span>
          <strong>{{ transaction.categoria }}</strong>
        </div>
        <div>
          <Calendar :size="18" />
          <span>Data</span>
          <strong>{{ store.dateTime(transaction.data) }}</strong>
        </div>
      </div>

      <div class="modal-action-row">
        <button class="button neutral" type="button" @click="emit('close')">
          Fechar
        </button>
        <button class="button" type="button" @click="emit('edit', transaction)">
          <Edit3 :size="18" />
          Editar
        </button>
        <button class="button danger" type="button" @click="emit('delete', transaction)">
          <Trash2 :size="18" />
          Excluir
        </button>
      </div>
    </div>
  </BaseModal>
</template>
