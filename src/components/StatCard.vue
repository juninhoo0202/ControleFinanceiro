<script setup>
import { computed } from "vue";
import { resolveIcon } from "./icons";

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: "CircleDollarSign"
  },
  tone: {
    type: String,
    default: "neutral"
  }
});

const Icon = computed(() => resolveIcon(props.icon));
</script>

<template>
  <article class="stat-card" :class="`tone-${tone}`">
    <div>
      <span>{{ label }}</span>
      <strong>{{ value }}</strong>
    </div>
    <component :is="Icon" :size="22" stroke-width="2.3" />
  </article>
</template>
