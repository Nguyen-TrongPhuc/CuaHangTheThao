<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Kho hàng (Phiếu nhập)</h1>
      <button class="btn-add" @click="$router.push('/warehouse/import')">+ Nhập hàng mới</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Mã phiếu</th>
          <th>Nhà cung cấp</th>
          <th>Người nhập</th>
          <th>Số mặt hàng</th>
          <th>Tổng tiền</th>
          <th>Ngày nhập</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="receipts.length === 0"><td colspan="7" style="text-align: center;">Chưa có phiếu nhập nào</td></tr>
        <tr v-for="r in receipts" :key="r._id">
          <td>{{ r._id?.slice(-6).toUpperCase() }}</td>
          <td>{{ r.supplier_name }}</td>
          <td>{{ r.staff_name }}</td>
          <td>{{ r.items ? r.items.length : (r.product_name ? 1 : 0) }}</td>
          <td>{{ (r.total_amount || 0).toLocaleString() }} đ</td>
          <td>{{ r.createdAt ? new Date(r.createdAt).toLocaleString() : '' }}</td>
          <td>
            <button class="btn-view" @click="viewDetail(r)">Chi tiết</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal Chi tiết -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
            <h3>Chi tiết phiếu nhập #{{ selectedReceipt._id?.slice(-6).toUpperCase() }}</h3>
            <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedReceipt">
            <div class="detail-row">
                <label>Nhà cung cấp:</label>
                <span>{{ selectedReceipt.supplier_name }}</span>
            </div>
            <div class="detail-row">
                <label>Người nhập:</label>
                <span>{{ selectedReceipt.staff_name }}</span>
            </div>
            <div class="detail-row">
                <label>Thời gian:</label>
                <span>{{ new Date(selectedReceipt.createdAt).toLocaleString() }}</span>
            </div>
            <div class="detail-row">
                <label>Ghi chú:</label>
                <p class="note-content">{{ selectedReceipt.note || 'Không có ghi chú' }}</p>
            </div>
            
            <hr>
            <h4>Danh sách sản phẩm nhập</h4>
            <div class="table-container">
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Phân loại</th>
                            <th>SL</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in (selectedReceipt.items || [])" :key="idx">
                            <td>{{ item.product_name }}</td>
                            <td>{{ item.variant_desc || '---' }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ (item.import_price || 0).toLocaleString() }}</td>
                            <td>{{ ((item.quantity || 0) * (item.import_price || 0)).toLocaleString() }}</td>
                        </tr>
                        <!-- Fallback cho dữ liệu cũ (nếu có) -->
                        <tr v-if="!selectedReceipt.items && selectedReceipt.product_name">
                            <td>{{ selectedReceipt.product_name }}</td>
                            <td>{{ selectedReceipt.variant_desc }}</td>
                            <td>{{ selectedReceipt.quantity }}</td>
                            <td>{{ (selectedReceipt.import_price || 0).toLocaleString() }}</td>
                            <td>{{ ((selectedReceipt.quantity || 0) * (selectedReceipt.import_price || 0)).toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="total-row">
                    <strong>Tổng cộng: {{ (selectedReceipt.total_amount || 0).toLocaleString() }} đ</strong>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-close" @click="closeModal">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WarehouseService from "@/services/warehouse.service";

export default {
  data() { 
    return { 
        receipts: [],
        showModal: false,
        selectedReceipt: null
    }; 
  },
  methods: {
    viewDetail(receipt) {
        this.selectedReceipt = receipt;
        this.showModal = true;
    },
    closeModal() {
        this.showModal = false;
        this.selectedReceipt = null;
    }
  },
  async mounted() {
    try {
      this.receipts = await WarehouseService.getAll();
    } catch (error) {
      console.error(error);
    }
  }
};
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.btn-add { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; text-decoration: none; font-size: 14px; }
.btn-add:hover { opacity: 0.9; transform: translateY(-1px); }

.product-info { display: flex; flex-direction: column; }
.variant-text { color: #666; font-size: 0.85em; }
.btn-view { background: #17a2b8; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
.btn-view:hover { background: #138496; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; border-radius: 8px; width: 500px; max-width: 90%; box-shadow: 0 4px 15px rgba(0,0,0,0.2); animation: slideIn 0.3s; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee; }
.modal-header h3 { margin: 0; color: #2c3e50; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
.close-btn:hover { color: #333; }
.modal-body { padding: 20px; }
.detail-row { display: flex; margin-bottom: 12px; }
.detail-row label { width: 120px; font-weight: bold; color: #555; flex-shrink: 0; }
.detail-row span { color: #333; flex: 1; }
.highlight { color: #e74c3c; font-weight: bold; font-size: 1.1em; }
.note-content { margin: 0; background: #f9f9f9; padding: 10px; border-radius: 4px; flex: 1; color: #555; font-style: italic; }
.modal-footer { padding: 15px 20px; border-top: 1px solid #eee; text-align: right; }
.btn-close { background: #6c757d; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; }
.btn-close:hover { background: #5a6268; }

.detail-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em; }
.detail-table th, .detail-table td { border: 1px solid #eee; padding: 8px; text-align: left; }
.detail-table th { background: #f8f9fa; }
.total-row { text-align: right; margin-top: 10px; font-size: 1.1em; color: #e74c3c; }

@keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>