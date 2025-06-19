<template>
  <div class="user-management">
    <h2>用户管理</h2>

    <!-- 筛选区域 -->
    <div class="filters">
      <input
        v-model="filters.username"
        placeholder="用户名模糊搜索"
        @keyup.enter="fetchUsers"
      />

      <select v-model="filters.role" @change="onFilterChange">
        <option value="">全部角色</option>
        <option value="data_consumer">数据使用者</option>
        <option value="dataset_provider">数据提供方</option>
      </select>

      <select v-model="filters.status" @change="onFilterChange">
        <option value="">全部状态</option>
        <option value="active">激活</option>
        <option value="disabled">禁用</option>
        <option value="pending_approval">待审批</option>
      </select>

      <select v-model="filters.sort_by" @change="onFilterChange">
        <option value="register_time">注册时间</option>
        <option value="username">用户名</option>
      </select>

      <select v-model="filters.order" @change="onFilterChange">
        <option value="desc">降序</option>
        <option value="asc">升序</option>
      </select>

      <button @click="fetchUsers">搜索</button>
    </div>

    <!-- 用户列表表格 -->
    <table class="user-table">
      <thead>
        <tr>
          <th>用户ID</th>
          <th>用户名</th>
          <th>邮箱</th>
          <th>角色</th>
          <th>注册时间</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.user_id">
          <td>{{ user.user_id }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.email }}</td>
          <td>{{ roleMap[user.role] || user.role }}</td>
          <td>{{ formatDate(user.register_time) }}</td>
          <td>{{ user.is_active ? '激活' : '禁用' }}</td>
          <td>
            <button @click="toggleUserStatus(user)">
              {{ user.is_active ? '禁用' : '激活' }}
            </button>
          </td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="7" class="no-data">暂无用户数据</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页 -->
    <div class="pagination">
      <button :disabled="filters.page <= 1" @click="changePage(filters.page - 1)">上一页</button>
      <span>第 {{ filters.page }} 页 / 共 {{ totalPages }} 页</span>
      <button :disabled="filters.page >= totalPages" @click="changePage(filters.page + 1)">下一页</button>
    </div>

    <!-- 新增管理员账号按钮 -->
    <button class="btn-add-admin" @click="showAddAdminModal = true">增加管理员账号</button>

    <!-- 新增管理员账号弹窗 -->
    <div v-if="showAddAdminModal" class="modal-overlay" @click.self="closeAddAdminModal">
      <div class="modal">
        <h3>新增管理员账号</h3>
        <form @submit.prevent="submitAddAdmin">
          <label>
            管理员ID:
            <input v-model="newAdmin.internal_id" type="text" required />
          </label>
          <label>
            用户名:
            <input v-model="newAdmin.username" type="text" required />
          </label>
          <label>
            密码:
            <input v-model="newAdmin.password" type="password" required />
          </label>
          <div class="modal-actions">
            <button type="submit">提交</button>
            <button type="button" @click="closeAddAdminModal">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserManagement',
  data() {
    return {
      users: [],
      totalPages: 1,
      filters: {
        username: '',
        role: '',
        status: '',
        sort_by: 'register_time',
        order: 'desc',
        page: 1,
        limit: 20,
      },
      roleMap: {
        data_consumer: '数据使用者',
        dataset_provider: '数据提供方',
      },
      showAddAdminModal: false,
      newAdmin: {
        internal_id: '',
        username: '',
        password: '',
      },
    }
  },
  mounted() {
    this.fetchUsers()
  },
  methods: {
    getAuthHeaders() {
        const token = localStorage.getItem('token')
        return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
        }
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const dt = new Date(dateStr)
      return dt.toLocaleString()
    },
    fetchUsers() {
        const params = new URLSearchParams()
        if (this.filters.username) params.append('username', this.filters.username)
        if (this.filters.role) params.append('role', this.filters.role)
        if (this.filters.status) params.append('status', this.filters.status)
        params.append('sort_by', this.filters.sort_by)
        params.append('order', this.filters.order)
        params.append('page', this.filters.page)
        params.append('limit', this.filters.limit)

        fetch(`http://localhost:5000/admin/users?${params.toString()}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        })
            .then(async res => {
            if (!res.ok) throw new Error(`请求失败，状态码: ${res.status}`)
            return res.json()
            })
            .then(data => {
            this.users = data.results || []
            this.totalPages = data.total_pages || 1
            if (this.filters.page > this.totalPages) {
                this.filters.page = this.totalPages || 1
                this.fetchUsers()
            }
            })
            .catch(err => {
            alert('获取用户列表失败: ' + err.message)
            })
        },
    changePage(newPage) {
      if (newPage < 1 || newPage > this.totalPages) return
      this.filters.page = newPage
      this.fetchUsers()
    },
    onFilterChange() {
      this.filters.page = 1
      this.fetchUsers()
    },
    toggleUserStatus(user) {
  const userId = user.user_id
  const newStatus = user.is_active ? 'disabled' : 'active'
  fetch(`http://localhost:5000/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: this.getAuthHeaders(),
    body: JSON.stringify({ status: newStatus }),
  })
    .then(async res => {
      if (!res.ok) throw new Error(`请求失败，状态码: ${res.status}`)
      const data = await res.json()
      if (data.code === 200) {
        alert(data.message)
        this.fetchUsers()
      } else {
        alert('状态更新失败: ' + data.message)
      }
    })
    .catch(err => {
      alert('更新用户状态失败: ' + err.message)
    })
},
    submitAddAdmin() {
  const { internal_id, username, password } = this.newAdmin
  if (!internal_id.trim() || !username.trim() || !password) {
    alert('请填写完整的管理员账号信息')
    return
  }

  fetch('http://localhost:5000/auth/internal-register', {
    method: 'POST',
    headers: this.getAuthHeaders(),
    body: JSON.stringify({
      internal_id: internal_id.trim(),
      username: username.trim(),
      password,
      role: 'admin',
    }),
  })
    .then(async res => {
      if (!res.ok) throw new Error(`请求失败，状态码: ${res.status}`)
      const data = await res.json()
      if (data.code === 200) {
        alert('管理员账号创建成功')
        this.closeAddAdminModal()
        this.fetchUsers()
      } else {
        alert('创建失败: ' + data.message)
      }
    })
    .catch(err => {
      alert('创建管理员账号失败: ' + err.message)
    })
},
    closeAddAdminModal() {
      this.showAddAdminModal = false
      this.newAdmin.internal_id = ''
      this.newAdmin.username = ''
      this.newAdmin.password = ''
    },
  },
}
</script>

<style>
.user-management {
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

.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.user-table th,
.user-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  font-size: 14px;
  text-align: left;
}

.user-table th {
  background-color: #f3f3f3;
}

.user-table button {
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  border-radius: 3px;
  background-color: #1890ff;
  color: white;
  transition: background-color 0.2s ease;
}

.user-table button:hover {
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

/* 新增管理员按钮 */
.btn-add-admin {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  float: right;
}

.btn-add-admin:hover {
  background-color: #1e7e34;
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
  width: 360px;
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

.modal input {
  width: 100%;
  padding: 8px 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
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
