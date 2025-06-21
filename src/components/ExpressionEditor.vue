<template>
  <div class="expression-editor">
    <h3>表达式构建器</h3>

    <!-- AST 构建区域 -->
    <ExpressionNodeEditor v-model="ast" />

    <!-- 变量映射 -->
    <div class="form-group">
      <h4>变量映射</h4>
      <div v-for="(col, varName) in variableMapping" :key="varName" class="mapping-row">
        <input v-model="variableNames[varName]" placeholder="变量名" />
        →
        <input v-model="variableMapping[varName]" placeholder="映射到数据集字段" />
        <button @click="removeMapping(varName)">删除</button>
      </div>
      <button @click="addMapping">添加变量映射</button>
    </div>
    
  </div>
</template>

<script>
import { ref, reactive, watch, computed } from "vue";
import ExpressionNodeEditor from "./ExpressionNodeEditor.vue";

export default {
  name: "ExpressionEditor",
  components: { ExpressionNodeEditor },
  props: {
    modelValue: Object,
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const defaultAst = {
  op: '+',
  left: { type: 'constant', value: 0 },
  right: { type: 'constant', value: 0 },
};

const ast = ref(props.modelValue?.ast && Object.keys(props.modelValue.ast).length > 0 
  ? props.modelValue.ast 
  : defaultAst);
    const variableMapping = reactive(props.modelValue?.variable_mapping || {});
    const variableNames = reactive({ ...variableMapping });

    // 更新父组件绑定的 modelValue
    watch(
      () => [ast.value, variableMapping],
      () => {
        emit("update:modelValue", {
          ast: ast.value,
          variable_mapping: { ...variableMapping },
        });
      },
      { deep: true }
    );

    const addMapping = () => {
      const varName = `var_${Object.keys(variableMapping).length + 1}`;
      variableMapping[varName] = "";
      variableNames[varName] = "";
    };

    const removeMapping = (key) => {
      delete variableMapping[key];
      delete variableNames[key];
    };

    return {
      ast,
      variableMapping,
      variableNames,
      addMapping,
      removeMapping,
    };
  },
};
</script>

<style scoped>
.expression-editor {
  border: 1px solid #ddd;
  padding: 16px;
  border-radius: 6px;
}
.mapping-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.mapping-row input {
  width: 150px;
  margin-right: 8px;
}
</style>
