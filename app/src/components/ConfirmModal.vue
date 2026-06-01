<script setup>
import { AlertTriangle, CheckCircle2 } from "lucide-vue-next";
import BaseModal from "./BaseModal.vue";

defineProps({
  open: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  kicker: {
    type: String,
    default: "Confirmacao"
  },
  message: {
    type: String,
    required: true
  },
  confirmLabel: {
    type: String,
    default: "Confirmar"
  },
  cancelLabel: {
    type: String,
    default: "Cancelar"
  },
  tone: {
    type: String,
    default: "danger"
  }
});

const emit = defineEmits(["cancel", "confirm"]);
</script>

<template>
  <BaseModal :open="open" :title="title" :kicker="kicker" size="compact" @close="emit('cancel')">
    <div class="confirm-modal">
      <div class="confirm-icon" :class="tone">
        <component :is="tone === 'success' ? CheckCircle2 : AlertTriangle" :size="24" />
      </div>

      <p>{{ message }}</p>

      <div class="modal-action-row">
        <button class="button neutral" type="button" @click="emit('cancel')">
          {{ cancelLabel }}
        </button>
        <button class="button" :class="tone === 'danger' ? 'danger' : 'success'" type="button" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>
