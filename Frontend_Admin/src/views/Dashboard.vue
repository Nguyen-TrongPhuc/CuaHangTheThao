<template>
  <div class="dashboard-page">
    <h1>Bảng điều khiển</h1>
    
    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...
    </div>

    <div v-else>
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div v-if="userRole === 'admin'" class="card">
          <div class="card-icon revenue"><i class="fa-solid fa-dollar-sign"></i></div>
          <div class="card-content">
            <div class="card-title">Tổng doanh thu (Tháng này)</div>
            <div class="card-value">{{ formatPrice(summary.totalRevenueMonth) }}</div>
          </div>
        </div>
        <div v-if="userRole === 'admin'" class="card">
          <div class="card-icon" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white;"><i class="fa-solid fa-file-invoice-dollar"></i></div>
          <div class="card-content">
            <div class="card-title">Tổng chi phí (Tháng này)</div>
            <div class="card-value text-danger">{{ formatPrice(summary.totalCostMonth) }}</div>
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
          <div class="card-icon cancelled"><i class="fa-solid fa-ban"></i></div>
          <div class="card-content">
            <div class="card-title">Đơn hàng bị hủy (Tháng này)</div>
            <div class="card-value">{{ summary.cancelledOrdersMonth }}</div>
          </div>
        </div>
        <!-- Card dành riêng cho Staff tập trung vào Vận hành -->
        <div v-if="userRole === 'staff'" class="card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f39c12, #d35400); color: white;"><i class="fa-solid fa-clock-rotate-left"></i></div>
          <div class="card-content">
            <div class="card-title">Đơn chờ xử lý</div>
            <div class="card-value" style="color: #f39c12;">{{ pendingOrdersCount }}</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid" :style="userRole === 'staff' ? { gridTemplateColumns: '1fr 1fr' } : {}">
        <div v-if="userRole === 'admin'" class="chart-container">
          <div class="section-header">
            <h3>Doanh thu theo ngày</h3>
            <div class="filters">
              <input type="date" v-model="revenueFromDate" @change="fetchRevenueChart" />
              <span>đến</span>
              <input type="date" v-model="revenueToDate" @change="fetchRevenueChart" />
              <button @click="fetchRevenueChart" style="padding: 5px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Cập nhật</button>
            </div>
          </div>
          <div class="chart-wrapper">
            <Line v-if="revenueChartData.labels.length" :data="revenueChartData" :options="chartOptions" />
          </div>
        </div>
        <div class="chart-container">
          <div class="section-header" style="margin-bottom: 10px;">
            <h3>Tình trạng đơn hàng</h3>
            <div class="filters">
              <select v-model="orderStatusType" @change="updateOrderStatusChart" class="filter-select-small">
                <option value="month">Theo tháng</option>
                <option value="all">Tất cả</option>
              </select>
              <select v-if="orderStatusType === 'month'" v-model.number="orderStatusMonth" @change="updateOrderStatusChart" class="filter-select-small">
                <option v-for="m in 12" :key="m" :value="m">Tháng {{ m }}</option>
              </select>
              <select v-if="orderStatusType === 'month'" v-model.number="orderStatusYear" @change="updateOrderStatusChart" class="filter-select-small">
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
          <div class="chart-wrapper">
            <Doughnut v-if="orderStatusChartData.labels && orderStatusChartData.labels.length > 0" :data="orderStatusChartData" :options="chartOptions" />
            <div v-else class="empty-chart">Chưa có đơn hàng nào</div>
          </div>
        </div>
        
        <!-- Thiết kế chuyên biệt cho Staff: Bảng nhiệm vụ vận hành -->
        <div v-if="userRole === 'staff'" class="tasks-container">
          <h3><i class="fa-solid fa-list-check"></i> Nhiệm vụ cần xử lý</h3>
          <div class="task-list">
            <router-link to="/orders" class="task-item">
              <div class="task-icon warning"><i class="fa-solid fa-hourglass-half"></i></div>
              <div class="task-info">
                <span class="task-name">Đơn chờ xác nhận</span>
                <span class="task-desc">Đơn hàng mới cần đóng gói và giao đi</span>
              </div>
              <div class="task-count" :class="{ 'has-task': pendingOrdersCount > 0 }">{{ pendingOrdersCount }}</div>
            </router-link>

            <router-link to="/orders" class="task-item">
              <div class="task-icon danger"><i class="fa-solid fa-rotate-left"></i></div>
              <div class="task-info">
                <span class="task-name">Yêu cầu trả hàng</span>
                <span class="task-desc">Khách yêu cầu hoàn trả, cần xử lý ngay</span>
              </div>
              <div class="task-count" :class="{ 'has-task': returnRequestedCount > 0 }">{{ returnRequestedCount }}</div>
            </router-link>

            <div class="task-item" @click="activeTab = 'stock'" style="cursor: pointer;">
              <div class="task-icon stock-alert"><i class="fa-solid fa-boxes-stacked"></i></div>
              <div class="task-info">
                <span class="task-name">Sản phẩm sắp hết</span>
                <span class="task-desc">Mặt hàng tồn kho thấp cần báo cáo nhập</span>
              </div>
              <div class="task-count" :class="{ 'has-task': lowStockProducts.length > 0 }">{{ lowStockProducts.length }}</div>
            </div>
          </div>
        </div>
      </div>

    

      <!-- NEW: Detailed Reports Tabs -->
      <div class="detailed-reports-container">
        <div class="dashboard-tabs">
          <button v-if="userRole === 'admin'" :class="{ active: activeTab === 'sales' }" @click="activeTab = 'sales'">Doanh số tháng</button>
          <button :class="{ active: activeTab === 'customers' }" @click="activeTab = 'customers'">Top Khách hàng</button>
          <button :class="{ active: activeTab === 'topProducts' }" @click="activeTab = 'topProducts'">Sản phẩm bán chạy</button>
          <button :class="{ active: activeTab === 'stock' }" @click="activeTab = 'stock'">Sắp hết hàng</button>
          <button :class="{ active: activeTab === 'import' }" @click="activeTab = 'import'">Lịch sử nhập kho</button>
        </div>

        <div class="tab-content">
          <!-- 1. Doanh số theo tháng -->
          <div v-if="activeTab === 'sales' && userRole === 'admin'" class="report-section">
            <div class="section-header">
              <h3>Thống kê doanh số theo tháng</h3>
              <div class="filters">
                <select v-model="salesYear" @change="fetchMonthlySales">
                  <option v-for="y in years" :key="y" :value="y">Năm {{ y }}</option>
                </select>
              </div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Số đơn hàng</th>
                  <th>SL Bán ra</th>
                  <th>Doanh thu</th>
                  <th>SL Nhập vào</th>
                  <th>Chi phí nhập</th>
                  <th>Chi phí lương</th>
                  <th>Lợi nhuận gộp</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in monthlySales" :key="item.month">
                  <td>Tháng {{ item.month }}</td>
                  <td>{{ item.orderCount }}</td>
                  <td>{{ item.totalSoldQuantity || 0 }}</td>
                  <td class="price-col text-success">+{{ formatPrice(item.totalRevenue) }}</td>
                  <td>{{ item.totalImportQuantity || 0 }}</td>
                  <td class="price-col text-danger">-{{ formatPrice(item.totalImportCost || 0) }}</td>
                  <td class="price-col text-danger">-{{ formatPrice(item.totalSalaryCost || 0) }}</td>
                  <td class="price-col" :class="item.profit >= 0 ? 'text-success' : 'text-danger'">
                    {{ item.profit > 0 ? '+' : '' }}{{ formatPrice(item.profit || 0) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 2. Top Khách hàng -->
          <div v-if="activeTab === 'customers'" class="report-section">
            <div class="section-header">
              <h3>Khách hàng mua nhiều nhất</h3>
              <div class="filters">
                <input type="date" v-model="customerStart" @change="fetchTopCustomers" />
                <span>đến</span>
                <input type="date" v-model="customerEnd" @change="fetchTopCustomers" />
              </div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Số đơn</th>
                  <th>Tổng chi tiêu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in topCustomers" :key="c._id">
                  <td>{{ c.name }}</td>
                  <td>{{ c.email }}</td>
                  <td>{{ c.orderCount }}</td>
                  <td class="price-col">{{ formatPrice(c.totalSpent) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 5. Top Sản phẩm bán chạy -->
          <div v-if="activeTab === 'topProducts'" class="report-section">
            <div class="section-header">
              <h3>Top {{ productLimit || 5 }} Sản phẩm bán chạy nhất - Tháng {{ productMonth }}/{{ productYear }}</h3>
              <div class="filters">
                <select v-model="productYear" @change="fetchTopProducts">
                  <option v-for="y in years" :key="y" :value="y">Năm {{ y }}</option>
                </select>
                <select v-model="productMonth" @change="fetchTopProducts">
                  <option v-for="m in 12" :key="m" :value="m">Tháng {{ m }}</option>
                </select>
                <input type="number" v-model="productLimit" @change="fetchTopProducts" placeholder="Số lượng" min="1" max="20" style="width: 80px" />
              </div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Hình ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Lượt mua (số đơn)</th>
                  <th>Số lượng đã bán</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="topProducts.length === 0">
                  <td colspan="5" style="text-align: center; padding: 20px;">Chưa có dữ liệu</td>
                </tr>
                <tr v-for="(p, index) in topProducts" :key="p._id">
                  <td>
                    <span class="rank-badge" :class="'rank-' + (index + 1)">#{{ index + 1 }}</span>
                  </td>
                  <td><img :src="p.image || 'https://placehold.co/40'" class="thumb-img" /></td>
                  <td style="font-weight: 500;">{{ p.name }}</td>
                  <td>{{ p.totalSold }}</td>
                  <td class="price-col text-success">{{ p.totalQuantity }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 3. Sản phẩm sắp hết hàng -->
          <div v-if="activeTab === 'stock'" class="report-section">
            <div class="section-header">
              <h3>Sản phẩm tồn kho thấp (≤ {{ stockThreshold }})</h3>
              <div class="filters">
                <label>Mức cảnh báo:</label>
                <input type="number" v-model="stockThreshold" @change="fetchLowStock" min="1" style="width: 60px" />
              </div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Tồn kho / Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in lowStockProducts" :key="p._id">
                  <td><img :src="p.image || 'https://placehold.co/40'" class="thumb-img" /></td>
                  <td>{{ p.name }}</td>
                  <td>
                    <div v-if="p.lowStockVariants && p.lowStockVariants.length > 0">
                      <span v-for="(v, idx) in p.lowStockVariants" :key="idx" class="variant-badge">
                        {{ getVariantName(v) }}: <b style="color: #dc3545; font-weight: 800;">{{ v.stock }}</b>
                      </span>
                    </div>
                    <div v-else>
                        <b style="color: #dc3545;">{{ p.stock }}</b> <span style="font-size: 0.9em; color: #777;">(Sản phẩm đơn giản)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 4. Báo cáo nhập hàng -->
          <div v-if="activeTab === 'import'" class="report-section">
            <div class="section-header">
              <h3>Báo cáo nhập hàng</h3>
              <div class="filters">
                <input type="date" v-model="importStart" @change="fetchImportReport" />
                <span>đến</span>
                <input type="date" v-model="importEnd" @change="fetchImportReport" />
              </div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Ngày nhập</th>
                  <th>Sản phẩm</th>
                  <th>Người nhập</th>
                  <th>Số lượng</th>
                  <th v-if="userRole === 'admin'">Đơn giá gốc</th>
                  <th v-if="userRole === 'admin'">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(i, index) in importReport" :key="index">
                  <td><span class="receipt-id">#{{ String(i._id).slice(-6).toUpperCase() }}</span></td>
                  <td>{{ formatDate(i.createdAt) }}</td>
                  <td>
                    {{ i.product_name }}
                    <span v-if="i.variant_desc && i.variant_desc !== '---'" style="font-size: 0.85em; color: #7f8c8d; margin-left: 5px;">({{ i.variant_desc }})</span>
                  </td>
                  <td>{{ i.importer || 'Admin' }}</td>
                  <td>{{ i.quantity }}</td>
                  <td v-if="userRole === 'admin'">{{ formatPrice(i.import_price) }}</td>
                  <td v-if="userRole === 'admin'" class="price-col">{{ formatPrice(i.total_cost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardService from '@/services/dashboard.service';
import OrderService from '@/services/orders.service';
import { Line, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement } from 'chart.js';
import { showToast } from "@/utils/toast";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement);

export default {
  components: { Line, Doughnut },
  data() {
    return {
      userRole: localStorage.getItem("user_role") || "staff",
      isLoading: true,
      summary: {
        totalRevenueMonth: 0,
        totalCostMonth: 0,
        newOrdersToday: 0,
        cancelledOrdersMonth: 0,
        orderStatusDistribution: []
      },
      summaryTopProducts: [],
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
      revenueFromDate: '',
      revenueToDate: '',
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
      },
      // New Data
      activeTab: localStorage.getItem("user_role") === 'admin' ? 'sales' : 'customers',
      salesYear: new Date().getFullYear(),
      years: [ 2024, 2025, 2026,2027],
      monthlySales: [],
      customerStart: '',
      customerEnd: '',
      topCustomers: [],
      stockThreshold: 10,
      lowStockProducts: [],
      productYear: new Date().getFullYear(),
      productMonth: new Date().getMonth() + 1,
      productLimit: 5,
      importStart: '',
      importEnd: '',
      importReport: [],
      orderStatusType: 'month',
      orderStatusMonth: new Date().getMonth() + 1,
      orderStatusYear: new Date().getFullYear(),
      allOrdersData: []
    };
  },
  computed: {
    pendingOrdersCount() {
      if (!this.summary.orderStatusDistribution) return 0;
      const pending = this.summary.orderStatusDistribution.find(s => s.status === 'pending');
      return pending ? pending.count : 0;
    },
    returnRequestedCount() {
      if (!this.summary.orderStatusDistribution) return 0;
      const returned = this.summary.orderStatusDistribution.find(s => s.status === 'return_requested');
      return returned ? returned.count : 0;
    }
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    },
    formatDate(date) {
      return new Date(date).toLocaleString('vi-VN');
    },
    getVariantName(variant) {
      const size = variant.size_name || (variant.size_id ? 'Size?' : '---');
      const color = variant.color_name || (variant.color_id ? 'Màu?' : '---');
      return `${size} - ${color}`;
    },
    initDates() {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const formatDateInput = (date) => date.toISOString().split('T')[0];
      this.revenueFromDate = formatDateInput(thirtyDaysAgo);
      this.revenueToDate = formatDateInput(today);
      this.customerStart = this.importStart = formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1));
      this.customerEnd = this.importEnd = formatDateInput(today);
    },
    async fetchDashboardData() {
      this.isLoading = true;
      try {
        const data = await DashboardService.getSummary();
        
        // Summary Cards
      this.summary = {
          totalRevenueMonth: data.totalRevenueMonth,
          totalCostMonth: data.totalCostMonth,
          newOrdersToday: data.newOrdersToday,
          cancelledOrdersMonth: data.cancelledOrdersMonth,
          orderStatusDistribution: data.orderStatusDistribution || []
        };
        
        this.summaryTopProducts = data.topSellingProducts || [];

        // Initial revenue chart from summary (current month)
        await this.fetchRevenueChart();

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
    },
    // New Fetch Methods
    async fetchAllOrdersForChart() {
      try {
        this.allOrdersData = await OrderService.getAll();
        this.updateOrderStatusChart();
      } catch (e) { console.error("Lỗi tải danh sách đơn hàng cho biểu đồ:", e); }
    },
    updateOrderStatusChart() {
      let filtered = this.allOrdersData || [];
      if (this.orderStatusType === 'month') {
        filtered = filtered.filter(o => {
          if (!o.createdAt) return false;
          const d = new Date(o.createdAt);
          return d.getMonth() + 1 === this.orderStatusMonth && d.getFullYear() === this.orderStatusYear;
        });
      }

      const dist = {};
      filtered.forEach(o => {
        dist[o.status] = (dist[o.status] || 0) + 1;
      });

      const colors = { 'pending': '#ffc107', 'shipping': '#17a2b8', 'delivered': '#20c997', 'completed': '#28a745', 'cancelled': '#dc3545', 'return_requested': '#fd7e14', 'return_accepted': '#6f42c1', 'returned': '#6c757d' };
      const labels = [];
      const data = [];
      const bgColors = [];

      for (const [status, count] of Object.entries(dist)) {
          labels.push(this.translateStatus(status));
          data.push(count);
          bgColors.push(colors[status] || '#6c757d');
      }

      this.orderStatusChartData = {
        labels: labels,
        datasets: [{ backgroundColor: bgColors, data: data }]
      };
    },
    async fetchMonthlySales() {
      if (this.userRole !== 'admin') return;
      try { 
        this.monthlySales = await DashboardService.getMonthlySales(this.salesYear); 
      } catch (e) { console.error(e); }
    },
    async fetchTopCustomers() {
      try { this.topCustomers = await DashboardService.getTopCustomers(this.customerStart, this.customerEnd); } catch (e) { console.error(e); }
    },
    async fetchLowStock() {
      try { this.lowStockProducts = await DashboardService.getLowStockProducts(this.stockThreshold); } catch (e) { console.error(e); }
    },
    async fetchTopProducts() {
      try { 
        this.topProducts = await DashboardService.getTopProductsByMonth(this.productYear, this.productMonth, this.productLimit); 
      } catch (e) { console.error(e); }
    },
    async fetchRevenueChart() {
      if (this.userRole !== 'admin') return;
      try {
        const data = await DashboardService.getDailyRevenueRange(this.revenueFromDate, this.revenueToDate);
        this.revenueChartData = {
          labels: data.map(d => d.date), // Lấy thẳng chuỗi 'Ngày/Tháng' do backend trả về, không dùng toLocaleDateString nữa
          datasets: [{
            label: 'Doanh thu',
            backgroundColor: '#4776E6',
            borderColor: '#4776E6',
            data: data.map(d => d.total),
          }]
        };
      } catch (e) {
        console.error('Lỗi tải biểu đồ doanh thu:', e);
      }
    },

    async fetchImportReport() {
      try { this.importReport = await DashboardService.getImportReport(this.importStart, this.importEnd); } catch (e) { console.error(e); }
    }
  },
  mounted() {
    this.initDates();
    this.fetchDashboardData();
    this.fetchAllOrdersForChart();
    
    // Fetch new reports
    if (this.userRole === 'admin') {
      this.fetchMonthlySales();
    }
    this.fetchTopCustomers();
    this.fetchLowStock();
    this.fetchTopProducts();
    this.fetchImportReport();
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'topProducts') {
        this.fetchTopProducts();
      } else if (newTab === 'sales') {
        this.fetchMonthlySales();
      } else if (newTab === 'customers') {
        this.fetchTopCustomers();
      } else if (newTab === 'stock') {
        this.fetchLowStock();
      } else if (newTab === 'import') {
        this.fetchImportReport();
      }
    }
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

/* Charts Grid */
.charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
.chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); height: 400px; display: flex; flex-direction: column; }
.chart-container h3 { margin-top: 0; margin-bottom: 20px; font-size: 18px; color: #343a40; }
.chart-wrapper { flex: 1; position: relative; min-height: 0; }

/* Staff Task List */
.tasks-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); height: 400px; overflow-y: auto; }
.tasks-container h3 { margin-top: 0; margin-bottom: 20px; font-size: 18px; color: #343a40; display: flex; align-items: center; gap: 10px;}
.tasks-container h3 i { color: #4776E6; }
.task-list { display: flex; flex-direction: column; gap: 15px; }
.task-item { display: flex; align-items: center; padding: 15px; border: 1px solid #eee; border-radius: 8px; text-decoration: none; color: inherit; transition: all 0.3s ease; background: #fafafa;}
.task-item:hover { border-color: #3498db; background: #fff; transform: translateX(5px); box-shadow: 0 4px 12px rgba(0,0,0,0.05);}
.task-icon { width: 45px; height: 45px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 15px; color: white;}
.task-icon.warning { background: linear-gradient(135deg, #f1c40f, #f39c12); }
.task-icon.danger { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.task-icon.stock-alert { background: linear-gradient(135deg, #9b59b6, #8e44ad); }
.task-info { flex: 1; display: flex; flex-direction: column; }
.task-name { font-weight: 600; font-size: 15px; color: #2c3e50; margin-bottom: 4px;}
.task-desc { font-size: 12px; color: #7f8c8d; }
.task-count { font-size: 20px; font-weight: bold; color: #bdc3c7; min-width: 30px; text-align: right;}
.task-count.has-task { color: #e74c3c; }

/* Bottom Grid */
.bottom-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-bottom: 30px; }

@media (max-width: 992px) { 
  .charts-grid, .bottom-grid { grid-template-columns: 1fr; } 
}
@media (max-width: 768px) { .summary-cards { grid-template-columns: 1fr; } }

/* New Styles for Tabs and Tables */
.detailed-reports-container { margin-top: 30px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 20px; }
.dashboard-tabs { margin-bottom: 20px; border-bottom: 1px solid #ddd; display: flex; gap: 10px; overflow-x: auto; }
.dashboard-tabs button { padding: 10px 20px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-size: 16px; color: #555; font-weight: 500; white-space: nowrap; }
.dashboard-tabs button.active { border-bottom-color: #3498db; color: #3498db; }
.dashboard-tabs button:hover { color: #3498db; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
.section-header h3 { margin: 0; color: #2c3e50; font-size: 18px; }
.filters { display: flex; align-items: center; gap: 10px; }
.filters input, .filters select { padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; }

.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { background-color: #f8f9fa; font-weight: 600; color: #2c3e50; }
.price-col { font-weight: bold; color: #2c3e50; }
.thumb-img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #eee; }

.variant-badge {
  display: inline-block;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.85em;
  margin-right: 5px;
  margin-bottom: 4px;
  white-space: nowrap;
}
.text-success { color: #28a745 !important; }
.text-danger { color: #dc3545 !important; }

.receipt-id { background: #f0f2f5; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; color: #555; }
/* Rank Badge */
.rank-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 13px; background: #f0f0f0; color: #555; }
.rank-1 { background: #fff3cd; color: #856404; } /* Vàng */
.rank-2 { background: #e2e3e5; color: #383d41; } /* Bạc */
.rank-3 { background: #f8d7da; color: #721c24; } /* Đồng/Đỏ nhạt */
.filter-select-small { padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; outline: none; background: #fdfdfd; cursor: pointer; }
.empty-chart { text-align: center; color: #999; margin-top: 60px; font-style: italic; font-size: 0.95rem; }
</style>