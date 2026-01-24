import { createWebHistory, createRouter } from "vue-router";
import ProductManager from "@/views/ProductManager.vue";
import OrderManager from "@/views/OrderManager.vue";
import Dashboard from '@/views/Dashboard.vue'
import CategoryManager from '@/views/CategoryManager.vue'
import SupplierManager from '@/views/SupplierManager.vue'

const routes = [
    {
        path: "/",
        redirect: "/dashboard", // Tự động chuyển hướng về Dashboard khi vào trang chủ
    },
    {
        path: "/dashboard",
        name: "dashboard",
        component: Dashboard,
    },
    {
        path: "/products",
        name: "product.manager",
        component: ProductManager,
    },
    {
        path: "/orders",
        name: "order.manager",
        component: OrderManager,
    },
    {
        path: "/categories",
        name: "category.manager",
        component: CategoryManager,
    },
    {
        path: "/suppliers",
        name: "supplier.manager",
        component: SupplierManager,
    },
    {
        path: "/customers", 
        name: "customer.manager",
        component: () => import('@/views/CustomerManager.vue'),
    },
    {
        path: "/employees",
        name: "employee.manager",
        component: () => import('@/views/EmployeeManager.vue'),
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

export default router;