<template>
  <div class="admin-home">
    <AdminSidebar
      :active="activeTab"
      @changeTab="activeTab = $event"
    />
    <div class="content-area">
      <UserManagement v-if="activeTab === 'user'" />
      <DatasetManagement v-else-if="activeTab === 'dataset'" />
      <TaskView v-else-if="activeTab === 'task'" />
      <OverviewDashboard v-else-if="activeTab === 'overview'" />
      <div v-else class="placeholder">请选择左侧功能</div>
    </div>
  </div>
</template>
<script>
import AdminSidebar from '@/components/AdminSidebar.vue'
import UserManagement from '@/components/UserManagement.vue'
import DatasetManagement from '@/components/DatasetManagement.vue'
import TaskView from '@/components/TaskView.vue'
import OverviewDashboard from '@/components/OverviewDashboard.vue'
export default {
  name: 'AdminHome',
  components: {
    AdminSidebar,
    UserManagement,
    DatasetManagement,
    TaskView,
    OverviewDashboard
  },
  data() {
    return {
      activeTab: 'user' // 默认显示用户管理
    }
  }
}
</script>
<style>
.admin-home {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
}
.content-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.placeholder {
  font-size: 16px;
  color: #666;
  margin-top: 20px;
}
</style>