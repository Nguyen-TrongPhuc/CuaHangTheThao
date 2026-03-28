<template>
  <div class="my-payslips-page">
    <div class="header">
      <h2>Lương của tôi</h2>
    </div>

    <div class="table-container">
      <table v-if="payslips.length > 0">
        <thead>
          <tr>
            <th>Kỳ lương</th>
            <th>Lương CB + Phụ cấp</th>
            <th>Hoa hồng</th>
            <th>Thưởng / Phạt</th>
            <th>Thực lãnh</th>
            <th>Trạng thái</th>
            <th>Ghi chú chi tiết</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slip in payslips" :key="slip._id">
            <td><strong>Tháng {{ slip.month }}/{{ slip.year }}</strong></td>
            <td>{{ formatPrice(slip.base_salary + slip.allowance) }}</td>
            <td>
                <span class="text-success font-bold">+{{ formatPrice(slip.commission_amount) }}</span><br>
                <small class="text-gray">({{ slip.order_count }} đơn hàng)</small>
            </td>
            <td>
                <span v-if="slip.bonus > 0" class="text-success">+{{ formatPrice(slip.bonus) }}<br></span>
                <span v-if="slip.deduction > 0" class="text-danger">-{{ formatPrice(slip.deduction) }}</span>
                <span v-if="slip.bonus === 0 && slip.deduction === 0">0đ</span>
            </td>
            <td class="net-salary">{{ formatPrice(slip.net_salary) }}</td>
            <td>
                <span :class="['status-badge', slip.status]">{{ slip.status === 'paid' ? 'Đã nhận' : 'Chờ thanh toán' }}</span>
            </td>
            <td class="note-col">{{ slip.note }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-data">
          <i class="fa-solid fa-file-invoice-dollar" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 15px;"></i>
          <p>Bạn chưa có phiếu lương nào.</p>
      </div>
    </div>
  </div>
</template>

<script>
import SalariesService from "@/services/salaries.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      payslips: []
    };
  },
  methods: {
    formatPrice(price) {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);
    },
    async loadPayslips() {
      try {
        this.payslips = await SalariesService.getMySalaries();
      } catch (error) {
        console.error(error);
        showToast("Lỗi tải phiếu lương của bạn", "error");
      }
    }
  },
  mounted() {
    this.loadPayslips();
  }
};
</script>

<style scoped>
.my-payslips-page { padding: 20px; background: #f8f9fa; min-height: 100vh; }
.header { margin-bottom: 20px; }
.header h2 { color: #2c3e50; margin: 0; font-weight: 700; }
.table-container { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
th { background: #f8f9fa; font-weight: 600; color: #2c3e50; }
.net-salary { font-weight: bold; color: #e74c3c; font-size: 1.1rem; }
.status-badge { padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; }
.status-badge.paid { background: #e8f8f5; color: #27ae60; }
.status-badge.unpaid { background: #fef9e7; color: #f1c40f; }
.text-success { color: #27ae60; } .font-bold { font-weight: bold; }
.text-danger { color: #e74c3c; } .text-gray { color: #7f8c8d; }
.note-col { font-size: 0.85rem; color: #555; max-width: 250px; line-height: 1.4; }
.no-data { padding: 60px 20px; text-align: center; color: #7f8c8d; }
</style>