<template>
  <div class="admin-container">
    <aside class="sidebar">
      <div class="logo">SPORT STORE </div>
      <nav>
        <router-link to="/dashboard" class="nav-item">Tổng quan</router-link>
        <router-link to="/categories" class="nav-item">Quản lý Danh mục</router-link>
        <router-link to="/suppliers" class="nav-item">Quản lý Nhà cung cấp</router-link>
        <router-link to="/products" class="nav-item">Quản lý Sản phẩm</router-link>
        <router-link to="/orders" class="nav-item">Quản lý Đơn hàng</router-link>
        <router-link to="/customers" class="nav-item">Quản lý Khách hàng</router-link>
        <router-link to="/employees" class="nav-item">Quản lý Nhân viên</router-link>
      </nav>
    </aside>
    
    <main class="main-content">
      <router-view /> </main>
  </div>
</template>

<style>
body { margin: 0; font-family: Arial, sans-serif; }
.admin-container { display: flex; height: 100vh; }
.sidebar {
    width: 250px;
    background: linear-gradient(135deg, #0f0c29, #4d4c4c, #000000);
    color: white;
    padding: 20px;
}
.logo { font-weight: bold; font-size: 20px; margin-bottom: 30px; text-align: center; }
.nav-item { display: block; color: white; text-decoration: none; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
.nav-item:hover, .router-link-active { background: #34495e; }
.main-content { flex: 1; padding: 30px; background: linear-gradient(135deg, #cdcdea, #4d4c4c);
 overflow-y: auto; }
</style>