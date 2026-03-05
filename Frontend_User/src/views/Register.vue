<template>
  <div class="register-container">
    <div class="register-box">
      <h2>Đăng ký tài khoản</h2>
      <form @submit.prevent="handleRegister">
        <div class="name-group">
            <input v-model="form.last_name" type="text" placeholder="Họ" required />
            <input v-model="form.first_name" type="text" placeholder="Tên" required />
        </div>
        <input v-model="form.email" type="email" placeholder="Email" required />
        <input v-model="form.phone" type="tel" placeholder="Số điện thoại" required />
        
        <div class="input-with-icon">
            <input :type="showPwd ? 'text' : 'password'" v-model="form.password" placeholder="Mật khẩu" required />
            <span class="toggle-pass" @click="showPwd = !showPwd">
                <i :class="showPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </span>
        </div>

        <!-- Chọn địa chỉ -->
        <div class="address-group">
            <label>Địa chỉ:</label>
            <div class="address-selection">
                <select v-model="addressState.selectedProvince" @change="fetchDistricts" class="form-control">
                    <option :value="null">-- Tỉnh/Thành phố --</option>
                    <option v-for="p in addressState.provinces" :key="p.code" :value="p">{{ p.name }}</option>
                </select>
                <select v-model="addressState.selectedDistrict" @change="fetchWards" class="form-control" :disabled="!addressState.selectedProvince">
                    <option :value="null">-- Quận/Huyện --</option>
                    <option v-for="d in addressState.districts" :key="d.code" :value="d">{{ d.name }}</option>
                </select>
                <select v-model="addressState.selectedWard" @change="updateFullAddress" class="form-control" :disabled="!addressState.selectedDistrict">
                    <option :value="null">-- Phường/Xã --</option>
                    <option v-for="w in addressState.wards" :key="w.code" :value="w">{{ w.name }}</option>
                </select>
            </div>
            <input v-model="addressState.street" @input="updateFullAddress" type="text" placeholder="Số nhà, tên đường..." required />
        </div>

        <button type="submit" class="btn-register">Đăng ký</button>
      </form>
      <p class="login-link">
        Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import AuthService from "@/services/auth.service";
import { showToast } from "@/utils/toast";
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const showPwd = ref(false);
    const form = reactive({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        address: ""
    });

    // State cho địa chỉ
    const addressState = reactive({
        provinces: [],
        districts: [],
        wards: [],
        selectedProvince: null,
        selectedDistrict: null,
        selectedWard: null,
        street: ""
    });

    // API Địa chính
    const fetchProvinces = async () => {
        try {
            const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
            addressState.provinces = await res.json();
        } catch (e) { console.error(e); }
    };

    const fetchDistricts = async () => {
        addressState.districts = [];
        addressState.wards = [];
        addressState.selectedDistrict = null;
        addressState.selectedWard = null;
        updateFullAddress();
        if (addressState.selectedProvince) {
            try {
                const res = await fetch(`https://provinces.open-api.vn/api/p/${addressState.selectedProvince.code}?depth=2`);
                const data = await res.json();
                addressState.districts = data.districts;
            } catch (e) { console.error(e); }
        }
    };

    const fetchWards = async () => {
        addressState.wards = [];
        addressState.selectedWard = null;
        updateFullAddress();
        if (addressState.selectedDistrict) {
            try {
                const res = await fetch(`https://provinces.open-api.vn/api/d/${addressState.selectedDistrict.code}?depth=2`);
                const data = await res.json();
                addressState.wards = data.wards;
            } catch (e) { console.error(e); }
        }
    };

    const updateFullAddress = () => {
        const parts = [];
        if (addressState.street) parts.push(addressState.street);
        if (addressState.selectedWard) parts.push(addressState.selectedWard.name);
        if (addressState.selectedDistrict) parts.push(addressState.selectedDistrict.name);
        if (addressState.selectedProvince) parts.push(addressState.selectedProvince.name);
        form.address = parts.join(", ");
    };

    const handleRegister = async () => {
      try {
        // Validation đã có ở backend, có thể thêm ở đây nếu muốn
        await AuthService.register(form);
        showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
        router.push("/login");
      } catch (error) {
        showToast(error.response?.data?.message || "Đăng ký thất bại", "error");
      }
    };

    onMounted(() => {
        fetchProvinces();
    });

    return {
        form, showPwd, addressState,
        fetchDistricts, fetchWards, updateFullAddress, handleRegister
    };
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff, #ffffff, #ffffff);
}
.register-box { background: rgba(15, 12, 41, 0.7); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); width: 100%; max-width: 450px; color: white; }
h2 { text-align: center; margin-bottom: 30px; }

input, select { width: 100%; margin-bottom: 15px; padding: 12px; border: 1px solid rgba(255,255,255,0.2); border-radius: 25px; background: rgba(255, 255, 255, 0.05); color: white; box-sizing: border-box; }
input:focus, select:focus { border-color: #00c6ff; outline: none; background: rgba(255, 255, 255, 0.1); }
select option { background: #333; color: white; }

.name-group { display: flex; gap: 10px; }
.input-with-icon { position: relative; }
.toggle-pass { position: absolute; right: 15px; top: 12px; cursor: pointer; color: rgba(255,255,255,0.7); }

.address-group label { display: block; margin-bottom: 5px; font-weight: bold; padding-left: 15px; }
.address-selection { display: flex; gap: 5px; margin-bottom: 10px; }
.address-selection select { padding: 8px; border-radius: 5px; font-size: 0.9rem; }

button { width: 100%; padding: 12px; background: linear-gradient(to right, #00c6ff, #0072ff); color: white; border: none; cursor: pointer; border-radius: 25px; font-weight: bold; margin-top: 10px; transition: 0.3s; }
button:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0, 114, 255, 0.3); }

.login-link { text-align: center; margin-top: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
.login-link a { color: #00c6ff; text-decoration: none; font-weight: bold; }
.login-link a:hover { text-decoration: underline; }

::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
</style>