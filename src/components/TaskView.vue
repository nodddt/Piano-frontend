<template>
  <div class="task-management">
    <h2>平台任务管理</h2>

    <!-- 筛选区 -->
    <div class="filters">
      <select v-model="filters.status" @change="onFilterChange">
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="approved">已通过</option>
        <option value="processing">处理中</option>
        <option value="pending_computation">待计算</option>
        <option value="computing">计算中</option>
        <option value="completed">已完成</option>
        <option value="failed">失败</option>
      </select>

      <select v-model="filters.type" @change="onFilterChange">
        <option value="">全部类型</option>
        <option value="row_wise">行级任务</option>
        <option value="aggregation">聚合任务</option>
        <option value="cross_row_polynomial">跨行多项式</option>
      </select>

      <input
        v-model="filters.consumer_id"
        placeholder="消费者ID"
        @keyup.enter="fetchTasks"
      />

      <select v-model="filters.sort_by" @change="onFilterChange">
        <option value="create_time">创建时间</option>
        <option value="updated_time">更新时间</option>
        <option value="status">状态</option>
        <option value="type">类型</option>
      </select>

      <select v-model="filters.order" @change="onFilterChange">
        <option value="desc">降序</option>
        <option value="asc">升序</option>
      </select>

      <button @click="fetchTasks">搜索</button>
    </div>

    <!-- 任务列表 -->
    <table class="task-table">
      <thead>
        <tr>
          <th>任务ID</th>
          <th>名称</th>
          <th>消费者ID</th>
          <th>数据集ID</th>
          <th>类型</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>完成时间</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in tasks" :key="task.task_id">
          <td>{{ task.task_id }}</td>
          <td>{{ task.name }}</td>
          <td>{{ task.consumer_id }}</td>
          <td>{{ task.dataset_id }}</td>
          <td>{{ translateType(task.type) }}</td>
          <td>{{ task.status }}</td>
          <td>{{ formatDate(task.create_time) }}</td>
          <td>{{ formatDate(task.complete_time) }}</td>
          <td>{{ task.note || '-' }}</td>
        </tr>
        <tr v-if="tasks.length === 0">
          <td colspan="9" class="no-data">暂无任务数据</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页 -->
    <div class="pagination">
      <button :disabled="filters.page <= 1" @click="changePage(filters.page - 1)">上一页</button>
      <span>第 {{ filters.page }} 页 / 共 {{ totalPages }} 页</span>
      <button :disabled="filters.page >= totalPages" @click="changePage(filters.page + 1)">下一页</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskManagement',
  data() {
    return {
      tasks: [],
      totalPages: 1,
      filters: {
        status: '',
        type: '',
        consumer_id: '',
        sort_by: 'create_time',
        order: 'desc',
        page: 1,
        limit: 20,
      },
    }
  },
  mounted() {
    this.fetchTasks()
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const dt = new Date(dateStr)
      return dt.toLocaleString()
    },
    translateType(type) {
      const map = {
        row_wise: '行级任务',
        aggregation: '聚合任务',
        cross_row_polynomial: '跨行多项式',
      }
      return map[type] || type
    },
    fetchTasks() {
  const params = new URLSearchParams()
  if (this.filters.status) params.append('status', this.filters.status)
  if (this.filters.type) params.append('type', this.filters.type)
  if (this.filters.consumer_id) params.append('consumer_id', this.filters.consumer_id)
  params.append('sort_by', this.filters.sort_by)
  params.append('order', this.filters.order)
  params.append('page', this.filters.page)
  params.append('limit', this.filters.limit)

  const token = localStorage.getItem('token') // ✅ 从本地获取 token

  fetch(`http://localhost:5000/admin/tasks?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // ✅ 携带 token
    },
  })
    .then(async res => {
      if (!res.ok) throw new Error(`请求失败，状态码: ${res.status}`)
      return res.json()
    })
    .then(data => {
      this.tasks = data.results || []
      this.totalPages = data.total_pages || 1
      if (this.filters.page > this.totalPages) {
        this.filters.page = this.totalPages || 1
        this.fetchTasks()
      }
    })
    .catch(err => {
      alert('获取任务列表失败: ' + err.message)
    })
},
    changePage(newPage) {
      if (newPage < 1 || newPage > this.totalPages) return
      this.filters.page = newPage
      this.fetchTasks()
    },
    onFilterChange() {
      this.filters.page = 1
      this.fetchTasks()
    },
  },
}
</script>

<style>
.task-management {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background-color: #FFFDEC;
  border-radius: 12px;

  color: #3f4174;
}

h2 {
  margin-bottom: 24px;
  font-weight: 700;
  color: #6970b5;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
  align-items: center;
}

.filters input,
.filters select {
  padding: 8px 14px;
  font-size: 14px;
  border: 1.5px solid #FFE2E2;
  border-radius: 8px;
  background-color: #fff;
  color: #5a5a8a;
  transition: border-color 0.3s ease;
  min-width: 140px;
}

.filters input:focus,
.filters select:focus {
  outline: none;
  border-color: #6970b5;
  box-shadow: 0 0 6px #6970b5aa;
}

.filters button {
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  background-color: #6970b5;
  color: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 3px 8px #6970b580;
  transition: background-color 0.3s ease;
}

.filters button:hover {
  background-color: #545da8;
}

.task-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
  margin-bottom: 20px;
  background-color: transparent;
}

.task-table th {
  background-color: transparent;
  color: #5a5a8a;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 2px solid #FFE2E2;
}

.task-table td {
  background-color: #fff;
  padding: 14px 16px;
  font-size: 14px;
  color: #3f4174;
  box-shadow: 0 2px 6px #FFE2E2;
  border-radius: 8px;
}

.task-table tr {
  border-radius: 8px;
}

.no-data {
  text-align: center;
  color: #a9a9c7;
  font-style: italic;
  padding: 20px 0;
  font-weight: 600;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  margin-bottom: 25px;
  color: #5a5a8a;
  font-weight: 600;
}

.pagination button {
  padding: 8px 16px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background-color: #6970b5;
  color: white;
  box-shadow: 0 3px 8px #6970b580;
  transition: background-color 0.3s ease;
}

.pagination button:disabled {
  background-color: #dcd6b8;
  color: #aaa;
  cursor: not-allowed;
  box-shadow: none;
}

.pagination button:hover:not(:disabled) {
  background-color: #545da8;
}

</style>
