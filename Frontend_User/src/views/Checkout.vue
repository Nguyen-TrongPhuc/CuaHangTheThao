<template>
  <div class="checkout-page-wrapper">
    <AppHeader />
    <div class="container">
      <h1 class="page-title">Thanh toán</h1>
      
      <div class="checkout-content">
        <!-- Form thông tin giao hàng -->
        <div class="shipping-info">
          <h2>Thông tin giao hàng</h2>
          <form @submit.prevent="submitOrder">
            <div class="form-group">
              <label>Họ tên người nhận <span class="required">*</span></label>
              <input v-model="form.name" type="text" required placeholder="Nhập họ tên" />
            </div>
            <div class="form-group">
              <label>Số điện thoại <span class="required">*</span></label>
              <input v-model="form.phone" type="tel" required placeholder="Nhập số điện thoại" />
            </div>
            <div class="form-group">
              <label>Địa chỉ nhận hàng <span class="required">*</span></label>
              <input v-model="form.address" type="text" required placeholder="Nhập địa chỉ chi tiết (Số nhà, đường, phường/xã...)" />
            </div>
            <div class="form-group">
              <label>Ghi chú</label>
              <textarea v-model="form.note" placeholder="Ghi chú về đơn hàng (tùy chọn)"></textarea>
            </div>
          </form>

          <!-- Phương thức thanh toán -->
          <div class="payment-section">
            <h2>Phương thức thanh toán</h2>
            <div class="payment-options">
              <label class="payment-option" :class="{ selected: paymentMethod === 'cod' }">
                <input type="radio" v-model="paymentMethod" value="cod" hidden>
                <div class="option-icon"><i class="fa-solid fa-money-bill-wave"></i></div>
                <div class="option-info">
                  <span class="opt-title">Thanh toán khi nhận hàng (COD)</span>
                  <span class="opt-desc">Thanh toán tiền mặt cho shipper khi nhận hàng.</span>
                </div>
              </label>
              <label class="payment-option" :class="{ selected: paymentMethod === 'vnpay' }">
                <input type="radio" v-model="paymentMethod" value="vnpay" hidden>
                <div class="option-icon"><i class="fa-solid fa-credit-card"></i></div>
                <div class="option-info">
                  <span class="opt-title">Thanh toán Online (VNPAY)</span>
                  <span class="opt-desc">Thanh toán qua ví VNPAY hoặc tài khoản ngân hàng.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Tóm tắt đơn hàng -->
        <div class="order-summary">
          <h2>Đơn hàng của bạn</h2>
          <div class="summary-items">
            <div v-for="item in selectedItems" :key="item._id" class="summary-item">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <div class="item-variant" v-if="item.variant">
                   Size: {{ getSizeName(item.variant.size_id) }} - Màu: {{ getColorName(item.variant.color_id) }}
                </div>
                <span class="item-quantity">x {{ item.quantity }}</span>
              </div>
              <span class="item-price">{{ formatPrice(item.price * item.quantity) }}đ</span>
            </div>
          </div>
          
          <div class="summary-total">
            <div class="row">
              <span>Tạm tính:</span>
              <span>{{ formatPrice(totalAmount) }}đ</span>
            </div>
            <div class="row">
              <span>Phí vận chuyển:</span>
              <span>0đ</span>
            </div>
            <div class="row total">
              <span>Tổng cộng:</span>
              <span>{{ formatPrice(totalAmount) }}đ</span>
            </div>
          </div>

          <button class="btn-confirm" @click="submitOrder" :disabled="isProcessing">
            {{ isProcessing ? 'Đang xử lý...' : 'Đặt hàng' }}
          </button>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script>
import { computed, reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { cartStore } from "@/utils/cart";
import OrderService from "@/services/orders.service";
import SizesService from "@/services/sizes.service";
import ColorsService from "@/services/colors.service";
import { showToast } from "@/utils/toast";
import { jwtDecode } from "jwt-decode";
import CustomerService from "@/services/customer.service";

export default {
  components: { AppHeader, AppFooter },
  setup() {
    const router = useRouter();
    const form = reactive({ name: "", phone: "", address: "", note: "" });
    const isProcessing = ref(false);
    const sizes = ref([]);
    const colors = ref([]);
    const paymentMethod = ref("cod");

    // Lấy các item đã chọn từ giỏ hàng
    const selectedItems = computed(() => cartStore.state.items.filter(item => item.selected));
    
    const totalAmount = computed(() => {
      return selectedItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
    });

    // Load dữ liệu Size/Màu để hiển thị tên
    const loadMetadata = async () => {
        try {
            const [s, c] = await Promise.all([SizesService.getAll(), ColorsService.getAll()]);
            sizes.value = s;
            colors.value = c;
        } catch (e) { console.error(e); }
    };

    const getSizeName = (id) => {
        const s = sizes.value.find(x => String(x._id) === String(id));
        return s ? s.name : '---';
    };
    const getColorName = (id) => {
        const c = colors.value.find(x => String(x._id) === String(id));
        return c ? c.name : '---';
    };

    onMounted(async () => {
        if (selectedItems.value.length === 0) {
            showToast("Vui lòng chọn sản phẩm để thanh toán", "warning");
            router.push("/cart");
            return;
        }
        loadMetadata();
        
        // Tự động điền thông tin từ hồ sơ người dùng
        try {
            const user = await CustomerService.getProfile();
            if (user) {
                form.name = `${user.last_name || ''} ${user.first_name || ''}`.trim();
                form.phone = user.phone || "";
                form.address = user.address || "";
            }
        } catch (error) {
            console.log("Không tải được thông tin profile:", error);
            // Fallback: Điền sẵn tên người dùng từ localStorage nếu có
            const userName = localStorage.getItem("user_name");
            if (userName) form.name = userName;
        }
    });

    const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value);

    const submitOrder = async () => {
        if (!form.name || !form.phone || !form.address) {
            showToast("Vui lòng điền đầy đủ thông tin giao hàng", "warning");
            return;
        }

        isProcessing.value = true;
        try {
            const token = localStorage.getItem("user_token");
            if (!token) throw new Error("Unauthorized");
            
            const decoded = jwtDecode(token);
            console.log("Thông tin Token:", decoded); // Debug xem token có gì

            // FIX: Thử lấy ID từ nhiều trường khác nhau để tránh lỗi undefined
            const customerId = decoded.userId || decoded.id || decoded._id;

            if (!customerId) {
                throw new Error("Lỗi xác thực người dùng. Vui lòng đăng nhập lại.");
            }

            const orderData = {
                customer_id: customerId,
                employee_id: null,
                // employee_id: null, // Không gửi trường này để tránh lỗi validation
                name: form.name,
                phone: form.phone,
                address: form.address,
                note: form.note,
                payment_method: paymentMethod.value,
                items: selectedItems.value.map(item => ({
                    product_id: item._id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    // Gửi kèm thông tin biến thể nếu có
                    variant_size_id: item.variant?.size_id || undefined,
                    variant_color_id: item.variant?.color_id || undefined
                })),
                total_price: totalAmount.value
            };

            console.log("Dữ liệu gửi đi:", orderData); // Debug payload
            await OrderService.create(orderData);

            // Xóa các sản phẩm đã mua khỏi giỏ hàng
            selectedItems.value.forEach(item => cartStore.removeFromCart(item._id));

            if (paymentMethod.value === 'vnpay') {
                // Nếu tích hợp thật, backend sẽ trả về URL thanh toán và bạn sẽ redirect tại đây
                showToast("Đơn hàng VNPAY đã được tạo. Vui lòng kiểm tra email để thanh toán.", "info");
            }
            showToast("Đặt hàng thành công!", "success");
            router.push("/"); // Hoặc chuyển đến trang lịch sử đơn hàng
        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            if (error.response) {
                console.error("Chi tiết lỗi từ server:", error.response.data);
            }
            // Hiển thị lỗi chi tiết từ Backend trả về
            const msg = error.response?.data?.message || "Đặt hàng thất bại. Vui lòng kiểm tra lại số lượng tồn kho.";
            showToast(msg, "error");
        } finally {
            isProcessing.value = false;
        }
    };

    return {
        form, selectedItems, totalAmount, isProcessing,
        formatPrice, submitOrder, getSizeName, getColorName, paymentMethod
    };
  }
};
</script>

<style scoped>
.checkout-page-wrapper { display: flex; flex-direction: column; min-height: 100vh; background: #f9f9f9; }
.container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; }
.page-title { text-align: center; margin-bottom: 30px; color: #2c3e50; }
.checkout-content { display: flex; gap: 30px; flex-wrap: wrap; }
.shipping-info { flex: 2; min-width: 300px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.order-summary { flex: 1; min-width: 300px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); height: fit-content; }
h2 { margin-top: 0; margin-bottom: 20px; color: #2c3e50; font-size: 1.2rem; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #555; }
.required { color: red; }
.form-group input, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.form-group textarea { height: 100px; resize: vertical; }
.summary-item { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f5f5f5; }
.item-info { display: flex; flex-direction: column; }
.item-name { font-weight: 600; color: #333; }
.item-variant { font-size: 0.85rem; color: #777; margin-top: 2px; }
.item-quantity { font-size: 0.85rem; color: #777; }
.item-price { font-weight: bold; color: #333; }
.summary-total { margin-top: 20px; }
.row { display: flex; justify-content: space-between; margin-bottom: 10px; color: #555; }
.row.total { font-weight: bold; color: #e74c3c; font-size: 1.2rem; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
.btn-confirm { width: 100%; padding: 15px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 5px; font-weight: bold; font-size: 1.1rem; cursor: pointer; margin-top: 20px; transition: 0.3s; }
.btn-confirm:hover:not(:disabled) { background: linear-gradient(135deg, #218838, #1e7e34); transform: translateY(-2px); }
.btn-confirm:disabled { background: #ccc; cursor: not-allowed; }

.payment-section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
.payment-options { display: flex; flex-direction: column; gap: 15px; }
.payment-option { display: flex; align-items: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.payment-option:hover { background: #f9f9f9; }
.payment-option.selected { border-color: #28a745; background: #f0fff4; box-shadow: 0 0 0 1px #28a745; }
.option-icon { font-size: 1.5rem; color: #555; margin-right: 15px; width: 30px; text-align: center; }
.payment-option.selected .option-icon { color: #28a745; }
.option-info { display: flex; flex-direction: column; }
.opt-title { font-weight: bold; color: #333; }
.opt-desc { font-size: 0.85rem; color: #777; margin-top: 3px; }
</style>