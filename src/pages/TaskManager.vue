<template>
  <div class="task-manager">
    <h2 class="title">计算任务管理</h2>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <input v-model="filters.name" type="text" placeholder="任务名称" class="input" />
      <select v-model="filters.status" class="select">
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="running">运行中</option>
        <option value="completed">已完成</option>
        <option value="failed">失败</option>
      </select>
      <button @click="fetchTasks" class="search-btn">搜索</button>
    </div>

    <!-- 表格 -->
    <div class="table-wrapper">
      <table class="task-table">
        <thead>
          <tr>
            <th>任务编号</th>
            <th>任务名称</th>
            <th>数据集 ID</th>
            <th>状态</th>
            <th>提交时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td>{{ task.id }}</td>
            <td>{{ task.name }}</td>
            <td>{{ task.dataset_id }}</td>
            <td>
              <span :class="['status', task.status]">{{ task.status }}</span>
            </td>
            <td>{{ formatTime(task.submitted_at) }}</td>
            <td>
              <button @click="viewTask(task.id)" class="link">查看</button>
              <button v-if="task.status === 'completed'" @click="downloadResult(task.id)" class="link green">下载结果</button>
            </td>
          </tr>
          <tr v-if="tasks.length === 0">
            <td colspan="6" class="empty">暂无任务</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <button :disabled="filters.page === 1" @click="prevPage">上一页</button>
      <span>第 {{ filters.page }} 页</span>
      <button @click="nextPage">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const tasks = ref([])
const filters = ref({
  name: '',
  status: '',
  page: 1,
  limit: 10,
  sort_by: 'submitted_at',
  order: 'desc'
})

const fetchTasks = async () => {
  try {
    const query = new URLSearchParams(filters.value).toString()
    const res = await request.get(`/tasks/get_list?${query}`)
    tasks.value = res.data.tasks || []
  } catch (err) {
    alert('获取任务失败')
  }
}

const viewTask = (taskId) => {
  router.push(`/task-detail/${taskId}`)
}

const downloadResult = async (taskId) => {
  try {
    const res = await request.get(`/tasks/result`, {
      params: { task_id: taskId },
      responseType: 'blob'
    })
    const blob = new Blob([res.data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${taskId}_result.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    alert('下载失败')
  }
}

const formatTime = (timestamp) => new Date(timestamp).toLocaleString()
const prevPage = () => { if (filters.value.page > 1) filters.value.page--; fetchTasks() }
const nextPage = () => { filters.value.page++; fetchTasks() }

onMounted(fetchTasks)
</script>

<style scoped>
.task-manager {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #FFFDEC;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input,
.select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  min-width: 180px;
  font-size: 14px;
}

.search-btn {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
}

.search-btn:hover {
  background-color: #565ea1;
}

.table-wrapper {
  overflow-x: auto;
}

.task-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.task-table th,
.task-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.task-table tr:hover {
  background-color: #f5f5f5;
}

.status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.status.pending { background-color: #999 }
.status.running { background-color: #3498db }
.status.completed { background-color: #2ecc71 }
.status.failed { background-color: #e74c3c }

.link {
  color: #6970b5;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.link:hover {
  text-decoration: underline;
}

.link.green {
  color: #27ae60;
}

.empty {
  text-align: center;
  padding: 1rem;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.pagination button {
  background: #eee;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.pagination button:hover:not(:disabled) {
  background: #ddd;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
