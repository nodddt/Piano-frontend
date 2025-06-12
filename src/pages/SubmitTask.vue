<template>
  <div class="task-submission p-6 max-w-4xl mx-auto">
    <h2 class="title">计算任务提交</h2>

    <el-form
      :model="form"
      label-width="140px"
      class="form-container"
      @submit.native.prevent
    >
      <!-- 表达式输入 -->
      <el-form-item label="表达式 AST">
        <el-input
          type="textarea"
          v-model="form.expression"
          placeholder="请输入表达式 AST JSON"
          rows="6"
          class="textarea-input"
        />
      </el-form-item>

      <!-- 变量映射 -->
      <el-form-item label="变量映射">
        <el-input
          v-model="form.variable_mapping.var_a"
          placeholder="var_a 映射，如 user_income"
          class="mb-3"
        />
        <el-input
          v-model="form.variable_mapping.var_b"
          placeholder="var_b 映射，如 tax_rate"
        />
      </el-form-item>

      <!-- 精度参数 -->
      <el-form-item label="计算精度">
        <el-input-number
          v-model="form.parameters.precision"
          :min="0.000001"
          :step="0.0001"
          controls-position="right"
          class="precision-input"
        />
      </el-form-item>

      <!-- 任务名称 -->
      <el-form-item label="任务名称">
        <el-input v-model="form.name" placeholder="请输入任务名称" />
      </el-form-item>

      <!-- 任务描述 -->
      <el-form-item label="任务描述">
        <el-input
          type="textarea"
          v-model="form.description"
          rows="3"
          placeholder="请输入任务描述（可选）"
        />
      </el-form-item>

      <!-- 价格和按钮 -->
      <el-form-item>
        <div class="footer-row">
          <p class="estimated-price">
            预估价格：
            <span class="price-value">{{ estimatedPrice }} 积分</span>
          </p>
          <el-button
            type="primary"
            class="submit-btn"
            @click="submitTask"
            :loading="loading"
          >
            提交任务
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const datasetId = route.query.dataset_id || ''

const form = ref({
  dataset_id: '',
  expression: '',
  variable_mapping: {
    var_a: '',
    var_b: '',
  },
  parameters: {
    precision: 0.0001,
  },
  name: '',
  description: '',
})

const estimatedPrice = computed(() => {
  const base = 100
  const multiplier = form.value.expression.length / 50
  return Math.ceil(base * multiplier || 1)
})

const submitTask = async () => {
  if (!form.value.expression) {
    ElMessage.warning('表达式不能为空')
    return
  }
  if (!form.value.name) {
    ElMessage.warning('请输入任务名称')
    return
  }

  loading.value = true
  try {
    const payload = {
      dataset_id: datasetId,
      task_type: 'row_wise',
      expression_details: {
        ast: JSON.parse(form.value.expression),
        variable_mapping: form.value.variable_mapping,
      },
      parameters: form.value.parameters,
      name: form.value.name,
      description: form.value.description,
    }

    await request.post('/tasks', payload)
    ElMessage.success('任务提交成功！')
    router.push('/task-manager')
  } catch (err) {
    ElMessage.error('提交失败：' + (err?.response?.data?.message || err.message))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.task-submission {
  background: #fffdec;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(105, 112, 181, 0.15);
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #6970b5;
  text-align: center;
}

.form-container {
  background: #fff;
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 0 18px rgba(105, 112, 181, 0.12);
}

.el-form-item__label {
  color: #6970b5;
  font-weight: 600;
  font-size: 16px;
  padding-right: 12px;
  min-width: 140px;
}

.textarea-input textarea {
  border-radius: 12px !important;
  border-color: #6970b5 !important;
  font-family: 'Source Code Pro', monospace;
  font-size: 14px;
  resize: vertical !important;
  color: #3b3f71;
}

.el-input input,
.el-input textarea,
.el-input-number input {
  border-radius: 12px !important;
  border-color: #6970b5 !important;
  font-size: 16px;
  color: #3b3f71;
  transition: border-color 0.3s ease;
}

.el-input input:focus,
.el-input textarea:focus,
.el-input-number input:focus {
  border-color: #51578e !important;
  box-shadow: 0 0 10px rgba(105, 112, 181, 0.4);
}

.precision-input {
  width: 120px;
}

.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.estimated-price {
  font-size: 16px;
  color: #4b4f7a;
  user-select: none;
}

.price-value {
  font-weight: 700;
  color: #ff8533;
}

.submit-btn {
  background-color: #6970b5;
  border-radius: 12px;
  font-weight: 600;
  padding: 10px 26px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.submit-btn:hover {
  background-color: #8a90d2;
  transform: scale(1.05);
}
</style>
