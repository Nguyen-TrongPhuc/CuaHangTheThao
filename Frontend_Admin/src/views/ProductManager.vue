<template>
  <div class="product-page">
    <div class="header">
      <h1>Quản lý Sản Phẩm</h1>
      <button class="btn-add" @click="showAddForm = true">+ Thêm sản phẩm</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên sản phẩm</th>
          <th>Danh mục</th>
          <th>Giá</th>
          <th>Size</th>
          <th>Màu</th>
          <th>Tồn kho</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product._id">
          <td>{{ product.name }}</td>
          <td>{{ product.category_id }}</td>
          <td>{{ formatCurrency(product.price) }}</td>
          <td><span class="badge">{{ product.size }}</span></td>
          <td>{{ product.color }}</td>
          <td :class="{ 'text-danger': product.stock_quantity < 10 }">
            {{ product.stock_quantity }}
          </td>
          <td>
            <button @click="editProduct(product)">Sửa</button>
            <button @click="removeProduct(product._id)" class="btn-del">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import ProductService from "@/services/products.service";

export default {
  data() {
    return {
      products: [],
    };
  },
  methods: {
    async retrieveProducts() {
      try {
        this.products = await ProductService.getAll();
      } catch (error) {
        console.log(error);
      }
    },
    async removeProduct(id) {
      if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
        await ProductService.delete(id);
        this.retrieveProducts();
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
  },
  mounted() {
    this.retrieveProducts();
  },
};
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.badge { background: #eee; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
.text-danger { color: red; font-weight: bold; }
.btn-add { background: #27ae60; color: white; padding: 10px 20px; border: none; cursor: pointer; }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
</style>