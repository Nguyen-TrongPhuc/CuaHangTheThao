<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Nhân viên</h1>
      <button class="btn-add" @click="$router.push('/employees/add')">+ Thêm nhân viên</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Mã Admin/NV</th>
          <th>SĐT</th>
          <th>Vai trò</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="employees.length === 0"><td colspan="5" style="text-align: center;">Không có dữ liệu</td></tr>
        <tr v-for="emp in employees" :key="emp._id">
          <td>{{ emp.full_name }}</td>
          <td><strong>{{ emp.admin_code }}</strong></td>
          <td>{{ emp.phone }}</td>
          <td>
            <span :style="{ color: emp.role === 'admin' ? 'red' : 'blue', fontWeight: 'bold' }">
                {{ emp.role === 'admin' ? 'Quản trị viên' : 'Nhân viên' }}
            </span>
          </td>
          <td>
            <button class="btn-edit" @click="$router.push({ name: 'EmployeeEdit', params: { id: emp._id } })">Sửa</button>
            <button class="btn-del" @click="remove(emp._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Confirm Modal -->
    <div v-if="deleteConfirmId" class="modal-overlay" @click.self="deleteConfirmId = null">
      <div class="confirm-dialog">
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa Nhân viên này? Quyền truy cập của họ sẽ bị thu hồi ngay lập tức.</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="deleteConfirmId = null">Hủy</button>
          <button class="btn-confirm-delete" @click="executeDelete">Xóa</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EmployeesService from "@/services/employees.service";
import { showToast } from "@/utils/toast";

export default {
  data() { return { employees: [], deleteConfirmId: null }; },
  methods: {
    async loadData() {
      this.employees = await EmployeesService.getAll();
    },
    remove(id) {
      this.deleteConfirmId = id;
    },
    async executeDelete() {
      if (!this.deleteConfirmId) return;
      try {
        await EmployeesService.delete(this.deleteConfirmId);
        await this.loadData();
        showToast("Xóa thành công!", "success");
      } catch (e) { showToast("Xóa thất bại!", "error"); }
      finally { this.deleteConfirmId = null; }
    }
  },
  mounted() { this.loadData(); }
};
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.btn-add { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; }
.btn-add:hover { background: linear-gradient(135deg, #8E54E9, #4776E6); box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-1px); }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
.btn-edit { color: #3498db; cursor: pointer; border: none; background: none; margin-right: 5px; }

/* Confirm Delete Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.confirm-dialog { background: white; padding: 30px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.confirm-icon { font-size: 3rem; color: #e74c3c; margin-bottom: 15px; }
.confirm-dialog h3 { margin-top: 0; color: #2c3e50; font-size: 1.5rem; }
.confirm-dialog p { color: #666; margin-bottom: 25px; line-height: 1.5; }
.confirm-actions { display: flex; justify-content: center; gap: 15px; }
.confirm-actions button { padding: 10px 25px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-cancel { background: #f1f3f5; color: #495057; border: 1px solid #ddd; }
.btn-cancel:hover { background: #e2e6ea; }
.btn-confirm-delete { background: #e74c3c; color: white; }
.btn-confirm-delete:hover { background: #c0392b; }
</style>