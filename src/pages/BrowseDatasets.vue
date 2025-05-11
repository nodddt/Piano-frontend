<template>
    <div>
      <h2>可用数据集</h2>
      <ul>
        <li v-for="ds in datasets" :key="ds.id">
          {{ ds.name }} - {{ ds.desc }}
          <button @click="view(ds.id)">查看详情</button>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  const datasets = [
    { id: 1, name: '健康数据', desc: '匿名统计数据' },
    { id: 2, name: '交通数据', desc: '城市交通流量' },
  ]
  const router = useRouter()
  function view(id) {
    router.push(`/datasets/${id}`)
  }
  </script>
  