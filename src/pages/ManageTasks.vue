<template>
  <div class="manage-tasks-page">
    <h2>计算任务管理</h2>

    <section class="filter-bar">
      <input
        v-model="filters.datasetName"
        placeholder="按数据集名称搜索"
        @keyup.enter="fetchTasks"
      />
      <input
        v-model="filters.requesterUsername"
        placeholder="按请求用户搜索"
        @keyup.enter="fetchTasks"
      />
      <select v-model="filters.status">
        <option value="">全部状态</option>
        <option value="pending">待审核</option>
        <option value="approved">已通过</option>
        <option value="processing">处理中</option>
        <option value="pending_computation">待计算</option>
        <option value="computing">计算中</option>
        <option value="completed">已完成</option>
        <option value="failed">失败</option>
      </select>
      <button @click="fetchTasks">搜索</button>
    </section>

    <section class="tasks-table-wrapper">
      <table>
        <thead>
          <tr>
            <th>任务ID</th>
            <th>任务名称</th>
            <th>数据集名称</th>
            <th>请求用户</th>
            <th>任务类型</th>
            <th>状态</th>
            <th>提交时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.task_id">
            <td>{{ task.task_id }}</td>
            <td>{{ task.name }}</td>
            <td>{{ task.dataset_name }}</td>
            <td>{{ task.requester_username || task.requester_id }}</td>
            <td>{{ taskTypeLabel(task.task_type) }}</td>
            <td>{{ statusLabel(task.status) }}</td>
            <td>{{ formatDate(task.submitted_at) }}</td>
          </tr>
          <tr v-if="tasks.length === 0">
            <td colspan="7" class="no-data">暂无计算任务</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="pagination">
      <button
        :disabled="pagination.current_page === 1"
        @click="changePage(pagination.current_page - 1)"
      >
        上一页
      </button>
      <span>第 {{ pagination.current_page }} / {{ pagination.total_pages }} 页</span>
      <button
        :disabled="pagination.current_page === pagination.total_pages"
        @click="changePage(pagination.current_page + 1)"
      >
        下一页
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'

const token = localStorage.getItem('token')

const filters = reactive({
  datasetName: '',
  requesterUsername: '',
  status: ''
})

const tasks = ref([])
const pagination = reactive({
  current_page: 1,
  page_size: 20,
  total_items: 0,
  total_pages: 1
})

const fetchTasks = async () => {
  try {
    const params = {
      page: pagination.current_page,
      limit: pagination.page_size,
      dataset_name: filters.datasetName.trim() || undefined,
      requester_username: filters.requesterUsername.trim() || undefined,
      status: filters.status || undefined
    }
    // 过滤掉 undefined
    Object.keys(params).forEach(
      (key) => params[key] === undefined && delete params[key]
    )

    const res = await request.get('/datasets/my/tasks', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.data && res.data.tasks) {
      tasks.value = res.data.tasks
      Object.assign(pagination, res.data.pagination)
    } else {
      tasks.value = []
      pagination.current_page = 1
      pagination.total_pages = 1
      pagination.total_items = 0
    }
  } catch (err) {
    alert('获取任务列表失败')
    console.error(err)
  }
}

const changePage = (page) => {
  if (page < 1 || page > pagination.total_pages) return
  pagination.current_page = page
  fetchTasks()
}

const formatDate = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleString()
}

const statusLabel = (status) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'processing': return '处理中'
    case 'pending_computation': return '待计算'
    case 'computing': return '计算中'
    case 'completed': return '已完成'
    case 'failed': return '失败'
    default: return status
  }
}

const taskTypeLabel = (type) => {
  switch (type) {
    case 'row_wise': return '行级任务'
    case 'aggregation': return '聚合任务'
    case 'cross_row_polynomial': return '交叉多项式任务'
    default: return type
  }
}

onMounted(fetchTasks)
</script>

<style scoped>
.manage-tasks-page {
  max-width: 1000px;
  margin: 24px auto;
  padding: 24px 40px;
  background: #fffdec;
  border-radius: 12px;
  box-sizing: border-box;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #3a3a3a;
}

.manage-tasks-page h2 {
  color: #6970b5;
  font-weight: 700;
  font-size: 28px;
  margin-bottom: 28px;
  text-align: center;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-bar input,
.filter-bar select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1.5px solid #6970b5;
  font-size: 14px;
  color: #3a3a3a;
  min-width: 160px;
  transition: box-shadow 0.3s ease;
}

.filter-bar input:focus,
.filter-bar select:focus {
  outline: none;
  box-shadow: 0 0 6px #ffe2e2;
  border-color: #ffe2e2;
}

.filter-bar button {
  background-color: #6970b5;
  border: none;
  color: white;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: 30px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s ease;
  min-width: 100px;
}

.filter-bar button:hover {
  background-color: #4f578e;
}

.tasks-table-wrapper {
  overflow-x: auto;
}

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

.no-data {
  text-align: center;
  font-style: italic;
  color: #999;
  padding: 20px 0;
}

.pagination {
  margin-top: 20px;
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 20px;
  align-items: center;
}

.pagination button {
  padding: 8px 22px;
  background-color: #6970b5;
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
}

.pagination button:disabled {
  background-color: #bbb;
  cursor: not-allowed;
}

.pagination span {
  font-weight: 600;
  color: #3a3a3a;
}
</style>
