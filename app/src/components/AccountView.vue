<script setup>
import { Eye, EyeOff, RotateCcw, Settings, UserRound, Wallet } from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";
import StatCard from "./StatCard.vue";

defineProps({
  displayBalance: {
    type: String,
    required: true
  }
});

const emit = defineEmits(["open-profile", "reset-data"]);
const store = useFinanceStore();
</script>

<template>
  <section class="workspace-section">
    <div class="section-heading">
      <div>
        <span class="kicker">Conta</span>
        <h1>Perfil e dados locais</h1>
        <p>Controle saldo inicial, entradas, saidas, privacidade e dados salvos neste navegador.</p>
      </div>

      <button class="button success" type="button" @click="emit('open-profile')">
        <Settings :size="18" />
        Ajustar perfil e saldo
      </button>
    </div>

    <div class="stat-grid four compact">
      <StatCard label="Saldo atual" :value="displayBalance" icon="Wallet" tone="blue" />
      <StatCard label="Saldo inicial" :value="store.money(store.state.profile.initialBalance)" icon="PiggyBank" tone="amber" />
      <StatCard label="Entradas totais" :value="store.money(store.entriesTotal)" icon="TrendingUp" tone="green" />
      <StatCard label="Saidas totais" :value="store.money(store.expensesTotal)" icon="TrendingDown" tone="red" />
    </div>

    <div class="system-grid">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <span>Usuario</span>
            <h2>Informacoes principais</h2>
          </div>
          <UserRound :size="22" />
        </div>

        <div class="summary-stack">
          <div>
            <span>Nome</span>
            <strong>{{ store.profileName }}</strong>
          </div>
          <div>
            <span>Privacidade</span>
            <strong>
              <component :is="store.state.profile.privacy ? EyeOff : Eye" :size="16" />
              {{ store.state.profile.privacy ? "Ativa" : "Inativa" }}
            </strong>
          </div>
          <div>
            <span>Mes ativo</span>
            <strong>{{ store.activeMonthLabel }}</strong>
          </div>
          <div>
            <span>Persistencia</span>
            <strong>LocalStorage</strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span>Fluxo</span>
            <h2>Entradas e saidas</h2>
          </div>
          <Wallet :size="22" />
        </div>

        <div class="summary-stack">
          <div>
            <span>Entradas do mes</span>
            <strong class="positive">{{ store.money(store.monthEntriesTotal) }}</strong>
          </div>
          <div>
            <span>Saidas do mes</span>
            <strong class="negative">{{ store.money(store.monthExpensesTotal) }}</strong>
          </div>
          <div>
            <span>Resultado do mes</span>
            <strong :class="{ negative: store.monthResult < 0, positive: store.monthResult >= 0 }">
              {{ store.money(store.monthResult) }}
            </strong>
          </div>
          <div>
            <span>Saldo para acompanhar</span>
            <strong>{{ displayBalance }}</strong>
          </div>
        </div>

        <button class="button neutral full-button" type="button" @click="emit('open-profile')">
          <Settings :size="18" />
          Alterar saldo inicial
        </button>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span>Manutencao</span>
            <h2>Dados do FinancePro</h2>
          </div>
          <Wallet :size="22" />
        </div>

        <div class="summary-stack">
          <div>
            <span>Orcamentos salvos</span>
            <strong>{{ store.state.budgets.length }}</strong>
          </div>
          <div>
            <span>Entradas totais</span>
            <strong>{{ store.money(store.entriesTotal) }}</strong>
          </div>
          <div>
            <span>Gastos totais</span>
            <strong>{{ store.money(store.expensesTotal) }}</strong>
          </div>
          <div>
            <span>Resultado total</span>
            <strong :class="{ negative: store.result < 0, positive: store.result >= 0 }">
              {{ store.money(store.result) }}
            </strong>
          </div>
        </div>

        <button class="button danger full-button" type="button" @click="emit('reset-data')">
          <RotateCcw :size="18" />
          Resetar dados
        </button>
      </article>
    </div>
  </section>
</template>
