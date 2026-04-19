<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Sản phẩm</h1>
      <div class="header-actions" style="display: flex; gap: 10px;">
        <button class="btn-export" @click="handleExport" style="background: #217346; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s;"><i class="fa-solid fa-file-excel"></i> Xuất Excel</button>
        <button class="btn-add" @click="showAddForm">+ Thêm sản phẩm</button>
      </div>
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
      <div class="product-count">Tìm thấy: <b>{{ filteredProducts.length }}</b> mã sản phẩm</div>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th class="col-name">Tên sản phẩm</th>
          <th class="col-price">Giá hiển thị</th>
          <th class="col-import-price">Giá vốn (BQ)</th>
          <th class="col-category">Danh mục</th>
          <th class="col-supplier">Nhà cung cấp</th>
          <th class="col-variants">Biến thể (Size - Màu - Kho)</th>
          <th class="col-image">Hình ảnh</th>
          <th class="col-actions">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredProducts.length === 0"><td colspan="7" style="text-align: center;">Không có dữ liệu</td></tr>
        <tr v-for="p in filteredProducts" :key="p._id">
         
          <td>{{ p.name }}</td>
          <td>{{ p.price.toLocaleString() }} đ</td>
          <td style="color: #27ae60; font-weight: 500;">{{ (p.import_price || 0).toLocaleString() }} đ</td>
          <td>{{ getCategoryName(p.category_id) }}</td>
          <td>{{ getSupplierName(p.supplier_id) }}</td>
          <td>
            <template v-if="p.variants && p.variants.length > 0">
                <div v-for="(v, index) in p.variants" :key="index" style="font-size: 0.9em; margin-bottom: 4px;">
                    <span v-if="v.size_id" style="font-weight: bold; color: #2980b9;">{{ getSizeName(v.size_id) }}</span>
                    <span v-if="v.size_id && v.color_id"> - </span>
                    <span v-if="v.color_id" style="font-weight: bold; color: #e67e22;">{{ getColorName(v.color_id) }}</span>
                    : {{ v.stock }} cái <span style="color:#27ae60">(Vốn: {{ (v.import_price || 0).toLocaleString() }}đ)</span>
                </div>
            </template>
            <div v-else style="color: #555; font-style: italic;">Sản phẩm cơ bản (Kho: {{ p.stock }})</div>
          </td>
           <td>
            <img :src="(p.images && p.images[0] && p.images[0].url) || p.image || 'https://via.placeholder.com/50'" alt="Ảnh" class="product-thumbnail" />
          </td>
          <td>
            <button class="btn-edit" @click="edit(p)">  Sửa</button>
            <button class="btn-del" @click="remove(p._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isFormVisible" class="modal-overlay" @click.self="isFormVisible = false">
      <div class="form-container product-form">
        <h2>{{ editingId ? 'Cập nhật' : 'Thêm mới' }} Sản phẩm</h2>
        <form @submit.prevent="save">
            <div class="form-grid">
                <!-- Cột trái -->
                <div class="form-group full-width">
                    <label>Tên sản phẩm & Ảnh đại diện <span class="required">*</span></label>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <div class="main-img-preview" style="width: 50px; height: 50px; border-radius: 6px; border: 1px solid #ddd; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8f9fa; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <img v-if="form.images && form.images.length > 0 && form.images[0].url" :src="form.images[0].url" style="width: 100%; height: 100%; object-fit: cover;" @error="$event.target.src='https://placehold.co/60'" />
                            <i v-else class="fa-regular fa-image" style="color: #ccc; font-size: 20px;"></i>
                        </div>
                        <input v-model="form.name" placeholder="Tên sản phẩm" required class="input-field" style="flex: 1;" />
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Giá bán (VNĐ) <span class="required">*</span></label>
                    <input v-model="form.price" type="number" placeholder="Giá chung" required class="input-field" />
                </div>
                
                <div class="form-group">
                    <label>Giá vốn bình quân (VNĐ)</label>
                    <input v-model="form.import_price" type="number" class="input-field" disabled style="background: #f5f5f5;" title="Tự động tính khi Nhập kho" />
                </div>

                <div class="form-group">
                    <label>Tồn kho (Quản lý qua Nhập kho)</label>
                    <input v-model="form.stock" type="number" placeholder="0" class="input-field" disabled style="background: #f5f5f5;" />
                </div>

                <div class="form-group">
                    <label>Danh mục</label>
                    <select v-model="form.category_id" class="input-field">
                        <option value="">-- Chọn danh mục --</option>
                        <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Môn thể thao</label>
                    <select v-model="form.sport_id" class="input-field">
                        <option value="">-- Chọn môn thể thao --</option>
                        <option v-for="s in sports" :key="s._id" :value="s._id">{{ s.name }}</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Nhà cung cấp</label>
                    <select v-model="form.supplier_id" class="input-field">
                        <option :value="null">-- Chọn nhà cung cấp --</option>
                        <option v-for="sup in suppliers" :key="sup._id" :value="sup._id">{{ sup.name }}</option>
                    </select>
                </div>
                
                <div class="form-group full-width">
                    <label>Mô tả chi tiết</label>
                    <textarea v-model="form.description" placeholder="Mô tả sản phẩm" class="input-field" rows="4"></textarea>
                </div>

                <div class="form-group full-width">
                    <label>Hình ảnh sản phẩm</label>
                    <div class="images-list">
                    <div v-for="(img, idx) in form.images" :key="idx" class="image-row">
                        <div class="img-preview-mini">
                            <img v-if="img.url" :src="img.url" @error="$event.target.src='https://placehold.co/50'" />
                            <i v-else class="fa-regular fa-image" style="color: #ccc;"></i>
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                            <input v-model="img.url" placeholder="Link ảnh (URL) hoặc chọn file bên dưới" class="input-field" />
                            <div class="custom-file-upload">
                                <input type="file" :id="'file-upload-' + idx" accept="image/*" @change="uploadImageToServer($event, idx)" class="hidden-file-input" />
                                <label :for="'file-upload-' + idx" class="btn-custom-upload">
                                    <i class="fa-solid fa-cloud-arrow-up"></i> Tải ảnh từ thiết bị
                                </label>
                            </div>
                        </div>
                        <select v-model="img.color_id" class="input-field" style="width:150px;">
                        <option value="">--- Màu ---</option>
                        <option v-for="c in colors" :key="c._id" :value="c._id">{{ c.name }}</option>
                        </select>
                        <button type="button" @click="removeImage(idx)" class="btn-del-variant"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    </div>
                    <button type="button" @click="addImage" class="btn-add-variant" style="margin-top:10px;">+ Thêm ảnh</button>
                </div>

                <!-- PHẦN QUẢN LÝ BIẾN THỂ -->
                <div class="form-group full-width variants-container">
                    <label style="margin-bottom: 15px; display: block; font-size: 16px;">Danh sách phân loại (Size & Màu)</label>
                    
                    <div class="variant-header" v-if="form.variants.length > 0">
                        <div style="flex: 1;">Kích thước</div>
                        <div style="flex: 1;">Màu sắc</div>
                        <div style="width: 80px;">Tồn kho</div>
                        <div style="width: 100px;">Giá vốn BQ</div>
                        <div style="width: 120px;">Giá bán riêng</div>
                        <div style="width: 40px;"></div>
                    </div>

                    <div v-for="(variant, index) in form.variants" :key="index" class="variant-row">
                        <select v-model="variant.size_id" class="input-field" style="flex: 1;">
                            <option value="">-- Không Size --</option>
                            <option v-for="s in sizes" :key="s._id" :value="s._id">{{ s.name }}</option>
                        </select>
                        
                        <select v-model="variant.color_id" class="input-field" style="flex: 1;">
                            <option value="">-- Không Màu --</option>
                            <option v-for="c in colors" :key="c._id" :value="c._id">{{ c.name }}</option>
                        </select>

                        <input type="number" v-model="variant.stock" placeholder="Kho" class="input-field" style="width: 80px; background: #f5f5f5;" disabled title="Số lượng được quản lý tự động qua Nhập kho">
                        <input type="number" v-model="variant.import_price" placeholder="Vốn" class="input-field" style="width: 100px; background: #f5f5f5;" disabled title="Tự động tính khi nhập kho">
                        <input type="number" v-model="variant.price" placeholder="Giá riêng" class="input-field" style="width: 120px;">
                        
                        <button type="button" @click="removeVariant(index)" class="btn-del-variant"><i class="fa-solid fa-trash"></i></button>
                    </div>

                    <button type="button" @click="addVariant" class="btn-add-variant">+ Thêm phân loại</button>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" @click="isFormVisible = false" class="btn-cancel">Hủy</button>
                <button type="submit" class="btn-save">Lưu</button>
            </div>
        </form>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="deleteConfirmId" class="modal-overlay" @click.self="deleteConfirmId = null">
      <div class="confirm-dialog">
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa sản phẩm này? Nếu sản phẩm đã từng được bán, tính năng này sẽ bị chặn.</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="deleteConfirmId = null">Hủy</button>
          <button class="btn-confirm-delete" @click="executeDelete">Xóa</button>
        </div>
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
import SuppliersService from "@/services/suppliers.service";
import { showToast } from "@/utils/toast";
import { exportInventoryToExcel } from "@/utils/excel";

export default {
  data() {
    return {
      products: [],
      categories: [],
      suppliers: [],
      sports: [],
      sizes: [],
      colors: [],
      isFormVisible: false,
      editingId: null,
      // image field kept for compatibility; new images array supports multiple image URLs with optional color association
      form: { name: "", price: 0, import_price: 0, stock: 0, description: "", category_id: "", sport_id: "", supplier_id: null, image: "", images: [], variants: [] },
      selectedCategory: "",
      selectedSport: "",
      searchText: "",
      deleteConfirmId: null
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
      this.suppliers = await SuppliersService.getAll();
    },
    getCategoryName(id) {
        const cat = this.categories.find(c => c._id === id);
        return cat ? cat.name : '---';
    },
    getSupplierName(id) {
        const sup = this.suppliers.find(s => s._id === id);
        return sup ? sup.name : '---';
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
      this.form = { name: "", price: 0, import_price: 0, stock: 0, description: "", category_id: "", sport_id: "", supplier_id: null, image: "", images: [], variants: [] };
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
        // Kiểm tra nếu sản phẩm chưa có biến thể nào và đang có tồn kho chung > 0
        if (this.form.variants.length === 0 && this.form.stock > 0) {
            showToast(`Sản phẩm đang có ${this.form.stock} tồn kho. Không thể phân loại. Vui lòng tạo mã mới hoặc hủy kho về 0.`, "warning");
            return;
        }
        this.form.variants.push({ size_id: "", color_id: "", stock: 0, import_price: 0, price: this.form.price });
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
    async uploadImageToServer(event, index) {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      // Chữ 'image' ở đây PHẢI khớp với cấu hình upload.single('image') ở Backend của bạn
      formData.append('image', file); 

      try {
        // Giả định backend chạy ở port 3003 và có API là /api/upload
        // (Bạn có thể sửa lại URL này nếu Backend của bạn chạy ở port khác)
        const uploadUrl = "http://localhost:3003/api/upload";
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error("Lỗi tải ảnh");
        
        const data = await response.json();
        this.form.images[index].url = data.url || data.imageUrl || data.path || "";
        showToast("Tải ảnh từ máy tính lên thành công!", "success");
      } catch (error) {
        console.error("Lỗi khi tải ảnh:", error);
        showToast("Không thể tải ảnh lên server.", "error");
      }
    },
    async save() {
      try {
        if (this.editingId) {
            // Loại bỏ _id, stock, sold, import_price để tránh ghi đè dữ liệu kho/vốn bằng tay
            // eslint-disable-next-line no-unused-vars
            const { _id, stock, sold, import_price, ...data } = this.form; 
            await ProductService.update(this.editingId, data);
        }
        else await ProductService.create(this.form);
        await this.loadData(); // Đợi tải xong dữ liệu mới
        this.isFormVisible = false;
        showToast("Lưu thành công!", "success");
      } catch (e) { showToast("Có lỗi xảy ra!", "error"); }
    },
    remove(id) {
      const product = this.products.find(p => p._id === id);
      // Chặn ngay tại Frontend nếu sản phẩm đã có lượt mua
      if (product && product.sold > 0) {
        showToast(`Không thể xóa "${product.name}" vì đã có ${product.sold} lượt mua.`, "error");
        return; 
      }
      this.deleteConfirmId = id;
    },
    async executeDelete() {
      if (!this.deleteConfirmId) return;
      try {
        await ProductService.delete(this.deleteConfirmId);
        await this.loadData();
        showToast("Xóa thành công!", "success");
      } catch (e) { 
        const errMsg = e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response.data : "Xóa thất bại!");
        showToast(errMsg, "error"); 
      } finally {
        this.deleteConfirmId = null;
      }
    },
    handleExport() {
      if (this.filteredProducts.length === 0) {
        showToast("Không có dữ liệu để xuất!", "error");
        return;
      }
      exportInventoryToExcel(this.filteredProducts, this.sizes, this.colors);
    }
  },
  mounted() { this.loadData(); },
  watch: {
    'form.variants': {
      handler(newVariants) {
        if (newVariants && newVariants.length > 0) {
          this.form.stock = newVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        }
      },
      deep: true
    }
  }
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
.btn-export:hover { background: #1e6b3e !important; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-1px); }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
.btn-edit { color: #3498db; cursor: pointer; border: none; background: none; margin-right: 5px; }

/* Custom Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.form-container { background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
.product-form { max-width: 900px !important; width: 95%; }
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

/* Product variants styling */
.image-row, .variant-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
.img-preview-mini { width: 46px; height: 46px; border: 1px dashed #ccc; border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f8f9fa; flex-shrink: 0; }
.img-preview-mini img { width: 100%; height: 100%; object-fit: cover; }
.variant-header { display: flex; gap: 10px; margin-bottom: 5px; font-size: 0.85em; font-weight: bold; color: #666; padding: 0 10px; }
.variants-container { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
.btn-add-variant { background: #e8f0fe; color: #0056b3; border: 1px dashed #0056b3; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; align-self: flex-start; }
.btn-add-variant:hover { background: #cce5ff; }
.btn-del-variant { background: #ffebee; color: #dc3545; border: none; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.2s; }
.btn-del-variant:hover { background: #ffcdd2; }

.filters { margin-bottom: 15px; display: flex; gap: 10px; }
.filter-select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-width: 200px; }
.filter-input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-width: 200px; flex: 1; }
.product-count { display: flex; align-items: center; white-space: nowrap; color: #555; }

/* Table Column Widths */
.admin-table th.col-name { width: 18%; word-break: break-word; }
.admin-table th.col-price { width: 10%; }
.admin-table th.col-import-price { width: 10%; }
.admin-table th.col-category { width: 12%; }
.admin-table th.col-supplier { width: 12%; }
.admin-table th.col-variants { width: 30%; } /* Mở rộng cột biến thể */
.admin-table th.col-image { width: 8%; text-align: center; }
.admin-table th.col-actions { width: 10%; text-align: center; }
.admin-table td { vertical-align: middle; line-height: 1.4; }
.admin-table td:nth-child(6), .admin-table td:nth-child(7) { text-align: center; }

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

/* Custom File Upload Button */
.hidden-file-input { display: none; }
.btn-custom-upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #495057;
  padding: 8px 15px;
  border-radius: 6px;
  border: 1px dashed #adb5bd;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  width: fit-content;
}
.btn-custom-upload:hover {
  background: #e8f0fe;
  border-color: #4776E6;
  color: #4776E6;
}
.btn-custom-upload i { margin-right: 6px; font-size: 14px; }
</style>