<template>
  <div class="page-wrapper">
    <div class="login-card">
      <h2 class="login-title">内部人员登录</h2>

      <input
        v-model="username"
        placeholder="用户名"
        autocomplete="username"
        class="base-input"
        type="text"
      />
      <input
        v-model="password"
        placeholder="密码"
        autocomplete="current-password"
        class="base-input"
        type="password"
      />

      <button class="base-btn" @click="login">登录</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import request from '@/utils/request'

const username = ref('')
const password = ref('')
const router = useRouter()
const store = useStore()

const login = async () => {
  if (!username.value || !password.value) {
    alert('请输入用户名和密码')
    return
  }

  try {
    const response = await request.post('/auth/internal-login', {
      username: username.value,
      password: password.value,
      role: 'admin',
    })

    const { token } = response.data
    if (token) {
      store.commit('setToken', token)
      store.commit('setRole', 'internal')
      router.push('/admin')
    } else {
      alert('登录失败，未获取到 token')
    }
  } catch (err) {
    console.error('登录失败:', err)
    alert('登录失败，请检查用户名或密码')
  }
}
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  background-color: #fffdec;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 32px 28px;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 0 18px rgba(105, 112, 181, 0.15);
  text-align: center;
  color: #3b3f71; 
}

.login-title {
  margin-bottom: 28px;
  font-weight: 700;
  font-size: 26px;
  color: #6970b5;
}

.base-input {
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 18px;
  border: 1.8px solid #6970b5;
  border-radius: 8px;
  font-size: 16px;
  color: #3b3f71;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
}

.base-input:focus {
  border-color: #51578e;
  box-shadow: 0 0 10px rgba(105, 112, 181, 0.5);
}

.base-btn {
  width: 100%;
  padding: 14px 0;
  background-color: #6970b5;
  color: #fffde1;
  font-weight: 700;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.base-btn:hover {
  background-color: #8b8ec9;
  transform: scale(1.05);
}
</style>
