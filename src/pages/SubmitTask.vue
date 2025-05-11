<template>
    <div>
      <h2>提交计算任务</h2>
      <input v-model="expr" placeholder="请输入表达式" />
      <button @click="submit">提交任务</button>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  const router = useRouter()
  const expr = ref('')
  
  function submit() {
    alert('任务提交成功，跳转至任务管理页面')
    router.push('/task-manager')
  }
  </script>
  