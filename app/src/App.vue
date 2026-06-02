<script setup>
import LoginView from "./components/LoginView.vue";
import DashboardView from "./views/DashboardView.vue";
import { useFinanceStore } from "./stores/financeStore";

const store = useFinanceStore();
</script>

<template>
  <div class="app-layout finance-shell">
    <DashboardView v-if="store.isAuthenticated" />
    <LoginView v-else />
  </div>
</template>
