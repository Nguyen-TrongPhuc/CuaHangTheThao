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
            <button @click="$router.push({ name: 'employee.edit', params: { id: emp._id } })">Sửa</button>
            <button class="btn-del" @click="remove(emp._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import EmployeesService from "@/services/employees.service";
import { showToast } from "@/utils/toast";

export default {
  data() { return { employees: [] }; },
  methods: {
    async loadData() {
      this.employees = await EmployeesService.getAll();
    },
    async remove(id) {
      if (confirm("Bạn có chắc muốn xóa nhân viên này?")) {
        try {
          await EmployeesService.delete(id);
          await this.loadData(); // Đợi tải xong dữ liệu mới
          showToast("Xóa thành công!", "success");
        } catch (e) { showToast("Xóa thất bại!", "error"); }
      }
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
</style>