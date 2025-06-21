<template>
  <div class="submit-task">
    <h2>提交计算任务</h2>

    <form @submit.prevent="handleSubmit">

      <div class="form-group">
        <label for="taskName">任务名称 <span style="color:red">*</span></label>
        <input id="taskName" v-model="taskName" type="text" required />
      </div>

      <div class="form-group">
        <label for="taskType">任务类型 <span style="color:red">*</span></label>
        <select id="taskType" v-model="taskType" required>
          <option value="" disabled>请选择任务类型</option>
          <option value="row_wise">逐行计算 (row_wise)</option>
          <option value="aggregation">聚合计算 (aggregation)</option>
          <option value="cross_row_polynomial">跨行多项式 (cross_row_polynomial)</option>
        </select>
      </div>

      <div class="form-group">
        <label>计算表达式</label>
       <ExpressionEditor v-model="expressionDetails" />
      </div>
      <div class="form-group">
  <label>表达式预览（中缀形式）</label>
  <div style="padding: 8px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">
    {{ expressionPreview }}
  </div>
</div>

      <div class="form-group">
        <label for="precision">计算精度 (可选，默认0.001)</label>
        <input
          id="precision"
          type="number"
          step="0.0001"
          min="0"
          v-model.number="precision"
          placeholder="0.001"
        />
      </div>

      <div class="form-group">
        <label for="description">任务描述 (可选)</label>
        <textarea
          id="description"
          v-model="description"
          rows="3"
          placeholder="请输入任务描述"
        ></textarea>
      </div>

      <div>
        <button type="submit" :disabled="loading">
          {{ loading ? "提交中..." : "提交计算任务" }}
        </button>
      </div>

      <p v-if="errorMsg" style="color:red;">{{ errorMsg }}</p>
      <p v-if="successMsg" style="color:green;">{{ successMsg }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ExpressionEditor from '@/components/ExpressionEditor.vue'

// 正确方式：从 query 获取 datasetId
const route = useRoute()
const datasetId = route.query.datasetId || ''

const taskName = ref('')
const taskType = ref('')
const expressionDetails = ref({
  ast: {
    op: '+',
    left: { type: 'constant', value: 0 },
    right: { type: 'constant', value: 0 },
  },
  variable_mapping: {},
})
const expressionPreview = computed(() => {
  return astToInfix(expressionDetails.value.ast)
})
const precision = ref(0.001)
const description = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)
const token = localStorage.getItem('token')
function astToInfix(node) {
  if (!node) return ''
  if (node.op) {
    const left = astToInfix(node.left)
    const right = astToInfix(node.right)
    return `(${left} ${node.op} ${right})`
  } else if (node.type === 'variable') {
    return node.name || ''
  } else if (node.type === 'constant') {
    return node.value !== undefined ? node.value : ''
  }
  return ''
}

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!taskName.value.trim()) {
    errorMsg.value = '任务名称不能为空'
    return
  }
  if (!taskType.value) {
    errorMsg.value = '请选择任务类型'
    return
  }

  const payload = {
    dataset_id: datasetId,
    task_type: taskType.value,
    expression_details: expressionDetails.value,
    parameters: {
      precision: precision.value ?? 0.001,
    },
    name: taskName.value.trim(),
  }

  if (description.value.trim()) {
    payload.description = description.value.trim()
  }

  loading.value = true
  try {
    const res = await fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || '提交失败')
    }
    successMsg.value = '任务提交成功！'
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
.submit-task {
  max-width: 600px;
  margin: 20px auto;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}
.form-group {
  margin-bottom: 15px;
}
label {
  font-weight: 600;
  margin-bottom: 5px;
  display: block;
}
input,
select,
textarea,
button {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  background-color: #007bff;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
}
button[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
