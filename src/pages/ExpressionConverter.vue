<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">大模型辅助表达式转换</h2>

    <!-- 表单区 -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- 表达式输入 -->
      <div>
        <label class="block mb-1 font-semibold">原始表达式</label>
        <input v-model="form.expression_string" type="text" class="w-full border px-3 py-2 rounded" placeholder="如 exp(x) * sin(y)" required />
      </div>

      <!-- 变量定义 -->
      <div v-for="(variable, index) in form.variables_context" :key="index" class="border p-4 rounded bg-gray-50">
        <div class="flex gap-4 items-center">
          <input v-model="variable.name" type="text" placeholder="变量名" class="border px-2 py-1 rounded w-32" required />
          <input v-model.number="variable.range.min" type="number" placeholder="最小值" class="border px-2 py-1 rounded w-32" required />
          <input v-model.number="variable.range.max" type="number" placeholder="最大值" class="border px-2 py-1 rounded w-32" required />
          <select v-model="variable.type" class="border px-2 py-1 rounded w-32">
            <option value="float">float</option>
            <option value="int">int</option>
          </select>
          <button type="button" @click="removeVariable(index)" class="text-red-600">删除</button>
        </div>
      </div>

      <button type="button" @click="addVariable" class="text-blue-600 underline">+ 添加变量</button>

      <!-- 近似参数 -->
      <div class="flex flex-wrap gap-4">
        <div>
          <label class="block mb-1 font-semibold">最大阶数</label>
          <input v-model.number="form.approximation_params.max_degree" type="number" class="border px-3 py-2 rounded w-32" min="1" required />
        </div>
        <div>
          <label class="block mb-1 font-semibold">目标精度</label>
          <select v-model="form.approximation_params.target_accuracy_level" class="border px-3 py-2 rounded w-40">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <div>
          <label class="block mb-1 font-semibold">输出格式</label>
          <select v-model="form.approximation_params.output_format" class="border px-3 py-2 rounded w-40">
            <option value="term_list">term_list</option>
            <option value="latex">latex</option>
          </select>
        </div>
      </div>

      <!-- 提交按钮 -->
      <button type="submit" class="bg-amber-700 text-white px-4 py-2 rounded hover:bg-amber-800">提交转换</button>
    </form>

    <!-- 结果展示 -->
    <div v-if="result" class="mt-8 p-4 border rounded bg-white shadow">
      <h3 class="text-lg font-semibold mb-2">转换结果</h3>
      <div>
        <strong>近似多项式：</strong>
        <pre class="bg-gray-100 p-2 rounded">{{ result.polynomial }}</pre>
      </div>
      <div v-if="result.mse">
        <strong>均方误差 (MSE)：</strong> {{ result.mse }}
      </div>
      <div v-if="result.chart_url">
        <img :src="result.chart_url" alt="误差图" class="mt-4 rounded border" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '@/utils/request' // 使用 axios 实例封装

const form = ref({
  expression_string: '',
  variables_context: [
    {
      name: 'x',
      range: { min: -1, max: 1 },
      type: 'float'
    }
  ],
  approximation_params: {
    max_degree: 5,
    target_accuracy_level: 'medium',
    output_format: 'term_list'
  }
})

const result = ref(null)

const addVariable = () => {
  form.value.variables_context.push({
    name: '',
    range: { min: 0, max: 1 },
    type: 'float'
  })
}

const removeVariable = (index) => {
  form.value.variables_context.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    const res = await request.post('/expression/convert', form.value)
    result.value = {
      polynomial: res.data.approx_expression,
      mse: res.data.mse,
      chart_url: res.data.chart_url // 假设后端会返回图表链接（可选）
    }
  } catch (err) {
    console.error('转换失败', err)
    alert('表达式转换失败，请检查输入或稍后重试')
  }
}
</script>

<style scoped>
input, select {
  outline: none;
}
</style>
