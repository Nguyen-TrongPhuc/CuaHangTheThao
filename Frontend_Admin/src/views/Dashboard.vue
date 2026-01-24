<template>
  <div class="dashboard">
    <h1>Tổng quan hệ thống</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Doanh thu</h3>
        <p class="value">{{ formatCurrency(150000000) }}</p>
      </div>
      <div class="stat-card">
        <h3>Đơn hàng mới</h3>
        <p class="value">24</p>
      </div>
      <div class="stat-card">
        <h3>Sản phẩm sắp hết</h3>
        <p class="value text-warning">5</p>
      </div>
      <div class="stat-card">
        <h3>Khách hàng</h3>
        <p class="value">1,200</p>
      </div>
    </div>

    <div class="recent-orders">
      <h2>Đơn hàng gần đây</h2>
      </div>
  </div>
</template>

<script>
export default {
  methods: {
    formatCurrency(v) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    }
  }
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}
.stat-card h3 { color: #7f8c8d; font-size: 14px; margin: 0; }
.stat-card .value { font-size: 24px; font-weight: bold; color: #2c3e50; margin: 10px 0; }
.text-warning { color: #e67e22 !important; }
</style>