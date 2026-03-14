<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>SportStore Admin</h2>
    </div>
    <nav class="sidebar-nav">
      <ul>
        <li>
          <router-link to="/" exact-active-class="active">
            <i class="fa-solid fa-tachometer-alt"></i>
            <span>Bảng điều khiển</span>
          </router-link>
        </li>
      </ul>
      
      <ul>
        <li class="menu-section">
          <span>Quản lý chính</span>
        </li>
        <li>
          <router-link to="/products" active-class="active">
            <i class="fa-solid fa-box-archive"></i>
            <span>Quản lý Sản phẩm</span>
          </router-link>
        </li>
        <li>
          <router-link to="/orders" active-class="active">
            <i class="fa-solid fa-file-invoice-dollar"></i>
            <span>Quản lý Đơn hàng</span>
          </router-link>
        </li>
        <li>
          <router-link to="/customers" active-class="active">
            <i class="fa-solid fa-users"></i>
            <span>Quản lý Khách hàng</span>
          </router-link>
        </li>
      </ul>
      
      <ul>
        <li class="menu-section">
          <span>Khuyến mãi</span>
        </li>
        <li>
          <router-link to="/vouchers" active-class="active">
            <i class="fa-solid fa-ticket"></i>
            <span>Quản lý Voucher</span>
          </router-link>
        </li>
      </ul>

      <ul>
        <li class="menu-section">
          <span>Cấu hình Sản phẩm</span>
        </li>
        <li>
          <router-link to="/categories" active-class="active">
            <i class="fa-solid fa-list"></i>
            <span>Quản lý Danh mục</span>
          </router-link>
        </li>
        <li>
          <router-link to="/sports" active-class="active">
            <i class="fa-solid fa-futbol"></i>
            <span>Quản lý Môn thể thao</span>
          </router-link>
        </li>
        <li>
          <router-link to="/colors" active-class="active">
            <i class="fa-solid fa-palette"></i>
            <span>Quản lý Màu sắc</span>
          </router-link>
        </li>
        <li>
          <router-link to="/sizes" active-class="active">
            <i class="fa-solid fa-ruler-combined"></i>
            <span>Quản lý Size</span>
          </router-link>
        </li>
      </ul>
      
      <ul>
        <li class="menu-section">
          <span>Nhân sự & Đối tác</span>
        </li>
        <li>
          <router-link to="/employees" active-class="active">
            <i class="fa-solid fa-user-tie"></i>
            <span>Quản lý Nhân viên</span>
          </router-link>
        </li>
        <li>
          <router-link to="/suppliers" active-class="active">
            <i class="fa-solid fa-truck"></i>
            <span>Quản lý Nhà cung cấp</span>
          </router-link>
        </li>
      </ul>
      
      <ul>
        <li class="menu-section">
          <span>Kho & Liên hệ</span>
        </li>
        <li>
          <router-link to="/warehouse" active-class="active">
            <i class="fa-solid fa-warehouse"></i>
            <span>Quản lý Kho</span>
          </router-link>
        </li>
        <li>
          <router-link to="/contacts" active-class="active">
            <i class="fa-solid fa-envelope"></i>
            <span>Quản lý Liên hệ</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar'
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  height: 100vh;
  overflow-y: auto;
}
.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #34495e;
}
.sidebar-header h2 {
  margin: 0;
  font-size: 1.4rem;
}
.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0 0 10px 0;
}
.menu-section {
  padding: 15px 20px;
  font-size: 0.85rem;
  color: #95a5a6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  border-bottom: 1px solid #34495e;
}
.sidebar-nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  color: #ecf0f1;
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
}
.sidebar-nav a:hover {
  background: #34495e;
}
.sidebar-nav a.active {
  background: #1abc9c;
  color: white;
}
.sidebar-nav a.active i {
  color: white;
}
.sidebar-nav i {
  width: 20px;
  text-align: center;
  color: #bdc3c7;
}
</style>
