<script setup>
import { reactive, ref, watch } from "vue";
import { Save } from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";
import BaseModal from "./BaseModal.vue";
import CategoryPicker from "./CategoryPicker.vue";

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  category: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["close", "saved"]);
const store = useFinanceStore();
const feedback = ref(null);

const form = reactive({
  mes: store.activeMonth,
  categoria: "",
  limite: ""
});

function hydrateForm() {
  const categoryName = props.category?.name || "";
  const budget = categoryName
    ? store.monthBudgets.find(item => item.categoria === categoryName)
    : null;

  form.mes = store.activeMonth;
  form.categoria = categoryName;
  form.limite = budget?.limite || props.category?.limit || "";
  feedback.value = null;
}

watch(
  () => [props.open, props.category?.name, store.activeMonth],
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

function saveBudget() {
  const response = store.saveBudget(form);
  feedback.value = { type: response.ok ? "success" : "error", message: response.message };

  if (!response.ok) return;

  store.setActiveMonth(form.mes);
  emit("saved", response.budget);
  emit("close");
}
</script>

<template>
  <BaseModal :open="open" title="Definir orcamento" kicker="Limite mensal" size="wide" @close="emit('close')">
    <form class="transaction-form modal-form" @submit.prevent="saveBudget">
      <label class="field">
        <span>Mes</span>
        <input v-model="form.mes" type="month" />
      </label>

      <div class="field wide">
        <span>Categoria</span>
        <CategoryPicker
          v-model="form.categoria"
          :categories="store.state.categories"
          @add="addCategory"
        />
      </div>

      <label class="field">
        <span>Limite mensal</span>
        <input v-model="form.limite" type="number" step="0.01" min="0" placeholder="0,00" />
      </label>

      <div class="form-actions">
        <button class="button success" type="submit">
          <Save :size="18" />
          Salvar limite
        </button>
      </div>
    </form>

    <p v-if="feedback" class="feedback" :class="feedback.type">
      {{ feedback.message }}
    </p>
  </BaseModal>
</template>
