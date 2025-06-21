<template>
  <div class="expression-node">
    <!-- 运算节点 -->
    <div v-if="isOperatorNode">
      <div class="operator-header">
        <label>运算符：</label>
        <select v-model="localNode.op">
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">*</option>
          <option value="/">/</option>
        </select>
        <button @click="changeToLeaf">更改为叶子节点</button>
      </div>
      <div class="children">
        <div class="child">
          <span>左侧：</span>
          <ExpressionNodeEditor
            :model-value="localNode.left"
            @update:modelValue="val => (localNode.left = val)"
          />
        </div>
        <div class="child">
          <span>右侧：</span>
          <ExpressionNodeEditor
            :model-value="localNode.right"
            @update:modelValue="val => (localNode.right = val)"
          />
        </div>
      </div>
    </div>

    <div v-else-if="isLeafNode">
      <select v-model="localNode.type">
        <option value="constant">常量</option>
        <option value="variable">变量</option>
      </select>

      <template v-if="localNode.type === 'constant'">
        <input type="number" v-model.number="localNode.value" />
      </template>
      <template v-else-if="localNode.type === 'variable'">
        <input type="text" v-model="localNode.name" placeholder="如 var_a" />
      </template>

      <button @click="changeToOperator">更改为运算节点</button>
    </div>

    <!-- 初始化：让用户选择类型 -->
    <div v-else>
      <label>选择节点类型：</label>
      <select v-model="nodeType">
        <option disabled value="">请选择</option>
        <option value="operator">运算符</option>
        <option value="constant">常量</option>
        <option value="variable">变量</option>
      </select>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, watch, computed } from 'vue';

export default {
  name: 'ExpressionNodeEditor',
  props: {
    modelValue: Object,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // 用 reactive 代替 ref 包裹对象，避免响应式丢失
    const localNode = reactive(props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : {});

    // 监控本地节点类型，给出初始值
    const detectType = (node) => {
      if (!node) return '';
      if (node.op) return 'operator';
      if (node.type === 'constant') return 'constant';
      if (node.type === 'variable') return 'variable';
      return '';
    };

    const nodeType = reactive({ value: detectType(localNode) });

    // 计算属性判断节点类型
    const isOperatorNode = computed(() => !!localNode.op);
    const isLeafNode = computed(() => localNode.type === 'constant' || localNode.type === 'variable');

    // 监听 props.modelValue 更新，更新 localNode
    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) {
          Object.assign(localNode, JSON.parse(JSON.stringify(newVal)));
          nodeType.value = detectType(localNode);
        } else {
          for (const key in localNode) {
            delete localNode[key];
          }
          nodeType.value = '';
        }
      },
      { immediate: true, deep: true }
    );

    // 监听 nodeType 改变，重新初始化 localNode
    watch(
      () => nodeType.value,
      (type) => {
        if (type === 'operator') {
          localNode.op = '+';
          localNode.left = { type: 'constant', value: 0 };
          localNode.right = { type: 'constant', value: 0 };
          delete localNode.type;
          delete localNode.value;
          delete localNode.name;
        } else if (type === 'constant') {
          localNode.type = 'constant';
          localNode.value = 0;
          delete localNode.op;
          delete localNode.left;
          delete localNode.right;
          delete localNode.name;
        } else if (type === 'variable') {
          localNode.type = 'variable';
          localNode.name = '';
          delete localNode.op;
          delete localNode.left;
          delete localNode.right;
          delete localNode.value;
        } else {
          // 清空
          for (const key in localNode) {
            delete localNode[key];
          }
        }
      }
    );

    // 监听 localNode 的变化，向外发射更新事件，注意 deep 监听，防止丢失
    watch(
      localNode,
      (val) => {
        emit('update:modelValue', JSON.parse(JSON.stringify(val)));
      },
      { deep: true }
    );

    // 操作函数
    const changeToOperator = () => {
      nodeType.value = 'operator';
    };

    const changeToLeaf = () => {
      // 清空并提示用户重新选择类型
      nodeType.value = '';
      for (const key in localNode) {
        delete localNode[key];
      }
    };

    return {
      localNode,
      nodeType,
      isOperatorNode,
      isLeafNode,
      changeToOperator,
      changeToLeaf,
    };
  },
};
</script>

<style scoped>
.expression-node {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px;
  border-radius: 6px;
  background-color: #fafafa;
}
.operator-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.children {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.child {
  flex: 1;
}
.leaf-node {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>