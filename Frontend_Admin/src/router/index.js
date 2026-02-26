import { createWebHistory, createRouter } from "vue-router";
import ProductManager from "@/views/ProductManager.vue";
import OrderManager from "@/views/OrderManager.vue";
import Dashboard from '@/views/Dashboard.vue'
import CategoryManager from '@/views/CategoryManager.vue'
import SportManager from '@/views/SportManager.vue'
import ColorManager from '@/views/ColorManager.vue'
import SizeManager from '@/views/SizeManager.vue'
import Login from "@/views/Login.vue";
import EmployeeForm from "@/views/EmployeeForm.vue";
import ContactManager from "@/views/ContactManager.vue";

const routes = [
    {
        path: "/login",
        name: "login",
        component: Login,
    },
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
        path: "/sports",
        name: "sport.manager",
        component: SportManager,
    },
    {
        path: "/colors",
        name: "color.manager",
        component: ColorManager,
    },
    {
        path: "/sizes",
        name: "size.manager",
        component: SizeManager,
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
    {
        path: "/employees/add",
        name: "employee.add",
        component: EmployeeForm,
    },
    {
        path: "/employees/:id",
        name: "employee.edit",
        component: EmployeeForm,
        props: true // Truyền id qua props
    },
    {
        path: "/contacts",
        name: "contact.manager",
        component: ContactManager,
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

router.beforeEach((to, from, next) => {
    const publicPages = ["/login"];
    const authRequired = !publicPages.includes(to.path);
    const loggedIn = localStorage.getItem("admin_token");

    if (authRequired && !loggedIn) {
        return next("/login");
    }

    next();
});

export default router;