import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/Home.vue'),
        meta: { title: 'SportStore - Thế giới đồ thể thao' }
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/Login.vue')
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/views/Register.vue')
    },
    {
        path: '/search',
        name: 'product.search',
        component: () => import('@/views/SearchView.vue')
    },
    {
        path: '/products',
        name: 'products',
        component: () => import('@/views/SearchView.vue') // Tái sử dụng trang tìm kiếm để hiển thị tất cả sản phẩm
    },
    {
        path: '/about',
        name: 'about',
        component: () => import('@/views/About.vue')
    },
    {
        path: '/contact',
        name: 'contact',
        component: () => import('@/views/Contact.vue')
    },
    {
        path: '/contact-replies',
        name: 'contact-replies',
        component: () => import('@/views/ContactReplies.vue'),
        beforeEnter: (to, from, next) => {
            if (!localStorage.getItem("user_token")) {
                next({ name: 'login', query: { redirect: to.fullPath } });
            } else {
                next();
            }
        }
    },
    {
        path: '/cart',
        name: 'cart',
        component: () => import('@/views/Cart.vue'),
        // Bảo vệ route: Nếu chưa đăng nhập thì đá về login
        beforeEnter: (to, from, next) => {
            if (!localStorage.getItem("user_token")) {
                next({ name: 'login', query: { redirect: to.fullPath } });
            } else {
                next();
            }
        }
    },
    {
        path: '/checkout',
        name: 'checkout',
        component: () => import('@/views/Checkout.vue'),
        beforeEnter: (to, from, next) => {
            if (!localStorage.getItem("user_token")) {
                next({ name: 'login', query: { redirect: to.fullPath } });
            } else {
                next();
            }
        }
    },
    {
        path: '/products/:id',
        name: 'product.detail',
        component: () => import('@/views/ProductDetail.vue')
    },
    {
        path: '/profile',
        name: 'profile',
        component: () => import('@/views/Profile.vue'),
        beforeEnter: (to, from, next) => {
            if (!localStorage.getItem("user_token")) {
                next({ name: 'login' });
            } else {
                next();
            }
        }
    },
    {
        path: '/orders',
        name: 'orders',
        component: () => import('@/views/Orders.vue'),
        beforeEnter: (to, from, next) => {
            if (!localStorage.getItem("user_token")) next({ name: 'login' });
            else next();
        }
    }
    
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;