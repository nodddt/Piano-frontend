<template>
    <div>
      <h2>数据集详情：{{ id }}</h2>
      <p>字段信息、访问次数、描述等</p>
      <button @click="handleApply">申请计算</button>
    </div>
  </template>
  
  <script setup>
  import { useRoute, useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  const route = useRoute()
  const router = useRouter()
  const store = useStore()
  const id = route.params.id
  
  function handleApply() {
    const role = store.getters.userRole
    if (!store.getters.isAuthenticated) {
      alert('请先登录'); router.push('/login')
    } else if (role === 'user') {
      router.push('/convert-expression')
    } else {
      alert('请以“数据使用方”身份登录再提交任务')
    }
  }
  </script>
  