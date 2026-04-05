<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Bảng lương</h1>
      <div class="actions">
        <select v-model="selectedMonth" @change="fetchSalaries" class="filter-select">
            <option v-for="m in 12" :key="m" :value="m">Tháng {{ m }}</option>
        </select>
        <select v-model="selectedYear" @change="fetchSalaries" class="filter-select">
            <option v-for="y in years" :key="y" :value="y">Năm {{ y }}</option>
        </select>
        <button class="btn-add" @click="generatePayroll" :disabled="isGenerating">
            <i class="fa-solid fa-calculator"></i>
            {{ isGenerating ? 'Đang tính...' : 'Tính lương tháng này' }}
        </button>
      </div>
    </div>

    <div>
      <table class="admin-table" v-if="salaries.length > 0">
        <thead>
          <tr>
            <th>Nhân viên</th>
            <th>Chức vụ</th>
            <th>Số công</th>
            <th>Giờ OT</th>
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
            <td>
                <span>{{ salary.working_days || 0 }} / {{ salary.standard_days || 26 }}</span>
            </td>
            <td>
                <div v-if="editingId === salary._id">
                    <input type="number" v-model.number="editData.ot_hours" step="0.5" class="small-input" title="Số giờ tăng ca" />
                </div>
                <span v-else>{{ salary.ot_hours || 0 }} giờ</span>
            </td>
            <td>{{ formatPrice((salary.actual_base_salary || salary.base_salary) + salary.allowance) }}</td>
            <td style="color: #27ae60; font-weight: bold;">+{{ formatPrice(salary.commission_amount) }}</td>
            <td>
                <div v-if="editingId === salary._id">
                    <input type="number" v-model.number="editData.bonus" placeholder="Thưởng thêm" class="small-input" />
                    <input type="number" v-model.number="editData.deduction" placeholder="Phạt" class="small-input mt-1" />
                </div>
                <div v-else>
                    <span v-if="salary.ot_salary > 0" class="text-success">+{{ formatPrice(salary.ot_salary) }} (OT)<br></span>
                    <span v-if="salary.bonus > 0" class="text-success">
                        +{{ formatPrice(salary.bonus) }} (Thưởng)
                    </span>
                    <span v-if="salary.deduction > 0" class="text-danger">-{{ formatPrice(salary.deduction) }}</span>
                    <span v-if="salary.bonus === 0 && salary.deduction === 0 && salary.ot_salary === 0">0đ</span>
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

    <!-- Warning Modal -->
    <div v-if="warningModal.show" class="modal-overlay" @click.self="warningModal.show = false">
      <div class="confirm-dialog warning-dialog">
        <div class="confirm-icon"><i class="fa-solid fa-circle-exclamation" style="color: #f39c12;"></i></div>
        <h3>CẢNH BÁO KẾ TOÁN</h3>
        <p v-html="warningModal.message"></p>
        <div class="confirm-actions">
          <button class="btn-cancel-modal" @click="warningModal.show = false">Hủy bỏ</button>
          <button class="btn-confirm-warning" @click="proceedEarlyPay">Vẫn thanh toán</button>
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
    const currentYear = now.getFullYear();
    const availableYears = [];
    for (let i = 2023; i <= currentYear + 2; i++) {
      availableYears.push(i);
    }
    return {
      salaries: [],
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      years: availableYears,
      isGenerating: false,
      editingId: null,
      editData: { bonus: 0, deduction: 0, working_days: 26, ot_hours: 0 },
      confirmPayId: null,
      warningModal: {
        show: false,
        salaryId: null,
        message: ''
      }
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
        this.editData = { 
            bonus: salary.bonus || 0, 
            deduction: salary.deduction || 0, 
            ot_hours: salary.ot_hours || 0
        };
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
             this.warningModal = {
                show: true,
                salaryId: id,
                message: `Tháng ${salary.month} chưa kết thúc! Nếu bạn thanh toán bây giờ, bảng lương tháng này sẽ bị khóa.<br><br>Tuy nhiên, hoa hồng của các đơn hàng phát sinh từ ngày hôm nay đến cuối tháng sẽ được hệ thống TỰ ĐỘNG CỘNG DỒN vào tháng sau.<br><br>Bạn có chắc chắn muốn chốt lương sớm?`
             };
             return;
        }
        this.confirmPayId = id;
    },
    proceedEarlyPay() {
        this.confirmPayId = this.warningModal.salaryId;
        this.warningModal.show = false;
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
.page-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header h1 { margin: 0; color: #2c3e50; font-size: 24px; }
.actions { display: flex; gap: 10px; align-items: center; }
.filter-select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; outline: none; background: white; }

.btn-add { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; display: flex; align-items: center; gap: 8px; font-weight: bold; }
.btn-add:hover:not(:disabled) { background: linear-gradient(135deg, #8E54E9, #4776E6); box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-1px); }
.btn-add:disabled { background: #95a5a6; cursor: not-allowed; box-shadow: none; transform: none; }

.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.admin-table th { background: #f8f9fa; font-weight: 600; color: #2c3e50; }
.net-salary { font-weight: bold; color: #e74c3c; font-size: 1.1rem; }

.status-badge { padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; }
.status-badge.paid { background: #e8f8f5; color: #27ae60; }
.status-badge.unpaid { background: #fef9e7; color: #f1c40f; }

.badge-role { padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }
.badge-role.admin { background: #ffcccc; color: #e74c3c; }
.badge-role.staff { background: #d4e6f1; color: #16a085; }

.action-btns { display: flex; gap: 12px; align-items: center; justify-content: center; }
.action-btns button { background: none; border: none; cursor: pointer; font-size: 1.1rem; transition: 0.2s; padding: 0; }
.btn-edit { color: #3498db; }
.btn-edit:hover { color: #2980b9; transform: scale(1.1); }
.btn-pay { color: #27ae60; }
.btn-pay:hover { color: #219150; transform: scale(1.1); }
.btn-save { color: #27ae60; }
.btn-save:hover { color: #219150; transform: scale(1.1); }
.btn-cancel { color: #e74c3c; }
.btn-cancel:hover { color: #c0392b; transform: scale(1.1); }
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
.warning-dialog .confirm-icon { font-size: 3.5rem; margin-bottom: 10px; }
.btn-confirm-warning { background: #f39c12; color: white; }
.btn-confirm-warning:hover { background: #e67e22; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(243, 156, 18, 0.3);}
</style>