<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Nhà cung cấp</h1>
      <button class="btn-add" @click="showAddForm">+ Thêm NCC</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên NCC</th>
          <th>Email</th>
          <th>SĐT</th>
          <th>Địa chỉ</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="suppliers.length === 0"><td colspan="5" style="text-align: center;">Không có dữ liệu</td></tr>
        <tr v-for="item in suppliers" :key="item._id">
          <td><strong>{{ item.name }}</strong></td>
          <td>{{ item.email }}</td>
          <td>{{ item.phone }}</td>
          <td>{{ item.address }}</td>
          <td>
            <button @click="edit(item)">Sửa</button>
            <button class="btn-del" @click="remove(item._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isFormVisible" class="form-overlay">
      <div class="form-container">
        <h2>{{ editingId ? 'Cập nhật' : 'Thêm mới' }} Nhà cung cấp</h2>
        <form @submit.prevent="save">
            <input v-model="form.name" placeholder="Tên nhà cung cấp" required class="input-field" />
            <input v-model="form.email" placeholder="Email" type="email" class="input-field" />
            <input v-model="form.phone" placeholder="Số điện thoại" class="input-field" />
            <input v-model="form.address" placeholder="Địa chỉ" class="input-field" />
            <div class="form-actions">
                <button type="submit" class="btn-save">Lưu</button>
                <button type="button" @click="isFormVisible = false">Hủy</button>
            </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import SupplierService from "@/services/suppliers.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      suppliers: [],
      isFormVisible: false,
      editingId: null,
      form: { name: "", email: "", phone: "", address: "" }
    };
  },
  methods: {
    async loadData() {
      this.suppliers = await SupplierService.getAll();
    },
    showAddForm() {
      this.editingId = null;
      this.form = { name: "", email: "", phone: "", address: "" };
      this.isFormVisible = true;
    },
    edit(item) {
      this.editingId = item._id;
      this.form = { ...item };
      this.isFormVisible = true;
    },
    async save() {
      try {
        if (this.editingId) {
            const { _id, ...data } = this.form; // Loại bỏ _id
            await SupplierService.update(this.editingId, data);
        }
        else await SupplierService.create(this.form);
        await this.loadData(); // Đợi tải xong dữ liệu mới
        this.isFormVisible = false;
      } catch (e) { showToast("Có lỗi xảy ra!", "error"); }
    },
    async remove(id) {
      if (confirm("Bạn có chắc muốn xóa?")) {
        await SupplierService.delete(id);
        await this.loadData(); // Đợi tải xong dữ liệu mới
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
.form-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
.form-container { background: white; padding: 30px; border-radius: 8px; width: 400px; }
.input-field { width: 100%; margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; display: block; box-sizing: border-box; }
.btn-save { background: #2980b9; color: white; padding: 10px 20px; border: none; margin-right: 10px; cursor: pointer; border-radius: 4px; }
</style>