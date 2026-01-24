<template>
  <div class="employee-page">
    <div class="header">
      <h1>Quản lý Nhân viên</h1>
      <button class="btn-add" @click="goToAddEmployee">+ Thêm nhân viên</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Email</th>
          <th>Vai trò</th>
          <th>Số điện thoại</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="employee in employees" :key="employee._id">
          <td>{{ employee.name }}</td>
          <td>{{ employee.email }}</td>
          <td><span class="badge">{{ employee.role }}</span></td>
          <td>{{ employee.phone }}</td>
          <td>
            <button @click="editEmployee(employee._id)">Sửa</button>
            <button class="btn-del" @click="deleteEmployee(employee._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import EmployeesService from "@/services/employees.service";

export default {
  data() {
    return {
      employees: [],
    };
  },
  methods: {
    async retrieveEmployees() {
      try {
        this.employees = await EmployeesService.getAll();
      } catch (error) {
        console.log(error);
      }
    },
    goToAddEmployee() {
      this.$router.push({ name: "employee.add" });
    },
    editEmployee(id) {
      this.$router.push({ name: "employee.edit", params: { id: id } });
    },
    async deleteEmployee(id) {
      if (confirm("Bạn muốn xóa nhân viên này?")) {
        try {
          await EmployeesService.delete(id);
          this.retrieveEmployees();
        } catch (error) {
          console.log(error);
        }
      }
    },
  },
  mounted() {
    this.retrieveEmployees();
  },
};
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.badge { background: #eee; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
.btn-add { background: #27ae60; color: white; padding: 10px 20px; border: none; cursor: pointer; }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
</style>