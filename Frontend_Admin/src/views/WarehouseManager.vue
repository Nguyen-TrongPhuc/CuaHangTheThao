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
          <th>Tổng tiền</th>
          <th>Ngày nhập</th>
          <th>Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="receipts.length === 0"><td colspan="6" style="text-align: center;">Chưa có phiếu nhập nào</td></tr>
        <tr v-for="r in receipts" :key="r._id">
          <td>{{ r._id.slice(-6).toUpperCase() }}</td>
          <td>{{ r.supplier_name }}</td>
          <td>{{ r.staff_name }}</td>
          <td>{{ r.total_amount.toLocaleString() }} đ</td>
          <td>{{ new Date(r.createdAt).toLocaleString() }}</td>
          <td>{{ r.note }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import WarehouseService from "@/services/warehouse.service";

export default {
  data() { return { receipts: [] }; },
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
</style>