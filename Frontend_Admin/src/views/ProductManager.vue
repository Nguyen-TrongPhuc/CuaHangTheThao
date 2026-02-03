<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Sản phẩm</h1>
      <button class="btn-add" @click="showAddForm">+ Thêm sản phẩm</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên sản phẩm</th>
          <th>Giá</th>
          <th>Kho</th>
          <th>Danh mục</th>
          <th>Môn thể thao</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="products.length === 0"><td colspan="5" style="text-align: center;">Không có dữ liệu</td></tr>
        <tr v-for="p in products" :key="p._id">
          <td>{{ p.name }}</td>
          <td>{{ p.price.toLocaleString() }} đ</td>
          <td>{{ p.stock }}</td>
          <td>{{ getCategoryName(p.category_id) }}</td>
          <td>{{ getSportName(p.sport_id) }}</td>
          <td>
            <button @click="edit(p)">Sửa</button>
            <button class="btn-del" @click="remove(p._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isFormVisible" class="form-overlay">
      <div class="form-container">
        <h2>{{ editingId ? 'Cập nhật' : 'Thêm mới' }} Sản phẩm</h2>
        <form @submit.prevent="save">
            <input v-model="form.name" placeholder="Tên sản phẩm" required class="input-field" />
            <input v-model="form.price" type="number" placeholder="Giá" required class="input-field" />
            <input v-model="form.stock" type="number" placeholder="Số lượng tồn kho" class="input-field" />
            <input v-model="form.image" placeholder="Link ảnh (URL)" class="input-field" />
            
            <select v-model="form.category_id" class="input-field">
                <option value="">-- Chọn danh mục --</option>
                <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
            </select>

            <select v-model="form.sport_id" class="input-field">
                <option value="">-- Chọn môn thể thao --</option>
                <option v-for="s in sports" :key="s._id" :value="s._id">{{ s.name }}</option>
            </select>

            <textarea v-model="form.description" placeholder="Mô tả" class="input-field"></textarea>

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
import ProductService from "@/services/products.service";
import CategoryService from "@/services/categories.service";
import SportService from "@/services/sports.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      products: [],
      categories: [],
      sports: [],
      isFormVisible: false,
      editingId: null,
      form: { name: "", price: 0, stock: 0, description: "", category_id: "", sport_id: "", image: "" }
    };
  },
  methods: {
    async loadData() {
      this.products = await ProductService.getAll();
      this.categories = await CategoryService.getAll();
      this.sports = await SportService.getAll();
    },
    getCategoryName(id) {
        const cat = this.categories.find(c => c._id === id);
        return cat ? cat.name : '---';
    },
    getSportName(id) {
        const sport = this.sports.find(s => s._id === id);
        return sport ? sport.name : '---';
    },
    showAddForm() {
      this.editingId = null;
      this.form = { name: "", price: 0, stock: 0, description: "", category_id: "", sport_id: "", image: "" };
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
            await ProductService.update(this.editingId, data);
        }
        else await ProductService.create(this.form);
        await this.loadData(); // Đợi tải xong dữ liệu mới
        this.isFormVisible = false;
        showToast("Lưu thành công!", "success");
      } catch (e) { showToast("Có lỗi xảy ra!", "error"); }
    },
    async remove(id) {
      if (confirm("Bạn có chắc muốn xóa?")) {
        try {
          await ProductService.delete(id);
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
/* Sử dụng lại style chung */
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