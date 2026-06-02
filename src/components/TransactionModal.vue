<script setup>
import { computed, reactive, ref, watch } from "vue";
import {
  CalendarDays,
  CircleArrowDown,
  CircleArrowUp,
  CircleDollarSign,
  ReceiptText,
  Save
} from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";
import BaseModal from "./BaseModal.vue";
import CategoryPicker from "./CategoryPicker.vue";

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

const emit = defineEmits(["close", "saved"]);
const store = useFinanceStore();
const feedback = ref(null);

const form = reactive({
  id: "",
  tipo: "gasto",
  categoria: "",
  descricao: "",
  valor: "",
  data: ""
});

const title = computed(() => (props.transaction ? "Editar transacao" : "Nova transacao"));

function defaultDateForActiveMonth() {
  const today = store.toInputDate(new Date());
  return today.startsWith(store.activeMonth) ? today : `${store.activeMonth}-01`;
}

function hydrateForm() {
  const transaction = props.transaction;
  form.id = transaction?.id || "";
  form.tipo = transaction?.tipo || "gasto";
  form.categoria = transaction?.categoria || "";
  form.descricao = transaction?.descricao || "";
  form.valor = transaction?.valor || "";
  form.data = transaction?.data ? store.toInputDate(transaction.data) : defaultDateForActiveMonth();
  feedback.value = null;
}

watch(
  () => [props.open, props.transaction?.id, store.activeMonth],
  () => {
    if (props.open) hydrateForm();
  },
  { immediate: true }
);

function addCategory(name) {
  const response = store.addCategory(name);
  feedback.value = { type: response.ok ? "success" : "error", message: response.message || "Categoria criada." };

  if (response.ok) {
    form.categoria = response.category.name;
  }
}

function saveTransaction() {
  const response = store.upsertTransaction(form);
  feedback.value = { type: response.ok ? "success" : "error", message: response.message };

  if (!response.ok) return;

  emit("saved", response.transaction);
  emit("close");
}
</script>

<template>
  <BaseModal :open="open" :title="title" kicker="Lancamento" size="wide" @close="emit('close')">
    <form class="transaction-form transaction-modal-form modal-form" @submit.prevent="saveTransaction">
      <section class="form-section wide">
        <div class="field">
          <span>Tipo</span>
          <div class="segmented-control transaction-type-control">
            <button
              type="button"
              :class="{ active: form.tipo === 'entrada' }"
              @click="form.tipo = 'entrada'"
            >
              <CircleArrowUp :size="18" />
              Entrada
            </button>
            <button
              type="button"
              :class="{ active: form.tipo === 'gasto' }"
              @click="form.tipo = 'gasto'"
            >
              <CircleArrowDown :size="18" />
              Gasto
            </button>
          </div>
        </div>
      </section>

      <section class="field form-section wide">
        <span>Categoria</span>
        <CategoryPicker
          v-model="form.categoria"
          :categories="store.state.categories"
          @add="addCategory"
        />
      </section>

      <label class="field">
        <span>Descricao</span>
        <div class="input-with-icon">
          <ReceiptText :size="18" />
          <input v-model="form.descricao" type="text" placeholder="Ex: mercado da semana" />
        </div>
      </label>

      <label class="field">
        <span>Valor</span>
        <div class="input-with-icon">
          <CircleDollarSign :size="18" />
          <input v-model="form.valor" type="number" step="0.01" min="0" placeholder="0,00" />
        </div>
      </label>

      <label class="field">
        <span>Data</span>
        <div class="input-with-icon">
          <CalendarDays :size="18" />
          <input v-model="form.data" type="date" />
        </div>
      </label>

      <div class="form-actions">
        <button class="button success" type="submit">
          <Save :size="18" />
          Salvar transacao
        </button>
      </div>
    </form>

    <p v-if="feedback" class="feedback" :class="feedback.type">
      {{ feedback.message }}
    </p>
  </BaseModal>
</template>
