<template>
  <div class="category-page">
    <div class="header">
      <h1>Quản lý Danh mục</h1>
      <button class="btn-add" @click="showAddForm">+ Thêm danh mục</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên danh mục</th>
          <th>Mô tả</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="categories.length === 0">
          <td colspan="3" style="text-align: center;">Đang tải dữ liệu...</td>
        </tr>
        <tr v-for="cat in categories" :key="cat._id">
          <td><strong>{{ cat.name }}</strong></td>
          <td>{{ cat.description }}</td>
          <td>
            <button @click="editCategory(cat)">Sửa</button>
            <button class="btn-del" @click="deleteCategory(cat._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isFormVisible" class="form-overlay">
      <div class="form-container">
        <h2>{{ editingId ? 'Cập nhật' : 'Thêm mới' }} Danh mục</h2>
        <input v-model="categoryForm.name" placeholder="Tên danh mục" class="input-field" />
        <textarea v-model="categoryForm.description" placeholder="Mô tả" class="input-field"></textarea>
        <div class="form-actions">
          <button @click="saveCategory" class="btn-save">Lưu</button>
          <button @click="isFormVisible = false">Hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Nhớ import CategoryService bạn đã tạo
import CategoryService from "@/services/categories.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      categories: [],
      isFormVisible: false,
      editingId: null,
      categoryForm: {
        name: "",
        description: ""
      }
    };
  },
  methods: {
    // 1. Lấy danh sách từ Backend
    async retrieveCategories() {
      try {
        this.categories = await CategoryService.getAll();
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
      }
    },

    // 2. Mở form thêm mới
    showAddForm() {
      this.editingId = null;
      this.categoryForm = { name: "", description: "" };
      this.isFormVisible = true;
    },

    // 3. Mở form sửa
    editCategory(cat) {
      this.editingId = cat._id;
      this.categoryForm = { ...cat };
      this.isFormVisible = true;
    },

    // 4. Lưu (Thêm hoặc Cập nhật)
    async saveCategory() {
      try {
        if (this.editingId) {
          // Cập nhật (Cần viết thêm hàm update trong Service nếu chưa có)
          const { _id, ...data } = this.categoryForm; // Loại bỏ _id
          await CategoryService.update(this.editingId, data);
          showToast("Cập nhật thành công!", "success");
        } else {
          // Thêm mới
          await CategoryService.create(this.categoryForm);
          showToast("Thêm thành công!", "success");
        }
        await this.retrieveCategories(); // Đợi tải xong dữ liệu mới
        this.isFormVisible = false;
      } catch (error) {
        console.log(error);
        showToast(error.response?.data?.message || "Có lỗi xảy ra!", "error");
      }
    },

    // 5. Xóa
    async deleteCategory(id) {
      if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
        try {
          await CategoryService.delete(id);
          await this.retrieveCategories(); // Đợi tải xong dữ liệu mới
          showToast("Xóa thành công!", "success");
        } catch (error) {
          console.log(error);
          showToast(error.response?.data?.message || "Xóa thất bại!", "error");
        }
      }
    }
  },
  mounted() {
    this.retrieveCategories();
  }
};
</script>

<style scoped>
/* Giữ nguyên Style cũ của bạn và thêm một chút cho Form */
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.btn-add { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; }
.btn-add:hover { background: linear-gradient(135deg, #8E54E9, #4776E6); box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-1px); }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }

/* CSS cho Form Modal đơn giản */
.form-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
.form-container { background: white; padding: 30px; border-radius: 8px; width: 400px; }
.input-field { width: 100%; margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; display: block; }
.btn-save { background: #2980b9; color: white; padding: 10px 20px; border: none; margin-right: 10px; cursor: pointer; }
</style>