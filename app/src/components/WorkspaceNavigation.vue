<script setup>
import { X } from "lucide-vue-next";
import { resolveIcon } from "./icons";

defineProps({
  items: {
    type: Array,
    required: true
  },
  active: {
    type: String,
    required: true
  },
  open: {
    type: Boolean,
    default: false
  },
  profileName: {
    type: String,
    required: true
  },
  balance: {
    type: String,
    required: true
  }
});

const emit = defineEmits(["select", "close"]);
</script>

<template>
  <aside class="workspace-sidebar" :class="{ open }">
    <button class="mobile-close-button" type="button" title="Fechar menu" @click="emit('close')">
      <X :size="20" />
    </button>

    <div class="brand">
      <span>FP</span>
      <div>
        <strong>FinancePro</strong>
        <small>Orcamento mensal</small>
      </div>
    </div>

    <nav class="main-nav" aria-label="Navegacao principal">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        :class="{ exact: item.id === active }"
        @click="emit('select', item.id)"
      >
        <component :is="resolveIcon(item.icon)" :size="19" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-profile">
      <span class="avatar">{{ profileName.slice(0, 1).toUpperCase() }}</span>
      <div>
        <strong>{{ profileName }}</strong>
        <span>{{ balance }}</span>
      </div>
    </div>
  </aside>
</template>
