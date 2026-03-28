<template>
  <div class="payroll-manager">
    <div class="header">
      <h2>Quản lý Bảng lương</h2>
      <div class="actions">
        <select v-model="selectedMonth" @change="fetchSalaries">
            <option v-for="m in 12" :key="m" :value="m">Tháng {{ m }}</option>
        </select>
        <select v-model="selectedYear" @change="fetchSalaries">
            <option v-for="y in [2023, 2024, 2025]" :key="y" :value="y">Năm {{ y }}</option>
        </select>
        <button class="btn-generate" @click="generatePayroll" :disabled="isGenerating">
            <i class="fa-solid fa-calculator"></i>
            {{ isGenerating ? 'Đang tính...' : 'Tính lương tháng này' }}
        </button>
      </div>
    </div>

    <div class="table-container">
      <table v-if="salaries.length > 0">
        <thead>
          <tr>
            <th>Nhân viên</th>
            <th>Chức vụ</th>
            <th>Lương CB + PC</th>
            <th>Hoa hồng (1%)</th>
            <th>Thưởng / Phạt</th>
            <th>Thực lãnh</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="salary in salaries" :key="salary._id">
            <td>
                <strong>{{ salary.employee_name }}</strong>
                <div style="font-size: 0.8rem; color: gray;">{{ salary.note }}</div>
            </td>
            <td>
                <span :class="['badge-role', salary.employee_role]">{{ salary.employee_role === 'admin' ? 'Admin' : 'Staff' }}</span>
            </td>
            <td>{{ formatPrice(salary.base_salary + salary.allowance) }}</td>
            <td style="color: #27ae60; font-weight: bold;">+{{ formatPrice(salary.commission_amount) }}</td>
            <td>
                <div v-if="editingId === salary._id">
                    <input type="number" v-model.number="editData.bonus" placeholder="Thưởng thêm" class="small-input" />
                    <input type="number" v-model.number="editData.deduction" placeholder="Phạt" class="small-input mt-1" />
                </div>
                <div v-else>
                    <span v-if="salary.bonus > 0" class="text-success">+{{ formatPrice(salary.bonus) }}<br></span>
                    <span v-if="salary.deduction > 0" class="text-danger">-{{ formatPrice(salary.deduction) }}</span>
                    <span v-if="salary.bonus === 0 && salary.deduction === 0">0đ</span>
                </div>
            </td>
            <td class="net-salary">{{ formatPrice(salary.net_salary) }}</td>
            <td>
                <span :class="['status-badge', salary.status]">{{ salary.status === 'paid' ? 'Đã trả' : 'Chưa trả' }}</span>
            </td>
            <td>
                <div v-if="editingId === salary._id" class="action-btns">
                    <button class="btn-save" @click="saveEdit(salary._id)"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-cancel" @click="editingId = null"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div v-else class="action-btns">
                    <button v-if="salary.status === 'unpaid'" class="btn-edit" @click="startEdit(salary)" title="Chỉnh sửa thưởng phạt">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button v-if="salary.status === 'unpaid'" class="btn-pay" @click="markAsPaid(salary._id)" title="Thanh toán">
                        <i class="fa-solid fa-money-bill-wave"></i>
                    </button>
                </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-data">
          <p>Chưa có dữ liệu bảng lương tháng {{ selectedMonth }}/{{ selectedYear }}.</p>
          <p>Vui lòng nhấn nút "Tính lương tháng này" để hệ thống tự động tạo.</p>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="confirmPayId" class="modal-overlay" @click.self="confirmPayId = null">
      <div class="confirm-dialog">
        <div class="confirm-icon"><i class="fa-solid fa-money-bill-wave" style="color: #27ae60;"></i></div>
        <h3>Xác nhận thanh toán</h3>
        <p>Bạn xác nhận đã chuyển khoản/trả lương cho nhân viên này?</p>
        <div class="confirm-actions">
          <button class="btn-cancel-modal" @click="confirmPayId = null">Hủy</button>
          <button class="btn-confirm-pay" @click="executeMarkAsPaid">Đã thanh toán</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SalariesService from "@/services/salaries.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    const now = new Date();
    return {
      salaries: [],
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      isGenerating: false,
      editingId: null,
      editData: { bonus: 0, deduction: 0 },
      confirmPayId: null
    };
  },
  methods: {
    formatPrice(price) {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);
    },
    async fetchSalaries() {
      try {
        this.salaries = await SalariesService.getAll({
            month: this.selectedMonth,
            year: this.selectedYear
        });
      } catch (error) {
        console.error(error);
        showToast("Lỗi tải bảng lương", "error");
      }
    },
    async generatePayroll() {
        this.isGenerating = true;
        try {
            await SalariesService.generate({
                month: this.selectedMonth,
                year: this.selectedYear,
                commissionRate: 0.01 // Hoa hồng 1%
            });
            showToast("Đã tính toán bảng lương thành công!", "success");
            await this.fetchSalaries();
        } catch (error) {
            console.error(error);
            showToast("Lỗi khi tính lương", "error");
        } finally {
            this.isGenerating = false;
        }
    },
    startEdit(salary) {
        this.editingId = salary._id;
        this.editData = { bonus: salary.bonus, deduction: salary.deduction };
    },
    async saveEdit(id) {
        try {
            await SalariesService.update(id, this.editData);
            showToast("Đã cập nhật bảng lương", "success");
            this.editingId = null;
            await this.fetchSalaries();
        } catch (error) {
            showToast("Lỗi cập nhật", "error");
        }
    },
    markAsPaid(id) {
        const salary = this.salaries.find(s => s._id === id);
        const now = new Date();
        if (salary && salary.month === (now.getMonth() + 1) && salary.year === now.getFullYear()) {
             if (!confirm(`⚠️ CẢNH BÁO KẾ TOÁN:\n\nTháng ${salary.month} chưa kết thúc! Nếu bạn thanh toán bây giờ, bảng lương tháng này sẽ bị khóa.\nTuy nhiên, hoa hồng của các đơn hàng phát sinh từ ngày hôm nay đến cuối tháng sẽ được hệ thống TỰ ĐỘNG CỘNG DỒN vào tháng sau.\n\nBạn có chắc chắn muốn chốt lương sớm?`)) {
                 return;
             }
        }
        this.confirmPayId = id;
    },
    async executeMarkAsPaid() {
        if (!this.confirmPayId) return;
        try {
            await SalariesService.update(this.confirmPayId, { status: 'paid', payment_date: new Date() });
            showToast("Đã chốt thanh toán!", "success");
            await this.fetchSalaries();
        } catch (error) {
            showToast("Lỗi thanh toán", "error");
        } finally {
            this.confirmPayId = null;
        }
    }
  },
  mounted() {
    this.fetchSalaries();
  }
};
</script>

<style scoped>
.payroll-manager { padding: 20px; background: #f8f9fa; min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.actions { display: flex; gap: 10px; }
.actions select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
.btn-generate { background: #2c3e50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.btn-generate:hover { background: #34495e; }
.btn-generate:disabled { background: #95a5a6; cursor: not-allowed; }

.table-container { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
th { background: #f8f9fa; font-weight: 600; color: #2c3e50; }
.net-salary { font-weight: bold; color: #e74c3c; font-size: 1.1rem; }

.status-badge { padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; }
.status-badge.paid { background: #e8f8f5; color: #27ae60; }
.status-badge.unpaid { background: #fef9e7; color: #f1c40f; }

.badge-role { padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }
.badge-role.admin { background: #ffcccc; color: #e74c3c; }
.badge-role.staff { background: #d4e6f1; color: #16a085; }

.action-btns { display: flex; gap: 8px; }
.action-btns button { padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; color: white; }
.btn-edit { background: #3498db; }
.btn-pay { background: #27ae60; }
.btn-save { background: #27ae60; }
.btn-cancel { background: #e74c3c; }
.small-input { width: 80px; padding: 4px; border: 1px solid #ddd; border-radius: 4px; }
.mt-1 { margin-top: 5px; }
.text-success { color: #27ae60; }
.text-danger { color: #e74c3c; }
.no-data { padding: 40px; text-align: center; color: #7f8c8d; }

/* Confirm Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.confirm-dialog { background: white; padding: 30px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.confirm-icon { font-size: 3.5rem; margin-bottom: 15px; }
.confirm-dialog h3 { margin-top: 0; color: #2c3e50; font-size: 1.5rem; }
.confirm-dialog p { color: #666; margin-bottom: 25px; line-height: 1.5; font-size: 1.05rem;}
.confirm-actions { display: flex; justify-content: center; gap: 15px; }
.confirm-actions button { padding: 12px 25px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 1rem; }
.btn-cancel-modal { background: #f1f3f5; color: #495057; border: 1px solid #ddd; }
.btn-cancel-modal:hover { background: #e2e6ea; }
.btn-confirm-pay { background: #27ae60; color: white; }
.btn-confirm-pay:hover { background: #219150; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);}
</style>