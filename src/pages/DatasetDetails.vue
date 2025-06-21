<template>
  <div class="dataset-detail-page">
    <h2 class="dataset-title">数据集详情：{{ dataset.name || id }}</h2>
    <p class="dataset-info">描述：{{ dataset.description || '暂无描述' }}</p>
    <p class="dataset-info">隐私级别：{{ mapPrivacy(dataset.privacy_level) }}</p>
    <p class="dataset-info">上传时间：{{ formatTime(dataset.upload_time) }}</p>
    
    <div class="dataset-fields">
      <h3>字段信息：</h3>
      <ul>
        <li v-for="(type, field) in dataset.fields" :key="field">
          {{ field }}：{{ type }}
        </li>
      </ul>
    </div>

    <button @click="handleApply" class="primary-btn">申请计算</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const router = useRouter()
const store = useStore()

const id = route.params.id
const dataset = ref({})

const fetchDatasetDetail = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:5000/datasets/get_dataset_detail?dataset_id=${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!res.ok) throw new Error(`请求失败，状态码：${res.status}`)
    const data = await res.json()
    dataset.value = data
  } catch (err) {
    console.error('获取数据集详情失败：', err)
    alert('数据加载失败，请稍后再试')
  }
}

const mapPrivacy = (level) => {
  switch (level) {
    case 'low': return '低'
    case 'medium': return '中'
    case 'high': return '高'
    default: return '未知'
  }
}

const formatTime = (isoStr) => {
  if (!isoStr) return '未知'
  const date = new Date(isoStr)
  return date.toLocaleString()
}

function handleApply() {
  const role = localStorage.getItem('role')
  if (role==='data_consumer') {
    router.push({ name: 'SubmitTask', query: { datasetId:id } })
  }  else {
    alert('请以“数据使用方”身份登录再提交任务')
  }
}

onMounted(fetchDatasetDetail)
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
  margin-bottom: 12px;
  color: #555;
}

.dataset-fields {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 0 8px rgba(0,0,0,0.05);
  margin-bottom: 30px;
}

.dataset-fields h3 {
  margin-bottom: 10px;
  font-size: 18px;
  color: #333;
}

.dataset-fields ul {
  padding-left: 20px;
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
