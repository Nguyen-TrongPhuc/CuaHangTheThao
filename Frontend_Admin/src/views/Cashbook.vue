<template>
  <div class="page-container">
    <div class="header">
      <h1>Sổ Quỹ / Dòng Tiền</h1>
      <div class="date-picker-group">
        <button class="btn-export" @click="handleExport" style="background: #217346; color: white; padding: 8px 15px; border: none; border-radius: 6px; cursor: pointer; margin-right: 15px; transition: 0.2s;">
          <i class="fa-solid fa-file-excel"></i> Xuất Excel
        </button>
        <label><i class="fa-regular fa-calendar"></i> Chọn ngày sao kê:</label>
        <input type="date" v-model="selectedDate" @change="fetchCashflow" class="date-input" />
      </div>
    </div>

    <!-- Thẻ Tổng Kết -->
    <div class="summary-cards">
      <div class="card revenue">
        <div class="card-icon"><i class="fa-solid fa-arrow-down-to-line"></i></div>
        <div class="card-info">
          <h3>Tổng Thu</h3>
          <p class="amount">+ {{ formatPrice(data.totalRevenue) }}đ</p>
        </div>
      </div>
      
      <div class="card cost">
        <div class="card-icon"><i class="fa-solid fa-arrow-up-from-line"></i></div>
        <div class="card-info">
          <h3>Tổng Chi</h3>
          <p class="amount">- {{ formatPrice(data.totalCost) }}đ</p>
        </div>
      </div>

      <div class="card profit" :class="{ 'negative': data.profit < 0 }">
        <div class="card-icon"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="card-info">
          <h3>Lợi Nhuận Ngày</h3>
          <p class="amount">{{ formatPrice(data.profit) }}đ</p>
        </div>
      </div>
    </div>

    <!-- Bảng Sao Kê Chi Tiết -->
    <div class="transactions-container">
      <h2>Lịch sử giao dịch ngày {{ formatDate(selectedDate) }}</h2>
      
      <table class="admin-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Loại</th>
            <th>Nguồn</th>
            <th>Mô tả chi tiết</th>
            <th style="text-align: right;">Số tiền (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="5" style="text-align: center; padding: 30px;">Đang tải dữ liệu...</td>
          </tr>
          <tr v-else-if="!data.transactions || data.transactions.length === 0">
            <td colspan="5" style="text-align: center; color: #777; padding: 30px;">
              <i class="fa-solid fa-box-open" style="font-size: 2rem; color: #ccc; margin-bottom: 10px; display: block;"></i>
              Không có giao dịch thu/chi nào trong ngày này.
            </td>
          </tr>
          <tr v-for="(txn, index) in data.transactions" :key="index">
            <td class="time-col">{{ new Date(txn.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }}</td>
            <td>
              <span :class="['badge', txn.type === 'revenue' ? 'badge-success' : 'badge-danger']">
                {{ txn.type === 'revenue' ? 'THU' : 'CHI' }}
              </span>
            </td>
            <td><strong>{{ txn.source }}</strong></td>
            <td class="desc-col">{{ txn.description }}</td>
            <td style="text-align: right; font-weight: bold; font-size: 1.1rem;" :class="txn.type === 'revenue' ? 'text-success' : 'text-danger'">
              {{ txn.type === 'revenue' ? '+' : '-' }}{{ formatPrice(txn.amount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import createApiClient from "@/services/api.service";
import { showToast } from "@/utils/toast";
import { exportCashbookToExcel } from "@/utils/excel";

export default {
  data() {
    // Sửa lỗi múi giờ để tự động lấy đúng ngày hiện tại theo giờ Việt Nam
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    
    return {
      selectedDate: today.toISOString().split('T')[0],
      data: {
        totalRevenue: 0,
        totalCost: 0,
        profit: 0,
        transactions: []
      },
      isLoading: false,
      api: createApiClient("/api/dashboard") // Trỏ vào endpoint dashboard của backend
    };
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN').format(value || 0);
    },
    formatDate(dateString) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    },
    async fetchCashflow() {
      this.isLoading = true;
      try {
        // Gọi API lấy dữ liệu sổ quỹ
        const response = await this.api.get(`/cashflow?date=${this.selectedDate}`);
        this.data = response.data || response;
      } catch (error) {
        console.error("Lỗi lấy dữ liệu sổ quỹ:", error);
        showToast("Không thể tải dữ liệu sổ quỹ!", "error");
        this.data = { totalRevenue: 0, totalCost: 0, profit: 0, transactions: [] };
      } finally {
        this.isLoading = false;
      }
    },
    handleExport() {
      if (!this.data.transactions || this.data.transactions.length === 0) {
        showToast("Không có dữ liệu để xuất!", "error");
        return;
      }
      exportCashbookToExcel(this.data, this.selectedDate);
    }
  },
  mounted() {
    this.fetchCashflow();
  }
};
</script>

<style scoped>
.page-container { padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.header h1 { margin: 0; color: #2c3e50; font-size: 1.8rem; }

.date-picker-group { display: flex; align-items: center; gap: 10px; background: white; padding: 10px 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.btn-export:hover { background: #1e6b3e !important; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(33, 115, 70, 0.3); }
.date-picker-group label { font-weight: 600; color: #555; }
.date-input { border: 1px solid #ddd; padding: 8px 15px; border-radius: 6px; font-size: 1rem; outline: none; cursor: pointer; }
.date-input:focus { border-color: #3498db; }

.summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
.card { display: flex; align-items: center; padding: 25px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.card-icon { font-size: 2.5rem; margin-right: 20px; opacity: 0.8; }
.card-info h3 { margin: 0 0 5px 0; font-size: 1.1rem; font-weight: normal; opacity: 0.9; }
.card-info .amount { margin: 0; font-size: 1.8rem; font-weight: bold; }

.card.revenue { background: linear-gradient(135deg, #2ecc71, #27ae60); }
.card.cost { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.card.profit { background: linear-gradient(135deg, #3498db, #2980b9); }
.card.profit.negative { background: linear-gradient(135deg, #f39c12, #d35400); } /* Nếu lỗ thì chuyển màu cam */

.transactions-container { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.transactions-container h2 { margin-top: 0; color: #2c3e50; font-size: 1.4rem; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }

.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th, .admin-table td { padding: 15px; border-bottom: 1px solid #eee; text-align: left; }
.admin-table th { background-color: #f8f9fa; font-weight: 600; color: #444; }
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tbody tr:hover { background-color: #fcfcfc; }

.time-col { color: #7f8c8d; font-weight: 500; width: 100px; }
.desc-col { color: #555; }

.badge { padding: 5px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; }
.badge-success { background-color: #e8f8f5; color: #27ae60; }
.badge-danger { background-color: #fdedec; color: #e74c3c; }

.text-success { color: #27ae60; }
.text-danger { color: #e74c3c; }
</style>