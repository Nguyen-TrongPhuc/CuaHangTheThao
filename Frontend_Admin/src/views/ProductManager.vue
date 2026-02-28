<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Sản phẩm</h1>
      <button class="btn-add" @click="showAddForm">+ Thêm sản phẩm</button>
    </div>

    <div class="filters">
      <input v-model="searchText" placeholder="Tìm kiếm sản phẩm..." class="filter-input" />
      <select v-model="selectedCategory" class="filter-select">
        <option value="">-- Tất cả danh mục --</option>
        <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
      </select>
      <select v-model="selectedSport" class="filter-select">
        <option value="">-- Tất cả môn thể thao --</option>
        <option v-for="s in sports" :key="s._id" :value="s._id">{{ s.name }}</option>
      </select>
      <div class="product-count">Tổng: <b>{{ filteredProducts.length }}</b> sản phẩm</div>
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
            <template v-if="p.variants && p.variants.length > 0">
                <div v-for="(v, index) in p.variants" :key="index" style="font-size: 0.9em; margin-bottom: 4px;">
                    <span v-if="v.size_id" style="font-weight: bold; color: #2980b9;">{{ getSizeName(v.size_id) }}</span>
                    <span v-if="v.size_id && v.color_id"> - </span>
                    <span v-if="v.color_id" style="font-weight: bold; color: #e67e22;">{{ getColorName(v.color_id) }}</span>
                    : {{ v.stock }} cái
                </div>
            </template>
            <div v-else style="color: #555; font-style: italic;">Sản phẩm đơn giản (Kho: {{ p.stock }})</div>
          </td>
           <td>
            <img :src="(p.images && p.images[0] && p.images[0].url) || p.image || 'https://via.placeholder.com/50'" alt="Ảnh" class="product-thumbnail" />
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
            <label>Tồn kho (Cho sản phẩm không biến thể):</label>
            <input v-model="form.stock" type="number" placeholder="Số lượng" class="input-field" min="0" />
            </div>
            <div class="form-group">
            <label>Hình ảnh sản phẩm:</label>
            <div class="images-list">
              <div v-for="(img, idx) in form.images" :key="idx" class="image-row" style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <input v-model="img.url" placeholder="Link ảnh (URL)" class="input-field" style="flex:1;" />
                <select v-model="img.color_id" class="input-field" style="width:120px;">
                  <option value="">--- Màu ---</option>
                  <option v-for="c in colors" :key="c._id" :value="c._id">{{ c.name }}</option>
                </select>
                <button type="button" @click="removeImage(idx)" class="btn-del-variant">X</button>
              </div>
            </div>
            <button type="button" @click="addImage" class="btn-add-variant" style="margin-top:5px;">+ Thêm ảnh</button>
            <small class="help-text">(Có thể gắn màu để ảnh thay đổi khi chọn màu tương ứng)</small>
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
                
                <div style="display: flex; gap: 10px; margin-bottom: 5px; font-size: 0.85em; font-weight: bold; color: #666;">
                    <div style="flex: 1;">Size</div>
                    <div style="flex: 1;">Màu sắc</div>
                    <div style="width: 70px;">Tồn kho</div>
                    <div style="width: 100px;">Giá riêng</div>
                    <div style="width: 32px;"></div>
                </div>

                <div v-for="(variant, index) in form.variants" :key="index" class="variant-row" style="gap: 10px;">
                    <select v-model="variant.size_id" style="flex: 1;">
                        <option value="">-- Không Size --</option>
                        <option v-for="s in sizes" :key="s._id" :value="s._id">{{ s.name }}</option>
                    </select>
                    
                    <select v-model="variant.color_id" style="flex: 1;">
                        <option value="">-- Không Màu --</option>
                        <option v-for="c in colors" :key="c._id" :value="c._id">{{ c.name }}</option>
                    </select>

                    <input type="number" v-model="variant.stock" placeholder="Kho" style="width: 70px;" min="0">
                    <input type="number" v-model="variant.price" placeholder="Giá riêng" style="width: 100px;">
                    
                    <button type="button" @click="removeVariant(index)" class="btn-del-variant" style="width: 32px; padding: 5px 0;">X</button>
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
      // image field kept for compatibility; new images array supports multiple image URLs with optional color association
      form: { name: "", price: 0, stock: 0, description: "", category_id: "", sport_id: "", image: "", images: [], variants: [] },
      selectedCategory: "",
      selectedSport: "",
      searchText: ""
    };
  },
  computed: {
    filteredProducts() {
      return this.products.filter(p => {
        const matchCat = this.selectedCategory ? p.category_id === this.selectedCategory : true;
        const matchSport = this.selectedSport ? p.sport_id === this.selectedSport : true;
        const matchSearch = this.searchText ? p.name.toLowerCase().includes(this.searchText.toLowerCase()) : true;
        return matchCat && matchSport && matchSearch;
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
      this.form = { name: "", price: 0, stock: 0, description: "", category_id: "", sport_id: "", image: "", images: [], variants: [] };
      // Không tự động thêm variant để hỗ trợ sản phẩm đơn giản
      this.isFormVisible = true;
    },
    edit(item) {
      this.editingId = item._id;
      // Clone item để tránh sửa trực tiếp vào bảng khi chưa lưu
      this.form = JSON.parse(JSON.stringify(item));
      // normalize images field for editing
      if (Array.isArray(item.images)) {
        this.form.images = item.images.map(img => ({ url: img.url || '', color_id: img.color_id || '' }));
      } else {
        this.form.images = item.image ? [{ url: item.image, color_id: '' }] : [];
      }
      if (!this.form.variants) this.form.variants = [];
      this.isFormVisible = true;
    },
    addVariant() {
        this.form.variants.push({ size_id: "", color_id: "", stock: 0, price: this.form.price });
    },
    removeVariant(index) {
        this.form.variants.splice(index, 1);
    },
    addImage() {
      this.form.images.push({ url: "", color_id: "" });
    },
    removeImage(index) {
      this.form.images.splice(index, 1);
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
.filter-input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-width: 200px; flex: 1; }
.product-count { display: flex; align-items: center; white-space: nowrap; color: #555; }
</style>