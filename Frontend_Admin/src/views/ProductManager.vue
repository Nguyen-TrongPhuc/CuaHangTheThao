<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Sản phẩm</h1>
      <button class="btn-add" @click="showAddForm">+ Thêm sản phẩm</button>
    </div>

    <div class="filters">
      <select v-model="selectedCategory" class="filter-select">
        <option value="">-- Tất cả danh mục --</option>
        <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
      </select>
      <select v-model="selectedSport" class="filter-select">
        <option value="">-- Tất cả môn thể thao --</option>
        <option v-for="s in sports" :key="s._id" :value="s._id">{{ s.name }}</option>
      </select>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
         
          <th>Tên sản phẩm</th>
          <th>Giá hiển thị</th>
          <th>Danh mục</th>
          <th>Biến thể (Size - Màu - Kho)</th>
           <th>Hình ảnh</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredProducts.length === 0"><td colspan="7" style="text-align: center;">Không có dữ liệu</td></tr>
        <tr v-for="p in filteredProducts" :key="p._id">
         
          <td>{{ p.name }}</td>
          <td>{{ p.price.toLocaleString() }} đ</td>
          <td>{{ getCategoryName(p.category_id) }}</td>
          <td>
            <div v-for="(v, index) in p.variants" :key="index" style="font-size: 0.9em; margin-bottom: 4px;">
                <span style="font-weight: bold; color: #2980b9;">{{ getSizeName(v.size_id) }}</span> - 
                <span style="font-weight: bold; color: #e67e22;">{{ getColorName(v.color_id) }}</span>
                : {{ v.stock }} cái
            </div>
          </td>
           <td>
            <img :src="p.image || 'https://via.placeholder.com/50'" alt="Ảnh" class="product-thumbnail" />
          </td>
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
            <div class="form-group">
            <label>Tên sản phẩm:</label>
            <input v-model="form.name" placeholder="Tên sản phẩm" required class="input-field" />
            </div>
            <div class="form-group">
            <label>Giá hiển thị (VNĐ):</label>
            <input v-model="form.price" type="number" placeholder="Giá chung" required class="input-field" />
            </div>
            <div class="form-group">
            <label>Link ảnh (URL):</label>
            <input v-model="form.image" placeholder="Link ảnh (URL)" class="input-field" />
            </div>
            
            <div class="form-group">
            <label>Danh mục:</label>
            <select v-model="form.category_id" class="input-field">
                <option value="">-- Chọn danh mục --</option>
                <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
            </select>
            </div>

            <div class="form-group">
            <label>Môn thể thao:</label>
            <select v-model="form.sport_id" class="input-field">
                <option value="">-- Chọn môn thể thao --</option>
                <option v-for="s in sports" :key="s._id" :value="s._id">{{ s.name }}</option>
            </select>
            </div>

            <!-- PHẦN QUẢN LÝ BIẾN THỂ -->
            <div class="form-group" style="background: #f9f9f9; padding: 10px; border-radius: 4px;">
                <label style="margin-bottom: 10px; display: block;">Danh sách biến thể (Size & Màu):</label>
                
                <div style="display: flex; gap: 5px; margin-bottom: 5px; font-size: 0.85em; font-weight: bold; color: #666;">
                    <div style="flex: 1;">Size</div>
                    <div style="flex: 1;">Màu sắc</div>
                    <div style="width: 60px;">Tồn kho</div>
                    <div style="width: 80px;">Giá riêng</div>
                    <div style="width: 30px;"></div>
                </div>

                <div v-for="(variant, index) in form.variants" :key="index" class="variant-row">
                    <select v-model="variant.size_id" required style="flex: 1;">
                        <option value="">Size</option>
                        <option v-for="s in sizes" :key="s._id" :value="s._id">{{ s.name }}</option>
                    </select>
                    
                    <select v-model="variant.color_id" required style="flex: 1;">
                        <option value="">Màu</option>
                        <option v-for="c in colors" :key="c._id" :value="c._id">{{ c.name }}</option>
                    </select>

                    <input type="number" v-model="variant.stock" placeholder="Kho" style="width: 60px;" min="0">
                    <input type="number" v-model="variant.price" placeholder="Giá riêng" style="width: 80px;">
                    
                    <button type="button" @click="removeVariant(index)" class="btn-del-variant">X</button>
                </div>

                <button type="button" @click="addVariant" class="btn-add-variant">+ Thêm biến thể</button>
            </div>

            <div class="form-group">
            <label>Mô tả:</label>
            <textarea v-model="form.description" placeholder="Mô tả" class="input-field"></textarea>
            </div>

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
import SizesService from "@/services/sizes.service";
import ColorsService from "@/services/colors.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      products: [],
      categories: [],
      sports: [],
      sizes: [],
      colors: [],
      isFormVisible: false,
      editingId: null,
      form: { name: "", price: 0, description: "", category_id: "", sport_id: "", image: "", variants: [] },
      selectedCategory: "",
      selectedSport: ""
    };
  },
  computed: {
    filteredProducts() {
      return this.products.filter(p => {
        const matchCat = this.selectedCategory ? p.category_id === this.selectedCategory : true;
        const matchSport = this.selectedSport ? p.sport_id === this.selectedSport : true;
        return matchCat && matchSport;
      });
    }
  },
  methods: {
    async loadData() {
      this.products = await ProductService.getAll();
      this.categories = await CategoryService.getAll();
      this.sports = await SportService.getAll();
      this.sizes = await SizesService.getAll();
      this.colors = await ColorsService.getAll();
    },
    getCategoryName(id) {
        const cat = this.categories.find(c => c._id === id);
        return cat ? cat.name : '---';
    },
    getSportName(id) {
        const sport = this.sports.find(s => s._id === id);
        return sport ? sport.name : '---';
    },
    getSizeName(id) {
        const size = this.sizes.find(s => s._id === id);
        return size ? size.name : '---';
    },
    getColorName(id) {
        const color = this.colors.find(c => c._id === id);
        return color ? color.name : '---';
    },
    showAddForm() {
      this.editingId = null;
      this.form = { name: "", price: 0, description: "", category_id: "", sport_id: "", image: "", variants: [] };
      // Thêm sẵn 1 dòng variant trống
      this.addVariant();
      this.isFormVisible = true;
    },
    edit(item) {
      this.editingId = item._id;
      // Clone item để tránh sửa trực tiếp vào bảng khi chưa lưu
      this.form = JSON.parse(JSON.stringify(item));
      if (!this.form.variants) this.form.variants = [];
      this.isFormVisible = true;
    },
    addVariant() {
        this.form.variants.push({ size_id: "", color_id: "", stock: 0, price: this.form.price });
    },
    removeVariant(index) {
        this.form.variants.splice(index, 1);
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
.product-thumbnail { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; }
.btn-add { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; }
.btn-add:hover { background: linear-gradient(135deg, #8E54E9, #4776E6); box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-1px); }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
.form-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
.form-container { background: white; padding: 30px; border-radius: 8px; width: 400px; max-height: 90vh; overflow-y: auto; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
.input-field { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; display: block; box-sizing: border-box; }
.btn-save { background: #2980b9; color: white; padding: 10px 20px; border: none; margin-right: 10px; cursor: pointer; border-radius: 4px; }

/* Style cho phần biến thể */
.variant-row { display: flex; gap: 5px; margin-bottom: 10px; align-items: center; }
.variant-row select, .variant-row input { padding: 5px; border: 1px solid #ddd; border-radius: 3px; }
.btn-add-variant { background: #27ae60; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em; }
.btn-del-variant { background: #c0392b; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; }

.filters { margin-bottom: 15px; display: flex; gap: 10px; }
.filter-select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-width: 200px; }
</style>