import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import VoucherManager from '../views/VoucherManager.vue';
import ProductManager from '../views/ProductManager.vue';
import OrderManager from '../views/OrderManager.vue';
import CustomerManager from '../views/CustomerManager.vue';
import CategoryManager from '../views/CategoryManager.vue';
import SportManager from '../views/SportManager.vue';
import ColorManager from '../views/ColorManager.vue';
import SizeManager from '../views/SizeManager.vue';
import EmployeeManager from '../views/EmployeeManager.vue';
import SupplierManager from '../views/SupplierManager.vue';
import WarehouseManager from '../views/WarehouseManager.vue';
import ContactManager from '../views/ContactManager.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    alias: '/dashboard',
  },
  {
    path: '/vouchers',
    name: 'VoucherManager',
    component: VoucherManager,
  },
  { path: '/products', name: 'ProductManager', component: ProductManager },
  { path: '/orders', name: 'OrderManager', component: OrderManager },
  { path: '/customers', name: 'CustomerManager', component: CustomerManager },
  { path: '/categories', name: 'CategoryManager', component: CategoryManager },
  { path: '/sports', name: 'SportManager', component: SportManager },
  { path: '/colors', name: 'ColorManager', component: ColorManager },
  { path: '/sizes', name: 'SizeManager', component: SizeManager },
  { path: '/employees', name: 'EmployeeManager', component: EmployeeManager },
  { path: '/warehouse', name: 'WarehouseManager', component: WarehouseManager },
  { path: '/suppliers', name: 'SupplierManager', component: SupplierManager },
  { path: '/contacts', name: 'ContactManager', component: ContactManager },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
