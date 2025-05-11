<template>
    <div class="login-page">
      <h2>外部用户登录 / 注册</h2>
      <div>
        <label>身份类型：</label>
        <select v-model="role">
          <option value="user">数据使用方</option>
          <option value="admin">数据集管理员</option>
        </select>
      </div>
  
      <div>
        <input v-model="username" placeholder="用户名" />
        <input v-model="password" type="password" placeholder="密码" />
        <input v-model="email" placeholder="邮箱" />
        <input v-if="role === 'admin'" v-model="invite" placeholder="邀请码（仅管理员）" />
      </div>
  
      <button @click="register">注册</button>
      <button @click="login">登录</button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useStore } from 'vuex'
  
  const router = useRouter()
  const store = useStore()
  const role = ref('user')
  const username = ref('')
  const password = ref('')
  const email = ref('')
  const invite = ref('')
  
  function login() {
    store.commit('setToken', 'mock-token')
    store.commit('setRole', role.value)
    if (role.value === 'admin') router.push('/datasets/manage')
    else router.push('/datasets')
  }
  
  function register() {
    alert('注册成功，请登录！')
  }
  </script>
  