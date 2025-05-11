<template>
    <div>
      <h2>数据集管理</h2>
      <button @click="addDataset">添加数据集</button>
      <ul>
        <li v-for="d in datasets" :key="d.id">{{ d.name }} - {{ d.status }}</li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  const datasets = ref([{ id: 1, name: '示例数据集', status: '待审核' }])
  
  function addDataset() {
    alert('弹出数据集注册表单（未实现）')
  }
  </script>
  