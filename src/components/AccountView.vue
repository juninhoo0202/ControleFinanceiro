<script setup>
import { computed, ref } from "vue";
import {
  CalendarDays,
  Database,
  Download,
  Eye,
  EyeOff,
  FileUp,
  RotateCcw,
  Settings,
  ShieldCheck,
  UserRound,
  Wallet
} from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";

const props = defineProps({
  displayBalance: {
    type: String,
    required: true
  }
});

const emit = defineEmits(["open-profile", "reset-data"]);
const store = useFinanceStore();
const fileInput = ref(null);
const feedback = ref(null);

const profileInitial = computed(() => store.profileName.slice(0, 1).toUpperCase());
const totalRecords = computed(() => {
  return store.state.transactions.length + store.state.budgets.length + store.state.categories.length;
});
const privacyStatus = computed(() => {
  return store.state.profile.privacy
    ? { label: "Saldo oculto", icon: EyeOff, className: "locked" }
    : { label: "Saldo visivel", icon: Eye, className: "open" };
});
const accountMetrics = computed(() => [
  {
    label: "Saldo atual",
    value: props.displayBalance,
    className: "",
    copy: "Saldo inicial com entradas e saidas totais."
  },
  {
    label: "Entradas do mes",
    value: store.money(store.monthEntriesTotal),
    className: "positive",
    copy: "Receitas registradas no mes ativo."
  },
  {
    label: "Saidas do mes",
    value: store.money(store.monthExpensesTotal),
    className: "negative",
    copy: "Despesas registradas no mes ativo."
  },
  {
    label: "Resultado do mes",
    value: store.money(store.monthResult),
    className: store.monthResult < 0 ? "negative" : "positive",
    copy: "Diferenca entre entradas e saidas."
  }
]);
const dataVaultRows = computed(() => [
  {
    icon: Database,
    label: "Registros locais",
    value: totalRecords.value
  },
  {
    icon: Wallet,
    label: "Transacoes",
    value: store.state.transactions.length
  },
  {
    icon: CalendarDays,
    label: "Orcamentos",
    value: store.state.budgets.length
  }
]);

function exportBackup() {
  const backup = store.exportData();
  const content = JSON.stringify(backup, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `financepro-backup-${store.toInputDate(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  feedback.value = { type: "success", message: "Backup exportado." };
}

function openImport() {
  fileInput.value?.click();
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const parsed = JSON.parse(await file.text());
    const response = store.importData(parsed);
    feedback.value = { type: response.ok ? "success" : "error", message: response.message };
  } catch {
    feedback.value = { type: "error", message: "Arquivo invalido para importacao." };
  } finally {
    event.target.value = "";
  }
}
</script>

<template>
  <section class="workspace-section">
    <div class="section-heading">
      <div>
        <span class="kicker">Conta</span>
        <h1>Central do perfil</h1>
        <p>Perfil, privacidade, saldo e manutencao dos dados locais em areas separadas.</p>
      </div>

      <button class="button success" type="button" @click="emit('open-profile')">
        <Settings :size="18" />
        Editar perfil
      </button>
    </div>

    <div class="account-overview-grid">
      <article class="profile-hero-panel account-profile-card">
        <div class="profile-identity">
          <span class="profile-avatar">{{ profileInitial }}</span>
          <div>
            <span>Perfil local</span>
            <h2>{{ store.profileName }}</h2>
            <p>Dados salvos neste navegador, com saldo e historico separados por mes.</p>
          </div>
        </div>

        <div class="profile-balance">
          <span>Saldo atual</span>
          <strong>{{ displayBalance }}</strong>
        </div>

        <div class="account-meta-row">
          <span class="account-pill" :class="privacyStatus.className">
            <component :is="privacyStatus.icon" :size="16" />
            {{ privacyStatus.label }}
          </span>
          <span class="account-pill">
            <CalendarDays :size="16" />
            {{ store.activeMonthLabel }}
          </span>
        </div>
      </article>

      <article class="panel account-actions-panel">
        <div class="panel-heading">
          <div>
            <span>Acoes</span>
            <h2>Atalhos da conta</h2>
          </div>
          <Settings :size="22" />
        </div>

        <div class="account-action-list">
          <button class="button" type="button" @click="emit('open-profile')">
            <UserRound :size="18" />
            Perfil e saldo
          </button>
          <button class="button neutral" type="button" @click="store.togglePrivacy()">
            <component :is="store.state.profile.privacy ? EyeOff : Eye" :size="18" />
            Alternar privacidade
          </button>
          <button class="button neutral" type="button" @click="exportBackup">
            <Download :size="18" />
            Exportar backup
          </button>
          <button class="button neutral" type="button" @click="openImport">
            <FileUp :size="18" />
            Importar backup
          </button>
        </div>

        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept="application/json,.json"
          @change="importBackup"
        />

        <p v-if="feedback" class="feedback compact" :class="feedback.type">
          {{ feedback.message }}
        </p>
      </article>
    </div>

    <div class="account-content-grid">
      <article class="panel account-section-panel">
        <div class="panel-heading">
          <div>
            <span>Mes ativo</span>
            <h2>Resumo financeiro</h2>
          </div>
          <Wallet :size="22" />
        </div>

        <div class="account-metric-grid">
          <div v-for="metric in accountMetrics" :key="metric.label" class="account-metric-card">
            <span>{{ metric.label }}</span>
            <strong :class="metric.className">{{ metric.value }}</strong>
            <small>{{ metric.copy }}</small>
          </div>
        </div>
      </article>

      <article class="panel account-section-panel">
        <div class="panel-heading">
          <div>
            <span>Preferencias</span>
            <h2>Organizacao da conta</h2>
          </div>
          <ShieldCheck :size="22" />
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
              {{ store.state.profile.privacy ? "Ocultando saldo" : "Saldo visivel" }}
            </strong>
          </div>
          <div>
            <span>Saldo inicial</span>
            <strong>{{ store.money(store.state.profile.initialBalance) }}</strong>
          </div>
          <div>
            <span>Saude financeira</span>
            <strong>{{ store.health.status }}</strong>
          </div>
        </div>
      </article>

      <article class="panel account-section-panel">
        <div class="panel-heading">
          <div>
            <span>Backup</span>
            <h2>Dados do FinancePro</h2>
          </div>
          <Database :size="22" />
        </div>

        <div class="data-vault">
          <div v-for="row in dataVaultRows" :key="row.label">
            <component :is="row.icon" :size="19" />
            <span>{{ row.label }}</span>
            <strong>{{ row.value }}</strong>
          </div>
        </div>
      </article>
    </div>

    <article class="panel account-danger-panel">
      <div>
        <span>Zona de manutencao</span>
        <strong>Resetar dados locais</strong>
        <p>Remove perfil, categorias personalizadas, limites e lancamentos deste navegador.</p>
      </div>
      <button class="button danger" type="button" @click="emit('reset-data')">
        <RotateCcw :size="18" />
        Resetar dados
      </button>
    </article>
  </section>
</template>
