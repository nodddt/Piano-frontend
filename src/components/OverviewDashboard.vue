<template>
  <div class="overview-dashboard">
    <h2>系统运行状态概览</h2>

    <section class="dataset-overview">
      <h3>数据集概览</h3>
      <div class="chart-container">
        <canvas ref="datasetPieChart"></canvas>
        <div class="info-box">
          <p>数据集总数: {{ overview.datasets.total }}</p>
          <p v-for="(count, status) in overview.datasets.by_status" :key="status">
            状态 {{ status }}: {{ count }}
          </p>
        </div>
      </div>
    </section>

    <section class="task-overview">
      <h3>计算任务概览（类型 / 状态）</h3>
      <div class="total-tasks">现有计算任务总数: {{ overview.tasks.total }}</div>
      <div class="charts-row">
        <div class="chart-container half-width">
          <canvas ref="taskTypePieChart"></canvas>
        </div>
        <div class="chart-container half-width">
          <canvas ref="taskStatusBarChart"></canvas>
        </div>
      </div>
    </section>

    <section class="user-overview">
      <h3>用户概览</h3>
      <div class="chart-container">
        <canvas ref="userPieChart"></canvas>
        <div class="info-box">
          <p>可用用户: {{ overview.users.active }}</p>
          <p>禁用用户: {{ overview.users.disabled }}</p>
          <p>用户角色数量:</p>
          <ul>
            <li v-for="(count, role) in overview.users.by_role" :key="role">
              {{ translateRole(role) }}: {{ count }}
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'OverviewDashboard',
  setup() {
    const overview = ref({
      datasets: { by_status: {}, total: 0 },
      tasks: { by_status: {}, by_type: {}, total: 0 },
      users: { active: 0, disabled: 0, by_role: {}, total: 0 },
    })

    const datasetPieChart = ref(null)
    const taskTypePieChart = ref(null)
    const taskStatusBarChart = ref(null)
    const userPieChart = ref(null)
    const harmoniousColors = [
  '#6970b5', '#9ea3e2', '#b1b5f0',
  '#FFE2E2', '#f5c2c2', '#e4d9fa', '#f4f0ff'
]
    let datasetChartInstance = null
    let taskTypeChartInstance = null
    let taskStatusChartInstance = null
    let userChartInstance = null

    const translateRole = (role) => {
      const map = {
        data_consumer: '数据使用者',
        dataset_provider: '数据提供方',
        admin: '管理员',
      }
      return map[role] || role
    }

    const createDatasetPieChart = (data) => {
  if (datasetChartInstance) datasetChartInstance.destroy()
  const labels = Object.keys(data.by_status)
  const values = Object.values(data.by_status)

  datasetChartInstance = new Chart(datasetPieChart.value.getContext('2d'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: harmoniousColors.slice(0, labels.length),
      }],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } },
    },
  })
}


    const createTaskTypePieChart = (data) => {
  if (taskTypeChartInstance) taskTypeChartInstance.destroy()
  const labels = Object.keys(data.by_type)
  const values = Object.values(data.by_type)

  taskTypeChartInstance = new Chart(taskTypePieChart.value.getContext('2d'), {
    type: 'pie',
    data: {
      labels: labels.map((t) => {
        if (t === 'row_wise') return '行级任务'
        if (t === 'aggregation') return '聚合任务'
        if (t === 'cross_row_polynomial') return '跨行多项式'
        return t
      }),
      datasets: [{
        data: values,
        backgroundColor: harmoniousColors.slice(0, labels.length),
      }],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } },
    },
  })
}


    const createTaskStatusBarChart = (data) => {
  if (taskStatusChartInstance) taskStatusChartInstance.destroy()
  const labels = Object.keys(data.by_status)
  const values = Object.values(data.by_status)

  taskStatusChartInstance = new Chart(taskStatusBarChart.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '任务数量',
        data: values,
        backgroundColor: harmoniousColors[0],  // 使用主色
      }],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  })
}


    const createUserPieChart = (data) => {
  if (userChartInstance) userChartInstance.destroy()
  const labels = Object.keys(data.by_role)
  const values = Object.values(data.by_role)

  userChartInstance = new Chart(userPieChart.value.getContext('2d'), {
    type: 'pie',
    data: {
      labels: labels.map((r) => translateRole(r)),
      datasets: [{
        data: values,
        backgroundColor: harmoniousColors.slice(0, labels.length),
      }],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } },
    },
  })
}


    const fetchOverview = () => {
  const token = localStorage.getItem('token') || ''

  fetch('http://localhost:5000/admin/overview', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error('接口请求失败')
      return res.json()
    })
    .then((data) => {
      overview.value = data

      createDatasetPieChart(data.datasets)
      createTaskTypePieChart(data.tasks)
      createTaskStatusBarChart(data.tasks)
      createUserPieChart(data.users)
    })
    .catch((err) => {
      alert('获取概览数据失败: ' + err.message)
    })
}

    onMounted(() => {
      fetchOverview()
    })

    return {
      overview,
      datasetPieChart,
      taskTypePieChart,
      taskStatusBarChart,
      userPieChart,
      translateRole,
    }
  },
}
</script>

<style>
.overview-dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h2 {
  margin-bottom: 24px;
}

section {
  margin-bottom: 40px;
}

h3 {
  margin-bottom: 16px;
}

.chart-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
}

.info-box {
  min-width: 180px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.total-tasks {
  text-align: center;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 10px;
}

.charts-row {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.half-width {
  width: 50%;
}

.overview-dashboard canvas {
  width: 350px !important;   /* 固定宽度 */
  height: 350px !important;  /* 固定高度 */
  max-width: none !important;  /* 取消最大宽度限制 */
  max-height: none !important; /* 取消最大高度限制 */
  border-radius: 12px;

}

</style>
