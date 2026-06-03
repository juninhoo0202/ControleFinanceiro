<script setup>
import { ListChecks, LogOut, Moon, Plus, Sun, UserRound, X } from "lucide-vue-next";
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
  },
  monthLabel: {
    type: String,
    required: true
  },
  monthResult: {
    type: String,
    required: true
  },
  resultNegative: {
    type: Boolean,
    default: false
  },
  darkMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  "select",
  "close",
  "open-transaction",
  "open-budget",
  "open-profile",
  "toggle-theme",
  "lock"
]);

function runMobileAction(eventName) {
  emit(eventName);
  emit("close");
}
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
        <small>Controle mensal</small>
      </div>
    </div>

    <section class="sidebar-summary" aria-label="Resumo do mes">
      <span>{{ monthLabel }}</span>
      <strong>{{ balance }}</strong>
      <small :class="{ negative: resultNegative, positive: !resultNegative }">
        Resultado: {{ monthResult }}
      </small>
    </section>

    <div class="sidebar-quick-actions">
      <button type="button" @click="runMobileAction('open-transaction')">
        <Plus :size="18" />
        <span>Lancar</span>
      </button>
      <button type="button" @click="runMobileAction('open-budget')">
        <ListChecks :size="18" />
        <span>Orcamento</span>
      </button>
      <button type="button" @click="runMobileAction('open-profile')">
        <UserRound :size="18" />
        <span>Perfil</span>
      </button>
    </div>

    <nav class="main-nav" aria-label="Navegacao principal">
      <span class="nav-label">Menu</span>
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

    <div class="sidebar-control-list">
      <button type="button" @click="runMobileAction('toggle-theme')">
        <component :is="darkMode ? Sun : Moon" :size="18" />
        <span>{{ darkMode ? "Modo claro" : "Modo escuro" }}</span>
      </button>
      <button type="button" @click="runMobileAction('lock')">
        <LogOut :size="18" />
        <span>Sair</span>
      </button>
    </div>

    <div class="sidebar-profile">
      <span class="avatar">{{ profileName.slice(0, 1).toUpperCase() }}</span>
      <div>
        <strong>{{ profileName }}</strong>
        <span>{{ balance }}</span>
      </div>
    </div>
  </aside>
</template>
