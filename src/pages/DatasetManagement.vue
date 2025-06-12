<template>
  <div class="dataset-management">
    <h2>数据集管理主页</h2>

    <!-- 数据集注册表单 -->
    <section class="register-form">
      <h3>注册新数据集</h3>
      <input v-model="newDataset.name" placeholder="数据集名称" />
      <textarea v-model="newDataset.description" placeholder="数据集描述"></textarea>
      <input v-model.number="newDataset.row_count" placeholder="数据量" type="number" />
      <select v-model="newDataset.privacy_level">
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>

      <h4>字段信息</h4>
      <div v-for="(field, index) in newDataset.fields" :key="index" class="field-item">
        <input v-model="field.name" placeholder="字段名" />
        <select v-model="field.type">
          <option value="string">字符串</option>
          <option value="number">数字</option>
          <option value="boolean">布尔</option>
        </select>
        <label>
          敏感：<input type="checkbox" v-model="field.is_sensitive" />
        </label>
        <button @click="removeField(index)">移除</button>
      </div>
      <button @click="addField">添加字段</button>
      <button @click="submitDataset">提交数据集</button>
    </section>

    <!-- 数据集列表 -->
    <section class="dataset-list">
      <h3>我提交的数据集</h3>
      <input v-model="searchParams.name" placeholder="搜索名称" />
      <button @click="fetchDatasets">搜索</button>

      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>描述</th>
            <th>记录数</th>
            <th>隐私级别</th>
            <th>审核状态</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dataset in datasetList" :key="dataset.id">
            <td>{{ dataset.name }}</td>
            <td>{{ dataset.description }}</td>
            <td>{{ dataset.row_count }}</td>
            <td>{{ dataset.privacy_level }}</td>
            <td>{{ dataset.review_status }}</td>
            <td>{{ dataset.status || 'available' }}</td>
            <td>
              <button @click="viewDetail(dataset.id)">查看详情</button>
              <button @click="editDescription(dataset)">编辑描述</button>
              <button @click="archiveDataset(dataset.id)">存档</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <button @click="goHome">返回主页</button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()

// 新建数据集
const newDataset = reactive({
  name: '',
  description: '',
  row_count: 0,
  privacy_level: 'medium',
  fields: []
})

const addField = () => {
  newDataset.fields.push({ name: '', type: 'string', is_sensitive: false })
}

const removeField = (index) => {
  newDataset.fields.splice(index, 1)
}

const submitDataset = async () => {
  try {
    await request.post('/datasets', newDataset)
    alert('提交成功')
    fetchDatasets()
  } catch (err) {
    alert('提交失败')
    console.error(err)
  }
}

// 查询数据集列表
const searchParams = reactive({
  name: '',
  sort_by: 'upload_time',
  order: 'desc',
  page: 1,
  limit: 20
})

const datasetList = ref([])

const fetchDatasets = async () => {
  try {
    const res = await request.get('/datasets/my', {
      params: searchParams
    })
    datasetList.value = res.data.datasets || []
  } catch (err) {
    alert('获取数据集失败')
    console.error(err)
  }
}

// 查看详情跳转
const viewDetail = (id) => {
  router.push({ path: '/dataset-detail', query: { id } })
}

// 编辑描述
const editDescription = async (dataset) => {
  const newDesc = prompt('请输入新的描述：', dataset.description)
  if (newDesc !== null && newDesc !== dataset.description) {
    try {
      await request.put('/datasets/update_db', {
        dataset_id: dataset.id,
        description: newDesc
      })
      alert('描述更新成功')
      fetchDatasets()
    } catch (err) {
      alert('描述更新失败')
      console.error(err)
    }
  }
}

// 软删除（存档）数据集
const archiveDataset = async (datasetId) => {
  if (!confirm('确定要存档该数据集吗？')) return
  try {
    await request.delete('/datasets/del_db', {
      data: { dataset_id: datasetId }
    })
    alert('数据集已存档')
    fetchDatasets()
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      alert(`存档失败：${err.response.data.message}`)
    } else {
      alert('存档失败，可能存在挂起任务')
    }
    console.error(err)
  }
}

const goHome = () => {
  router.push('/')
}

onMounted(() => {
  fetchDatasets()
})
</script>

<style scoped>
.dataset-management {
  padding: 20px;
}
.register-form,
.dataset-list {
  margin-top: 30px;
}
.field-item {
  margin-bottom: 10px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th,
td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}
</style>
