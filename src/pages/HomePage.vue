<template>
  <div id="vanta-container" ref="vantaRef" class="vanta-bg">
    <!-- 🟡 左上角标题 -->
    <div class="title-box">
      <h1 class="main-title">Piano隐私计算平台</h1>
      <p class="subtitle">安全、高效的多方数据协同计算平台</p>
    </div>

    <!-- 🔵 可折叠的核心功能 -->
    <div class="feature-box">
      <button @click="toggleFeatures" class="accordion-btn">
        核心功能
        <span>{{ showFeatures ? '▲' : '▼' }}</span>
      </button>
      <ul v-if="showFeatures" class="feature-list">
        <li>多方安全计算</li>
        <li>密文计算与零知识证明</li>
        <li>大模型辅助表达式转换</li>
        <li>任务调度与全流程审计</li>
      </ul>
    </div>

    <!-- 🟢 底部横向按钮栏 -->
    <div class="bottom-bar">
      <button @click="router.push('/datasets')" class="bar-button">查看可用数据集</button>
      <button @click="router.push('/convert-expression')" class="bar-button">表达式转换</button>
      <button @click="router.push('/login')" class="bar-button">外部登录/注册</button>
    </div>

    <!-- 🔒 右上角内部登录按钮 -->
    <div class="internal-login-fab" @click="router.push('/internal-login')" title="内部登录入口">
      🔒
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import GLOBE from 'vanta/dist/vanta.globe.min'

const router = useRouter()
const vantaRef = ref(null)
let vantaEffect = null

const showFeatures = ref(false)
const toggleFeatures = () => (showFeatures.value = !showFeatures.value)

onMounted(() => {
  if (!vantaEffect) {
    vantaEffect = GLOBE({
      el: vantaRef.value,
      THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,

      color:0xFFCFCF,
      color2:0xFFFDEC,
      backgroundColor:0x6970B5
    })
  }
})

onBeforeUnmount(() => {
  if (vantaEffect) vantaEffect.destroy()
})
</script>

<style scoped>
.vanta-bg {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 🟡 左上角标题 */
.title-box {
  position: absolute;
  top: 80px;
  left: 80px;
  color: #FFE2E2;
}
.main-title {
  font-size: 60px;
  font-weight: bold;
  margin-bottom: 4px;
}
.subtitle {
  font-size: 16px;
  opacity: 0.8;
}

/* 🔵 可折叠核心功能 */
.feature-box {
  position: absolute;
  top: 270px;
  left: 80px;
  color: #FFE2E2;
}
.accordion-btn {
  background-color: rgba(255, 255, 255, 0.1);
  color: #FFE2E2;
  border: 1px solid #FFE2E2;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 8px;
}
.feature-list {
  margin-top: 10px;
  padding-left: 20px;
  list-style: disc;
  animation: fadeIn 0.5s ease;
}

/* 🟢 底部横向按钮栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width:100%;
  display: flex;
  padding: 30px 0;
  background-color:#FFFDEC;
  align-items: center;
  justify-content: space-around;
  z-index: 99;
}
.bar-button {
  background: #6970b5;
  color: white;
  padding: 15px 70px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size:16px;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}
.bar-button:hover {
  background-color: #799e7c;
  transform: scale(1.05);
}

/* 🔒 内部登录图标（右上角） */
.internal-login-fab {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.4);
  color: white;
  font-size: 20px;
  padding: 10px 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.internal-login-fab:hover {
  background-color: rgba(0, 0, 0, 0.6);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
