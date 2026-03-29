<template>
  <div class="page-container">
    <div class="header">
      <h1>Phân công Ca trực</h1>
    </div>

    <div class="split-layout">
      <!-- FORM PHÂN CÔNG -->
      <div class="assign-form card">
        <h3>Tạo ca làm việc</h3>
        <form @submit.prevent="assignShift">
          <div class="form-group">
            <label>Ngày trực <span class="required">*</span></label>
            <input type="date" v-model="form.date" required class="form-control" />
          </div>
          
          <div class="form-group">
            <label>Ca làm việc <span class="required">*</span></label>
            <select v-model="form.shift_type" required class="form-control">
              <option value="morning">Ca Sáng (06:00 - 14:00)</option>
              <option value="afternoon">Ca Chiều (14:00 - 22:00)</option>
              <option value="evening">Ca Đêm (22:00 - 06:00)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Nhân viên <span class="required">*</span></label>
            <select v-model="form.employee_id" required class="form-control">
              <option value="">-- Chọn nhân viên --</option>
              <option v-for="emp in employees" :key="emp._id" :value="emp._id">
                {{ emp.full_name }} ({{ emp.admin_code }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Ghi chú (Tùy chọn)</label>
            <input type="text" v-model="form.note" class="form-control" placeholder="Ghi chú công việc..." />
          </div>

          <button type="submit" class="btn-submit" :disabled="isSubmitting">
            Phân công
          </button>
        </form>
      </div>

      <!-- DANH SÁCH CA TRỰC -->
      <div class="shift-list card">
        <div class="list-header">
            <h3 style="margin: 0;">Danh sách ca trực</h3>
            <div class="filters">
              <select v-model="filterRange" @change="updateDateRange" class="form-control filter-select">
                <option value="today">Hôm nay</option>
                <option value="this_week">Tuần này</option>
                <option value="next_week">Tuần sau</option>
                <option value="this_month">Tháng này</option>
                <option value="custom">Tùy chọn khoảng ngày...</option>
              </select>
              <span v-if="filterRange === 'custom'" class="custom-date-range">
                <input type="date" v-model="filterStartDate" @change="fetchShifts" class="form-control date-input" title="Từ ngày" />
                <span class="separator">-</span>
                <input type="date" v-model="filterEndDate" @change="fetchShifts" class="form-control date-input" title="Đến ngày" />
              </span>
            </div>
        </div>
        
        <table class="admin-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Ca trực</th>
              <th>Nhân viên</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="shifts.length === 0">
                <td colspan="5" style="text-align: center; color: #777;">Chưa có lịch phân công nào.</td>
            </tr>
            <tr v-for="shift in shifts" :key="shift._id">
              <td><strong>{{ formatDate(shift.date) }}</strong></td>
              <td>
                  <span :class="['shift-badge', shift.shift_type]">
                      {{ getShiftName(shift.shift_type) }}
                  </span>
              </td>
              <td>{{ shift.employee_name }}</td>
              <td>
                <select :value="shift.status" @change="updateStatus(shift._id, $event)" class="status-select" :class="shift.status">
                    <option value="scheduled">Đã xếp lịch</option>
                    <option value="attended">Có mặt</option>
                    <option value="absent">Vắng mặt</option>
                </select>
              </td>
              <td>
                <button class="btn-del" @click="confirmDelete(shift._id)" title="Xóa ca trực"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  <!-- Confirm Delete Modal -->
  <div v-if="deleteConfirmId" class="modal-overlay" @click.self="deleteConfirmId = null">
    <div class="confirm-dialog">
      <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3>Xác nhận xóa</h3>
      <p>Bạn có chắc chắn muốn xóa lịch trực này?</p>
      <div class="confirm-actions">
        <button class="btn-cancel-modal" @click="deleteConfirmId = null">Hủy</button>
        <button class="btn-confirm-delete" @click="executeDelete">Xóa</button>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import ShiftsService from "@/services/shifts.service";
import EmployeesService from "@/services/employees.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      shifts: [],
      employees: [],
      isSubmitting: false,
      filterRange: 'this_week', // Mặc định hiển thị nguyên Tuần này
      filterStartDate: '',
      filterEndDate: '',
      deleteConfirmId: null,
      form: {
        date: new Date().toISOString().split('T')[0],
        shift_type: "morning",
        employee_id: "",
        note: ""
      }
    };
  },
  methods: {
    formatDateStr(d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    formatDate(dateStr) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    },
    getShiftName(type) {
        const map = { 'morning': 'Ca Sáng', 'afternoon': 'Ca Chiều', 'evening': 'Ca Đêm', 'full': 'Full Ngày' };
        return map[type] || type;
    },
    async fetchEmployees() {
        try {
            // Chỉ lấy danh sách nhân viên (staff) để phân ca
            const res = await EmployeesService.getAll();
            this.employees = res.filter(e => e.role === 'staff');
        } catch (e) { console.error(e); }
    },
    updateDateRange() {
      const today = new Date();
      const getMonday = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
      };

      if (this.filterRange === 'today') {
        this.filterStartDate = this.formatDateStr(today);
        this.filterEndDate = this.formatDateStr(today);
      } else if (this.filterRange === 'this_week') {
        const monday = getMonday(today);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        this.filterStartDate = this.formatDateStr(monday);
        this.filterEndDate = this.formatDateStr(sunday);
      } else if (this.filterRange === 'next_week') {
        const nextMonday = getMonday(today);
        nextMonday.setDate(nextMonday.getDate() + 7);
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);
        this.filterStartDate = this.formatDateStr(nextMonday);
        this.filterEndDate = this.formatDateStr(nextSunday);
      } else if (this.filterRange === 'this_month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        this.filterStartDate = this.formatDateStr(firstDay);
        this.filterEndDate = this.formatDateStr(lastDay);
      }
      
      if (this.filterRange !== 'custom') {
        this.fetchShifts();
      }
    },
    async fetchShifts() {
        try {
            const params = { startDate: this.filterStartDate, endDate: this.filterEndDate };
            this.shifts = await ShiftsService.getAll(params);
        } catch (e) { console.error(e); }
    },
    async assignShift() {
        this.isSubmitting = true;
        try {
            const emp = this.employees.find(e => e._id === this.form.employee_id);
            const payload = { ...this.form, employee_name: emp ? emp.full_name : "Unknown" };
            
            await ShiftsService.create(payload);
            showToast("Phân công ca trực thành công!", "success");
            
            // Reset form (giữ lại ngày)
            this.form.employee_id = "";
            this.form.note = "";
            
            this.fetchShifts();
        } catch (error) {
            showToast(error.response?.data?.message || "Lỗi khi phân ca", "error");
        } finally {
            this.isSubmitting = false;
        }
    },
    async updateStatus(id, event) {
        const newStatus = event.target.value;
        try {
            await ShiftsService.update(id, { status: newStatus });
            showToast("Đã cập nhật trạng thái chấm công", "success");
            this.fetchShifts();
        } catch (e) { showToast("Lỗi cập nhật trạng thái", "error"); }
    },
    confirmDelete(id) {
        this.deleteConfirmId = id;
    },
    async executeDelete() {
        if (!this.deleteConfirmId) return;
        try {
            await ShiftsService.delete(this.deleteConfirmId);
            showToast("Đã xóa", "success");
            this.fetchShifts();
        } catch (e) { showToast("Lỗi xóa", "error"); }
        finally { this.deleteConfirmId = null; }
    }
  },
  mounted() {
      this.fetchEmployees();
      this.updateDateRange(); // Tính toán ngày của "Tuần này" và tự động fetchShifts
  }
};
</script>

<style scoped>
.page-container { padding: 20px; }
.header h1 { margin-bottom: 20px; color: #2c3e50; }
.split-layout { display: flex; gap: 20px; align-items: flex-start; }
.card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.assign-form { flex: 1; min-width: 300px; }
.shift-list { flex: 2; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.filter-select { width: auto; display: inline-block; padding: 6px 12px; }
.custom-date-range { display: flex; align-items: center; gap: 5px; }
.date-input { width: auto; display: inline-block; padding: 6px 12px; }
.separator { color: #666; font-weight: bold; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #444; }
.required { color: red; }
.form-control { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
.btn-submit { width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-submit:hover:not(:disabled) { background: #219150; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th, .admin-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
.shift-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; }
.shift-badge.morning { background: #fff3cd; color: #856404; }
.shift-badge.afternoon { background: #d1ecf1; color: #0c5460; }
.shift-badge.evening { background: #cce5ff; color: #004085; }
.shift-badge.full { background: #e2e3e5; color: #383d41; }
.status-select { padding: 5px; border-radius: 4px; border: 1px solid #ddd; }
.status-select.scheduled { background: #f8f9fa; color: #666; }
.status-select.attended { background: #d4edda; color: #155724; }
.status-select.absent { background: #f8d7da; color: #721c24; }
.btn-del { color: #e74c3c; background: none; border: none; cursor: pointer; padding: 5px; }
@media (max-width: 768px) { .split-layout { flex-direction: column; } }

/* Confirm Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.confirm-dialog { background: white; padding: 30px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.confirm-icon { font-size: 3.5rem; color: #e74c3c; margin-bottom: 15px; }
.confirm-dialog h3 { margin-top: 0; color: #2c3e50; font-size: 1.5rem; }
.confirm-dialog p { color: #666; margin-bottom: 25px; line-height: 1.5; font-size: 1.05rem;}
.confirm-actions { display: flex; justify-content: center; gap: 15px; }
.confirm-actions button { padding: 12px 25px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 1rem; }
.btn-cancel-modal { background: #f1f3f5; color: #495057; border: 1px solid #ddd; }
.btn-cancel-modal:hover { background: #e2e6ea; }
.btn-confirm-delete { background: #e74c3c; color: white; }
.btn-confirm-delete:hover { background: #c0392b; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);}
</style>