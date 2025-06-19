<template>
  <div class="dataset-management">
    <h2>数据集管理</h2>

    <!-- 筛选区域 -->
    <div class="filters">
      <input
        v-model="filters.name"
        placeholder="数据集名称模糊搜索"
        @keyup.enter="fetchDatasets"
      />

      <input
        v-model="filters.provider_id"
        placeholder="提供者用户ID"
        @keyup.enter="fetchDatasets"
      />

      <select v-model="filters.status" @change="onFilterChange">
        <option value="">全部状态</option>
        <option value="pending">待审核</option>
        <option value="approved">已通过</option>
        <option value="rejected">已拒绝</option>
        <option value="unavailable">不可用</option>
      </select>

      <select v-model="filters.sort_by" @change="onFilterChange">
        <option value="upload_time">上传时间</option>
        <option value="name">名称</option>
        <option value="status">状态</option>
      </select>

      <select v-model="filters.order" @change="onFilterChange">
        <option value="desc">降序</option>
        <option value="asc">升序</option>
      </select>

      <label>
        <input type="checkbox" v-model="onlyPending" @change="toggleOnlyPending" />
        仅显示未审核数据集
      </label>

      <button @click="fetchDatasets">搜索</button>
    </div>

    <!-- 数据集列表表格 -->
    <table class="dataset-table">
      <thead>
        <tr>
          <th>数据集ID</th>
          <th>名称</th>
          <th>提供者</th>
          <th>状态</th>
          <th>上传时间</th>
          <th>隐私级别</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dataset in datasets" :key="dataset.dataset_id">
          <td>{{ dataset.dataset_id }}</td>
          <td>{{ dataset.name }}</td>
          <td>{{ dataset.provider_id }}</td>
          <td>{{ dataset.status }}</td>
          <td>{{ formatDate(dataset.upload_time) }}</td>
          <td>{{ dataset.privacy_level }}</td>
          <td>
            <button
              v-if="dataset.status === 'pending'"
              @click="openReviewModal(dataset)"
            >
              审核
            </button>
          </td>
        </tr>
        <tr v-if="datasets.length === 0">
          <td colspan="7" class="no-data">暂无数据集</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页 -->
    <div class="pagination">
      <button :disabled="filters.page <= 1" @click="changePage(filters.page - 1)">上一页</button>
      <span>第 {{ filters.page }} 页 / 共 {{ totalPages }} 页</span>
      <button :disabled="filters.page >= totalPages" @click="changePage(filters.page + 1)">下一页</button>
    </div>

    <!-- 审核弹窗 -->
    <div
      v-if="showReviewModal"
      class="modal-overlay"
      @click.self="closeReviewModal"
    >
      <div class="modal">
        <h3>审核数据集 - {{ reviewDataset?.name }}</h3>
        <form @submit.prevent="submitReview">
          <label>
            审核结果:
            <select v-model="reviewForm.review_status" required>
              <option value="" disabled>请选择</option>
              <option value="approved">通过</option>
              <option value="rejected">拒绝</option>
            </select>
          </label>
          <label>
            评价:
            <textarea v-model="reviewForm.comments" rows="4" placeholder="请输入评价内容"></textarea>
          </label>
          <div class="modal-actions">
            <button type="submit">提交</button>
            <button type="button" @click="closeReviewModal">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DatasetManagement',
  data() {
    return {
      datasets: [],
      totalPages: 1,
      filters: {
        name: '',
        provider_id: '',
        status: '',
        sort_by: 'upload_time',
        order: 'desc',
        page: 1,
        limit: 20,
      },
      onlyPending: false,
      showReviewModal: false,
      reviewDataset: null,
      reviewForm: {
        review_status: '',
        comments: '',
      },
    }
  },
  mounted() {
    this.fetchDatasets()
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const dt = new Date(dateStr)
      return dt.toLocaleString()
    },
    fetchDatasets() {
  const params = new URLSearchParams()
  if (this.filters.name) params.append('name', this.filters.name)
  if (this.filters.provider_id) params.append('provider_id', this.filters.provider_id)
  if (this.filters.status) params.append('status', this.filters.status)
  params.append('sort_by', this.filters.sort_by)
  params.append('order', this.filters.order)
  params.append('page', this.filters.page)
  params.append('limit', this.filters.limit)

  const token = localStorage.getItem('token') // ✅ 取出 token

  fetch(`http://localhost:5000/admin/datasets?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // ✅ 添加 Authorization 头
    },
  })
    .then(async res => {
      if (!res.ok) throw new Error(`请求失败，状态码: ${res.status}`)
      return res.json()
    })
    .then(data => {
      this.datasets = data.results || []
      this.totalPages = data.total_pages || 1
      if (this.filters.page > this.totalPages) {
        this.filters.page = this.totalPages || 1
        this.fetchDatasets()
      }
    })
    .catch(err => {
      alert('获取数据集列表失败: ' + err.message)
    })
},
    changePage(newPage) {
      if (newPage < 1 || newPage > this.totalPages) return
      this.filters.page = newPage
      this.fetchDatasets()
    },
    onFilterChange() {
      this.filters.page = 1
      this.fetchDatasets()
    },
    toggleOnlyPending() {
      this.filters.status = this.onlyPending ? 'pending' : ''
      this.filters.page = 1
      this.fetchDatasets()
    },
    openReviewModal(dataset) {
      this.reviewDataset = dataset
      this.reviewForm.review_status = ''
      this.reviewForm.comments = ''
      this.showReviewModal = true
    },
    closeReviewModal() {
      this.showReviewModal = false
      this.reviewDataset = null
    },
    submitReview() {
  if (!this.reviewForm.review_status) {
    alert('请选择审核结果')
    return
  }

  const token = localStorage.getItem('token') // ✅ 取出 token

  fetch(`http://localhost:5000/admin/datasets/${this.reviewDataset.dataset_id}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // ✅ 添加 Authorization 头
    },
    body: JSON.stringify({
      review_status: this.reviewForm.review_status,
      comments: this.reviewForm.comments,
    }),
  })
    .then(async res => {
      if (!res.ok) throw new Error(`请求失败，状态码: ${res.status}`)
      const data = await res.json()
      if (data.code === 200) {
        alert('审核成功')
        this.closeReviewModal()
        this.fetchDatasets()
      } else {
        alert('审核失败: ' + data.message)
      }
    })
    .catch(err => {
      alert('提交审核失败: ' + err.message)
    })
}
,
  },
}
</script>

<style>
.dataset-management {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h2 {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
  align-items: center;
}

.filters input,
.filters select {
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 130px;
}

.filters label {
  display: flex;
  align-items: center;
  font-size: 14px;
  gap: 6px;
  user-select: none;
}

.filters button {
  padding: 6px 14px;
  font-size: 14px;
  cursor: pointer;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.filters button:hover {
  background-color: #005ea3;
}

.dataset-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.dataset-table th,
.dataset-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  font-size: 14px;
  text-align: left;
}

.dataset-table th {
  background-color: #f3f3f3;
}

.dataset-table button {
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  border-radius: 3px;
  background-color: #1890ff;
  color: white;
  transition: background-color 0.2s ease;
}

.dataset-table button:hover {
  background-color: #0f78d1;
}

.no-data {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 15px 0;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  margin-bottom: 15px;
}

.pagination button {
  padding: 6px 12px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background-color: #007acc;
  color: white;
  transition: background-color 0.2s ease;
}

.pagination button:disabled {
  background-color: #bbb;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background-color: #005ea3;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal {
  background-color: white;
  padding: 24px 28px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.25);
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 18px;
  font-size: 20px;
  font-weight: 600;
}

.modal label {
  display: block;
  margin-bottom: 14px;
  font-size: 14px;
  color: #333;
}

.modal select,
.modal textarea {
  width: 100%;
  padding: 8px 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  resize: vertical;
}

.modal-actions {
  text-align: right;
  margin-top: 20px;
}

.modal-actions button {
  padding: 7px 16px;
  font-size: 14px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.modal-actions button[type="submit"] {
  background-color: #007acc;
  color: white;
  margin-right: 10px;
  transition: background-color 0.2s ease;
}

.modal-actions button[type="submit"]:hover {
  background-color: #005ea3;
}

.modal-actions button[type="button"] {
  background-color: #eee;
}

.modal-actions button[type="button"]:hover {
  background-color: #ccc;
}
</style>
