<template>
  <div class="category-page">
    <div class="header">
      <h1>Quản lý Danh mục</h1>
      <button class="btn-add">+ Thêm danh mục</button>
    </div>
    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên danh mục</th>
          <th>Mô tả</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cat in categories" :key="cat._id">
          <td><strong>{{ cat.name }}</strong></td>
          <td>{{ cat.description }}</td>
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
// Bạn tạo thêm CategoryService tương tự ProductService nhé
export default {
  data() {
    return {
      categories: [
        { _id: '1', name: 'Giày Thể Thao', description: 'Các loại giày chạy bộ, bóng đá' },
        { _id: '2', name: 'Quần Áo', description: 'Trang phục thi đấu và tập luyện' }
      ]
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