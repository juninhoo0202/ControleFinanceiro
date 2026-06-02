<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { X } from "lucide-vue-next";

const props = defineProps({
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
const modalCard = ref(null);
const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;
let previousActiveElement = null;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function focusableElements() {
  if (!modalCard.value) return [];

  return [...modalCard.value.querySelectorAll(focusableSelector)]
    .filter(element => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
}

function focusFirstElement() {
  const [firstElement] = focusableElements();
  (firstElement || modalCard.value)?.focus();
}

function restoreFocus() {
  previousActiveElement?.focus?.();
  previousActiveElement = null;
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    emit("close");
    return;
  }

  if (event.key !== "Tab") return;

  const elements = focusableElements();

  if (elements.length === 0) {
    event.preventDefault();
    modalCard.value?.focus();
    return;
  }

  const firstElement = elements[0];
  const lastElement = elements[elements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

watch(
  () => props.open,
  async isOpen => {
    if (typeof document === "undefined") return;

    if (isOpen) {
      previousActiveElement = document.activeElement;
      await nextTick();
      focusFirstElement();
      return;
    }

    restoreFocus();
  },
  { flush: "post" }
);

onBeforeUnmount(restoreFocus);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-layer" @click.self="emit('close')">
        <section
          ref="modalCard"
          class="modal-card"
          :class="`modal-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          @keydown="handleKeydown"
        >
          <header class="modal-header">
            <div>
              <span v-if="kicker">{{ kicker }}</span>
              <h2 :id="titleId">{{ title }}</h2>
            </div>
            <button
              class="icon-button"
              type="button"
              title="Fechar"
              aria-label="Fechar modal"
              @click="emit('close')"
            >
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
