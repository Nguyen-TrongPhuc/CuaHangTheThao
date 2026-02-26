<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Màu sắc</h1>
      <button class="btn-add" @click="showAddForm">+ Thêm màu</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên màu</th>
          <th>Mã màu (Hex)</th>
          <th>Hiển thị</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="colors.length === 0"><td colspan="4" style="text-align: center;">Chưa có dữ liệu</td></tr>
        <tr v-for="item in colors" :key="item._id">
          <td><strong>{{ item.name }}</strong></td>
          <td>{{ item.hex }}</td>
          <td>
            <div :style="{ backgroundColor: item.hex, width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ccc' }"></div>
          </td>
          <td>
            <button @click="edit(item)">Sửa</button>
            <button class="btn-del" @click="remove(item._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isFormVisible" class="form-overlay">
      <div class="form-container">
        <h2>{{ editingId ? 'Cập nhật' : 'Thêm mới' }} Màu sắc</h2>
        <form @submit.prevent="save">
            <input v-model="form.name" placeholder="Tên màu (VD: Đỏ)" required class="input-field" />
            <input v-model="form.hex" type="color" class="input-field" style="height: 50px; padding: 5px;" />
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
import ColorsService from "@/services/colors.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      colors: [],
      isFormVisible: false,
      editingId: null,
      form: { name: "", hex: "#000000" }
    };
  },
  methods: {
    async loadData() {
      this.colors = await ColorsService.getAll();
    },
    showAddForm() {
      this.editingId = null;
      this.form = { name: "", hex: "#000000" };
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
            const { _id, ...data } = this.form;
            await ColorsService.update(this.editingId, data);
        }
        else await ColorsService.create(this.form);
        await this.loadData();
        this.isFormVisible = false;
        showToast("Lưu thành công!", "success");
      } catch (e) { showToast("Có lỗi xảy ra!", "error"); }
    },
    async remove(id) {
      if (confirm("Bạn có chắc muốn xóa?")) {
        try {
          await ColorsService.delete(id);
          await this.loadData();
          showToast("Xóa thành công!", "success");
        } catch (e) { showToast("Xóa thất bại!", "error"); }
      }
    }
  },
  mounted() { this.loadData(); }
};
</script>

<style scoped>
/* Style giống các trang khác */
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