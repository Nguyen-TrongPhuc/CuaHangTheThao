<template>
  <div class="checkout-page-wrapper">
    <AppHeader />
    <div class="container">
      <h1 class="page-title">Thanh toán</h1>
      
      <div class="checkout-content">
        <!-- Form thông tin giao hàng -->
        <div class="shipping-info">
          <h2><i class="fa-solid fa-map-location-dot"></i> Thông tin giao hàng</h2>
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
              
              <!-- Hiển thị địa chỉ hiện tại -->
              <div v-if="!isChangingAddress && form.address" class="current-address-box">
                <span>{{ form.address }}</span>
                <button type="button" class="btn-change-addr" @click="isChangingAddress = true">Thay đổi</button>
              </div>

              <!-- Chọn địa chỉ hành chính -->
              <div v-else class="address-edit-container">
                <div v-if="!userLocation.lat">
                    <div class="address-selection">
                        <select v-model="addressState.selectedProvince" @change="fetchDistricts" class="form-control">
                        <option :value="null">-- Tỉnh/Thành phố --</option>
                        <option v-for="p in addressState.provinces" :key="p.code" :value="p">{{ p.name }}</option>
                        </select>
                        
                        <select v-model="addressState.selectedDistrict" @change="fetchWards" class="form-control" :disabled="!addressState.selectedProvince">
                        <option :value="null">-- Quận/Huyện --</option>
                        <option v-for="d in addressState.districts" :key="d.code" :value="d">{{ d.name }}</option>
                        </select>
                        
                        <select v-model="addressState.selectedWard" class="form-control" :disabled="!addressState.selectedDistrict">
                        <option :value="null">-- Phường/Xã --</option>
                        <option v-for="w in addressState.wards" :key="w.code" :value="w">{{ w.name }}</option>
                        </select>
                    </div>

                    <div class="address-input-group">
                        <input v-model="addressState.street" type="text" required placeholder="Số nhà, tên đường..." />
                        <button type="button" class="btn-location" @click="getGeoLocation" title="Lấy vị trí hiện tại để tính ship">
                            <i class="fa-solid fa-location-crosshairs"></i>
                        </button>
                    </div>
                    <div class="address-edit-actions">
                        <button type="button" class="btn-confirm-addr" @click="confirmAddressChange">Xác nhận</button>
                        <button type="button" class="btn-cancel-addr" @click="isChangingAddress = false">Hủy</button>
                    </div>
                </div>

                <div v-else class="location-selected-box">
                    <p class="location-text"><i class="fa-solid fa-location-dot"></i> Đã chọn vị trí hiện tại</p>
                    <div class="map-container">
                        <iframe
                            :src="mapEmbedUrl"
                            width="100%"
                            height="200"
                            style="border:0;"
                            allowfullscreen=""
                            loading="lazy"></iframe>
                    </div>
                    <small class="location-coords">{{ form.address }}</small>
                    <button type="button" class="btn-reset-location" @click="resetLocation">
                        Nhập địa chỉ thủ công
                    </button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Ghi chú</label>
              <textarea v-model="form.note" placeholder="Ghi chú về đơn hàng (tùy chọn)"></textarea>
            </div>
          </form>

          <!-- Phương thức vận chuyển -->
          <div class="shipping-section">
            <h2><i class="fa-solid fa-truck-fast"></i> Phương thức vận chuyển</h2>
            <div class="shipping-options">
              <label class="shipping-option" :class="{ selected: shippingType === 'standard' }">
                <input type="radio" v-model="shippingType" value="standard" hidden>
                <div class="option-icon"><i class="fa-solid fa-truck"></i></div>
                <div class="option-info">
                  <span class="opt-title">Giao hàng tiêu chuẩn</span>
                  <span class="opt-desc">{{ shippingFee.standardEstimatedTime || 'Giao trong 3-5 ngày' }}</span>
                </div>
                <span class="option-price">{{ shippingFee.standardFee === 0 ? 'Miễn phí' : formatPrice(shippingFee.standardFee) + 'đ' }}</span>
              </label>
              <label class="shipping-option" :class="{ selected: shippingType === 'express' }">
                <input type="radio" v-model="shippingType" value="express" hidden>
                <div class="option-icon"><i class="fa-solid fa-bolt"></i></div>
                <div class="option-info">
                  <span class="opt-title">Giao hàng nhanh</span>
                  <span class="opt-desc">{{ shippingFee.expressEstimatedTime || 'Ưu tiên xử lý & giao nhanh' }}</span>
                </div>
                <span class="option-price">{{ shippingFee.expressFee === 0 ? 'Miễn phí' : formatPrice(shippingFee.expressFee) + 'đ' }}</span>
              </label>
            </div>
            <div v-if="shippingFee.message" class="shipping-message">
              <i class="fa-solid fa-info-circle"></i> {{ shippingFee.message }}
              <span v-if="shippingFee.distance > 0"> (Khoảng cách: {{ shippingFee.distance }}km)</span>
            </div>
          </div>

          <!-- Phương thức thanh toán -->
          <div class="payment-section">
            <h2><i class="fa-solid fa-wallet"></i> Phương thức thanh toán</h2>
            <div class="payment-options">
              <label class="payment-option" :class="{ selected: paymentMethod === 'cod' }">
                <input type="radio" v-model="paymentMethod" value="cod" hidden>
                <div class="option-icon cod-icon"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                <div class="option-info">
                  <span class="opt-title">Thanh toán khi nhận hàng (COD)</span>
                  <span class="opt-desc">Thanh toán tiền mặt cho shipper khi nhận hàng.</span>
                </div>
              </label>
              <label class="payment-option" :class="{ selected: paymentMethod === 'vnpay' }">
                <input type="radio" v-model="paymentMethod" value="vnpay" hidden>
                <div class="option-icon vnpay-icon"><i class="fa-solid fa-credit-card"></i></div>
                <div class="option-info">
                  <span class="opt-title">Thanh toán VNPAY</span>
                  <span class="opt-desc">Thanh toán qua ATM/Visa/MasterCard/QR Code.</span>
                </div>
              </label>
              <label class="payment-option" :class="{ selected: paymentMethod === 'momo' }">
                <input type="radio" v-model="paymentMethod" value="momo" hidden>
                <div class="option-icon momo-icon"><i class="fa-solid fa-wallet"></i></div>
                <div class="option-info">
                  <span class="opt-title">Thanh toán MoMo</span>
                  <span class="opt-desc">Thanh toán qua ví điện tử MoMo.</span>
                </div>
              </label>
              <label class="payment-option" :class="{ selected: paymentMethod === 'bank_transfer' }">
                <input type="radio" v-model="paymentMethod" value="bank_transfer" hidden>
                <div class="option-icon bank-icon"><i class="fa-solid fa-building-columns"></i></div>
                <div class="option-info">
                  <span class="opt-title">Chuyển khoản ngân hàng</span>
                  <span class="opt-desc">Chuyển khoản qua STK: 123456789 - Ngân hàng Vietcombank</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Tóm tắt đơn hàng -->
        <div class="order-summary">
          <h2><i class="fa-solid fa-bag-shopping"></i> Đơn hàng của bạn</h2>
          <div class="summary-items">
            <div v-for="item in selectedItems" :key="item._id" class="summary-item">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <div class="item-variant" v-if="item.variant">
                   Size: {{ getSizeName(item.variant.size_id) }} - Màu: {{ getColorName(item.variant.color_id) }}
                </div>
                <span class="item-quantity">x {{ item.quantity }}</span>
                <div v-if="item.vipDiscountPercent > 0" style="color: #ee4d2d; font-size: 0.8rem; margin-top: 2px;">
                  <i class="fa-solid fa-crown"></i> VIP -{{ item.vipDiscountPercent }}%
                </div>
              </div>
              <div style="text-align: right;">
                 <div v-if="item.vipDiscountPercent > 0" style="font-size: 0.85rem; color: #999; text-decoration: line-through;">{{ formatPrice((item.originalPrice || (item.price / (1 - item.vipDiscountPercent/100))) * item.quantity) }}đ</div>
                 <span class="item-price">{{ formatPrice(item.price * item.quantity) }}đ</span>
              </div>
            </div>
          </div>
          
          <div class="summary-totals">
            <div class="row">
              <span>Tạm tính:</span>
              <span>{{ formatPrice(totalAmount) }}đ</span>
            </div>
            <div class="row">
              <span>Phí vận chuyển:</span>
              <span>{{ formatPrice(finalShippingFee) }}đ</span>
            </div>
            <div v-if="discountVoucher" class="row discount">
              <span class="voucher-applied-label">
                Giảm giá ({{ discountVoucher.code }}):
                <button @click="removeDiscountVoucher" class="btn-reset-voucher-inline" title="Bỏ mã"><i class="fa-solid fa-times"></i></button>
              </span>
              <span>-{{ formatPrice(discountVoucher.amount) }}đ</span>
            </div>
            <div v-if="shippingVoucher" class="row discount">
              <span class="voucher-applied-label">
                Phí ship ({{ shippingVoucher.code }}):
                <button @click="removeShippingVoucher" class="btn-reset-voucher-inline" title="Bỏ mã"><i class="fa-solid fa-times"></i></button>
              </span>
              <span>-{{ formatPrice(shippingVoucher.amount) }}đ</span>
            </div>
            <div class="row total">
              <span>Tổng cộng:</span>
              <span>{{ formatPrice(grandTotal) }}đ</span>
            </div>
          </div>

          <!-- Voucher input section -->
          <div class="voucher-section">
            <h3 class="voucher-title">Mã giảm giá</h3>
            <div class="voucher-input-group" :class="{ 'has-error': voucherError }">
              <div class="input-wrapper">
                <input 
                  v-model="voucherInputCode" 
                  type="text" 
                  placeholder="Nhập mã giảm giá / freeship" 
                  @keyup.enter="applyVoucher"
                  :disabled="isApplyingVoucher"
                />
              </div>
              <button 
                @click="applyVoucher" 
                :disabled="!voucherInputCode.trim() || isApplyingVoucher"
                class="btn-apply-voucher"
              >
                {{ isApplyingVoucher ? 'Đang kiểm tra...' : 'Áp dụng' }}
              </button>
            </div>
            <div v-if="voucherError" class="voucher-error">
              <i class="fa-solid fa-exclamation-triangle"></i> {{ voucherError }}
            </div>
          </div>

          <!-- Thông tin thanh toán online -->
          <div v-if="paymentMethod !== 'cod'" class="online-payment-info">
            <p v-if="paymentMethod === 'vnpay'">
              <i class="fa-solid fa-info-circle"></i> Bạn sẽ được chuyển đến cổng thanh toán VNPAY để hoàn tất thanh toán.
            </p>
            <p v-else-if="paymentMethod === 'momo'">
              <i class="fa-solid fa-info-circle"></i> Bạn sẽ được chuyển đến ứng dụng MoMo để thanh toán.
            </p>
            <p v-else-if="paymentMethod === 'bank_transfer'">
              <i class="fa-solid fa-info-circle"></i> Vui lòng chuyển khoản theo thông tin bên dưới và chụp màn hình gửi cho shop.
            </p>
          </div>

          <button class="btn-confirm" @click="submitOrder" :disabled="isProcessing">
            <span v-if="isProcessing">Đang xử lý...</span>
            <span v-else>
              {{ paymentMethod === 'cod' ? 'Đặt hàng' : 'Thanh toán ngay' }}
            </span>
          </button>
        </div>
      </div>
    </div>
    <AppFooter />

    <!-- Modal QR Code Thanh toán -->
    <div v-if="showPaymentModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Thanh toán đơn hàng</h3>
        <p>Vui lòng quét mã QR bên dưới để thanh toán</p>
        
        <div class="qr-container">
          <img :src="paymentQrUrl" alt="Mã QR Thanh toán" />
        </div>
        
        <div class="payment-details">
            <p><strong>Số tiền:</strong> <span class="price">{{ formatPrice(paymentAmount) }}đ</span></p>
            <p><strong>Nội dung:</strong> {{ paymentContent }}</p>
        </div>

        <p class="note-warning"><i class="fa-solid fa-circle-info"></i> Sau khi chuyển khoản thành công, vui lòng bấm nút "Hoàn thành" bên dưới.</p>

        <div class="modal-actions">
          <button class="btn-back" @click="cancelPayment">
            <i class="fa-solid fa-arrow-left"></i> Trở lại
          </button>
          <button class="btn-complete" @click="finishPayment">
            <i class="fa-solid fa-check"></i> Hoàn thành
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, reactive, ref, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { cartStore } from "@/utils/cart";
import OrderService from "@/services/orders.service";
import PaymentService from "@/services/payment.service";
import SizesService from "@/services/sizes.service";
import ColorsService from "@/services/colors.service";
import { showToast } from "@/utils/toast";
import { jwtDecode } from "jwt-decode";
import CustomerService from "@/services/customer.service";
import VoucherService from "@/services/vouchers.service";

export default {
  components: { AppHeader, AppFooter },
  setup() {
    const router = useRouter();
    const form = reactive({ name: "", phone: "", address: "", note: "" });
    const isProcessing = ref(false);
    const sizes = ref([]);
    const colors = ref([]);
    const paymentMethod = ref("cod");
    const shippingType = ref("standard");
    const shippingFee = ref({
        standardFee: 30000,
        expressFee: 50000,
        isFreeShipping: false,
        message: "",
        standardEstimatedTime: "3-5 ngày",
        expressEstimatedTime: "1-2 ngày"
    });
    
    const showPaymentModal = ref(false);
    const paymentQrUrl = ref("");
    const paymentContent = ref("");
    const createdOrderId = ref(null);
    const paymentAmount = ref(0);
    const userLocation = ref({ lat: null, lng: null });
    const isCalculatingShip = ref(false);
    const isChangingAddress = ref(true);
    
    // State cho việc chọn địa chỉ
    const addressState = reactive({
        provinces: [],
        districts: [],
        wards: [],
        selectedProvince: null,
        selectedDistrict: null,
        selectedWard: null,
        street: ""
    });

    // Lấy các item đã chọn từ giỏ hàng
    const selectedItems = computed(() => cartStore.state.items.filter(item => item.selected));
    
    const totalAmount = computed(() => {
      return selectedItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
    });

    // Calculate shipping fee based on subtotal and shipping type
    const calculateShippingFee = async () => {
        const subtotal = totalAmount.value;
        isCalculatingShip.value = true;
        
        // Lấy tên tỉnh thành nếu đang chọn từ dropdown
        let provinceName = addressState.selectedProvince ? addressState.selectedProvince.name : '';
        let districtName = addressState.selectedDistrict ? addressState.selectedDistrict.name : '';
        let wardName = addressState.selectedWard ? addressState.selectedWard.name : '';
        let streetName = addressState.street || '';
        
        // Luôn gửi địa chỉ đầy đủ (nếu có) để backend xử lý
        // Backend sẽ ưu tiên các trường tỉnh/huyện/xã riêng lẻ nếu có,
        // sau đó mới fallback về parse chuỗi địa chỉ đầy đủ.
        const fullAddress = form.address || '';

        try {
            // Gọi API tính phí ship từ backend (truyền thêm tọa độ nếu có)
            // Frontend gửi đầy đủ: lat, lng, province, district, ward, street, và address (chuỗi đầy đủ)
            const res = await PaymentService.getShippingFee(
                subtotal, 
                shippingType.value, 
                userLocation.value.lat, 
                userLocation.value.lng,
                provinceName,
                districtName,
                wardName,
                streetName,
                fullAddress
            );
            
            // Cập nhật phí ship từ phản hồi của server
            shippingFee.value = res.shipping_fee;
            // Backend trả về object shipping_fee đầy đủ
        } catch (error) {
            console.error("Lỗi tính phí ship:", error);
        } finally {
            isCalculatingShip.value = false;
        }
    };

    // Final shipping fee based on selected shipping type
    const finalShippingFee = computed(() => {
        return shippingType.value === 'express' ? shippingFee.value.expressFee : shippingFee.value.standardFee;
    });
    
    // Nếu backend trả về shippingFee dạng đơn (không chia standard/express), ta xử lý ở đây
    // Tuy nhiên, để đơn giản, ta giả định backend trả về đúng format hoặc ta dùng giá trị trả về làm standardFee

    // --- VOUCHER REFACTOR ---
    const voucherInputCode = ref(''); // The v-model for the input field
    const discountVoucher = ref(null); // Stores applied discount voucher { id, code, amount }
    const shippingVoucher = ref(null); // Stores applied shipping voucher { id, code, amount }
    const isApplyingVoucher = ref(false);
    const voucherError = ref('');

    // Total discount from all vouchers
    const totalDiscount = computed(() => {
        const dAmount = discountVoucher.value ? discountVoucher.value.amount : 0;
        const sAmount = shippingVoucher.value ? shippingVoucher.value.amount : 0;
        return dAmount + sAmount;
    });

    // Grand total
    const grandTotal = computed(() => {
        // Nếu shippingFee từ API trả về dạng số trực tiếp (khi đã có tọa độ)
        const fee = (typeof shippingFee.value.shippingFee === 'number') 
            ? shippingFee.value.shippingFee 
            : (shippingType.value === 'express' ? shippingFee.value.expressFee : shippingFee.value.standardFee);
            
        return totalAmount.value + (fee || 0) - totalDiscount.value;
    });

    // Apply voucher
    const applyVoucher = async () => {
        if (!voucherInputCode.value.trim()) {
            voucherError.value = 'Vui lòng nhập mã voucher';
            return;
        }

        isApplyingVoucher.value = true;
        voucherError.value = '';
        try {
            // Truyền thêm finalShippingFee để xử lý voucher freeship
            const result = await VoucherService.validateVoucher(voucherInputCode.value, totalAmount.value, finalShippingFee.value);
            
            const newVoucher = {
                id: result.voucher_id,
                code: result.code,
                amount: result.discount_amount,
            };

            if (result.discount_type === 'shipping') {
                shippingVoucher.value = newVoucher;
            } else { // 'fixed' or 'percent'
                discountVoucher.value = newVoucher;
            }

            showToast(result.message, 'success');
            voucherInputCode.value = ''; // Clear input on success
        } catch (error) {
            voucherError.value = error.response?.data?.message || 'Mã voucher không hợp lệ';
        } finally {
            isApplyingVoucher.value = false;
        }
    };

    const removeDiscountVoucher = () => { discountVoucher.value = null; };
    const removeShippingVoucher = () => { shippingVoucher.value = null; };
    // --- END VOUCHER REFACTOR ---

    // Watch for shipping type changes to recalculate
    watch(shippingType, () => {
        calculateShippingFee();
    });
    
    // Watch for address changes to recalculate shipping fee
    watch(
        () => [
            addressState.selectedProvince,
            addressState.selectedDistrict,
            addressState.selectedWard,
            addressState.street
        ],
        () => {
            // Only recalculate if all address parts are filled
            if (addressState.selectedProvince && 
                addressState.selectedDistrict && 
                addressState.selectedWard && 
                addressState.street) {
                calculateShippingFee();
            }
        }
    );
    
    // Khi người dùng thay đổi Tỉnh/Huyện/Xã, tính lại phí ship
    // Điều này quan trọng để áp dụng quy tắc miễn phí ship cho Cần Thơ
    // watch is removed to calculate fee only on confirm.
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

    // Hàm lấy danh sách Tỉnh/Thành
    const fetchProvinces = async () => {
        try {
            const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
            addressState.provinces = await res.json();
        } catch (e) { console.error("Lỗi tải tỉnh thành:", e); }
    };

    // Hàm lấy Quận/Huyện khi chọn Tỉnh
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

    // Hàm lấy Phường/Xã khi chọn Quận
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

    // Cập nhật chuỗi địa chỉ đầy đủ vào form.address
    const updateFullAddress = () => {
        const parts = [];
        if (addressState.street) parts.push(addressState.street);
        if (addressState.selectedWard) parts.push(addressState.selectedWard.name);
        if (addressState.selectedDistrict) parts.push(addressState.selectedDistrict.name);
        if (addressState.selectedProvince) parts.push(addressState.selectedProvince.name);
        
        form.address = parts.join(", ");
    };

    const confirmAddressChange = () => {
        const parts = [];
        if (addressState.street) parts.push(addressState.street);
        if (addressState.selectedWard) parts.push(addressState.selectedWard.name);
        if (addressState.selectedDistrict) parts.push(addressState.selectedDistrict.name);
        if (addressState.selectedProvince) parts.push(addressState.selectedProvince.name);
        
        const newAddress = parts.join(", ");

        if (!addressState.selectedProvince || !addressState.selectedDistrict || !addressState.selectedWard || !addressState.street) {
            showToast("Vui lòng điền đầy đủ Tỉnh/Huyện/Xã và số nhà.", "warning");
            return;
        }

        form.address = newAddress;
        isChangingAddress.value = false;
        calculateShippingFee(); // Tính lại phí ship sau khi xác nhận
        showToast("Đã cập nhật địa chỉ.", "success");
    };

    const mapEmbedUrl = computed(() => {
        if (userLocation.value.lat && userLocation.value.lng) {
            return `https://maps.google.com/maps?q=${userLocation.value.lat},${userLocation.value.lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
        }
        return "";
    });

    const resetLocation = () => {
        userLocation.value = { lat: null, lng: null };
        form.address = "";
        addressState.street = "";
        showToast("Đã chuyển sang chế độ nhập địa chỉ thủ công.", "info");
        calculateShippingFee();
    };

    onMounted(async () => {
        if (selectedItems.value.length === 0) {
            showToast("Vui lòng chọn sản phẩm để thanh toán", "warning");
            router.push("/cart");
            return;
        }
        
        await fetchProvinces();
        await loadMetadata();

        // Cập nhật giá VIP mới nhất cho các sản phẩm trong giỏ
        const token = localStorage.getItem("user_token");
        if (token) {
        try {
            const loyalty = await CustomerService.getLoyalty();
            if (loyalty && loyalty.discountPercent > 0) {
                const discount = loyalty.discountPercent / 100;
                cartStore.state.items.forEach(item => {
                     // Nếu item chưa có trường originalPrice (do thêm từ trước), gán nó bằng giá hiện tại
                     if (!item.originalPrice) item.originalPrice = item.price;
                     
                     // Tính lại giá VIP
                     item.vipDiscountPercent = loyalty.discountPercent;
                     item.vipPrice = Math.round(item.originalPrice * (1 - discount));
                     item.price = item.vipPrice; // Cập nhật giá bán thực tế để tính tổng tiền
                });
                // Lưu cập nhật vào localStorage
                if (cartStore.save) cartStore.save();
            }
        } catch (e) {
             console.log("Không thể cập nhật giá VIP (Chưa đăng nhập hoặc lỗi mạng)");
        }
        }
        
        // Tự động điền thông tin từ hồ sơ người dùng
        try {
            const user = await CustomerService.getProfile();
            if (user) {
                form.name = `${user.last_name || ''} ${user.first_name || ''}`.trim();
                form.phone = user.phone || "";
                // Nếu có địa chỉ cũ, điền vào ô đường/số nhà (vì khó phân tách ngược lại)
                if (user.address) {
                    form.address = user.address;
                    isChangingAddress.value = false;
                }
            }
        } catch (error) {
            console.log("Không tải được thông tin profile:", error);
            // Fallback: Điền sẵn tên người dùng từ localStorage nếu có
            const userName = localStorage.getItem("user_name");
            if (userName) form.name = userName;
        }

        // Tính phí ship sau khi đã có thông tin địa chỉ từ profile
        await calculateShippingFee();
    });

    // Hàm lấy vị trí
    const getGeoLocation = () => {
        if (!navigator.geolocation) {
            showToast("Trình duyệt của bạn không hỗ trợ định vị.", "error");
            return;
        }
        showToast("Đang lấy vị trí...", "info");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation.value.lat = position.coords.latitude;
                userLocation.value.lng = position.coords.longitude;
                form.address = `[Tọa độ: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}]`;
                
                // Cập nhật UI
                // Xóa các trường địa chỉ hành chính để tránh nhầm lẫn
                addressState.street = "";
                addressState.selectedProvince = null;
                addressState.selectedDistrict = null;
                addressState.selectedWard = null;

                showToast("Đã lấy vị trí thành công! Phí ship sẽ được tính lại.", "success");
                calculateShippingFee(); // Tính lại phí ship
            },
            (error) => {
                showToast("Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập.", "error");
            }
        );
    };

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
            const customerId = decoded.userId || decoded.id || decoded._id;

            if (!customerId) {
                throw new Error("Lỗi xác thực người dùng. Vui lòng đăng nhập lại.");
            }

            // Lưu lại tổng tiền trước khi xóa giỏ hàng (vì xóa giỏ hàng sẽ làm grandTotal thay đổi về 0 hoặc phí ship)
            const finalAmount = grandTotal.value;
            paymentAmount.value = finalAmount;

            const orderData = {
                customer_id: customerId,
                employee_id: null,
                name: form.name,
                phone: form.phone,
                address: form.address,
                note: form.note,
                payment_method: paymentMethod.value,
                shipping_type: shippingType.value,
                // Gửi đúng key mà Backend OrderService yêu cầu
                discount_voucher_code: discountVoucher.value ? discountVoucher.value.code : undefined,
                shipping_voucher_code: shippingVoucher.value ? shippingVoucher.value.code : undefined,
                // Sử dụng phí ship đã tính toán (ưu tiên phí từ API)
                shipping_fee: (typeof shippingFee.value.shippingFee === 'number') 
                    ? shippingFee.value.shippingFee 
                    : finalShippingFee.value,
                subtotal: totalAmount.value,
                items: selectedItems.value.map(item => ({
                    product_id: item._id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    variant_size_id: item.variant?.size_id || undefined,
                    variant_color_id: item.variant?.color_id || undefined
                })),
                // For COD, payment status is pending; for online, it's unpaid until callback
                payment_status: paymentMethod.value === 'cod' ? 'pending' : 'unpaid'
            };

            console.log("Dữ liệu gửi đi:", orderData);
            
            const result = await OrderService.create(orderData);
            console.log("Kết quả tạo đơn:", result);
            const orderId = result.insertedId || result._id;
            createdOrderId.value = orderId;

            // Handle different payment methods
            if (paymentMethod.value === 'vnpay') {
                // Create VNPAY payment URL
                try {
                    // Xóa giỏ hàng trước khi chuyển hướng
                    selectedItems.value.forEach(item => cartStore.removeFromCart(item._id));
                    const paymentResult = await PaymentService.createVnpayPayment(orderId);
                    if (paymentResult.paymentUrl) {
                        // Redirect to VNPAY
                        window.location.href = paymentResult.paymentUrl;
                        return;
                    }
                } catch (payError) {
                    console.error("Payment error:", payError);
                    showToast("Đơn hàng đã tạo nhưng không thể chuyển đến thanh toán. Vui lòng vào lịch sử đơn hàng để thanh toán.", "warning");
                }
            } else if (paymentMethod.value === 'momo') {
                try {
                    // Xóa giỏ hàng trước khi chuyển hướng
                    selectedItems.value.forEach(item => cartStore.removeFromCart(item._id));
                    const paymentResult = await PaymentService.createMomoPayment(orderId);
                    if (paymentResult.paymentUrl) {
                        window.location.href = paymentResult.paymentUrl;
                        return;
                    }
                } catch (payError) {
                    console.error("Payment error:", payError);
                    showToast("Không thể kết nối đến cổng thanh toán MoMo.", "error");
                }
            } else if (paymentMethod.value === 'bank_transfer') {
                paymentContent.value = `TT DON ${orderId.slice(-6).toUpperCase()}`;
                // Tạo mã VietQR (Vietcombank - 123456789)
                paymentQrUrl.value = `https://img.vietqr.io/image/VCB-123456789-compact.png?amount=${finalAmount}&addInfo=${encodeURIComponent(paymentContent.value)}`;
                showPaymentModal.value = true;
                return;
            } else {
                // COD hoặc phương thức khác không cần modal
                // Xóa giỏ hàng và chuyển hướng
                selectedItems.value.forEach(item => cartStore.removeFromCart(item._id));
                showToast("Đặt hàng thành công!", "success");
                router.push("/orders");
            }
            
        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            if (error.response) {
                console.error("Chi tiết lỗi từ server:", error.response.data);
            }
            const msg = error.response?.data?.message || "Đặt hàng thất bại. Vui lòng kiểm tra lại số lượng tồn kho.";
            showToast(msg, "error");
        } finally {
            isProcessing.value = false;
        }
    };

    const finishPayment = async () => {
        // Cập nhật trạng thái thanh toán thành 'paid' (Giả lập đã nhận tiền sau khi quét QR)
        if (createdOrderId.value) {
            try {
                await OrderService.update(createdOrderId.value, { payment_status: 'paid' });
            } catch (error) {
                console.error("Lỗi cập nhật trạng thái thanh toán:", error);
            }
        }
        // Xác nhận thanh toán xong -> Xóa giỏ hàng
        selectedItems.value.forEach(item => cartStore.removeFromCart(item._id));
        showPaymentModal.value = false;
        showToast("Thanh toán thành công! Đơn hàng đã được xác nhận.", "success");
        router.push("/orders");
    };

    const cancelPayment = async () => {
        if (createdOrderId.value) {
            try {
                // Nếu khách hàng bấm trở lại nghĩa là không muốn mua nữa -> Hủy đơn để hoàn kho
                await OrderService.update(createdOrderId.value, { status: 'cancelled' });
                showToast("Đã hủy đơn hàng.", "info");
            } catch (error) {
                console.error("Lỗi hủy đơn:", error);
            }
        }
        showPaymentModal.value = false;
        // Không redirect về trang chủ nữa, ở lại trang checkout để khách chọn lại
    };

    return {
        form, 
        selectedItems, 
        totalAmount,
        shippingFee,
        shippingType,
        finalShippingFee,
        totalDiscount,
        grandTotal,
        voucherInputCode,
        discountVoucher,
        shippingVoucher,
        voucherError,
        isApplyingVoucher,
        applyVoucher,
        isProcessing,
        paymentMethod,
        formatPrice, 
        submitOrder, 
        getSizeName, 
        getColorName,
        showPaymentModal,
        paymentQrUrl,
        paymentContent,
        finishPayment,
        paymentAmount,
        cancelPayment,
        getGeoLocation,
        addressState,
        fetchDistricts,
        fetchWards,
        updateFullAddress,
        isChangingAddress,
        confirmAddressChange,
        resetLocation,
        userLocation,
        mapEmbedUrl,
        removeDiscountVoucher,
        removeShippingVoucher,
    };
  }
};
</script>

<style scoped>
.checkout-page-wrapper { display: flex; flex-direction: column; min-height: 100vh; background: #f9f9f9; }
.container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; }
.page-title { text-align: center; margin-bottom: 40px; color: #2c3e50; font-size: 2rem; font-weight: 800; text-transform: uppercase; position: relative; }
.page-title::after { content: ''; display: block; width: 60px; height: 4px; background: #ee4d2d; margin: 10px auto 0; border-radius: 2px; }
.checkout-content { display: flex; gap: 30px; flex-wrap: wrap; }
.shipping-info { flex: 2; min-width: 300px; background: white; padding: 35px; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #f5f5f5; }
.order-summary { flex: 1; min-width: 300px; background: white; padding: 35px; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #f5f5f5; height: fit-content; }
h2 { margin-top: 0; margin-bottom: 25px; color: #2c3e50; font-size: 1.3rem; font-weight: 700; border-bottom: 2px solid #f0f0f0; padding-bottom: 12px; display: flex; align-items: center; gap: 10px; }
h2 i { color: #ee4d2d; font-size: 1.4rem; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #555; }
.required { color: red; }
.form-group input, .form-group textarea { width: 100%; padding: 10px 15px; border: 1px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; transition: all 0.3s ease; background-color: #fafafa; }
.form-group input:focus, .form-group textarea:focus { border-color: #302b63; background-color: #fff; box-shadow: 0 0 0 3px rgba(48, 43, 99, 0.1); outline: none; }
.current-address-box { background: #f8f9fa; padding: 12px; border: 1px solid #ddd; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
.current-address-box span { font-weight: 500; color: #2c3e50; }
.btn-change-addr { background: #302b63; color: white; border: none; padding: 6px 15px; border-radius: 20px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: background 0.3s; }
.btn-change-addr:hover { background: #1a1639; }
.address-edit-container { animation: fadeIn 0.3s; }
.address-selection { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.voucher-input-group { position: relative; display: flex; gap: 10px; align-items: stretch; margin-bottom: 5px;}
.input-wrapper { position: relative; flex: 1; display: flex; align-items: center; }
.input-wrapper input { width: 100%; padding-right: 35px; }
.address-selection select { flex: 1; min-width: 150px; padding: 10px 15px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; transition: all 0.3s ease;}
.address-selection select:focus { border-color: #302b63; background-color: #fff; box-shadow: 0 0 0 3px rgba(48, 43, 99, 0.1); outline: none; }
.address-input-group { display: flex; gap: 10px; }
.btn-location { padding: 0 15px; background: #302b63; color: white; border: none; border-radius: 8px; cursor: pointer; transition: 0.3s; }
.btn-location:hover { background: #1a1639; }
.location-success { color: #27ae60; font-size: 0.85rem; margin-top: 5px; display: block; }
.location-selected-box { text-align: center; padding: 15px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px; }
.location-text { color: #2e7d32; font-weight: bold; margin: 0 0 5px 0; }
.location-coords { display: block; color: #555; margin-bottom: 10px; }
.btn-reset-location { background: #fff; border: 1px solid #2e7d32; color: #2e7d32; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
.btn-reset-location:hover { background: #2e7d32; color: white; }
.address-edit-actions { display: flex; gap: 10px; margin-top: 15px; }
.address-edit-actions button { flex: 1; padding: 8px; border-radius: 4px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-confirm-addr { background: #28a745; color: white; border: 1px solid #28a745; }
.btn-confirm-addr:hover { background: #218838; }
.btn-cancel-addr { background: white; color: #555; border: 1px solid #ddd; }
.btn-cancel-addr:hover { background: #f1f1f1; }
.map-container {
    margin: 15px 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ddd;
}

.form-group textarea { height: 100px; resize: vertical; }
.summary-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #eee; }
.item-info { display: flex; flex-direction: column; flex: 1; padding-right: 15px; }
.item-name { font-weight: 600; color: #2c3e50; line-height: 1.4; }
.item-variant { font-size: 0.85rem; color: #777; margin-top: 2px; }
.item-quantity { font-size: 0.85rem; color: #777; }
.item-price { font-weight: bold; color: #333; }
.summary-totals { margin-top: 20px; }
.row { display: flex; justify-content: space-between; margin-bottom: 10px; color: #555; font-size: 1.05rem; }
.row.discount { color: #28a745; }
.row.total { font-weight: 800; color: #ee4d2d; font-size: 1.4rem; margin-top: 15px; border-top: 2px solid #eee; padding-top: 15px; }
.btn-confirm { width: 100%; padding: 16px; background: linear-gradient(135deg, #ee4d2d, #ff7337); color: white; border: none; border-radius: 30px; font-weight: 800; font-size: 1.2rem; cursor: pointer; margin-top: 30px; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(238, 77, 45, 0.3); }
.btn-confirm:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(238, 77, 45, 0.4); }
.btn-confirm:disabled { background: #e0e0e0; color: #999; box-shadow: none; cursor: not-allowed; transform: none; }

.shipping-section, .payment-section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }

/* Vận chuyển (Dạng List) */
.shipping-options { display: flex; flex-direction: column; gap: 12px; }
.shipping-option { display: flex; align-items: center; padding: 15px 20px; border: 2px solid #eee; border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); background: white; margin-bottom: 0; }
.shipping-option:hover { border-color: #d1d5db; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
.shipping-option.selected { border-color: #ee4d2d; background: #fff5f1; box-shadow: 0 4px 15px rgba(238, 77, 45, 0.1); }
.shipping-option .option-icon { font-size: 1.8rem; color: #9ca3af; margin-right: 20px; width: 40px; text-align: center; transition: color 0.3s; }
.shipping-option.selected .option-icon { color: #ee4d2d; }
.shipping-option .option-info { display: flex; flex-direction: column; flex: 1; }

/* Thanh toán (Dạng Grid Card) */
.payment-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; }
.payment-option { display: flex; flex-direction: column; align-items: flex-start; padding: 20px; border: 2px solid #eee; border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); background: white; position: relative; height: 100%; box-sizing: border-box; }
.payment-option:hover { border-color: #d1d5db; transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,0.05); }
.payment-option.selected { border-color: #ee4d2d; background: #fff5f1; box-shadow: 0 4px 15px rgba(238, 77, 45, 0.1); }
/* Dấu check góc trên bên phải */
.payment-option::after { content: '\f058'; font-family: "Font Awesome 6 Free"; font-weight: 900; position: absolute; top: 15px; right: 15px; font-size: 1.5rem; color: #ee4d2d; opacity: 0; transform: scale(0.5); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.payment-option.selected::after { opacity: 1; transform: scale(1); }
.payment-option .option-icon { font-size: 2.2rem; margin-bottom: 15px; text-align: left; transition: transform 0.3s; }
.payment-option.selected .option-icon { transform: scale(1.1); }
/* Màu sắc thương hiệu cho từng loại ví/ngân hàng */
.cod-icon { color: #27ae60; }
.vnpay-icon { color: #005baa; }
.momo-icon { color: #a50064; }
.bank-icon { color: #2980b9; }
.payment-option .option-info { display: flex; flex-direction: column; }
.payment-option .opt-title { font-weight: 700; color: #2c3e50; margin-bottom: 5px; font-size: 1.05rem; }
.payment-option .opt-desc { font-size: 0.85rem; color: #7f8c8d; line-height: 1.4; }

/* Dùng chung */
.opt-title { font-weight: bold; color: #333; }
.opt-desc { font-size: 0.85rem; color: #777; margin-top: 3px; }
.option-price { font-weight: bold; color: #e74c3c; }
.shipping-message { margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 4px; font-size: 0.9rem; color: #856404; }
.shipping-message i { margin-right: 5px; }

.online-payment-info { margin-top: 15px; padding: 15px; background: #e7f3ff; border-radius: 6px; }
.online-payment-info p { margin: 0; color: #0056b3; font-size: 0.9rem; }
.online-payment-info i { margin-right: 5px; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: slideIn 0.3s ease; }
@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-content h3 { margin-top: 0; color: #2c3e50; }
.qr-container img { max-width: 100%; height: auto; margin: 15px 0; border: 1px solid #eee; border-radius: 8px; }
.payment-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: left; }
.payment-details p { margin: 5px 0; color: #555; }
.payment-details .price { color: #e74c3c; font-weight: bold; font-size: 1.1rem; }
.note-warning { font-size: 0.85rem; color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-actions button { flex: 1; padding: 12px; border: none; border-radius: 6px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: 0.2s; }
.btn-back { background: #6c757d; color: white; }
.btn-back:hover { background: #5a6268; }
.btn-complete { background: #28a745; color: white; }
.btn-complete:hover { background: #218838; }

/* Voucher Section Redesign */
.voucher-section {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #eee;
}
.voucher-title {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}
.btn-apply-voucher {
  padding: 0 20px;
  border: none;
  background: #3498db;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
  height: 42px; /* Match input height */
}
.btn-apply-voucher:hover:not(:disabled) { background: #1a1639; }
.btn-apply-voucher:disabled { background: #bdc3c7; cursor: not-allowed; }
.voucher-error { margin-top: 8px; color: #e74c3c; font-weight: 500; font-size: 0.9rem; }
.voucher-input-group.has-error .input-wrapper input {
  border-color: #e74c3c;
  animation: shake 0.4s;
}
.voucher-applied-label { display: flex; align-items: center; gap: 8px; }
.btn-reset-voucher-inline { background: none; border: none; color: #e74c3c; cursor: pointer; padding: 0; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; transition: background 0.2s; }
.btn-reset-voucher-inline:hover { background: #fbe9e7; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* Override for checkout page */
.form-group input, .address-selection select {
    height: 48px;
}
.form-group textarea {
    height: 100px;
}
.btn-apply-voucher {
    height: 48px;
}
.address-input-group input {
    height: 48px;
}
</style>
