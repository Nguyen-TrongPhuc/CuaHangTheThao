<template>
  <div class="page-container">
    <div class="header">
      <h1>Tạo Phiếu Nhập Hàng</h1>
      <button class="btn-back" @click="$router.push('/warehouse')">Quay lại</button>
    </div>

    <div class="import-layout">
      <!-- Phần thêm sản phẩm -->
      <div class="add-product-section">
        <h3>Thêm sản phẩm vào phiếu</h3>
        <div class="form-group">
          <label>Chọn sản phẩm:</label>
          <select v-model="selectedProductId" @change="onProductSelect" class="input-field">
            <option value="">-- Chọn sản phẩm --</option>
            <option v-for="p in products" :key="p._id" :value="p._id">{{ p.name }}</option>
          </select>
        </div>

        <div v-if="selectedProduct" class="variant-selection">
          <div v-if="selectedProduct.variants && selectedProduct.variants.length > 0">
             <div class="form-group">
                <label>Chọn biến thể (Size - Màu):</label>
                <select v-model="selectedVariantIndex" class="input-field">
                    <option :value="-1">-- Chọn biến thể --</option>
                    <option v-for="(v, idx) in selectedProduct.variants" :key="idx" :value="idx">
                        {{ getSizeName(v.size_id) }} - {{ getColorName(v.color_id) }} (Kho hiện tại: {{ v.stock }})
                    </option>
                </select>
             </div>
          </div>
          <div v-else class="simple-product-info">
             <p>Sản phẩm đơn giản (Kho hiện tại: {{ selectedProduct.stock }})</p>
          </div>
        </div>

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

        <button class="btn-add-item" @click="addItemToReceipt" :disabled="!canAddItem">Thêm vào danh sách</button>
      </div>

      <!-- Phần thông tin phiếu -->
      <div class="receipt-info-section">
        <h3>Thông tin phiếu nhập</h3>
        <div class="form-group">
            <label>Nhà cung cấp:</label>
            <input v-model="receipt.supplier_name" placeholder="Nhập tên nhà cung cấp" class="input-field" />
        </div>
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
import WarehouseService from "@/services/warehouse.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      products: [],
      sizes: [],
      colors: [],
      selectedProductId: "",
      selectedProduct: null,
      selectedVariantIndex: -1,
      inputQuantity: 1,
      inputPrice: 0,
      receipt: {
        supplier_name: "",
        note: "",
        items: []
      }
    };
  },
  computed: {
    canAddItem() {
        if (!this.selectedProduct) return false;
        if (this.inputQuantity <= 0) return false;
        // Nếu có variant thì phải chọn variant
        if (this.selectedProduct.variants && this.selectedProduct.variants.length > 0 && this.selectedVariantIndex === -1) return false;
        return true;
    },
    totalAmount() {
        return this.receipt.items.reduce((sum, item) => sum + (item.quantity * item.import_price), 0);
    }
  },
  methods: {
    async loadData() {
        const [p, s, c] = await Promise.all([
            ProductService.getAll(),
            SizesService.getAll(),
            ColorsService.getAll()
        ]);
        this.products = p;
        this.sizes = s;
        this.colors = c;
    },
    getSizeName(id) { return this.sizes.find(s => s._id === id)?.name || '---'; },
    getColorName(id) { return this.colors.find(c => c._id === id)?.name || '---'; },
    
    onProductSelect() {
        this.selectedProduct = this.products.find(p => p._id === this.selectedProductId);
        this.selectedVariantIndex = -1;
        this.inputPrice = this.selectedProduct ? this.selectedProduct.price * 0.7 : 0; // Gợi ý giá nhập = 70% giá bán
    },
    
    addItemToReceipt() {
        const item = {
            product_id: this.selectedProduct._id,
            product_name: this.selectedProduct.name,
            quantity: this.inputQuantity,
            import_price: this.inputPrice,
            variant_size_id: null,
            variant_color_id: null,
            variant_desc: ""
        };

        if (this.selectedVariantIndex > -1) {
            const v = this.selectedProduct.variants[this.selectedVariantIndex];
            item.variant_size_id = v.size_id;
            item.variant_color_id = v.color_id;
            item.variant_desc = `${this.getSizeName(v.size_id)} - ${this.getColorName(v.color_id)}`;
        }

        this.receipt.items.push(item);
        
        // Reset form nhập
        this.selectedProductId = "";
        this.selectedProduct = null;
        this.selectedVariantIndex = -1;
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
</style>