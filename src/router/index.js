import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import ExternalLoginRegister from '../pages/ExternalLoginRegister.vue';
import InternalLogin from '../pages/InternalLogin.vue';
import DatasetManagement from '../pages/DatasetManagement.vue';
import BrowseDatasets from '../pages/BrowseDatasets.vue';
import DatasetDetails from '../pages/DatasetDetails.vue';
import SubmitTask from '../pages/SubmitTask.vue';
import ExpressionConverter from '../pages/ExpressionConverter.vue';
import TaskManager from '../pages/TaskManager.vue';
import AdminDashboard from '../pages/AdminDashboard.vue';
//页面配置路由
const routes = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/login', name: 'ExternalLogin', component: ExternalLoginRegister },
  { path: '/internal-login', name: 'InternalLogin', component: InternalLogin },
  { path: '/datasets/manage', name: 'DatasetManagement', component: DatasetManagement },
  { path: '/datasets', name: 'BrowseDatasets', component: BrowseDatasets },
  { path: '/datasets/:id', name: 'DatasetDetails', component: DatasetDetails, props: true },
  { path: '/submit-task', name: 'SubmitTask', component: SubmitTask },
  { path: '/convert-expression', name: 'ExpressionConverter', component: ExpressionConverter },
  { path: '/task-manager', name: 'TaskManager', component: TaskManager },
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
