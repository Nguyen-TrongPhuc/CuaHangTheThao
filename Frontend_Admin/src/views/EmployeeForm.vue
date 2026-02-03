<template>
  <div class="employee-form-page">
    <div class="form-container">
      <h2>{{ isEditMode ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới' }}</h2>
      
      <form @submit.prevent="saveEmployee">
        <div class="form-group">
          <label>Họ và tên:</label>
          <input v-model="employee.full_name" required placeholder="Nhập họ tên" />
        </div>

        <div class="form-group">
          <label>Mã Admin / Mã nhân viên:</label>
          <input v-model="employee.admin_code" required placeholder="Ví dụ: ADMIN002" :disabled="isEditMode" />
          <small v-if="isEditMode">Mã nhân viên không thể thay đổi</small>
        </div>

        <div class="form-group">
          <label>Số điện thoại:</label>
          <input v-model="employee.phone" placeholder="Nhập số điện thoại" />
        </div>

        <div class="form-group">
          <label>Mật khẩu:</label>
          <input v-model="employee.password" type="password" :required="!isEditMode" placeholder="Nhập mật khẩu" />
          <small v-if="isEditMode">Để trống nếu không muốn đổi mật khẩu</small>
        </div>

        <div class="form-group">
          <label>Vai trò (Quyền hạn):</label>
          <select v-model="employee.role">
            <option value="staff">Nhân viên (Staff)</option>
            <option value="admin">Quản trị viên (Admin)</option>
          </select>
          <small>Admin có toàn quyền quản lý hệ thống.</small>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save">Lưu</button>
          <button type="button" @click="$router.push('/employees')" class="btn-cancel">Hủy</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import EmployeesService from "@/services/employees.service";
import { showToast } from "@/utils/toast";

export default {
  props: ["id"],
  data() {
    return {
      employee: {
        full_name: "",
        admin_code: "",
        phone: "",
        password: "",
        role: "staff", // Mặc định là nhân viên thường
      },
    };
  },
  computed: {
    isEditMode() {
      return !!this.id;
    },
  },
  methods: {
    async getEmployee(id) {
      try {
        this.employee = await EmployeesService.get(id);
        // Xóa mật khẩu khỏi form khi load dữ liệu để tránh ghi đè hash cũ
        this.employee.password = ""; 
      } catch (error) {
        console.log(error);
        this.$router.push({ name: "employee.manager" });
      }
    },
    async saveEmployee() {
      try {
        const data = { ...this.employee };
        delete data._id; // Xóa _id để tránh lỗi khi update
        if (this.isEditMode && !data.password) {
            delete data.password;
        }

        if (this.isEditMode) {
          await EmployeesService.update(this.id, data);
          showToast("Cập nhật thành công!", "success");
        } else {
          await EmployeesService.create(data);
          showToast("Tạo tài khoản thành công!", "success");
        }
        this.$router.push("/employees");
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 409) {
            showToast("Mã Admin này đã tồn tại!", "error");
        } else {
            showToast("Có lỗi xảy ra, vui lòng thử lại.", "error");
        }
      }
    },
  },
  created() {
    if (this.isEditMode) {
      this.getEmployee(this.id);
    }
  },
};
</script>

<style scoped>
.employee-form-page { display: flex; justify-content: center; padding-top: 50px; }
.form-container { background: white; padding: 30px; border-radius: 8px; width: 500px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
h2 { text-align: center; margin-bottom: 20px; color: #2c3e50; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.form-group small { color: #7f8c8d; font-size: 0.85em; }
.form-actions { display: flex; justify-content: space-between; margin-top: 20px; }
.btn-save { background: #27ae60; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
.btn-cancel { background: #95a5a6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
.btn-save:hover { background: #219150; }
.btn-cancel:hover { background: #7f8c8d; }
</style>