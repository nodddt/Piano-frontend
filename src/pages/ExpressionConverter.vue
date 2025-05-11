<template>
    <div>
      <h2>表达式转换</h2>
      <textarea v-model="inputExpr" rows="4" placeholder="输入原始表达式"></textarea>
      <button @click="convert">转换为多项式</button>
      <div v-if="outputExpr">
        <p>转换结果：</p>
        <pre>{{ outputExpr }}</pre>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  const inputExpr = ref('')
  const outputExpr = ref('')
  
  function convert() {
    outputExpr.value = '多项式近似结果（模拟）'
  }
  </script>
  