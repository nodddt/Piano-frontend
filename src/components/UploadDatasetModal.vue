<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>上传新数据集</h3>
        <button class="modal-close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div class="form-item">
          <label>数据集名称</label>
          <input v-model="form.name" placeholder="请输入数据集名称" />
        </div>

        <div class="form-item">
          <label>数据集描述</label>
          <textarea v-model="form.description" placeholder="请输入数据集描述" rows="3"></textarea>
        </div>

        <div class="form-item">
          <label>数据量</label>
          <input v-model.number="form.row_count" type="number" min="0" placeholder="请输入数据量" />
        </div>

        <div class="form-item">
          <label>隐私级别</label>
          <select v-model="form.privacy_level">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div class="form-item fields-group">
          <label>字段信息</label>
          <div class="fields-list">
            <div v-for="(field, index) in form.fields" :key="index" class="field-item">
              <input v-model="field.name" placeholder="字段名" class="field-name" />
              <select v-model="field.type" class="field-type">
                <option value="string">字符串</option>
                <option value="number">数字</option>
                <option value="boolean">布尔</option>
                <option value="float">浮点</option>
              </select>
              <label class="sensitive-label">
                敏感
                <input type="checkbox" v-model="field.is_sensitive" />
              </label>
              <button class="remove-field-btn" @click="removeField(index)">移除</button>
            </div>
          </div>
          <button class="add-field-btn" @click="addField">添加字段</button>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="submit" class="submit-btn">提交</button>
        <button @click="close" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, toRefs } from 'vue'
import request from '@/utils/request'
import { watchEffect } from 'vue'

defineProps({
  modelValue: Boolean,
  token: String
})

const emit = defineEmits(['update:modelValue', 'close', 'submitted'])

const form = reactive({
  name: '',
  description: '',
  row_count: 0,
  privacy_level: 'medium',
  fields: []
})

const addField = () => {
  form.fields.push({ name: '', type: 'string', is_sensitive: false })
}

const removeField = (index) => {
  form.fields.splice(index, 1)
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.row_count = 0
  form.privacy_level = 'medium'
  form.fields = []
}

const close = () => {
  if (confirm('确认关闭？未保存的数据将丢失')) {
    emit('update:modelValue', false)
    emit('close')
    resetForm()
  }
}

const submit = async () => {
  if (!form.name.trim()) {
    alert('请填写数据集名称')
    return
  }
  if (form.fields.length === 0) {
    alert('请添加至少一个字段')
    return
  }
  try {
    await request.post('/datasets', form, {
      headers: { Authorization: `Bearer ${__props.token}` }
    })
    alert('提交成功')
    emit('submitted')
    resetForm()
  } catch (err) {
    alert('提交失败')
    console.error(err)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(105, 112, 181, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal {
  background: white;
  width: 600px;
  max-width: 95vw;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(105, 112, 181, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #6970b5;
  color: white;
  padding: 16px 20px;
  font-weight: 700;
  font-size: 18px;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 26px;
  cursor: pointer;
  color: white;
  user-select: none;
}

.modal-body {
  padding: 20px 28px;
  color: #3a3a3a;
  font-size: 15px;
}

.form-item {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-item label {
  min-width: 90px;
  font-weight: 600;
  color: #6970b5;
  user-select: none;
}

.form-item input,
.form-item textarea,
.form-item select {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1.5px solid #6970b5;
  font-size: 15px;
  color: #3a3a3a;
  transition: box-shadow 0.3s ease;
}

.form-item input:focus,
.form-item textarea:focus,
.form-item select:focus {
  outline: none;
  box-shadow: 0 0 6px #ffe2e2;
  border-color: #ffe2e2;
}

.fields-group {
  flex-direction: column;
  align-items: flex-start;
}

.fields-list {
  width: 100%;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.field-name {
  flex: 2;
  border-radius: 8px;
  border: 1.5px solid #6970b5;
  padding: 6px 10px;
}

.field-type {
  flex: 1;
  max-width: 120px;
  border-radius: 8px;
  border: 1.5px solid #6970b5;
  padding: 6px 10px;
  font-size: 14px;
}

.sensitive-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ff7f7f;
  font-weight: 600;
  user-select: none;
  font-size: 14px;
}

.remove-field-btn {
  background-color: #ff8c8c;
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.remove-field-btn:hover {
  background-color: #e06666;
}

.add-field-btn {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  margin-top: 8px;
  transition: background-color 0.3s;
}

.add-field-btn:hover {
  background-color: #4f578e;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding: 16px 24px;
  background-color: #f9f7f0;
  border-top: 1px solid #ddd;
}

.submit-btn {
  background-color: #6970b5;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 30px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.3s;
  user-select: none;
}

.submit-btn:hover {
  background-color: #4f578e;
}

.cancel-btn {
  background-color: #ffe2e2;
  color: #a94442;
  border: none;
  padding: 10px 28px;
  border-radius: 30px;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background-color: #f7bcbc;
}
</style>
