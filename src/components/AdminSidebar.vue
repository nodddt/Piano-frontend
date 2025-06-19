<template>
  <nav class="sidebar">
    <ul>
      <li :class="{ active: active === 'user' }" @click="$emit('changeTab', 'user')">用户管理</li>
      <li :class="{ active: active === 'dataset' }" @click="$emit('changeTab', 'dataset')">数据集管理</li>
      <li :class="{ active: active === 'task' }" @click="$emit('changeTab', 'task')">查看平台任务</li>
      <li :class="{ active: active === 'overview' }" @click="$emit('changeTab', 'overview')">概览数据</li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: 'AdminSidebar',
  props: ['active']
}
</script>

<style>
.sidebar {
  width: 200px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 0;
}
.sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sidebar li {
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
  user-select: none;
  transition: background-color 0.2s;
}
.sidebar li:hover {
  background-color: #e0e0e0;
}
.sidebar li.active {
  background-color: #1890ff;
  color: white;
  font-weight: bold;
}
</style>
