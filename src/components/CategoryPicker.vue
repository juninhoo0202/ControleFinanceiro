<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Check, ChevronDown, Plus, Search } from "lucide-vue-next";
import { categoryToneClass, resolveIcon } from "./icons";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  categories: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["update:modelValue", "add"]);

const isOpen = ref(false);
const newCategory = ref("");
const categorySearch = ref("");
const pickerElement = ref(null);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const selectedCategory = computed(() => {
  const selected = normalizeText(props.modelValue);
  return props.categories.find(category => normalizeText(category.name) === selected);
});

const sortedCategories = computed(() => {
  return [...props.categories].sort((a, b) => {
    if (a.custom !== b.custom) return a.custom ? 1 : -1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
});

const filteredCategories = computed(() => {
  const term = normalizeText(categorySearch.value.trim());
  if (!term) return sortedCategories.value;

  return sortedCategories.value.filter(category => {
    return normalizeText(category.name).includes(term);
  });
});

const groupedCategories = computed(() => {
  const standard = filteredCategories.value.filter(category => !category.custom);
  const custom = filteredCategories.value.filter(category => category.custom);

  return [
    { id: "standard", title: "Principais", items: standard },
    { id: "custom", title: "Personalizadas", items: custom }
  ].filter(group => group.items.length > 0);
});

const SelectedIcon = computed(() => resolveIcon(selectedCategory.value?.icon));
const selectedToneClass = computed(() => categoryToneClass(selectedCategory.value?.tone));

watch(
  () => props.modelValue,
  value => {
    if (value) isOpen.value = false;
  }
);

function selectCategory(category) {
  emit("update:modelValue", category.name);
  isOpen.value = false;
  categorySearch.value = "";
}

function isSelected(category) {
  return normalizeText(category.name) === normalizeText(props.modelValue);
}

function addCategory() {
  const name = newCategory.value.trim();
  if (!name) return;

  const existing = props.categories.find(category => normalizeText(category.name) === normalizeText(name));
  if (existing) {
    selectCategory(existing);
    newCategory.value = "";
    return;
  }

  emit("add", name);
  newCategory.value = "";
  categorySearch.value = "";
}

function closeOnOutsideClick(event) {
  if (!isOpen.value || pickerElement.value?.contains(event.target)) return;
  isOpen.value = false;
}

onMounted(() => {
  document.addEventListener("click", closeOnOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeOnOutsideClick);
});
</script>

<template>
  <div ref="pickerElement" class="category-picker" :class="{ open: isOpen }">
    <button
      class="category-select"
      type="button"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="category-selected-icon" :class="selectedToneClass">
        <component :is="SelectedIcon" :size="25" />
      </span>

      <span class="category-selected-copy">
        <small>{{ selectedCategory ? "Categoria selecionada" : "Categoria" }}</small>
        <strong>{{ selectedCategory?.name || "Selecionar categoria" }}</strong>
      </span>

      <span class="category-select-action" :class="{ open: isOpen }">
        <ChevronDown :size="22" />
      </span>
    </button>

    <div v-if="isOpen" class="category-popover" @keydown.esc="isOpen = false">
      <div class="category-popover-header">
        <div>
          <strong>Escolha a categoria</strong>
          <span>{{ filteredCategories.length }} de {{ categories.length }} opcoes</span>
        </div>
      </div>

      <label class="category-search">
        <Search :size="20" />
        <input v-model="categorySearch" type="text" placeholder="Buscar categoria" />
      </label>

      <div v-if="filteredCategories.length > 0" class="category-groups">
        <section v-for="group in groupedCategories" :key="group.id" class="category-group">
          <div class="category-group-heading">
            <span>{{ group.title }}</span>
            <small>{{ group.items.length }}</small>
          </div>

          <div class="category-options">
            <button
              v-for="category in group.items"
              :key="category.id"
              class="category-option"
              :class="{ active: isSelected(category) }"
              type="button"
              @click="selectCategory(category)"
            >
              <span class="category-option-icon" :class="categoryToneClass(category.tone)">
                <component :is="resolveIcon(category.icon)" :size="22" />
              </span>

              <span class="category-option-text">
                <strong>{{ category.name }}</strong>
              </span>

              <span v-if="isSelected(category)" class="category-option-check">
                <Check :size="16" />
              </span>
            </button>
          </div>
        </section>
      </div>

      <div v-else class="category-empty">
        Nenhuma categoria encontrada.
      </div>

      <div class="new-category">
        <span>Nova categoria</span>
        <input
          v-model="newCategory"
          type="text"
          placeholder="Criar nova categoria"
          @keydown.enter.prevent="addCategory"
        />
        <button type="button" @click="addCategory">
          <Plus :size="20" />
          Adicionar
        </button>
      </div>
    </div>
  </div>
</template>
