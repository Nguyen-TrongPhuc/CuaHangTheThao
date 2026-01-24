<template>
  <div class="customer-page">
    <div class="header">
      <h1>Quản lý Khách hàng</h1>
      <button class="btn-add" @click="goToAddCustomer">+ Thêm khách hàng</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Email</th>
          <th>Số điện thoại</th>
          <th>Địa chỉ</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in customers" :key="customer._id">
          <td>{{ customer.name }}</td>
          <td>{{ customer.email }}</td>
          <td>{{ customer.phone }}</td>
          <td>{{ customer.address }}</td>
          <td>
            <button class="btn-del" @click="deleteCustomer(customer._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import CustomerService from "@/services/customer.service";

export default {
  data() {
    return {
      customers: [],
    };
  },
  methods: {
    async retrieveCustomers() {
      try {
        this.customers = await CustomerService.getAll();
      } catch (error) {
        console.log(error);
      }
    },
    goToAddCustomer() {
      this.$router.push({ name: "customer.add" });
    },
    async deleteCustomer(id) {
      if (confirm("Bạn muốn xóa khách hàng này?")) {
        try {
          await CustomerService.delete(id);
          this.retrieveCustomers();
        } catch (error) {
          console.log(error);
        }
      }
    },
  },
  mounted() {
    this.retrieveCustomers();
  },
};
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.btn-del { color: #e74c3c; margin-left: 10px; cursor: pointer; border: none; background: none; }
.btn-add { background: #27ae60; color: white; padding: 10px 20px; border: none; cursor: pointer; }
</style>