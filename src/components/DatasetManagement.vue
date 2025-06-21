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
  padding: 8px 12px;
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

.filters label {
  display: flex;
  align-items: center;
  font-size: 14px;
  gap: 6px;
  user-select: none;
  color: #5a5a8a;
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

.dataset-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
  margin-bottom: 20px;
  background-color: transparent;
}

.dataset-table th {
  background-color: transparent;
  color: #5a5a8a;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 2px solid #FFE2E2;
}

.dataset-table td {
  background-color: #fff;
  padding: 14px 16px;
  font-size: 14px;
  color: #3f4174;
  box-shadow: 0 2px 6px #FFE2E2;
  border-radius: 8px;
}

.dataset-table tr {
  border-radius: 8px;
}

.dataset-table button {
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: #FFE2E2;
  color: #6970b5;
  font-weight: 600;
  box-shadow: 0 2px 8px #ffcbcb90;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.dataset-table button:hover {
  background-color: #6970b5;
  color: #fff;
  box-shadow: 0 4px 12px #6970b5cc;
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

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(105, 112, 181, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal {
  background-color: #FFFDEC;
  padding: 28px 32px;
  border-radius: 14px;
  width: 400px;
  box-shadow: 0 6px 18px rgba(105, 112, 181, 0.3);
  color: #3f4174;
  font-weight: 600;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 22px;
  font-size: 22px;
  font-weight: 700;
  color: #6970b5;
}

.modal label {
  display: block;
  margin-bottom: 18px;
  font-size: 15px;
  color: #5a5a8a;
}

.modal select,
.modal textarea {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  border: 1.5px solid #FFE2E2;
  border-radius: 10px;
  box-sizing: border-box;
  resize: vertical;
  background-color: #fff;
  color: #5a5a8a;
  transition: border-color 0.3s ease;
}

.modal select:focus,
.modal textarea:focus {
  outline: none;
  border-color: #6970b5;
  box-shadow: 0 0 8px #6970b5aa;
}

.modal-actions {
  text-align: right;
  margin-top: 24px;
}

.modal-actions button {
  padding: 9px 20px;
  font-size: 15px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.3s ease;
}

.modal-actions button[type="submit"] {
  background-color: #6970b5;
  color: #fff;
  margin-right: 14px;
  box-shadow: 0 4px 14px #6970b5cc;
}

.modal-actions button[type="submit"]:hover {
  background-color: #545da8;
}

.modal-actions button[type="button"] {
  background-color: #FFE2E2;
  color: #6970b5;
  box-shadow: 0 4px 14px #ffcbcb90;
}

.modal-actions button[type="button"]:hover {
  background-color: #f6c7c7;
}

</style>
