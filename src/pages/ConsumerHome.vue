<template>
  <div class="consumer-homepage">
    <h2 class="page-title">我的计算任务</h2>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <select v-model="filters.status" multiple>
        <option value="pending">待审核</option>
        <option value="approved">已批准</option>
        <option value="processing">计算中</option>
        <option value="completed">已完成</option>
        <option value="failed">已失败</option>
        <option value="rejected">已拒绝</option>
      </select>
      <input v-model="filters.name" placeholder="任务名称模糊搜索" />
      <input v-model="filters.dataset_id" placeholder="数据集ID过滤" />
      <button @click="fetchTasks">搜索</button>
    </div>

    <!-- 任务表 -->
    <table class="task-table">
      <thead>
        <tr>
          <th>任务ID</th>
          <th>任务名称</th>
          <th>数据集ID</th>
          <th>任务类型</th>
          <th>状态</th>
          <th>上传时间</th>
          <th>操作</th>
          <th>下载</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in taskList" :key="task.task_id">
          <td>{{ task.task_id }}</td>
          <td>{{ task.name }}</td>
          <td>{{ task.dataset_id }}</td>
          <td>{{ task.task_type }}</td>
          <td>{{ statusLabel(task.status) }}</td>
          <td>{{ formatDate(task.submitted_at) }}</td>
          <td>
            <button @click="showTaskDetail(task.task_id)">查看任务详情</button>
            <button 
              v-if="['pending', 'approved', 'processing'].includes(task.status)" 
              @click="cancelTask(task.task_id)"
              class="btn-cancel"
            >
              取消
            </button>
          </td>
          <td>
            <button 
              v-if="task.status === 'completed'" 
              @click="downloadResult(task.task_id)"
              class="btn-download"
            >
              下载
            </button>
          </td>
        </tr>
        <tr v-if="taskList.length === 0">
          <td colspan="8" class="no-data">暂无任务</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.total_pages > 1">
      <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page <= 1">上一页</button>
      <span>第 {{ pagination.current_page }} 页 / 共 {{ pagination.total_pages }} 页</span>
      <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page >= pagination.total_pages">下一页</button>
    </div>

    <!-- 任务详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal">
        <div class="modal-header">
          <h3>任务详情</h3>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        <div class="modal-body" v-if="taskDetail">
          <p><strong>任务ID：</strong>{{ taskDetail.task_id }}</p>
          <p><strong>任务名称：</strong>{{ taskDetail.name }}</p>
          <p><strong>描述：</strong>{{ taskDetail.description || '无' }}</p>
          <p><strong>数据集ID：</strong>{{ taskDetail.dataset_id }}</p>
          <p><strong>任务类型：</strong>{{ taskDetail.task_type }}</p>
          <p><strong>参数：</strong>{{ JSON.stringify(taskDetail.parameters) }}</p>
          <p><strong>状态：</strong>{{ statusLabel(taskDetail.status) }}</p>
          <p><strong>进度：</strong>{{ taskDetail.progress?.percentage ?? 0 }}%，当前步骤: {{ taskDetail.progress?.current_step || '无' }}</p>
          <p><strong>提交时间：</strong>{{ formatDate(taskDetail.submitted_at) }}</p>
          <p><strong>最后更新时间：</strong>{{ formatDate(taskDetail.last_updated_at) }}</p>
          <p><strong>完成时间：</strong>{{ formatDate(taskDetail.completed_at) || '未完成' }}</p>
          <p v-if="taskDetail.error_info"><strong>错误信息：</strong>{{ JSON.stringify(taskDetail.error_info) }}</p>
          <p v-if="taskDetail.expression_details"><strong>表达式详情：</strong>{{ JSON.stringify(taskDetail.expression_details) }}</p>
          <p v-if="taskDetail.result_metadata">
            <strong>结果元数据：</strong>
            可用：{{ taskDetail.result_metadata.available }},
            大小：{{ (taskDetail.result_metadata.size_bytes / 1024).toFixed(2) }} KB,
            过期时间：{{ formatDate(taskDetail.result_metadata.expires_at) }}
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailModal">关闭</button>
        </div>
      </div>
    </div>

    <!-- 左下角固定按钮 -->
    <div class="fixed-bottom-left">
      <button @click="goDatasets" class="btn-fixed">查看可用数据集</button>
      <button @click="goRec" class="btn-fixed">REC验证与解密</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const token = localStorage.getItem('token') || ''

// 筛选条件
const filters = reactive({
  status: [],
  name: '',
  dataset_id: '',
  sort_by: 'submitted_at',
  order: 'desc',
  page: 1,
  limit: 20
})

const taskList = ref([])
const pagination = reactive({
  total_items: 0,
  total_pages: 1,
  current_page: 1,
  page_size: 20
})

const showDetailModal = ref(false)
const taskDetail = ref(null)

const apiBase = 'http://localhost:5000'

// 获取任务列表
const fetchTasks = async () => {
  try {
    // 状态转数组为逗号分隔字符串
    const statusParam = filters.status.length ? filters.status.join(',') : undefined

    const res = await axios.get(`${apiBase}/tasks/get_list`, {
      params: {
        status: statusParam,
        name: filters.name || undefined,
        dataset_id: filters.dataset_id || undefined,
        sort_by: filters.sort_by,
        order: filters.order,
        page: filters.page,
        limit: filters.limit
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const data = res.data || {}
taskList.value = data.tasks || []
Object.assign(pagination, {
  current_page: data.pagination?.current_page || 1,
  page_size: data.pagination?.page_size || 20,
  total_items: data.pagination?.total_items || 0,
  total_pages: data.pagination?.total_pages || 1
})
  } catch (error) {
    alert('获取任务列表失败')
    console.error(error)
  }
}

// 格式化状态中文
const statusLabel = (status) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已批准'
    case 'processing': return '计算中'
    case 'completed': return '已完成'
    case 'failed': return '已失败'
    case 'rejected': return '已拒绝'
    default: return status
  }
}

// 格式化日期
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString()
}

// 翻页
const changePage = (page) => {
  if (page < 1 || page > pagination.total_pages) return
  filters.page = page
  fetchTasks()
}

// 查看任务详情
const showTaskDetail = async (taskId) => {
  try {
    const res = await axios.get(`${apiBase}/tasks/get_task_detail`, {
      params: { task_id: taskId, include: 'expression' },
      headers: { Authorization: `Bearer ${token}` }
    })
    taskDetail.value = res.data || null
    showDetailModal.value = true
  } catch (error) {
    alert('获取任务详情失败')
    console.error(error)
  }
}

// 关闭详情弹窗
const closeDetailModal = () => {
  showDetailModal.value = false
  taskDetail.value = null
}

// 取消任务
const cancelTask = async (taskId) => {
  if (!confirm('确定要取消该任务吗？')) return
  try {
    const res = await axios.post(`${apiBase}/tasks/cancle`, null, {
      params: { task_id: taskId },
      headers: { Authorization: `Bearer ${token}` }
    })
    alert(res.data.message || '任务取消成功')
    fetchTasks()
  } catch (error) {
    alert('取消任务失败')
    console.error(error)
  }
}

// 下载任务结果
const downloadResult = async (taskId) => {
  try {
    const res = await axios.get(`${apiBase}/tasks/result`, {
      params: { task_id: taskId },
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    })

    // 触发浏览器下载
    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `task_result_${taskId}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载结果失败')
    console.error(error)
  }
}

// 左下角按钮跳转
const goDatasets = () => {
  router.push('/datasets')
}
const goRec = () => {
  router.push('/rec')
}

onMounted(fetchTasks)
</script>

<style scoped>
.consumer-homepage {
  max-width: 1100px;
  margin: 20px auto 60px;
  padding: 24px 36px;
  background: #FFFDEC;
  border-radius: 16px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  min-height: 90vh;

}

.page-title {
  text-align: center;
  font-size: 28px;
  color: #6970b5;
  margin-bottom: 28px;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
}

.filter-bar select,
.filter-bar input {
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 8px;
  border: 1.5px solid #6970b5;
  background-color: white;
  color: #333;
  min-width: 160px;
  outline: none;
  transition: border 0.3s;
}

.filter-bar select[multiple] {
  height: 100px;
  overflow-y: auto;
}

.filter-bar button {
  padding: 8px 18px;
  background-color: #6970b5;
  border: none;
  color: white;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.filter-bar button:hover {
  background-color: #5259a4;
}

.task-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  background-color: white;
}

.task-table th,
.task-table td {
  border: 1px solid #eee;
  padding: 12px 10px;
  text-align: center;
  vertical-align: middle;
}

.task-table th {
  background-color: #6970b5;
  color: white;
  font-weight: 600;
}

.task-table td {
  background-color: #fff;
}

.btn-cancel {
  background-color: #ffe2e2;
  color: #a94442;
  border: 1px solid #f5c6c6;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-cancel:hover {
  background-color: #fbd4d4;
}

.btn-download {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-download:hover {
  background-color: #5259a4;
}

.no-data {
  font-style: italic;
  color: #999;
  text-align: center;
  padding: 20px 0;
  background-color: #fff;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-weight: 500;
  color: #6970b5;
  margin-top: 10px;
}

.pagination button {
  background-color: #6970b5;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pagination button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background-color: #5259a4;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal {
  background-color: white;
  border-radius: 12px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px 28px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.close-btn {
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  color: #6970b5;
}

.modal-body p {
  margin-bottom: 8px;
  word-break: break-word;
}

.modal-footer {
  text-align: right;
  margin-top: 20px;
}

.fixed-bottom-left {
  position: fixed;
  left: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
}

.btn-fixed {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-fixed:hover {
  background-color: #5259a4;
}

</style>
