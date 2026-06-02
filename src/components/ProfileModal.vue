<script setup>
import { computed, reactive, ref, watch } from "vue";
import { CircleDollarSign, Eye, EyeOff, RotateCcw, Save, UserRound } from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";
import BaseModal from "./BaseModal.vue";

defineProps({
  open: {
    type: Boolean,
    required: true
  },
  displayBalance: {
    type: String,
    required: true
  }
});

const emit = defineEmits(["close", "reset-data"]);
const store = useFinanceStore();
const feedback = ref("");
const profileInitial = computed(() => store.profileName.slice(0, 1).toUpperCase());

const form = reactive({
  name: store.state.profile.name,
  initialBalance: store.state.profile.initialBalance,
  privacy: store.state.profile.privacy
});

watch(
  () => store.state.profile,
  profile => {
    form.name = profile.name;
    form.initialBalance = profile.initialBalance;
    form.privacy = profile.privacy;
  },
  { deep: true, immediate: true }
);

function saveProfile() {
  store.saveProfile(form);
  feedback.value = "Perfil salvo.";
}

function togglePrivacy() {
  form.privacy = !form.privacy;
  store.saveProfile(form);
  feedback.value = form.privacy ? "Privacidade ativada." : "Privacidade desativada.";
}
</script>

<template>
  <BaseModal :open="open" title="Perfil e saldo" kicker="Conta local" size="wide" @close="emit('close')">
    <div class="profile-modal-layout">
      <section class="profile-modal-hero">
        <span class="profile-avatar">{{ profileInitial }}</span>
        <div>
          <span>Perfil atual</span>
          <h3>{{ store.profileName }}</h3>
          <p>{{ store.state.profile.privacy ? "Saldo oculto no painel." : "Saldo visivel no painel." }}</p>
        </div>
      </section>

      <form class="profile-form modal-form profile-editor-form" @submit.prevent="saveProfile">
        <label class="field">
          <span>Nome</span>
          <div class="input-with-icon">
            <UserRound :size="18" />
            <input v-model="form.name" type="text" placeholder="Digite seu nome" />
          </div>
        </label>

        <label class="field">
          <span>Saldo inicial da conta</span>
          <div class="input-with-icon">
            <CircleDollarSign :size="18" />
            <input v-model="form.initialBalance" type="number" step="0.01" min="0" placeholder="0,00" />
          </div>
        </label>

        <label class="toggle-row profile-toggle">
          <input v-model="form.privacy" type="checkbox" />
          <span>
            <component :is="form.privacy ? EyeOff : Eye" :size="18" />
            Ocultar saldo no painel
          </span>
        </label>

        <div class="form-actions">
          <button class="button success" type="submit">
            <Save :size="18" />
            Salvar
          </button>
          <button class="button neutral" type="button" @click="togglePrivacy">
            <component :is="store.state.profile.privacy ? EyeOff : Eye" :size="18" />
            Privacidade
          </button>
          <button class="button danger" type="button" @click="emit('reset-data')">
            <RotateCcw :size="18" />
            Resetar
          </button>
        </div>
      </form>

      <div class="summary-stack modal-summary profile-modal-summary">
        <div>
          <span>Nome</span>
          <strong>{{ store.profileName }}</strong>
        </div>
        <div>
          <span>Saldo inicial</span>
          <strong>{{ store.money(store.state.profile.initialBalance) }}</strong>
        </div>
        <div>
          <span>Saldo atual</span>
          <strong>{{ displayBalance }}</strong>
        </div>
        <div>
          <span>Entradas totais</span>
          <strong class="positive">{{ store.money(store.entriesTotal) }}</strong>
        </div>
        <div>
          <span>Saidas totais</span>
          <strong class="negative">{{ store.money(store.expensesTotal) }}</strong>
        </div>
        <div>
          <span>Transacoes</span>
          <strong>{{ store.state.transactions.length }}</strong>
        </div>
      </div>
    </div>

    <p v-if="feedback" class="feedback success">{{ feedback }}</p>
  </BaseModal>
</template>
