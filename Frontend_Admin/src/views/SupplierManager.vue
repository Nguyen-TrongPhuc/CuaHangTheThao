<template>
  <div class="supplier-page">
    <div class="header">
      <h1>Nhà Cung Cấp</h1>
      <button class="btn-add">+ Thêm nhà cung cấp</button>
    </div>
    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên công ty</th>
          <th>Số điện thoại</th>
          <th>Email</th>
          <th>Địa chỉ</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sup in suppliers" :key="sup._id">
          <td>{{ sup.name }}</td>
          <td>{{ sup.phone }}</td>
          <td>{{ sup.email }}</td>
          <td>{{ sup.address }}</td>
          <td>
            <button>Sửa</button>
            <button class="btn-del">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      suppliers: [] // Dữ liệu sẽ fetch từ SupplierService
    }
  }
}
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.btn-add { background: #27ae60; color: white; padding: 10px 20px; border: none; cursor: pointer; }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
</style>