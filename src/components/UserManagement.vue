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

.user-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
  margin-bottom: 20px;
  background-color: transparent;
}

.user-table th {
  background-color: transparent;
  color: #5a5a8a;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 2px solid #FFE2E2;
}

.user-table td {
  background-color: #fff;
  padding: 14px 16px;
  font-size: 14px;
  color: #3f4174;
  box-shadow: 0 2px 6px #FFE2E2;
  border-radius: 8px;
}

.user-table tr {
  border-radius: 8px;
}

.user-table button {
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

.user-table button:hover {
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

/* 新增管理员按钮 */
.btn-add-admin {
  background-color: #FFE2E2;
  color: #6970b5;
  border: none;
  padding: 10px 22px;
  cursor: pointer;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 4px 10px #ffcbcb90;
  float: right;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.btn-add-admin:hover {
  background-color: #6970b5;
  color: #fff;
  box-shadow: 0 6px 16px #6970b5cc;
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
  width: 380px;
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

.modal input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  border: 1.5px solid #FFE2E2;
  border-radius: 10px;
  box-sizing: border-box;
  background-color: #fff;
  color: #5a5a8a;
  transition: border-color 0.3s ease;
}

.modal input:focus {
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
