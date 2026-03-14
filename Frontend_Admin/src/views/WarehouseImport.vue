<template>
  <div class="page-container">
    <div class="header">
      <h1>Tạo Phiếu Nhập Hàng</h1>
      <button class="btn-back" @click="$router.push('/warehouse')">Quay lại</button>
    </div>

    <!-- BƯỚC 1: Chọn Nhà Cung Cấp (Bắt buộc) -->
    <div class="supplier-section">
        <div class="form-group">
            <label>Chọn Nhà Cung Cấp <span class="required">*</span>:</label>
            <select v-model="receipt.supplier_name" class="input-field supplier-select" :disabled="receipt.items.length > 0">
                <option value="">-- Vui lòng chọn nhà cung cấp --</option>
                <option v-for="s in suppliers" :key="s._id" :value="s.name">{{ s.name }}</option>
            </select>
            <small v-if="receipt.items.length > 0" class="warning-text">
                <i class="fa-solid fa-lock"></i> Đã khóa nhà cung cấp. Vui lòng xóa hết sản phẩm trong danh sách nếu muốn thay đổi.
            </small>
        </div>
    </div>

    <div class="import-layout">
      <!-- Phần thêm sản phẩm -->
      <div class="add-product-section" :class="{ 'disabled-section': !receipt.supplier_name }">
        <h3>Thêm sản phẩm vào phiếu</h3>
        <div class="form-group">
          <label>Chọn sản phẩm:</label>
          <select v-model="selectedProductId" @change="onProductSelect" class="input-field" :disabled="!receipt.supplier_name">
            <option value="">-- Chọn sản phẩm --</option>
            <option v-for="p in filteredProducts" :key="p._id" :value="p._id">{{ p.name }}</option>
          </select>
          <small v-if="receipt.supplier_name && filteredProducts.length === 0" class="warning-text">
            <i class="fa-solid fa-info-circle"></i> Nhà cung cấp này chưa có sản phẩm nào. Vui lòng thêm sản phẩm cho nhà cung cấp trước.
          </small>
        </div>

        <div v-if="selectedProduct" class="variant-selection">
          <!-- Trường hợp 1: Sản phẩm có biến thể (Hiển thị danh sách nhập nhiều) -->
          <div v-if="selectedProduct.variants && selectedProduct.variants.length > 0" class="variant-import-list">
             <label style="display:block; margin-bottom:5px; font-weight:bold;">Nhập số lượng cho các biến thể:</label>
             <div class="table-wrapper">
                <table class="variant-table">
                    <thead>
                        <tr>
                            <th>Phân loại</th>
                            <th>Tồn kho</th>
                            <th>SL Nhập</th>
                            <th>Giá Nhập</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(v, idx) in selectedProduct.variants" :key="idx">
                            <td>{{ getSizeName(v.size_id) }} - {{ getColorName(v.color_id) }}</td>
                            <td>{{ v.stock }}</td>
                            <td><input type="number" v-model.number="variantInputs[idx].quantity" min="0" class="input-small" placeholder="0" /></td>
                            <td><input type="number" v-model.number="variantInputs[idx].price" min="0" class="input-small" /></td>
                        </tr>
                    </tbody>
                </table>
             </div>
          </div>
          
          <!-- Trường hợp 2: Sản phẩm đơn giản -->
          <div v-else class="simple-product-info">
             <p>Sản phẩm đơn giản (Kho hiện tại: {{ selectedProduct.stock }})</p>
             <div class="form-row">
                <div class="form-group half">
                    <label>Số lượng nhập:</label>
                    <input type="number" v-model.number="inputQuantity" min="1" class="input-field" />
                </div>
                <div class="form-group half">
                    <label>Giá nhập (đơn giá):</label>
                    <input type="number" v-model.number="inputPrice" min="0" class="input-field" />
                </div>
            </div>
          </div>
        </div>

        <button class="btn-add-item" @click="addItemToReceipt" :disabled="!canAddItem">Thêm vào danh sách</button>
      </div>

      <!-- Phần thông tin phiếu -->
      <div class="receipt-info-section">
        <h3>Thông tin phiếu nhập</h3>
        <div class="form-group">
            <label>Ghi chú:</label>
            <textarea v-model="receipt.note" placeholder="Ghi chú..." class="input-field"></textarea>
        </div>

        <h4>Danh sách hàng nhập</h4>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th>Phân loại</th>
                    <th>SL</th>
                    <th>Giá nhập</th>
                    <th>Thành tiền</th>
                    <th>Xóa</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="receipt.items.length === 0"><td colspan="6" style="text-align:center;">Chưa có sản phẩm</td></tr>
                <tr v-for="(item, idx) in receipt.items" :key="idx">
                    <td>{{ item.product_name }}</td>
                    <td>{{ item.variant_desc || '---' }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.import_price.toLocaleString() }}</td>
                    <td>{{ (item.quantity * item.import_price).toLocaleString() }}</td>
                    <td><button @click="removeItem(idx)" class="btn-del">X</button></td>
                </tr>
            </tbody>
        </table>
        
        <div class="total-section">
            <strong>Tổng tiền: {{ totalAmount.toLocaleString() }} đ</strong>
        </div>

        <button class="btn-save-receipt" @click="saveReceipt" :disabled="receipt.items.length === 0">Lưu Phiếu Nhập</button>
      </div>
    </div>
  </div>
</template>

<script>
import ProductService from "@/services/products.service";
import SizesService from "@/services/sizes.service";
import ColorsService from "@/services/colors.service";
import SuppliersService from "@/services/suppliers.service";
import WarehouseService from "@/services/warehouse.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      products: [],
      suppliers: [],
      sizes: [],
      colors: [],
      selectedProductId: "",
      selectedProduct: null,
      inputQuantity: 1,
      inputPrice: 0,
      variantInputs: [], // Mảng lưu trữ input cho từng biến thể
      receipt: {
        supplier_name: "",
        note: "",
        items: []
      }
    };
  },
  computed: {
    // Lọc sản phẩm theo nhà cung cấp được chọn
    filteredProducts() {
      if (!this.receipt.supplier_name) return this.products;
      // Tìm supplier được chọn
      const selectedSupplier = this.suppliers.find(s => s.name === this.receipt.supplier_name);
      if (!selectedSupplier) return this.products;
      // Lọc sản phẩm có supplier_id khớp với nhà cung cấp được chọn
      return this.products.filter(p => {
        if (!p.supplier_id) return false;
        return String(p.supplier_id) === String(selectedSupplier._id);
      });
    },
    canAddItem() {
        if (!this.receipt.supplier_name) return false;
        if (!this.selectedProduct) return false;
        
        if (this.selectedProduct.variants && this.selectedProduct.variants.length > 0) {
             return this.variantInputs.some(v => v.quantity > 0);
        }
        
        if (this.inputQuantity <= 0) return false;
        return true;
    },
    totalAmount() {
        return this.receipt.items.reduce((sum, item) => sum + (item.quantity * item.import_price), 0);
    }
  },
  methods: {
    async loadData() {
        const [p, s, c, sup] = await Promise.all([
            ProductService.getAll(),
            SizesService.getAll(),
            ColorsService.getAll(),
            SuppliersService.getAll()
        ]);
        this.products = p;
        this.sizes = s;
        this.colors = c;
        this.suppliers = sup;
    },
    getSizeName(id) { return this.sizes.find(s => s._id === id)?.name || '---'; },
    getColorName(id) { return this.colors.find(c => c._id === id)?.name || '---'; },
    
    onProductSelect() {
        this.selectedProduct = this.products.find(p => p._id === this.selectedProductId);
        
        if (this.selectedProduct) {
            // Setup cho sản phẩm đơn giản
            this.inputPrice = this.selectedProduct.price * 0.7; 
            this.inputQuantity = 1;

            // Setup cho sản phẩm biến thể (tạo mảng input tương ứng)
            if (this.selectedProduct.variants && this.selectedProduct.variants.length > 0) {
                this.variantInputs = this.selectedProduct.variants.map(v => ({
                    quantity: 0,
                    price: (v.price || this.selectedProduct.price) * 0.7
                }));
            } else {
                this.variantInputs = [];
            }
        } else {
            this.inputPrice = 0;
            this.variantInputs = [];
        }
    },
    
    addItemToReceipt() {
        if (!this.selectedProduct) return;

        // Trường hợp 1: Nhập nhiều biến thể
        if (this.selectedProduct.variants && this.selectedProduct.variants.length > 0) {
            this.variantInputs.forEach((input, idx) => {
                if (input.quantity > 0) {
                    const v = this.selectedProduct.variants[idx];
                    this.receipt.items.push({
                        product_id: this.selectedProduct._id,
                        product_name: this.selectedProduct.name,
                        quantity: input.quantity,
                        import_price: input.price,
                        variant_size_id: v.size_id,
                        variant_color_id: v.color_id,
                        variant_desc: `${this.getSizeName(v.size_id)} - ${this.getColorName(v.color_id)}`
                    });
                }
            });
        } 
        // Trường hợp 2: Sản phẩm đơn giản
        else {
            this.receipt.items.push({
                product_id: this.selectedProduct._id,
                product_name: this.selectedProduct.name,
                quantity: this.inputQuantity,
                import_price: this.inputPrice,
                variant_size_id: null,
                variant_color_id: null,
                variant_desc: ""
            });
        }
        
        // Reset form nhập
        this.selectedProductId = "";
        this.selectedProduct = null;
        this.variantInputs = [];
        this.inputQuantity = 1;
        this.inputPrice = 0;
    },
    removeItem(index) {
        this.receipt.items.splice(index, 1);
    },
    async saveReceipt() {
        if (!this.receipt.supplier_name) {
            showToast("Vui lòng nhập tên nhà cung cấp", "warning");
            return;
        }
        try {
            // Lấy thông tin người đăng nhập từ localStorage
            const staff_name = localStorage.getItem("user_name") || "Admin";
            
            await WarehouseService.importStock({
                ...this.receipt,
                staff_name: staff_name,
                total_amount: this.totalAmount
            });
            showToast("Nhập hàng thành công!", "success");
            this.$router.push("/warehouse");
        } catch (error) {
            showToast("Lỗi khi lưu phiếu nhập", "error");
        }
    }
  },
  mounted() { this.loadData(); }
};
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-back { background: #95a5a6; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
.import-layout { display: flex; gap: 30px; }
.add-product-section { flex: 1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); height: fit-content; }
.add-product-section.disabled-section { opacity: 0.6; pointer-events: none; }

.supplier-section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 20px; border-left: 5px solid #3498db; }
.supplier-select { font-size: 1.1em; color: #2c3e50; font-weight: 500; }
.required { color: red; }
.warning-text { color: #e67e22; font-style: italic; margin-top: 5px; display: block; }

.receipt-info-section { flex: 2; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9em; }
.input-field { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.form-row { display: flex; gap: 15px; }
.half { flex: 1; }

.btn-add-item { width: 100%; background: #27ae60; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px; }
.btn-add-item:disabled { background: #ccc; cursor: not-allowed; }

.items-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em; }
.items-table th, .items-table td { border: 1px solid #eee; padding: 8px; text-align: left; }
.btn-del { color: red; border: none; background: none; cursor: pointer; }

.total-section { text-align: right; margin-top: 20px; font-size: 1.2em; color: #2c3e50; }
.btn-save-receipt { width: 100%; background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 15px; border: none; border-radius: 4px; font-size: 1.1em; font-weight: bold; cursor: pointer; margin-top: 20px; }
.btn-save-receipt:disabled { background: #ccc; cursor: not-allowed; }

.variant-import-list { margin-bottom: 15px; }
.table-wrapper { max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px; }
.variant-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
.variant-table th, .variant-table td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
.variant-table th { background: #f8f9fa; position: sticky; top: 0; }
.input-small { width: 80px; padding: 5px; border: 1px solid #ddd; border-radius: 3px; }
</style>