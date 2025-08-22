<template>
  <div class="error-message">
    <p>⚠️ {{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  margin: 1rem;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  text-align: center;
}

.error-message p {
  margin: 0;
  font-weight: 500;
}
</style>
