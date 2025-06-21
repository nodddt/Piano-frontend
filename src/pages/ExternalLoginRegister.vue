<template>
  <div class="auth-page">
    <h2 class="auth-title">{{ isLogin ? '外部用户登录' : '新用户注册' }}</h2>

    <div class="form-group">
      <label>身份类型：</label>
      <select v-model="role" class="select-input">
        <option value="data_consumer">数据使用方</option>
        <option value="dataset_provider">数据集管理员</option>
      </select>
    </div>

    <div class="form-group">
      <input
        v-model="username"
        type="text"
        placeholder="用户名"
        class="text-input"
        autocomplete="username"
      />
    </div>

    <div class="form-group">
      <input
        v-model="password"
        type="password"
        placeholder="密码"
        class="text-input"
        autocomplete="current-password"
      />
    </div>

    <div class="form-group" v-if="!isLogin">
      <input
        v-model="email"
        type="email"
        placeholder="邮箱"
        class="text-input"
        autocomplete="email"
      />
    </div>

    <div class="form-group" v-if="!isLogin && role === 'dataset_provider'">
      <input
        v-model="invite"
        type="text"
        placeholder="邀请码（仅管理员）"
        class="text-input"
      />
    </div>

    <button
      @click="isLogin ? login() : register()"
      class="primary-btn"
    >
      {{ isLogin ? '登录' : '注册' }}
    </button>

    <p class="switch-text">
      {{ isLogin ? '还没有账号？' : '已有账号？' }}
      <span class="switch-link" @click="toggleAuth">
        {{ isLogin ? '去注册' : '去登录' }}
      </span>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import request from '@/utils/request'

const router = useRouter()
const store = useStore()

const isLogin = ref(true) // 默认显示登录
const role = ref('data_consumer')
const username = ref('')
const password = ref('')
const email = ref('')
const invite = ref('')

function toggleAuth() {
  isLogin.value = !isLogin.value
  // 切换时清空输入，防止数据混淆
  username.value = ''
  password.value = ''
  email.value = ''
  invite.value = ''
}

const register = async () => {
  if (!username.value || !password.value || !email.value) {
    alert('请完整填写用户名、密码和邮箱')
    return
  }
  if (role.value === 'dataset_provider' && !invite.value) {
    alert('管理员请填写邀请码')
    return
  }

  const payload = {
    username: username.value,
    password: password.value,
    email: email.value,
    role: role.value
  }

  if (role.value === 'dataset_provider') {
    payload.invite_code = invite.value
  }

  try {
    await request.post('/auth/register', payload)
    alert('注册成功，请登录！')
    isLogin.value = true
  } catch (err) {
    console.error('注册失败', err)
    alert('注册失败，请检查信息是否填写完整或邀请码是否正确')
  }
}

const login = async () => {
  if (!username.value || !password.value) {
    alert('请填写用户名和密码')
    return
  }
  const payload = {
    username: username.value,
    password: password.value,
    role: role.value
  }

  try {
    const response = await request.post('/auth/login', payload)
    const token = response.data.token || 'mock-token'

    store.commit('setToken', token)
    store.commit('setRole', role.value)

    if (role.value === 'dataset_provider') {
      router.push('/datasets/manage')
    } else {
      router.push('/consumerhome')
    }
  } catch (err) {
    console.error('登录失败', err)
    alert('登录失败，请检查用户名、密码或邮箱是否正确')
  }
}
</script>

<style scoped>
.auth-page {
  max-width: 420px;
  margin: 80px auto 40px;
  padding: 30px 24px;
  background-color: #FFFDEC;
  border-radius: 12px;
  box-shadow: 0 0 14px rgba(105, 112, 181, 0.3);
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #3a3a3a;
  text-align: center;
}

.auth-title {
  font-size: 28px;
  font-weight: 700;
  color: #6970b5;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 18px;
  text-align: left;
}

.select-input,
.text-input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  border: 1px solid #6970b5;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.25s ease;
  box-sizing: border-box;
}

.select-input:focus,
.text-input:focus {
  border-color: #51578e;
}

.primary-btn {
  width: 100%;
  padding: 14px 0;
  background-color: #6970b5;
  color: white;
  border: none;
  font-size: 18px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  margin-top: 12px;
}

.primary-btn:hover {
  background-color: #51578e;
  transform: scale(1.05);
}

.switch-text {
  margin-top: 20px;
  font-size: 14px;
  color: #555;
}

.switch-link {
  color: #6970b5;
  cursor: pointer;
  font-weight: 600;
  margin-left: 6px;
  user-select: none;
  transition: color 0.3s ease;
}

.switch-link:hover {
  color: #51578e;
}
</style>