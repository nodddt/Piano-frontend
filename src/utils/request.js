// src/utils/request.js
import axios from 'axios'

const service = axios.create({
  baseURL: 'http://localhost:5000', // ✅ 后端地址
  timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token') // 或从 store 拿
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
)

export default service
