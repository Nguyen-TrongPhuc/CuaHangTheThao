<template>
  <div class="dashboard-page">
    <h1>Bảng điều khiển</h1>
    
    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...
    </div>

    <div v-else>
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card">
          <div class="card-icon revenue"><i class="fa-solid fa-dollar-sign"></i></div>
          <div class="card-content">
            <div class="card-title">Tổng doanh thu (Tháng này)</div>
            <div class="card-value">{{ formatPrice(summary.totalRevenueMonth) }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-icon orders"><i class="fa-solid fa-box"></i></div>
          <div class="card-content">
            <div class="card-title">Đơn hàng mới (Hôm nay)</div>
            <div class="card-value">{{ summary.newOrdersToday }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-icon users"><i class="fa-solid fa-users"></i></div>
          <div class="card-content">
            <div class="card-title">Người dùng mới (Tháng này)</div>
            <div class="card-value">{{ summary.newUsersMonth }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-icon cancelled"><i class="fa-solid fa-ban"></i></div>
          <div class="card-content">
            <div class="card-title">Đơn hàng bị hủy (Tháng này)</div>
            <div class="card-value">{{ summary.cancelledOrdersMonth }}</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <div class="chart-container">
          <h3>Doanh thu 7 ngày qua</h3>
          <Line v-if="revenueChartData.labels.length" :data="revenueChartData" :options="chartOptions" />
        </div>
        <div class="chart-container">
          <h3>Tình trạng đơn hàng</h3>
          <Doughnut v-if="orderStatusChartData.labels.length" :data="orderStatusChartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Top Products -->
      <div class="top-products-container">
        <h3>Top 5 sản phẩm bán chạy nhất</h3>
        <div v-if="topProducts.length === 0" class="empty-list">Chưa có dữ liệu.</div>
        <ul v-else class="product-list">
          <li v-for="(product, index) in topProducts" :key="product._id">
            <span class="rank">{{ index + 1 }}</span>
            <img :src="product.image || 'https://via.placeholder.com/40'" class="product-img" />
            <span class="product-name">{{ product.name }}</span>
            <span class="product-sold">{{ product.totalSold }} lượt bán</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardService from '@/services/dashboard.service';
import { Line, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement);

export default {
  components: { Line, Doughnut },
  data() {
    return {
      isLoading: true,
      summary: {
        totalRevenueMonth: 0,
        newOrdersToday: 0,
        newUsersMonth: 0,
        cancelledOrdersMonth: 0,
      },
      revenueChartData: {
        labels: [],
        datasets: [{
          label: 'Doanh thu',
          backgroundColor: '#4776E6',
          borderColor: '#4776E6',
          data: [],
        }]
      },
      orderStatusChartData: {
        labels: [],
        datasets: [{
          backgroundColor: [],
          data: []
        }]
      },
      topProducts: [],
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false
      }
    };
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    },
    async fetchDashboardData() {
      this.isLoading = true;
      try {
        const data = await DashboardService.getSummary();
        
        // Summary Cards
        this.summary = {
          totalRevenueMonth: data.totalRevenueMonth,
          newOrdersToday: data.newOrdersToday,
          newUsersMonth: data.newUsersMonth,
          cancelledOrdersMonth: data.cancelledOrdersMonth,
        };

        // Revenue Chart
        this.revenueChartData.labels = data.dailyRevenue.map(d => new Date(d.date).toLocaleDateString('vi-VN'));
        this.revenueChartData.datasets[0].data = data.dailyRevenue.map(d => d.total);

        // Order Status Chart
        this.orderStatusChartData.labels = data.orderStatusDistribution.map(s => this.translateStatus(s.status));
        this.orderStatusChartData.datasets[0].data = data.orderStatusDistribution.map(s => s.count);
        
        // Cập nhật màu sắc theo trạng thái
        this.orderStatusChartData.datasets[0].backgroundColor = data.orderStatusDistribution.map(s => {
            const colors = {
                'pending': '#ffc107', // Chờ xử lý (Vàng)
                'shipping': '#17a2b8', // Đang giao (Xanh dương nhạt)
                'delivered': '#20c997', // Đã giao (Xanh ngọc)
                'completed': '#28a745', // Hoàn thành (Xanh lá)
                'cancelled': '#dc3545', // Đã hủy (Đỏ)
                'return_requested': '#fd7e14', // Yêu cầu trả hàng (Cam)
                'return_accepted': '#6f42c1', // Đồng ý trả hàng (Tím)
                'returned': '#6c757d' // Đã trả hàng (Xám)
            };
            return colors[s.status] || '#6c757d';
        });

        // Top Products
        this.topProducts = data.topSellingProducts;

      } catch (error) {
        console.error("Lỗi tải dữ liệu dashboard:", error);
      } finally {
        this.isLoading = false;
      }
    },
    translateStatus(status) {
        const map = {
            'pending': 'Chờ xử lý',
            'shipping': 'Đang giao',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
            'delivered': 'Đã giao',
            'return_requested': 'Yêu cầu trả hàng',
            'return_accepted': 'Đồng ý trả hàng',
            'returned': 'Đã trả hàng'
        };
        return map[status] || status;
    }
  },
  mounted() {
    this.fetchDashboardData();
  }
};
</script>

<style scoped>
.dashboard-page { padding: 20px; }
.dashboard-page h1 { font-size: 28px; color: #2c3e50; margin-bottom: 20px; }
.loading-state { text-align: center; font-size: 1.5rem; color: #7f8c8d; padding: 100px 0; }
.summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
.card { background: white; border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.3s, box-shadow 0.3s; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.card-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; }
.card-icon.revenue { background: linear-gradient(135deg, #28a745, #218838); }
.card-icon.orders { background: linear-gradient(135deg, #007bff, #0056b3); }
.card-icon.users { background: linear-gradient(135deg, #ffc107, #e0a800); }
.card-icon.cancelled { background: linear-gradient(135deg, #dc3545, #c82333); }
.card-content .card-title { font-size: 14px; color: #6c757d; margin-bottom: 5px; }
.card-content .card-value { font-size: 24px; font-weight: bold; color: #343a40; }
.charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
.chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); height: 400px; }
.chart-container h3 { margin-top: 0; margin-bottom: 20px; font-size: 18px; color: #343a40; }
.top-products-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.top-products-container h3 { margin-top: 0; margin-bottom: 20px; font-size: 18px; color: #343a40; }
.empty-list { color: #6c757d; text-align: center; padding: 20px 0; }
.product-list { list-style: none; padding: 0; margin: 0; }
.product-list li { display: flex; align-items: center; gap: 15px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.product-list li:last-child { border-bottom: none; }
.rank { font-size: 16px; font-weight: bold; color: #6c757d; width: 20px; text-align: center; }
.product-img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
.product-name { flex: 1; font-weight: 500; color: #343a40; }
.product-sold { font-size: 14px; color: #28a745; font-weight: bold; }
@media (max-width: 992px) { .charts-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .summary-cards { grid-template-columns: 1fr; } }
</style>