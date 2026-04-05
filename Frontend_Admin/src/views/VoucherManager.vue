<template>
  <div class="page-container">
    <div class="header">
      <h1>Quản lý Voucher</h1>
      <div class="actions">
        <button class="btn-refresh" @click="refreshData" title="Làm mới"><i class="fa-solid fa-rotate-right"></i></button>
        <button v-if="userRole === 'admin'" class="btn-add" @click="showCreateModal = true">
          + Tạo Voucher
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row" v-if="stats">
      <div class="stat-card">
        <div class="stat-number">{{ stats.total || 0 }}</div>
        <div class="stat-label">Tổng voucher</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" :class="{ 'text-success': stats.active }">
          {{ stats.active || 0 }}
        </div>
        <div class="stat-label">Còn hiệu lực</div>
      </div>
      <div class="stat-card">
        <div class="stat-number text-warning">{{ stats.used || 0 }}</div>
        <div class="stat-label">Đã sử dụng</div>
      </div>
    </div>

    <!-- Filter & Search -->
    <div class="filter-section">
      <div class="filter-group">
        <select v-model="filterStatus" @change="fetchVouchers" class="form-control">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tắt</option>
          <option value="expired">Hết hạn</option>
        </select>
        <input 
          v-model="searchCode" 
          @input="debouncedSearch" 
          placeholder="Tìm theo mã voucher..." 
          class="form-control"
        />
      </div>
    </div>

    <!-- Vouchers Table -->
    <div class="table-wrapper">
      <table class="admin-table" v-if="vouchers.length">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Giảm giá</th>
            <th>Đơn tối thiểu</th>
            <th>Số lần dùng</th>
            <th>Ngày hết hạn</th>
            <th>Trạng thái</th>
            <th v-if="userRole === 'admin'">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="voucher in vouchers" :key="voucher._id">
            <td>
              <strong class="code">{{ voucher.code }}</strong>
              <div class="description">{{ voucher.description || '-' }}</div>
            </td>
            <td>
              <span class="discount" :class="voucher.discount_type">
                {{ voucher.discount_type === 'percent' ? voucher.discount_value + '%' : formatPrice(voucher.discount_value) }}
              </span>
              <div v-if="voucher.discount_type === 'shipping'" style="font-size: 11px; color: #2980b9;">(Phí ship)</div>
            </td>
            <td>{{ formatPrice(voucher.min_order_value) }}</td>
            <td>
              <span class="usage">
                {{ voucher.used_count || 0 }} / {{ voucher.max_usage || '∞' }}
              </span>
            </td>
            <td>{{ formatDate(voucher.end_date) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(voucher)">
                {{ getStatusText(voucher) }}
              </span>
            </td>
            <td v-if="userRole === 'admin'">
              <button class="btn-edit" @click="editVoucher(voucher)">Sửa</button>
              <button class="btn-del" @click="deleteVoucher(voucher._id)" :disabled="isDeleting === voucher._id">
                <span v-if="isDeleting !== voucher._id">Xóa</span>
                <i class="fa-solid fa-spinner fa-spin" v-else></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <i class="fa-solid fa-ticket"></i>
        <p>Chưa có voucher nào</p>
        <button v-if="userRole === 'admin'" class="btn-add" @click="showCreateModal = true" style="margin: 0 auto; display: inline-block;">Tạo voucher đầu tiên</button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="form-container" style="max-width: 700px;">
        <h2>{{ editingVoucher ? 'Cập nhật' : 'Thêm mới' }} Voucher</h2>
        <form @submit.prevent="saveVoucher">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Mã voucher <span class="required">*</span></label>
              <input v-model="form.code" required maxlength="20" placeholder="VD: SALE50" class="input-field" />
            </div>
            <div class="form-group">
              <label>Loại giảm giá <span class="required">*</span></label>
              <select v-model="form.discount_type" required class="input-field">
                <option value="fixed">Giảm cố định (VNĐ)</option>
                <option value="percent">Phần trăm (%)</option>
                <option value="shipping">Giảm phí vận chuyển</option>
              </select>
            </div>
            <div class="form-group">
              <label>Giá trị giảm <span class="required">*</span></label>
              <input v-model.number="form.discount_value" type="number" required min="0" max="10000000" 
                :placeholder="form.discount_type === 'percent' ? '0-100' : (form.discount_type === 'shipping' ? 'Nhập số tiền tối đa (VD: 1000000)' : 'Số tiền VNĐ')" class="input-field" />
              <small v-if="form.discount_type === 'shipping'" style="color: #666; display: block; margin-top: 5px;">
                * Nhập số tiền lớn (VD: 100.000đ) để miễn phí vận chuyển hoàn toàn.
              </small>
            </div>
            <div class="form-group">
              <label>Đơn hàng tối thiểu</label>
              <input v-model.number="form.min_order_value" type="number" min="0" placeholder="0đ = Không yêu cầu" class="input-field" />
            </div>
            <div class="form-group">
              <label>Số lần sử dụng tối đa</label>
              <input v-model.number="form.max_usage" type="number" min="1" placeholder="∞ (Không giới hạn)" class="input-field" />
            </div>
            <div class="form-group">
              <label>Bắt đầu</label>
              <input v-model="form.start_date" type="datetime-local" class="input-field" />
            </div>
            <div class="form-group">
              <label>Hết hạn</label>
              <input v-model="form.end_date" type="datetime-local" class="input-field" />
            </div>
            <div class="form-group full-width">
              <label>Trạng thái</label>
              <select v-model="form.is_active" class="input-field">
                <option :value="true">Hoạt động</option>
                <option :value="false">Tắt</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Mô tả</label>
              <textarea v-model="form.description" rows="3" placeholder="Mô tả voucher (tùy chọn)" class="input-field"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Hủy</button>
            <button type="submit" class="btn-save" :disabled="isSaving">
              <i class="fa-solid fa-save" v-if="!isSaving"></i>
              <i class="fa-solid fa-spinner fa-spin" v-else></i>
              {{ editingVoucher ? 'Cập nhật' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="deleteConfirmId" class="modal-overlay" @click.self="deleteConfirmId = null">
      <div class="confirm-dialog">
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc chắn muốn xóa Voucher này? Hành động này không thể hoàn tác.</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="deleteConfirmId = null">Hủy</button>
          <button class="btn-confirm-delete" @click="executeDelete">Xóa</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VoucherService from '@/services/vouchers.service';
import { showToast } from '@/utils/toast';

export default {
  data() {
    return {
      userRole: localStorage.getItem("user_role") || "staff",
      vouchers: [],
      stats: null,
      isLoading: false,
      showCreateModal: false,
      editingVoucher: null,
      form: {
        code: '',
        discount_type: 'fixed',
        discount_value: 0,
        min_order_value: 0,
        max_usage: 1,
        start_date: '',
        end_date: '',
        is_active: true,
        description: ''
      },
      filterStatus: '',
      searchCode: '',
      isSaving: false,
      isDeleting: null,
      debounceTimer: null,
      deleteConfirmId: null
    };
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    },
    getStatusClass(voucher) {
      const now = new Date();
      if (!voucher.is_active) return 'inactive';
      if (now > new Date(voucher.end_date)) return 'expired';
      if (voucher.used_count >= (voucher.max_usage || Infinity)) return 'exhausted';
      return 'active';
    },
    getStatusText(voucher) {
      const now = new Date();
      if (!voucher.is_active) return 'Tắt';
      if (now > new Date(voucher.end_date)) return 'Hết hạn';
      if (voucher.used_count >= (voucher.max_usage || Infinity)) return 'Hết lượt';
      return 'Hoạt động';
    },
    async fetchVouchers() {
      this.isLoading = true;
      try {
        const params = {};
        if (this.filterStatus) params.status = this.filterStatus;
        if (this.searchCode) params.code = this.searchCode;
        
        this.vouchers = await VoucherService.getAll(params);
      } catch (error) {
        showToast('Lỗi tải danh sách voucher', 'error');
        console.error(error);
      }

      // Fetch stats independently so failure doesn't block the UI or show misleading error
      try {
        this.stats = await VoucherService.getStats();
      } catch (error) {
        console.warn('Voucher stats unavailable:', error.message);
      } finally {
        this.isLoading = false;
      }
    },
    refreshData() {
      this.fetchVouchers();
    },
    debouncedSearch() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.fetchVouchers();
      }, 500);
    },
    resetForm() {
      this.form = {
        code: '',
        discount_type: 'fixed',
        discount_value: 0,
        min_order_value: 0,
        max_usage: 1,
        start_date: '',
        end_date: '',
        is_active: true,
        description: ''
      };
      this.editingVoucher = null;
    },
    editVoucher(voucher) {
      this.form = { ...voucher };
      // Convert dates for input
      this.form.start_date = voucher.start_date ? new Date(voucher.start_date).toISOString().slice(0,16) : '';
      this.form.end_date = voucher.end_date ? new Date(voucher.end_date).toISOString().slice(0,16) : '';
      this.showCreateModal = true;
      this.editingVoucher = voucher;
    },
    closeModal() {
      this.showCreateModal = false;
      this.resetForm();
    },
    async saveVoucher() {
      this.isSaving = true;
      try {
        if (this.editingVoucher) {
          await VoucherService.update(this.editingVoucher._id, this.form);
          showToast('Cập nhật voucher thành công!', 'success');
        } else {
          await VoucherService.create(this.form);
          showToast('Tạo voucher mới thành công!', 'success');
        }
        this.closeModal();
        this.refreshData();
      } catch (error) {
        showToast(error.response?.data?.message || 'Lỗi lưu voucher', 'error');
      } finally {
        this.isSaving = false;
      }
    },
    deleteVoucher(id) {
      this.deleteConfirmId = id;
    },
    async executeDelete() {
      if (!this.deleteConfirmId) return;
      this.isDeleting = this.deleteConfirmId;
      try {
        await VoucherService.delete(this.deleteConfirmId);
        showToast('Xóa voucher thành công!', 'success');
        this.refreshData();
      } catch (error) {
        showToast('Lỗi xóa voucher', 'error');
      } finally {
        this.isDeleting = null;
        this.deleteConfirmId = null;
      }
    }
  },
  mounted() {
    this.fetchVouchers();
  }
};
</script>

<style scoped>
/* Layout & Header consistent with other managers */
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header h1 { margin: 0; color: #2c3e50; font-size: 24px; }
.actions { display: flex; gap: 10px; }

.btn-add { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; font-weight: 500; }
.btn-add:hover { background: linear-gradient(135deg, #8E54E9, #4776E6); box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-1px); }
.btn-refresh { background: white; border: 1px solid #ddd; color: #555; width: 36px; height: 36px; border-radius: 4px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
.btn-refresh:hover { background: #f0f0f0; color: #333; }

.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
.stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: transform 0.3s; }
.stat-card:hover { transform: translateY(-5px); }
.stat-number { font-size: 2.5rem; font-weight: bold; margin-bottom: 8px; }
.stat-number.text-success { color: #28a745; }
.stat-number.text-warning { color: #ffc107; }
.stat-label { color: #6c757d; font-size: 14px; }

.filter-section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.filter-group { display: flex; gap: 15px; max-width: 600px; flex-wrap: wrap; }
.form-control { flex: 1; min-width: 200px; padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.form-control:focus { outline: none; border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.1); }

/* Table Styles matching admin-table */
.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; vertical-align: middle; }
.admin-table th { background-color: #f8f9fa; color: #495057; font-weight: 600; }

.code { font-size: 16px; color: #e74c3c; font-family: monospace; }
.description { font-size: 12px; color: #6c757d; margin-top: 4px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.discount { padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px; }
.discount.fixed { background: #d4edda; color: #155724; }
.discount.percent { background: #cce5ff; color: #004085; }
.discount.shipping { background: #e8daef; color: #6c3483; }
.usage { background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 12px; font-size: 13px; font-weight: 500; }
.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
.status-badge.active { background: #d4edda; color: #155724; }
.status-badge.inactive { background: #f8d7da; color: #721c24; }
.status-badge.expired { background: #fff3cd; color: #856404; }
.status-badge.exhausted { background: #cce5ff; color: #004085; }
.btn-edit { color: #3498db; cursor: pointer; border: none; background: none; margin-right: 5px; }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
.btn-del:disabled { opacity: 0.6; cursor: not-allowed; }

.empty-state { text-align: center; padding: 60px 20px; color: #6c757d; }
.empty-state i { font-size: 4rem; opacity: 0.5; margin-bottom: 20px; display: block; }
.empty-state p { font-size: 18px; margin-bottom: 20px; }

/* Custom Modal Styles (Đồng bộ) */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.form-container { background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.form-container h2 { margin-top: 0; margin-bottom: 25px; color: #2c3e50; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; margin-bottom: 0; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { margin-bottom: 8px; font-weight: 600; color: #444; }
.required { color: #e74c3c; margin-left: 3px; }
.input-field { width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.3s ease; }
.input-field:focus { border-color: #4776E6; outline: none; box-shadow: 0 0 0 3px rgba(71, 118, 230, 0.1); }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; }
.btn-cancel { background: #f1f3f5; color: #495057; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;}
.btn-cancel:hover { background: #e2e6ea; }
.btn-save { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 25px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; display: flex; align-items: center; gap: 5px; }
.btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(71, 118, 230, 0.3); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
@media (max-width: 768px) {
  .header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .stats-row { grid-template-columns: 1fr; }
  .filter-group { flex-direction: column; }
  .form-control { min-width: auto; }
  .form-row { grid-template-columns: 1fr; }
  .data-table { font-size: 13px; }
}

/* Confirm Delete Modal */
.confirm-dialog { background: white; padding: 30px; border-radius: 12px; width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: modalFadeIn 0.3s ease; }
.confirm-icon { font-size: 3rem; color: #e74c3c; margin-bottom: 15px; }
.confirm-dialog h3 { margin-top: 0; color: #2c3e50; font-size: 1.5rem; }
.confirm-dialog p { color: #666; margin-bottom: 25px; line-height: 1.5; }
.confirm-actions { display: flex; justify-content: center; gap: 15px; }
.confirm-actions button { padding: 10px 25px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-confirm-delete { background: #e74c3c; color: white; }
.btn-confirm-delete:hover { background: #c0392b; }
</style>
