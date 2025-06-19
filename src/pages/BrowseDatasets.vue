<template>
  <div class="dataset-page">
    <h2 class="dataset-title">可用数据集浏览</h2>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <input v-model="filters.name" placeholder="按名称搜索" class="input" />
      <select v-model="filters.privacy" class="select">
        <option value="">全部隐私级别</option>
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
      <button @click="fetchDatasets" class="primary-btn">搜索</button>
    </div>

    <!-- 数据集列表 -->
    <div v-if="datasets.length > 0" class="dataset-list">
      <div
        v-for="ds in datasets"
        :key="ds.dataset_id"
        class="dataset-card"
        @click="goToDetail(ds.dataset_id)"
      >
        <h3 class="dataset-name">{{ ds.name }}</h3>
        <p class="dataset-desc">{{ ds.description }}</p>
        <div class="dataset-meta">
          <span>数据量：{{ ds.row_count }}</span>
          <span>隐私级别：{{ mapPrivacy(ds.privacy_level) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="empty-hint">暂无符合条件的数据集</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const datasets = ref([])

const filters = ref({
  name: '',
  privacy: '',
  sort_by: 'upload_time',
  order: 'desc',
  page: 1,
  limit: 20,
})

const fetchDatasets = async () => {
  try {
    // 组装查询参数
    const params = new URLSearchParams()
    for (const key in filters.value) {
      if (filters.value[key]) {
        params.append(key, filters.value[key])
      }
    }
    const res = await fetch(`http://localhost:5000/datasets/db_list?${params.toString()}`)
    if (!res.ok) throw new Error(`请求失败，状态码：${res.status}`)
    const data = await res.json()
    datasets.value = data || []
  } catch (err) {
    console.error('获取数据集失败:', err)
  }
}

const goToDetail = (datasetId) => {
  router.push({ path: '/dataset-detail', query: { dataset_id: datasetId } })
}

const mapPrivacy = (level) => {
  switch (level) {
    case 'low': return '低'
    case 'medium': return '中'
    case 'high': return '高'
    default: return '未知'
  }
}

onMounted(fetchDatasets)
</script>

<style scoped>
.dataset-page {
  padding: 60px 80px;
  min-height: 100vh;
  background-color: #FFFDEC;
}

.dataset-title {
  font-size: 32px;
  font-weight: bold;
  color: #6970b5;
  margin-bottom: 30px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.input, .select {
  padding: 10px 14px;
  border: 1px solid #6970b5;
  border-radius: 8px;
  font-size: 14px;
  width: 200px;
}

.primary-btn {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 10px 24px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.primary-btn:hover {
  background-color: #51578e;
}

.dataset-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.dataset-card {
  background-color: white;
  border-radius: 12px;
  border: 1px solid #eee;
  padding: 24px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.dataset-card:hover {
  background-color: #FFE2E2;
}

.dataset-name {
  font-size: 18px;
  font-weight: bold;
  color: #6970b5;
  margin-bottom: 8px;
}

.dataset-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dataset-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
}

.empty-hint {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-top: 40px;
}
</style>
