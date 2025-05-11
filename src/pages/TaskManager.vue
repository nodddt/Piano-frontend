<template>
    <div>
      <h2>计算任务管理</h2>
      <ul>
        <li v-for="t in tasks" :key="t.id">
          {{ t.id }} - {{ t.status }} - {{ t.submitted }}
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  const tasks = ref([
    { id: 101, status: 'pending', submitted: '2025-04-10' },
    { id: 102, status: 'completed', submitted: '2025-04-12' },
  ])
  </script>
  