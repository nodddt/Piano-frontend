<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view />
  </div>
  
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}

router-view {
  position: relative;
  z-index: 10; /* 确保内容层高于背景 */
}

/* 如果你的VantaEffect组件根容器使用 id="vanta-container"，这里保证它铺满 */
#vanta-container {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 0 !important; /* 保证在内容下方 */
}
</style>
