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
  background-color: #FFFDEC;
  border-right: 1px solid #dcd6b8;
  padding: 0;
  box-shadow: 2px 0 8px rgba(105, 112, 181, 0.1);
}

.sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar li {
  padding: 16px 24px;
  cursor: pointer;
  border-bottom: 1px solid #fff1f1;
  user-select: none;
  transition: background-color 0.3s ease, color 0.3s ease;
  color: #6970b5;
  font-weight: 600;
  border-radius: 0 20px 20px 0;
}

.sidebar li:hover {
  background-color: #FFE2E2;
  color: #5a5a8a;
}

.sidebar li.active {
  background-color: #6970b5;
  color: #fff;
  font-weight: 700;
  box-shadow: 4px 0 12px rgba(105, 112, 181, 0.4);
}

</style>
