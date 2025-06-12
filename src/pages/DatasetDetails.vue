<template>
  <div class="dataset-detail-page">
    <h2 class="dataset-title">数据集详情：{{ id }}</h2>
    <p class="dataset-info">字段信息、访问次数、描述等</p>
    <button @click="handleApply" class="primary-btn">申请计算</button>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import request from '@/utils/request'
const route = useRoute()
const router = useRouter()
const store = useStore()
const id = route.params.id

function handleApply() {
  const role = store.getters.userRole
  if (!store.getters.isAuthenticated) {
    alert('请先登录'); router.push('/login')
  } else if (role === 'user') {
    router.push({
      name:'ExpressionConverter',
      query:{dataset_id:id}
    })
  } else {
    alert('请以“数据使用方”身份登录再提交任务')
  }
}
</script>

<style scoped>
.dataset-detail-page {
  max-width: 720px;
  margin: 60px auto 40px;
  padding: 20px 24px;
  background-color: #FFFDEC;
  border-radius: 12px;
  box-shadow: 0 0 12px rgb(105 112 181 / 0.3);
  color: #3a3a3a;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.dataset-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #6970b5;
}

.dataset-info {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 30px;
  color: #555;
}

.primary-btn {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 14px 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.primary-btn:hover {
  background-color: #51578e;
  transform: scale(1.05);
}
</style>
