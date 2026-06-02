<script setup>
defineProps({
  kicker: {
    type: String,
    default: ""
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ""
  }
});
</script>

<template>
  <header class="page-header">
    <div>
      <span v-if="kicker" class="kicker">{{ kicker }}</span>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.actions" class="page-actions">
      <slot name="actions" />
    </div>
  </header>
</template>
