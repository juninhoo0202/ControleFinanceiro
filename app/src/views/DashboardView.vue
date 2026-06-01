<script setup>
import { computed, ref } from "vue";
import { ListChecks, Menu, Plus, UserRound } from "lucide-vue-next";
import AccountView from "../components/AccountView.vue";
import BudgetModal from "../components/BudgetModal.vue";
import BudgetView from "../components/BudgetView.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import FinanceHome from "../components/FinanceHome.vue";
import ProfileModal from "../components/ProfileModal.vue";
import ReportsView from "../components/ReportsView.vue";
import TransactionDetailModal from "../components/TransactionDetailModal.vue";
import TransactionModal from "../components/TransactionModal.vue";
import TransactionsView from "../components/TransactionsView.vue";
import WorkspaceNavigation from "../components/WorkspaceNavigation.vue";
import { useFinanceStore } from "../stores/financeStore";

const store = useFinanceStore();
const activeView = ref("inicio");
const mobileNavOpen = ref(false);
const transactionModalOpen = ref(false);
const profileModalOpen = ref(false);
const budgetModalOpen = ref(false);
const editingTransaction = ref(null);
const editingBudgetCategory = ref(null);
const viewingTransaction = ref(null);
const confirmState = ref({
  open: false,
  title: "",
  kicker: "Confirmacao",
  message: "",
  confirmLabel: "Confirmar",
  tone: "danger",
  onConfirm: null
});

const navigationItems = [
  { id: "inicio", label: "Inicio", icon: "LayoutDashboard" },
  { id: "orcamento", label: "Orcamento", icon: "ListChecks" },
  { id: "transacoes", label: "Transacoes", icon: "ReceiptText" },
  { id: "relatorios", label: "Relatorios", icon: "BarChart3" },
  { id: "conta", label: "Conta", icon: "UserRound" }
];

const activeViewName = computed(() => {
  return navigationItems.find(item => item.id === activeView.value)?.label || "Inicio";
});

const displayBalance = computed(() => {
  return store.state.profile.privacy ? "R$ *****" : store.money(store.currentBalance);
});

const detailModalOpen = computed(() => Boolean(viewingTransaction.value));

function selectView(viewId) {
  activeView.value = viewId;
  mobileNavOpen.value = false;
}

function openTransaction(transaction = null) {
  editingTransaction.value = transaction;
  transactionModalOpen.value = true;
}

function closeTransactionModal() {
  transactionModalOpen.value = false;
  editingTransaction.value = null;
}

function openTransactionDetails(transaction) {
  viewingTransaction.value = transaction;
}

function closeTransactionDetails() {
  viewingTransaction.value = null;
}

function editFromDetails(transaction) {
  closeTransactionDetails();
  openTransaction(transaction);
}

function openBudget(category = null) {
  editingBudgetCategory.value = category;
  budgetModalOpen.value = true;
}

function closeBudgetModal() {
  budgetModalOpen.value = false;
  editingBudgetCategory.value = null;
}

function openConfirm(options) {
  confirmState.value = {
    open: true,
    title: options.title,
    kicker: options.kicker || "Confirmacao",
    message: options.message,
    confirmLabel: options.confirmLabel || "Confirmar",
    tone: options.tone || "danger",
    onConfirm: options.onConfirm
  };
}

function closeConfirm() {
  confirmState.value.open = false;
}

function confirmAction() {
  const action = confirmState.value.onConfirm;
  closeConfirm();
  action?.();
}

function requestTransactionDelete(transaction) {
  if (!transaction) return;

  openConfirm({
    title: "Excluir transacao",
    message: `Deseja excluir "${transaction.descricao}" no valor de ${store.money(transaction.valor)}?`,
    confirmLabel: "Excluir",
    onConfirm: () => {
      store.deleteTransaction(transaction.id);
      if (viewingTransaction.value?.id === transaction.id) {
        closeTransactionDetails();
      }
    }
  });
}

function requestBudgetDelete(budget) {
  if (!budget) return;

  openConfirm({
    title: "Remover limite",
    message: `Deseja remover o limite de ${store.money(budget.limite)} para ${budget.categoria}?`,
    confirmLabel: "Remover",
    onConfirm: () => store.deleteBudget(budget.id)
  });
}

function resetData() {
  openConfirm({
    title: "Resetar dados",
    message: "Deseja apagar perfil, categorias personalizadas, orcamentos e transacoes deste navegador?",
    confirmLabel: "Resetar",
    onConfirm: () => {
      store.resetData();
      profileModalOpen.value = false;
      transactionModalOpen.value = false;
      budgetModalOpen.value = false;
      viewingTransaction.value = null;
      activeView.value = "inicio";
    }
  });
}
</script>

<template>
  <div class="finance-workspace">
    <button class="mobile-menu-button" type="button" title="Abrir menu" @click="mobileNavOpen = true">
      <Menu :size="21" />
    </button>

    <div v-if="mobileNavOpen" class="mobile-scrim" @click="mobileNavOpen = false"></div>

    <WorkspaceNavigation
      :items="navigationItems"
      :active="activeView"
      :open="mobileNavOpen"
      :profile-name="store.profileName"
      :balance="displayBalance"
      @select="selectView"
      @close="mobileNavOpen = false"
    />

    <main class="workspace-main">
      <header class="workspace-topbar">
        <div>
          <span>{{ activeViewName }}</span>
          <strong>{{ store.activeMonthLabel }}</strong>
        </div>

        <div class="topbar-actions">
          <label class="month-control">
            <input
              :value="store.activeMonth"
              type="month"
              @input="store.setActiveMonth($event.target.value)"
            />
          </label>

          <button class="icon-link" type="button" title="Nova transacao" @click="openTransaction()">
            <Plus :size="20" />
          </button>
          <button class="icon-link" type="button" title="Definir orcamento" @click="openBudget()">
            <ListChecks :size="20" />
          </button>
          <button class="icon-link" type="button" title="Perfil" @click="profileModalOpen = true">
            <UserRound :size="20" />
          </button>
        </div>
      </header>

      <FinanceHome
        v-if="activeView === 'inicio'"
        :display-balance="displayBalance"
        @open-transaction="openTransaction"
        @open-budget="openBudget"
        @open-account="profileModalOpen = true"
        @select-view="selectView"
        @view-transaction="openTransactionDetails"
        @edit-transaction="openTransaction"
        @delete-transaction="requestTransactionDelete"
      />

      <BudgetView
        v-else-if="activeView === 'orcamento'"
        @open-budget="openBudget"
        @delete-budget="requestBudgetDelete"
      />

      <TransactionsView
        v-else-if="activeView === 'transacoes'"
        @open-transaction="openTransaction"
        @view-transaction="openTransactionDetails"
        @edit-transaction="openTransaction"
        @delete-transaction="requestTransactionDelete"
      />

      <ReportsView v-else-if="activeView === 'relatorios'" />

      <AccountView
        v-else
        :display-balance="displayBalance"
        @open-profile="profileModalOpen = true"
        @reset-data="resetData"
      />
    </main>

    <TransactionModal
      :open="transactionModalOpen"
      :transaction="editingTransaction"
      @close="closeTransactionModal"
    />

    <BudgetModal
      :open="budgetModalOpen"
      :category="editingBudgetCategory"
      @close="closeBudgetModal"
    />

    <TransactionDetailModal
      :open="detailModalOpen"
      :transaction="viewingTransaction"
      @close="closeTransactionDetails"
      @edit="editFromDetails"
      @delete="requestTransactionDelete"
    />

    <ProfileModal
      :open="profileModalOpen"
      :display-balance="displayBalance"
      @close="profileModalOpen = false"
      @reset-data="resetData"
    />

    <ConfirmModal
      :open="confirmState.open"
      :title="confirmState.title"
      :kicker="confirmState.kicker"
      :message="confirmState.message"
      :confirm-label="confirmState.confirmLabel"
      :tone="confirmState.tone"
      @cancel="closeConfirm"
      @confirm="confirmAction"
    />
  </div>
</template>
