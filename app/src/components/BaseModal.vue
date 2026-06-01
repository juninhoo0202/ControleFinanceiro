<script setup>
import { X } from "lucide-vue-next";

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
    default: ""
  },
  size: {
    type: String,
    default: "default"
  }
});

const emit = defineEmits(["close"]);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-layer" @click.self="emit('close')">
        <section class="modal-card" :class="`modal-${size}`" role="dialog" aria-modal="true">
          <header class="modal-header">
            <div>
              <span v-if="kicker">{{ kicker }}</span>
              <h2>{{ title }}</h2>
            </div>
            <button class="icon-button" type="button" title="Fechar" @click="emit('close')">
              <X :size="20" />
            </button>
          </header>

          <div class="modal-body">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
