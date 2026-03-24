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
            <button class="btn-edit" @click="editCategory(cat)">Sửa</button>
            <button class="btn-del" @click="deleteCategory(cat._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Form Modal -->
    <div v-if="isFormVisible" class="modal-overlay" @click.self="isFormVisible = false">
      <div class="form-container">
        <h2>{{ editingId ? 'Cập nhật' : 'Thêm mới' }} Danh mục</h2>
        <div class="form-grid">
            <div class="form-group full-width">
                <label>Tên danh mục <span class="required">*</span></label>
                <input v-model="categoryForm.name" placeholder="Nhập tên danh mục..." class="input-field" />
            </div>
            <div class="form-group full-width">
                <label>Mô tả</label>
                <textarea v-model="categoryForm.description" placeholder="Mô tả..." class="input-field" rows="3"></textarea>
            </div>
        </div>
        <div class="form-actions">
          <button @click="isFormVisible = false" class="btn-cancel">Hủy</button>
          <button @click="saveCategory" class="btn-save">Lưu</button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="deleteConfirmId" class="modal-overlay" @click.self="deleteConfirmId = null">
      <div class="confirm-dialog">
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="deleteConfirmId = null">Hủy</button>
          <button class="btn-confirm-delete" @click="executeDelete">Xóa</button>
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
      deleteConfirmId: null,
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
    deleteCategory(id) {
      this.deleteConfirmId = id;
    },
    async executeDelete() {
      if (!this.deleteConfirmId) return;
      try {
        await CategoryService.delete(this.deleteConfirmId);
        await this.retrieveCategories();
        showToast("Xóa thành công!", "success");
      } catch (error) {
        showToast(error.response?.data?.message || "Xóa thất bại!", "error");
      } finally {
        this.deleteConfirmId = null;
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
.btn-edit { color: #3498db; cursor: pointer; border: none; background: none; margin-right: 5px; }

/* Custom Modal Styles Chung */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.form-container { background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.form-container h2 { margin-top: 0; margin-bottom: 25px; color: #2c3e50; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { margin-bottom: 8px; font-weight: 600; color: #444; }
.required { color: #e74c3c; margin-left: 3px; }
.input-field { width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.3s ease; }
.input-field:focus { border-color: #4776E6; outline: none; box-shadow: 0 0 0 3px rgba(71, 118, 230, 0.1); }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; }
.btn-save { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 25px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(71, 118, 230, 0.3); }

/* Confirm Delete Modal */
.confirm-dialog { background: white; padding: 30px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
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