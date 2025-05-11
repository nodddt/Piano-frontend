<template>
    <div>
      <h2>内部人员登录</h2>
      <input v-model="username" placeholder="用户名" />
      <input v-model="password" type="password" placeholder="密码" />
      <button @click="login">登录</button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  
  const username = ref('')
  const password = ref('')
  const router = useRouter()
  const store = useStore()
  
  function login() {
    store.commit('setToken', 'admin-token')
    store.commit('setRole', 'internal')
    router.push('/admin')
  }
  </script>
  