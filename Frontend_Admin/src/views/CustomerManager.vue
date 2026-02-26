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
          <td>{{ customer.last_name }} {{ customer.first_name }}</td>
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
import { showToast } from "@/utils/toast";

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
          await this.retrieveCustomers();
          showToast("Xóa thành công!", "success");
        } catch (error) {
          console.log(error);
          showToast("Xóa thất bại!", "error");
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
.btn-add { background: linear-gradient(135deg, #4776E6, #8E54E9); color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; }
.btn-add:hover { background: linear-gradient(135deg, #8E54E9, #4776E6); box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-1px); }
</style>