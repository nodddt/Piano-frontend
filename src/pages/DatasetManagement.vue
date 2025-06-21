<template>
  <div class="dataset-management">
    <h2 class="page-title">数据集管理主页</h2>

    <section class="dataset-list">
      <h3>我提交的数据集</h3>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <input v-model="searchParams.name" placeholder="搜索名称" />
        <button @click="fetchDatasets">搜索</button>
      </div>

      <!-- 数据集表格 -->
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>描述</th>
            <th>记录数</th>
            <th>隐私级别</th>
            <th>审核状态</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dataset in datasetList" :key="dataset.id">
            <td>{{ dataset.name }}</td>
            <td>{{ dataset.description }}</td>
            <td>{{ dataset.row_count }}</td>
            <td>{{ privacyLabel(dataset.privacy_level) }}</td>
            <td>{{ reviewStatusLabel(dataset.review_status) }}</td>
            <td>{{ dataset.status || '可用' }}</td>
            <td class="actions">
              <button @click="viewDetail(dataset.dataset_id)" class="btn btn-view">查看详情</button>
              <button @click="editDescription(dataset)" class="btn btn-edit">编辑描述</button>
              <button @click="archiveDataset(dataset.id)" class="btn btn-archive">存档</button>
            </td>
          </tr>
          <tr v-if="datasetList.length === 0">
            <td colspan="7" class="no-data">暂无数据集</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 上传新数据集按钮 -->
    <div class="upload-btn-wrapper">
      <button class="upload-btn" @click="showUploadModal = true">上传新数据集</button>
      <button class="manage-tasks-btn" @click="goManageTasks">查看计算任务</button>
    </div>
    <!-- 上传弹窗组件 -->
    <UploadDatasetModal
      v-if="showUploadModal"
      :modelValue="showUploadModal"
      @close="handleModalClose"
      @submitted="onUploadSuccess"
      :token="token"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import UploadDatasetModal from '@/components/UploadDatasetModal.vue'

const router = useRouter()
const token = localStorage.getItem('token')

// 搜索条件
const searchParams = reactive({
  name: '',
  sort_by: 'upload_time',
  order: 'desc',
  page: 1,
  limit: 20
})

const datasetList = ref([])
const showUploadModal = ref(false)

// 请求数据集列表
const fetchDatasets = async () => {
  try {
    const res = await request.get('/datasets/my', {
      params: searchParams,
      headers: { Authorization: `Bearer ${token}` }
    })
    datasetList.value = res.data.datasets || []
  } catch (err) {
    alert('获取数据集失败')
    console.error(err)
  }
}

const viewDetail = (datasetId) => {
  router.push({ name: 'DatasetDetails', params: { id: datasetId } })
}

const editDescription = async (dataset) => {
  const newDesc = prompt('请输入新的描述：', dataset.description)
  if (newDesc !== null && newDesc !== dataset.description) {
    try {
      await request.put(
        '/datasets/update_db',
        { dataset_id: dataset.dataset_id, description: newDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('描述更新成功')
      fetchDatasets()
    } catch (err) {
      alert('描述更新失败')
      console.error(err)
    }
  }
}

const archiveDataset = async (datasetId) => {
  if (!confirm('确定要存档该数据集吗？')) return
  try {
    await request.delete('/datasets/del_db', {
      headers: { Authorization: `Bearer ${token}` },
      data: { dataset_id: datasetId }
    })
    alert('数据集已存档')
    fetchDatasets()
  } catch (err) {
    alert(err.response?.data?.message || '存档失败，可能存在挂起任务')
    console.error(err)
  }
}
const goManageTasks = () => {
  router.push('/managetasks')
}
const handleModalClose = () => {
  if (confirm('确认关闭？未保存的数据将丢失')) {
    showUploadModal.value = false
  }
}

const onUploadSuccess = () => {
  showUploadModal.value = false
  fetchDatasets()
}

onMounted(fetchDatasets)

const privacyLabel = (level) => {
  switch (level) {
    case 'low': return '低'
    case 'medium': return '中'
    case 'high': return '高'
    default: return level
  }
}

const reviewStatusLabel = (status) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return status || '未知'
  }
}
</script>

<style scoped>
/* 全局背景色 */
.dataset-management {
  background-color: #fffdec;
  padding: 24px 40px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #3a3a3a;
  border-radius: 12px;
  box-sizing: border-box;
  min-height: 100vh;
}

/* 标题 */
.page-title {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: #6970b5;
  margin-bottom: 32px;
}

.dataset-list h3 {
  font-size: 22px;
  font-weight: 600;
  color: #6970b5;
  margin-bottom: 16px;
  border-bottom: 3px solid #6970b5;
  padding-bottom: 6px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-bar input {
  flex: 1;
  border: 1.5px solid #6970b5;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 15px;
  color: #3a3a3a;
  transition: border-color 0.3s;
}

.search-bar input:focus {
  outline: none;
  border-color: #ffe2e2;
  box-shadow: 0 0 6px #ffe2e2;
}

.search-bar button {
  background-color: #6970b5;
  color: #fff;
  font-weight: 600;
  border: none;
  padding: 8px 22px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  user-select: none;
}

.search-bar button:hover {
  background-color: #4f578e;
}

/* 表格 */
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  font-size: 14px;
}

thead tr {
  background-color: #6970b5;
  color: white;
  font-weight: 600;
  border-radius: 8px;
}

thead tr th {
  padding: 12px 15px;
  text-align: center;
  border: none;
}

tbody tr {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 10px rgb(105 112 181 / 0.2);
  transition: box-shadow 0.3s ease;
}

tbody tr:hover {
  box-shadow: 0 0 16px rgb(105 112 181 / 0.35);
}

tbody tr td {
  padding: 14px 15px;
  text-align: center;
  vertical-align: middle;
  border: none;
  color: #3a3a3a;
}

/* 操作按钮 */
.actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.actions button {
  padding: 6px 14px;
  font-size: 13px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
  color: white;
  font-weight: 600;
}

.actions .btn-view {
  background-color: #6970b5;
}

.actions .btn-view:hover {
  background-color: #4f578e;
}

.actions .btn-edit {
  background-color: #ff8c8c;
}

.actions .btn-edit:hover {
  background-color: #e06666;
}

.actions .btn-archive {
  background-color: #b54f4f;
}

.actions .btn-archive:hover {
  background-color: #813939;
}

/* 无数据提示 */
.no-data {
  color: #999;
  font-style: italic;
  padding: 20px 0;
}

/* 上传按钮 */
.upload-btn-wrapper {
  margin-top: 36px;
  text-align: center;
}

.upload-btn {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 14px 36px;
  font-size: 16px;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 6px 12px rgb(105 112 181 / 0.4);
  user-select: none;
  transition: background-color 0.3s ease;
}

.upload-btn:hover {
  background-color: #4f578e;
}
.manage-tasks-btn {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 14px 36px;
  font-size: 16px;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 6px 12px rgb(105 112 181 / 0.4);
  user-select: none;
  transition: background-color 0.3s ease;
  margin-left: 20px; /* 按钮间距 */
}

.manage-tasks-btn:hover {
  background-color: #4f578e;
}
</style>
