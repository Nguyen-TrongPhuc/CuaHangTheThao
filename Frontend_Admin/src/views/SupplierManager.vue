<template>
  <div class="category-page">
    <div class="header">
      <h1>Quản lý Nhà cung cấp</h1>
      <button class="btn-add" @click="openModal()">+ Thêm Nhà cung cấp</button>
    </div>

    <div v-if="isLoading" class="loading">Đang tải dữ liệu...</div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Tên Nhà cung cấp</th>
          <th>Email</th>
          <th>Số điện thoại</th>
          <th>Địa chỉ</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="suppliers.length === 0">
          <td colspan="5" style="text-align: center;">Không có dữ liệu</td>
        </tr>
        <tr v-for="supplier in suppliers" :key="supplier._id">
          <td><strong>{{ supplier.name }}</strong></td>
          <td>{{ supplier.email }}</td>
          <td>{{ supplier.phone }}</td>
          <td>{{ supplier.address }}</td>
          <td>
            <button class="btn-edit" @click="openModal(supplier)">Sửa</button>
            <button class="btn-del" @click="deleteSupplier(supplier._id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <div v-if="showModal" class="form-overlay">
      <div class="form-container">
        <h2>{{ isEditing ? 'Cập nhật' : 'Thêm mới' }} Nhà cung cấp</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Tên nhà cung cấp:</label>
            <input v-model="form.name" required class="input-field" placeholder="Nhập tên nhà cung cấp" />
          </div>
          <div class="form-group">
            <label>Email:</label>
            <input v-model="form.email" type="email" class="input-field" placeholder="Nhập email" />
          </div>
          <div class="form-group">
            <label>Số điện thoại:</label>
            <input v-model="form.phone" class="input-field" placeholder="Nhập số điện thoại" />
          </div>
          <div class="form-group">
            <label>Địa chỉ:</label>
            <div class="address-selection">
              <select v-model="addressState.selectedProvince" @change="fetchDistricts" class="input-field">
                <option :value="null">-- Tỉnh/Thành phố --</option>
                <option v-for="p in addressState.provinces" :key="p.code" :value="p">{{ p.name }}</option>
              </select>
              
              <select v-model="addressState.selectedDistrict" @change="fetchWards" class="input-field" :disabled="!addressState.selectedProvince">
                <option :value="null">-- Quận/Huyện --</option>
                <option v-for="d in addressState.districts" :key="d.code" :value="d">{{ d.name }}</option>
              </select>
              
              <select v-model="addressState.selectedWard" class="input-field" :disabled="!addressState.selectedDistrict">
                <option :value="null">-- Phường/Xã --</option>
                <option v-for="w in addressState.wards" :key="w.code" :value="w">{{ w.name }}</option>
              </select>
            </div>
            <input v-model="addressState.street" class="input-field" placeholder="Số nhà, tên đường..." style="margin-top: 10px;" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Hủy</button>
            <button type="submit" class="btn-save">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from "vue";
import SuppliersService from "@/services/suppliers.service";
import { showToast } from "@/utils/toast";

export default {
  data() {
    return {
      suppliers: [],
      isLoading: false,
      showModal: false,
      isEditing: false,
      form: {
        _id: null,
        name: "",
        email: "",
        phone: "",
        address: ""
      },
      addressState: reactive({
        provinces: [],
        districts: [],
        wards: [],
        selectedProvince: null,
        selectedDistrict: null,
        selectedWard: null,
        street: ""
      })
    };
  },
  methods: {
    async fetchSuppliers() {
      this.isLoading = true;
      try {
        this.suppliers = await SuppliersService.getAll();
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    
    // Lấy danh sách Tỉnh/Thành
    async fetchProvinces() {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
        this.addressState.provinces = await res.json();
      } catch (e) {
        console.error("Lỗi tải tỉnh thành:", e);
      }
    },

    // Lấy danh sách Quận/Huyện
    async fetchDistricts() {
      this.addressState.districts = [];
      this.addressState.wards = [];
      this.addressState.selectedDistrict = null;
      this.addressState.selectedWard = null;
      this.updateFullAddress();

      if (this.addressState.selectedProvince) {
        try {
          const res = await fetch(`https://provinces.open-api.vn/api/p/${this.addressState.selectedProvince.code}?depth=2`);
          const data = await res.json();
          this.addressState.districts = data.districts;
        } catch (e) {
          console.error(e);
        }
      }
    },

    // Lấy danh sách Phường/Xã
    async fetchWards() {
      this.addressState.wards = [];
      this.addressState.selectedWard = null;
      this.updateFullAddress();

      if (this.addressState.selectedDistrict) {
        try {
          const res = await fetch(`https://provinces.open-api.vn/api/d/${this.addressState.selectedDistrict.code}?depth=2`);
          const data = await res.json();
          this.addressState.wards = data.wards;
        } catch (e) {
          console.error(e);
        }
      }
    },

    // Cập nhật địa chỉ đầy đủ
    updateFullAddress() {
      const parts = [];
      if (this.addressState.street) parts.push(this.addressState.street);
      if (this.addressState.selectedWard) parts.push(this.addressState.selectedWard.name);
      if (this.addressState.selectedDistrict) parts.push(this.addressState.selectedDistrict.name);
      if (this.addressState.selectedProvince) parts.push(this.addressState.selectedProvince.name);
      
      this.form.address = parts.join(", ");
    },

    openModal(supplier = null) {
      this.showModal = true;
      
      // Reset address state
      this.addressState.selectedProvince = null;
      this.addressState.selectedDistrict = null;
      this.addressState.selectedWard = null;
      this.addressState.street = "";
      
      // Load provinces
      this.fetchProvinces();

      if (supplier) {
        this.isEditing = true;
        this.form = { ...supplier };
        
        // Try to parse existing address to select dropdowns
        this.parseAddress(supplier.address);
      } else {
        this.isEditing = false;
        this.form = { _id: null, name: "", email: "", phone: "", address: "" };
      }
    },
    
    // Parse địa chỉ hiện có để chọn dropdowns
    async parseAddress(address) {
      if (!address) return;
      
      const parts = address.split(', ').map(p => p.trim().toLowerCase());
      
      // Find province
      for (const province of this.addressState.provinces) {
        if (parts.some(p => p.includes(province.name.toLowerCase()))) {
          this.addressState.selectedProvince = province;
          await this.fetchDistricts();
          
          // Find district
          for (const district of this.addressState.districts) {
            if (parts.some(p => p.includes(district.name.toLowerCase()))) {
              this.addressState.selectedDistrict = district;
              await this.fetchWards();
              
              // Find ward
              for (const ward of this.addressState.wards) {
                if (parts.some(p => p.includes(ward.name.toLowerCase()))) {
                  this.addressState.selectedWard = ward;
                  break;
                }
              }
              break;
            }
          }
          break;
        }
      }
      
      // Extract street number (first part that's not province/district/ward)
      const fullParts = address.split(', ').map(p => p.trim());
      if (fullParts.length > 0) {
        const wardName = this.addressState.selectedWard?.name || '';
        const districtName = this.addressState.selectedDistrict?.name || '';
        const provinceName = this.addressState.selectedProvince?.name || '';
        
        // Find the street part (usually first part)
        const streetPart = fullParts.find(p => {
          const lower = p.toLowerCase();
          return !lower.includes(wardName.toLowerCase()) && 
                 !lower.includes(districtName.toLowerCase()) &&
                 !lower.includes(provinceName.toLowerCase());
        });
        
        if (streetPart) {
          this.addressState.street = streetPart;
        }
      }
    },

    // Validate email format
    validateEmail(email) {
      if (!email) return true; // Email is optional
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    // Validate phone format (Vietnamese phone numbers)
    validatePhone(phone) {
      if (!phone) return true; // Phone is optional
      // Vietnamese phone: 10 digits, starts with 0, or +84
      const phoneRegex = /^(0[1-9]|84[1-9])\d{8}$/;
      return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    closeModal() {
      this.showModal = false;
    },
    async handleSubmit() {
      // Validate email format
      if (this.form.email && !this.validateEmail(this.form.email)) {
        showToast("Email không đúng định dạng!", "warning");
        return;
      }
      
      // Validate phone format
      if (this.form.phone && !this.validatePhone(this.form.phone)) {
        showToast("Số điện thoại không đúng định dạng! Vui lòng nhập số điện thoại Việt Nam (10 số).", "warning");
        return;
      }
      
      // Validate address
      if (!this.addressState.selectedProvince || !this.addressState.selectedDistrict || !this.addressState.selectedWard) {
        showToast("Vui lòng chọn đầy đủ Tỉnh/Huyện/Xã!", "warning");
        return;
      }
      
      // Update full address before saving
      this.updateFullAddress();

      try {
        if (this.isEditing) {
          await SuppliersService.update(this.form._id, this.form);
          showToast("Cập nhật thành công!", "success");
        } else {
          await SuppliersService.create(this.form);
          showToast("Thêm mới thành công!", "success");
        }
        this.closeModal();
        this.fetchSuppliers();
      } catch (error) {
        showToast(error.response?.data?.message || "Có lỗi xảy ra!", "error");
      }
    },
    async deleteSupplier(id) {
      if (confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
        try {
          await SuppliersService.delete(id);
          showToast("Xóa thành công!", "success");
          this.fetchSuppliers();
        } catch (error) {
          showToast(error.response?.data?.message || "Xóa thất bại!", "error");
        }
      }
    }
  },
  mounted() {
    this.fetchSuppliers();
  }
};
</script>

<style scoped>
.category-page { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-table { width: 100%; border-collapse: collapse; background: white; }
.admin-table th, .admin-table td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
.loading { text-align: center; padding: 20px; color: #666; }

.btn-add { 
  background: linear-gradient(135deg, #4776E6, #8E54E9); 
  color: white; 
  padding: 10px 20px; 
  border: none; 
  cursor: pointer; 
  border-radius: 4px; 
  box-shadow: 0 2px 5px rgba(0,0,0,0.2); 
  transition: 0.3s; 
}
.btn-add:hover { 
  background: linear-gradient(135deg, #8E54E9, #4776E6); 
  box-shadow: 0 4px 10px rgba(0,0,0,0.3); 
  transform: translateY(-1px); 
}

.btn-edit { 
  color: #3498db; 
  cursor: pointer; 
  border: none; 
  background: none; 
  margin-right: 5px; 
}

.btn-del { 
  color: #e74c3c; 
  margin-left: 5px; 
  cursor: pointer; 
  border: none; 
  background: none; 
}
.btn-del:hover { color: #c0392b; }

.form-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%; 
  background: rgba(0,0,0,0.5); 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  z-index: 1000;
}
.form-container { 
  background: white; 
  padding: 30px; 
  border-radius: 8px; 
  width: 500px; 
  max-height: 90vh;
  overflow-y: auto;
}
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #555; }
.input-field { 
  width: 100%; 
  padding: 10px; 
  border: 1px solid #ccc; 
  border-radius: 4px; 
  display: block; 
  box-sizing: border-box;
}
.input-field:focus { outline: none; border-color: #4776E6; }

.address-selection { display: flex; flex-direction: column; gap: 10px; }
.address-selection select { width: 100%; }

.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-save { 
  background: #2980b9; 
  color: white; 
  padding: 10px 20px; 
  border: none; 
  cursor: pointer; 
  border-radius: 4px;
}
.btn-save:hover { background: #1f6391; }

.btn-cancel { 
  background: #6c757d; 
  color: white; 
  padding: 10px 20px; 
  border: none; 
  cursor: pointer; 
  border-radius: 4px;
}
.btn-cancel:hover { background: #5a6268; }
</style>
