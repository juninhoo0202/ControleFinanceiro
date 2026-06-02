<script setup>
import { computed, reactive, ref } from "vue";
import {
  ArrowLeft,
  Database,
  KeyRound,
  LockKeyhole,
  Mail,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  UserRound,
  WalletCards
} from "lucide-vue-next";
import { useFinanceStore } from "../stores/financeStore";

const store = useFinanceStore();
const mode = ref("login");
const feedback = ref(null);
const recovery = ref(null);

const form = reactive({
  name: store.state.profile.name,
  recoveryEmail: store.state.profile.recoveryEmail,
  pin: "",
  confirmPin: "",
  resetEmail: store.state.profile.recoveryEmail,
  resetCode: "",
  newPin: "",
  confirmNewPin: ""
});

const isSetup = computed(() => !store.hasAccessPin);
const activeMode = computed(() => (isSetup.value ? "setup" : mode.value));
const title = computed(() => {
  if (activeMode.value === "setup") return "Criar acesso";
  if (activeMode.value === "recover") return "Recuperar PIN";
  return "Entrar";
});
const formTitle = computed(() => {
  if (activeMode.value === "setup") return "Configure sua chave";
  if (activeMode.value === "recover") return "Trocar PIN";
  return "Desbloquear conta";
});
const introCopy = computed(() => {
  if (activeMode.value === "setup") return "Crie um PIN e cadastre um e-mail para recuperar o acesso quando precisar.";
  if (activeMode.value === "recover") return "Informe o e-mail cadastrado para receber um codigo e trocar seu PIN.";
  return `Ola, ${store.profileName}. Digite seu PIN para continuar.`;
});
const activePin = computed(() => (activeMode.value === "recover" ? form.newPin : form.pin));
const pinDots = computed(() => {
  const filled = Math.min(activePin.value.length, 4);
  return Array.from({ length: 4 }, (_, index) => index < filled);
});
const submitLabel = computed(() => (isSetup.value ? "Criar e entrar" : "Entrar"));

function setFeedback(response) {
  feedback.value = {
    type: response.ok ? "success" : "error",
    message: response.message
  };
}

function clearSecrets() {
  form.pin = "";
  form.confirmPin = "";
  form.resetCode = "";
  form.newPin = "";
  form.confirmNewPin = "";
}

function submitLogin() {
  feedback.value = null;

  if (isSetup.value && form.pin !== form.confirmPin) {
    feedback.value = { type: "error", message: "Os PINs precisam ser iguais." };
    return;
  }

  const response = isSetup.value
    ? store.setupAccess({
      name: form.name,
      pin: form.pin,
      recoveryEmail: form.recoveryEmail
    })
    : store.unlockAccess(form.pin);

  setFeedback(response);

  if (response.ok) {
    clearSecrets();
  }
}

function openRecovery() {
  mode.value = "recover";
  feedback.value = null;
  recovery.value = null;
  clearSecrets();
}

function backToLogin() {
  mode.value = "login";
  feedback.value = null;
  recovery.value = null;
  clearSecrets();
}

function requestRecoveryCode() {
  feedback.value = null;
  const response = store.requestPinReset(form.resetEmail);
  setFeedback(response);

  if (response.ok) {
    recovery.value = response;
  }
}

function resetPin() {
  feedback.value = null;

  if (form.newPin !== form.confirmNewPin) {
    feedback.value = { type: "error", message: "Os novos PINs precisam ser iguais." };
    return;
  }

  const response = store.resetAccessWithCode({
    email: form.resetEmail,
    code: form.resetCode,
    pin: form.newPin
  });

  setFeedback(response);

  if (response.ok) {
    recovery.value = null;
    clearSecrets();
  }
}
</script>

<template>
  <main class="login-screen">
    <section class="login-shell">
      <article class="login-intro-card">
        <div class="login-brand">
          <span>FP</span>
          <div>
            <strong>FinancePro</strong>
            <small>Controle mensal</small>
          </div>
        </div>

        <div class="login-intro-copy">
          <span>{{ activeMode === "recover" ? "Recuperacao" : isSetup ? "Primeiro acesso" : "Acesso local" }}</span>
          <h1>{{ title }}</h1>
          <p>{{ introCopy }}</p>
        </div>

        <div class="login-security-grid">
          <div>
            <Smartphone :size="18" />
            <span>Mobile-first</span>
          </div>
          <div>
            <Database :size="18" />
            <span>Dados locais</span>
          </div>
          <div>
            <ShieldCheck :size="18" />
            <span>Codigo por e-mail</span>
          </div>
        </div>
      </article>

      <article class="login-card">
        <div class="login-heading">
          <span class="login-icon">
            <LockKeyhole v-if="activeMode !== 'recover'" :size="24" />
            <RotateCcw v-else :size="24" />
          </span>
          <div>
            <span>{{ activeMode === "recover" ? "Troca de PIN" : "Entrada segura" }}</span>
            <h2>{{ formTitle }}</h2>
          </div>
        </div>

        <div class="login-mobile-summary">
          <strong>{{ title }}</strong>
          <span>{{ introCopy }}</span>
        </div>

        <div v-if="activeMode !== 'recover'" class="pin-visual" aria-hidden="true">
          <span v-for="(filled, index) in pinDots" :key="index" :class="{ filled }"></span>
        </div>

        <form v-if="activeMode !== 'recover'" class="login-form" @submit.prevent="submitLogin">
          <label v-if="isSetup" class="field">
            <span>Nome</span>
            <div class="input-with-icon">
              <UserRound :size="18" />
              <input v-model="form.name" type="text" autocomplete="name" placeholder="Seu nome" />
            </div>
          </label>

          <label v-if="isSetup" class="field">
            <span>E-mail de recuperacao</span>
            <div class="input-with-icon">
              <Mail :size="18" />
              <input v-model="form.recoveryEmail" type="email" autocomplete="email" placeholder="voce@email.com" />
            </div>
          </label>

          <label class="field">
            <span>PIN</span>
            <div class="input-with-icon">
              <KeyRound :size="18" />
              <input
                v-model="form.pin"
                type="password"
                inputmode="numeric"
                autocomplete="current-password"
                maxlength="8"
                placeholder="4 a 8 numeros"
              />
            </div>
          </label>

          <label v-if="isSetup" class="field">
            <span>Confirmar PIN</span>
            <div class="input-with-icon">
              <ShieldCheck :size="18" />
              <input
                v-model="form.confirmPin"
                type="password"
                inputmode="numeric"
                autocomplete="new-password"
                maxlength="8"
                placeholder="Repita o PIN"
              />
            </div>
          </label>

          <button class="button success login-submit" type="submit">
            <WalletCards :size="18" />
            {{ submitLabel }}
          </button>

          <button v-if="!isSetup" class="login-link-button" type="button" @click="openRecovery">
            Esqueci meu PIN
          </button>
        </form>

        <div v-else class="login-form">
          <label class="field">
            <span>E-mail cadastrado</span>
            <div class="input-with-icon">
              <Mail :size="18" />
              <input v-model="form.resetEmail" type="email" autocomplete="email" placeholder="voce@email.com" />
            </div>
          </label>

          <button class="button login-submit" type="button" @click="requestRecoveryCode">
            <Mail :size="18" />
            Enviar codigo
          </button>

          <div v-if="recovery" class="recovery-code-panel">
            <span>Codigo enviado</span>
            <strong>{{ recovery.code }}</strong>
            <small>Modo local: este codigo aparece aqui para teste. Com backend, ele chega no e-mail.</small>
          </div>

          <label class="field">
            <span>Codigo</span>
            <div class="input-with-icon">
              <ShieldCheck :size="18" />
              <input
                v-model="form.resetCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
              />
            </div>
          </label>

          <div class="pin-visual recovery-pin" aria-hidden="true">
            <span v-for="(filled, index) in pinDots" :key="index" :class="{ filled }"></span>
          </div>

          <label class="field">
            <span>Novo PIN</span>
            <div class="input-with-icon">
              <KeyRound :size="18" />
              <input
                v-model="form.newPin"
                type="password"
                inputmode="numeric"
                autocomplete="new-password"
                maxlength="8"
                placeholder="4 a 8 numeros"
              />
            </div>
          </label>

          <label class="field">
            <span>Confirmar novo PIN</span>
            <div class="input-with-icon">
              <ShieldCheck :size="18" />
              <input
                v-model="form.confirmNewPin"
                type="password"
                inputmode="numeric"
                autocomplete="new-password"
                maxlength="8"
                placeholder="Repita o novo PIN"
              />
            </div>
          </label>

          <button class="button success login-submit" type="button" @click="resetPin">
            <RotateCcw :size="18" />
            Trocar PIN
          </button>

          <button class="login-link-button" type="button" @click="backToLogin">
            <ArrowLeft :size="16" />
            Voltar para login
          </button>
        </div>

        <p v-if="feedback" class="feedback compact" :class="feedback.type">
          {{ feedback.message }}
        </p>

        <p class="login-note">
          Este acesso protege a visualizacao local. Para envio real de e-mail, conecte o app a um backend ou servico de e-mail.
        </p>
      </article>
    </section>
  </main>
</template>
