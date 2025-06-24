<!-- ReviewModal.vue -->
<template>
  <div class="review-modal-overlay">
    <div class="review-modal">
      <h3>审核任务</h3>

      <label for="decision">请选择审核结果：</label>
      <select v-model="decision" id="decision" required>
        <option disabled value="">请选择</option>
        <option value="approve">通过</option>
        <option value="reject">拒绝</option>
      </select>

      <label for="comments">填写评价：</label>
      <textarea
        v-model="comments"
        id="comments"
        rows="4"
        placeholder="请输入评价或备注（可选）"
      ></textarea>

      <div class="modal-actions">
        <button class="submit-btn" @click="handleSubmit">提交</button>
        <button class="cancel-btn" @click="$emit('close')">取消</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const props = defineProps({
  task: Object
})
const emits = defineEmits(['close', 'submit'])

const decision = ref('')
const comments = ref('')

const handleSubmit = () => {
  if (!decision.value) {
    alert('请选择审核结果')
    return
  }
  emits('submit', {
    decision: decision.value,
    comments: comments.value
  })
}
</script>
<style scoped>
.review-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.review-modal {
  background-color: #fffdec;
  padding: 32px 36px;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.2);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.review-modal h3 {
  margin-bottom: 20px;
  font-size: 22px;
  color: #3a3a3a;
  text-align: center;
}

.review-modal label {
  display: block;
  margin: 12px 0 6px;
  font-weight: 600;
  color: #3a3a3a;
}

.review-modal select,
.review-modal textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1.5px solid #6970b5;
  font-size: 14px;
  box-sizing: border-box;
  resize: none;
  transition: border-color 0.3s;
}

.review-modal select:focus,
.review-modal textarea:focus {
  outline: none;
  border-color: #ffa07a;
  box-shadow: 0 0 6px #ffe2e2;
}

.modal-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.submit-btn,
.cancel-btn {
  padding: 8px 22px;
  border-radius: 30px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn {
  background-color: #6970b5;
  color: white;
}

.submit-btn:hover {
  background-color: #4f578e;
}

.cancel-btn {
  background-color: #ccc;
  color: #333;
}

.cancel-btn:hover {
  background-color: #aaa;
}
</style>
