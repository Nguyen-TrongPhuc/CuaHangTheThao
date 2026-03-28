<template>
  <div class="checkout-page-wrapper">
    <AppHeader />
    <div class="container">
      <h1 class="page-title">Thanh toán</h1>
      
      <div class="checkout-content">
        <!-- Form thông tin giao hàng -->
        <div class="shipping-info">
          <h2 style="display:flex;align-items:center;gap:10px;"><MapPin color="#ee4d2d" :size="24" /> Thông tin giao hàng</h2>
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
                            <LocateFixed :size="18" />
                        </button>
                    </div>
                    <div class="address-edit-actions">
                        <button type="button" class="btn-confirm-addr" @click="confirmAddressChange">Xác nhận</button>
                        <button type="button" class="btn-cancel-addr" @click="isChangingAddress = false">Hủy</button>
                    </div>
                </div>

                <div v-else class="location-selected-box">
                    <p class="location-text" style="display:flex;align-items:center;justify-content:center;gap:5px;"><MapPin :size="18" /> Đã chọn vị trí hiện tại</p>
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
            <h2 style="display:flex;align-items:center;gap:10px;"><Truck color="#ee4d2d" :size="24" /> Phương thức vận chuyển</h2>
            <div class="shipping-options">
              <label class="shipping-option" :class="{ selected: shippingType === 'standard' }">
                <input type="radio" v-model="shippingType" value="standard" hidden>
                <div class="option-icon"><Truck :size="32" /></div>
                <div class="option-info">
                  <span class="opt-title">Giao hàng tiêu chuẩn</span>
                  <span class="opt-desc">{{ shippingFee.standardEstimatedTime || 'Giao trong 3-5 ngày' }}</span>
                </div>
                <span class="option-price">{{ shippingFee.standardFee === 0 ? 'Miễn phí' : formatPrice(shippingFee.standardFee) + 'đ' }}</span>
              </label>
              <label class="shipping-option" :class="{ selected: shippingType === 'express' }">
                <input type="radio" v-model="shippingType" value="express" hidden>
                <div class="option-icon"><Zap :size="32" /></div>
                <div class="option-info">
                  <span class="opt-title">Giao hàng nhanh</span>
                  <span class="opt-desc">{{ shippingFee.expressEstimatedTime || 'Ưu tiên xử lý & giao nhanh' }}</span>
                </div>
                <span class="option-price">{{ shippingFee.expressFee === 0 ? 'Miễn phí' : formatPrice(shippingFee.expressFee) + 'đ' }}</span>
              </label>
            </div>
            <div v-if="shippingFee.message" class="shipping-message">
              <Info :size="16" style="margin-right:5px;vertical-align:text-bottom;"/> {{ shippingFee.message }}
              <span v-if="shippingFee.distance > 0"> (Khoảng cách: {{ shippingFee.distance }}km)</span>
            </div>
          </div>

          <!-- Phương thức thanh toán -->
          <div class="payment-section">
            <h2 style="display:flex;align-items:center;gap:10px;"><Wallet color="#ee4d2d" :size="24" /> Phương thức thanh toán</h2>
            <div class="payment-options">
              <label class="payment-option" :class="{ selected: paymentMethod === 'cod' }">
                <input type="radio" v-model="paymentMethod" value="cod" hidden>
                <div class="option-icon cod-icon"><Banknote :size="32" /></div>
                <div class="option-info">
                  <span class="opt-title">Thanh toán khi nhận hàng (COD)</span>
                  <span class="opt-desc">Thanh toán tiền mặt cho shipper khi nhận hàng.</span>
                </div>
                <CheckCircle2 class="payment-check" />
              </label>
              <label class="payment-option" :class="{ selected: paymentMethod === 'vnpay' }">
                <input type="radio" v-model="paymentMethod" value="vnpay" hidden>
                <div class="option-icon vnpay-icon"><CreditCard :size="32" /></div>
                <div class="option-info">
                  <span class="opt-title">Thanh toán VNPAY</span>
                  <span class="opt-desc">Thanh toán qua ATM/Visa/MasterCard/QR Code.</span>
                </div>
                <CheckCircle2 class="payment-check" />
              </label>
              <label class="payment-option" :class="{ selected: paymentMethod === 'momo' }">
                <input type="radio" v-model="paymentMethod" value="momo" hidden>
                <div class="option-icon momo-icon"><Wallet :size="32" /></div>
                <div class="option-info">
                  <span class="opt-title">Thanh toán MoMo</span>
                  <span class="opt-desc">Thanh toán qua ví điện tử MoMo.</span>
                </div>
                <CheckCircle2 class="payment-check" />
              </label>
            </div>
          </div>
        </div>

        <!-- Tóm tắt đơn hàng -->
        <div class="order-summary">
          <h2 style="display:flex;align-items:center;gap:10px;"><ShoppingBag color="#ee4d2d" :size="24" /> Đơn hàng của bạn</h2>
          <div class="summary-items">
            <div v-for="item in selectedItems" :key="item._id" class="summary-item">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <div class="item-variant" v-if="item.variant">
                   Size: {{ getSizeName(item.variant.size_id) }} - Màu: {{ getColorName(item.variant.color_id) }}
                </div>
                <span class="item-quantity">x {{ item.quantity }}</span>
                <div v-if="item.vipDiscountPercent > 0" style="color: #ee4d2d; font-size: 0.8rem; margin-top: 2px;">
                  <Crown :size="14" style="vertical-align:text-bottom;" /> VIP -{{ item.vipDiscountPercent }}%
                </div>
              </div>
              <div style="text-align: right;">
                 <div v-if="item.vipDiscountPercent > 0" style="font-size: 0.85rem; color: #999; text-decoration: line-through;">{{ formatPrice((item.originalPrice || (item.price / (1 - item.vipDiscountPercent/100))) * item.quantity) }}đ</div>
                 <span class="item-price">{{ formatPrice(item.price * item.quantity) }}đ</span>
              </div>
            </div>
          </div>
          
          <!-- Voucher input section (Modern E-commerce style) -->
          <div class="modern-voucher-section">
            <div class="voucher-header-flex">
              <h3><Ticket color="#ee4d2d" :size="20" style="margin-right: 8px;" /> Khuyến mãi & Voucher</h3>
              <button type="button" class="btn-text-select" @click="openVoucherModal">
                Xem tất cả <ChevronRight :size="16" />
              </button>
            </div>
            
            <!-- Tags cho voucher đã áp dụng -->
            <div class="applied-tags" v-if="discountVoucher || shippingVoucher">
               <div class="v-tag shipping-tag" v-if="shippingVoucher">
                  <span class="tag-icon"><Truck :size="18" /></span>
                  <span class="tag-text">Đã áp dụng mã: <strong>{{ shippingVoucher.code }}</strong></span>
                  <button type="button" class="tag-remove" @click="removeShippingVoucher"><X :size="16" /></button>
               </div>
               <div class="v-tag discount-tag" v-if="discountVoucher">
                  <span class="tag-icon"><Gift :size="18" /></span>
                  <span class="tag-text">Đã áp dụng mã: <strong>{{ discountVoucher.code }}</strong></span>
                  <button type="button" class="tag-remove" @click="removeDiscountVoucher"><X :size="16" /></button>
               </div>
            </div>

            <div class="voucher-input-row" :class="{ 'has-error': voucherError }">
               <input 
                  v-model="voucherInputCode" 
                  type="text" 
                  placeholder="Nhập mã giảm giá / freeship" 
                  @keyup.enter="applyVoucher"
                  :disabled="isApplyingVoucher"
                />
                <button 
                  type="button"
                  @click="applyVoucher" 
                  :disabled="!voucherInputCode.trim() || isApplyingVoucher"
                  class="btn-apply-modern"
                >
                  {{ isApplyingVoucher ? 'Đang xử lý...' : 'Áp dụng' }}
                </button>
            </div>
            <div v-if="voucherError" class="voucher-error-msg">
              <AlertCircle :size="16" style="margin-right:5px;"/> {{ voucherError }}
            </div>
          </div>

          <!-- Thưởng từ ví -->
          <div class="wallet-section" v-if="walletBalance > 0">
            <label class="wallet-checkbox">
              <input type="checkbox" v-model="useWallet" />
              <span>Dùng số dư ví tích lũy: <strong>{{ formatPrice(walletBalance) }}đ</strong></span>
            </label>
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
              <span>Giảm giá ({{ discountVoucher.code }}):</span>
              <span>-{{ formatPrice(discountVoucher.amount) }}đ</span>
            </div>
            <div v-if="shippingVoucher" class="row discount">
              <span>Hỗ trợ phí ship ({{ shippingVoucher.code }}):</span>
              <span>-{{ formatPrice(shippingVoucher.amount) }}đ</span>
            </div>
            <div v-if="useWallet && totalWalletDiscount > 0" class="row discount">
              <span>Trừ số dư ví:</span>
              <span>-{{ formatPrice(totalWalletDiscount) }}đ</span>
            </div>
            <div class="row total">
              <span>Tổng cộng:</span>
              <span>{{ formatPrice(grandTotal) }}đ</span>
            </div>
          </div>

          <!-- Thông tin thanh toán online -->
          <div v-if="paymentMethod !== 'cod'" class="online-payment-info">
            <p v-if="paymentMethod === 'vnpay'">
              <Info :size="16" style="margin-right:5px;vertical-align:text-bottom;"/> Bạn sẽ được chuyển đến cổng thanh toán VNPAY để hoàn tất thanh toán.
            </p>
            <p v-else-if="paymentMethod === 'momo'">
              <Info :size="16" style="margin-right:5px;vertical-align:text-bottom;"/> Bạn sẽ được chuyển đến ứng dụng MoMo để thanh toán.
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

    <!-- Modal Danh sách Voucher khả dụng -->
    <div v-if="showVoucherModal" class="modal-overlay" @click.self="showVoucherModal = false">
      <div class="modal-content voucher-modal-content">
        <div class="modal-header">
          <h3 style="display:flex;align-items:center;"><Tags color="#ee4d2d" :size="24" style="margin-right:10px;"/> Mã khuyến mãi dành cho bạn</h3>
          <button class="close-btn" @click="showVoucherModal = false" title="Đóng">
            <X :size="24" />
          </button>
        </div>
        <div class="modal-body voucher-modal-body">
          <div v-if="isLoadingVouchers" class="loading-state">
            <Loader2 class="lucide-spin" :size="24" style="margin-right:10px;" /> Đang tìm mã...
          </div>
          <div v-else-if="availableVouchers.length === 0" class="empty-state">
            <PackageOpen :size="48" color="#bdc3c7" style="margin-bottom:15px;"/>
            <p>Hiện chưa có mã khuyến mãi nào khả dụng.</p>
          </div>
          <div v-else class="voucher-list-container">
            <div v-if="discountVouchersList.length > 0" class="voucher-category">
              <h4 class="voucher-cat-title" style="display:flex;align-items:center;gap:8px;"><Gift color="#ee4d2d" :size="20" /> Giảm giá đơn hàng</h4>
              <div class="voucher-list">
                <div v-for="v in discountVouchersList" :key="v.code" class="voucher-ticket" :class="{ disabled: totalAmount < v.min_order_value }">
                  <div class="ticket-left" :class="v.discount_type">
                    <Gift :size="32" color="white" />
                  </div>
                  <div class="ticket-right">
                    <h4>{{ v.code }}</h4>
                    <p>{{ v.description || 'Mã giảm giá đơn hàng' }}</p>
                    <div class="ticket-footer">
                      <small :class="{ 'text-danger': totalAmount < v.min_order_value }">Đơn tối thiểu: {{ formatPrice(v.min_order_value) }}đ</small>
                      <button class="btn-use-ticket" :disabled="totalAmount < v.min_order_value" @click="selectVoucherFromList(v.code)">Dùng ngay</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="shippingVouchersList.length > 0" class="voucher-category">
              <h4 class="voucher-cat-title" style="display:flex;align-items:center;gap:8px;"><Truck color="#3498db" :size="20" /> Miễn phí vận chuyển</h4>
              <div class="voucher-list">
                <div v-for="v in shippingVouchersList" :key="v.code" class="voucher-ticket" :class="{ disabled: totalAmount < v.min_order_value }">
                  <div class="ticket-left" :class="v.discount_type">
                    <Truck :size="32" color="white" />
                  </div>
                  <div class="ticket-right">
                    <h4>{{ v.code }}</h4>
                    <p>{{ v.description || 'Mã miễn phí vận chuyển' }}</p>
                    <div class="ticket-footer">
                      <small :class="{ 'text-danger': totalAmount < v.min_order_value }">Đơn tối thiểu: {{ formatPrice(v.min_order_value) }}đ</small>
                      <button class="btn-use-ticket" :disabled="totalAmount < v.min_order_value" @click="selectVoucherFromList(v.code)">Dùng ngay</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, reactive, ref, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
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
import { 
  MapPin, LocateFixed, Truck, Zap, Info, Wallet, Banknote, CreditCard,
  ShoppingBag, Crown, Ticket, ChevronRight, X, Gift, AlertCircle, Check, Tags, Loader2, PackageOpen, CheckCircle2
} from "lucide-vue-next";

export default {
  components: { AppHeader, AppFooter, MapPin, LocateFixed, Truck, Zap, Info, Wallet, Banknote, CreditCard, ShoppingBag, Crown, Ticket, ChevronRight, X, Gift, AlertCircle, Check, Tags, Loader2, PackageOpen, CheckCircle2 },
  setup() {
    const router = useRouter();
    const route = useRoute();
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
    
    const createdOrderId = ref(null);
    const userLocation = ref({ lat: null, lng: null });
    const isCalculatingShip = ref(false);
    const isChangingAddress = ref(true);
    
    const walletBalance = ref(0);
    const useWallet = ref(false);

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
    const selectedItems = computed(() => {
        if (route.query.direct === '1') {
            const directItems = sessionStorage.getItem('checkout_direct');
            if (directItems) return JSON.parse(directItems);
        }
        return cartStore.state.items.filter(item => item.selected);
    });
    
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

    // Quản lý Modal Voucher
    const showVoucherModal = ref(false);
    const availableVouchers = ref([]);
    const isLoadingVouchers = ref(false);

    const openVoucherModal = async () => {
        showVoucherModal.value = true;
        isLoadingVouchers.value = true;
        try {
            const res = await VoucherService.getAvailable();
            availableVouchers.value = Array.isArray(res) ? res : (res.data || []);
        } catch (error) {
            console.error("Lỗi tải danh sách voucher", error);
            availableVouchers.value = [];
        } finally {
            isLoadingVouchers.value = false;
        }
    };

    const shippingVouchersList = computed(() => availableVouchers.value.filter(v => v.discount_type === 'shipping'));
    const discountVouchersList = computed(() => availableVouchers.value.filter(v => v.discount_type !== 'shipping'));

    const selectVoucherFromList = (code) => {
        voucherInputCode.value = code;
        showVoucherModal.value = false;
        applyVoucher();
    };

    // Total discount from all vouchers
    const totalDiscount = computed(() => {
        const dAmount = discountVoucher.value ? discountVoucher.value.amount : 0;
        const sAmount = shippingVoucher.value ? shippingVoucher.value.amount : 0;
        return dAmount + sAmount;
    });

    const totalWalletDiscount = computed(() => {
        if (!useWallet.value) return 0;
        const fee = (typeof shippingFee.value.shippingFee === 'number') 
            ? shippingFee.value.shippingFee 
            : (shippingType.value === 'express' ? shippingFee.value.expressFee : shippingFee.value.standardFee);
        const currentTotal = totalAmount.value + (fee || 0) - totalDiscount.value;
        return Math.min(walletBalance.value, currentTotal);
    });

    // Grand total
    const grandTotal = computed(() => {
        // Nếu shippingFee từ API trả về dạng số trực tiếp (khi đã có tọa độ)
        const fee = (typeof shippingFee.value.shippingFee === 'number') 
            ? shippingFee.value.shippingFee 
            : (shippingType.value === 'express' ? shippingFee.value.expressFee : shippingFee.value.standardFee);
            
        return totalAmount.value + (fee || 0) - totalDiscount.value - totalWalletDiscount.value;
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
                if (route.query.direct === '1') {
                    const items = JSON.parse(sessionStorage.getItem('checkout_direct') || '[]');
                    let updated = false;
                    items.forEach(item => {
                         if (!item.originalPrice) item.originalPrice = item.price;
                         item.vipDiscountPercent = loyalty.discountPercent;
                         item.vipPrice = Math.round(item.originalPrice * (1 - discount));
                         if (item.price !== item.vipPrice) { item.price = item.vipPrice; updated = true; }
                    });
                    if (updated) sessionStorage.setItem('checkout_direct', JSON.stringify(items));
                } else {
                    let updated = false;
                    cartStore.state.items.forEach(item => {
                         if (!item.originalPrice) item.originalPrice = item.price;
                         item.vipDiscountPercent = loyalty.discountPercent;
                         item.vipPrice = Math.round(item.originalPrice * (1 - discount));
                         if (item.price !== item.vipPrice) {
                             item.price = item.vipPrice; 
                             updated = true;
                         }
                    });
                    if (updated && cartStore.save) cartStore.save();
                }
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
                walletBalance.value = user.wallet_balance || 0;
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

            const clearCheckoutItems = () => {
                if (route.query.direct === '1') {
                    sessionStorage.removeItem('checkout_direct');
                } else {
                    const itemIds = selectedItems.value.map(item => item._id);
                    itemIds.forEach(id => cartStore.removeFromCart(id));
                }
            };

            const orderData = {
                customer_id: customerId,
                employee_id: null,
                name: form.name,
                phone: form.phone,
                address: form.address,
                note: form.note,
                use_wallet: useWallet.value,
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
                    clearCheckoutItems();
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
                    clearCheckoutItems();
                    const paymentResult = await PaymentService.createMomoPayment(orderId);
                    if (paymentResult.paymentUrl) {
                        window.location.href = paymentResult.paymentUrl;
                        return;
                    }
                } catch (payError) {
                    console.error("Payment error:", payError);
                    showToast("Không thể kết nối đến cổng thanh toán MoMo.", "error");
                }
            } else {
                // COD hoặc phương thức khác không cần modal
                clearCheckoutItems();
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

    return {
        form, 
        selectedItems, 
        totalAmount,
        shippingFee,
        shippingType,
        finalShippingFee,
        totalDiscount,
        grandTotal,
        walletBalance,
        useWallet,
        totalWalletDiscount,
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
        showVoucherModal,
        availableVouchers,
        shippingVouchersList,
        discountVouchersList,
        isLoadingVouchers,
        openVoucherModal,
        selectVoucherFromList
    };
  }
};
</script>

<style scoped>
.checkout-page-wrapper { display: flex; flex-direction: column; min-height: 100vh; background: #f9f9f9; }
.container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; }
.page-title { text-align: center; margin-bottom: 40px; color: #2c3e50; font-size: 2rem; font-weight: 800; text-transform: uppercase; position: relative; }
.page-title::after { content: ''; display: block; width: 60px; height: 4px; background: #ee4d2d; margin: 10px auto 0; border-radius: 2px; }

.checkout-content { 
  display: flex; gap: 30px; align-items: flex-start; 
  height: calc(100vh - 180px); /* Tách biệt vùng cuộn độc lập so với màn hình */
}

.shipping-info { 
  flex: 2; min-width: 300px; background: white; padding: 35px 25px 35px 35px; 
  border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #f5f5f5; 
  height: 100%; overflow-y: auto; 
}
.shipping-info::-webkit-scrollbar { width: 6px; }
.shipping-info::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
.shipping-info::-webkit-scrollbar-thumb:hover { background: #ee4d2d; }

.order-summary { 
  flex: 1; min-width: 300px; background: white; padding: 35px 25px 35px 35px; 
  border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #f5f5f5; 
  height: 100%; overflow-y: auto; 
}
.order-summary::-webkit-scrollbar { width: 6px; }
.order-summary::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
.order-summary::-webkit-scrollbar-thumb:hover { background: #ee4d2d; }

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

/* Thanh toán (Dạng List) */
.payment-options { display: flex; flex-direction: column; gap: 12px; }
.payment-option { display: flex; flex-direction: row; align-items: center; padding: 15px 20px; border: 2px solid #eee; border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); background: white; }
.payment-option:hover { border-color: #d1d5db; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
.payment-option.selected { border-color: #ee4d2d; background: #fff5f1; box-shadow: 0 4px 15px rgba(238, 77, 45, 0.1); }
.payment-check { margin-left: auto; color: #ee4d2d; opacity: 0; transform: scale(0.5); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.payment-option.selected .payment-check { opacity: 1; transform: scale(1); }
.payment-option .option-icon { font-size: 1.8rem; margin-right: 20px; text-align: center; width: 40px; transition: transform 0.3s; display: flex; align-items: center; justify-content: center; }
.payment-option.selected .option-icon { transform: scale(1.1); }
/* Màu sắc thương hiệu cho từng loại ví/ngân hàng */
.cod-icon { color: #27ae60; }
.vnpay-icon { color: #005baa; }
.momo-icon { color: #a50064; }
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

/* Modern Voucher Section */
.modern-voucher-section {
  margin-top: 20px;
  padding: 20px;
  background: #fffaf9;
  border-radius: 12px;
  border: 1px dashed #ffb4a2;
  box-shadow: 0 4px 10px rgba(238, 77, 45, 0.05);
}

.voucher-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.voucher-header-flex h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.btn-text-select {
  background: none;
  border: none;
  color: #3498db;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s;
}

.btn-text-select:hover {
  color: #1d6fa5;
}

.voucher-input-row {
  display: flex;
  gap: 10px;
  position: relative;
  flex-wrap: wrap;
}

.voucher-input-row input {
  flex: 1;
  min-width: 200px;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-transform: uppercase;
  font-weight: 600;
  color: #333;
  transition: all 0.3s ease;
  background: white;
}

.voucher-input-row input:focus {
  border-color: #ee4d2d;
  background: white;
  box-shadow: 0 0 0 3px rgba(238, 77, 45, 0.1);
  outline: none;
}

.btn-apply-modern {
  padding: 0 25px;
  background: #ee4d2d;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-apply-modern:hover:not(:disabled) {
  background: #d73211;
}

.btn-apply-modern:disabled {
  background: #f0f0f0;
  color: #aaa;
  cursor: not-allowed;
}

.voucher-error-msg {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.voucher-input-row.has-error input {
  border-color: #e74c3c;
  background: #fffafa;
  animation: shake 0.4s;
}

/* Applied Tags */
.applied-tags {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.v-tag {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  flex-wrap: wrap;
}

.v-tag::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.shipping-tag {
  background: #f0f8ff;
  border: 1px solid #cce5ff;
}
.shipping-tag::before { background: #3498db; }
.shipping-tag .tag-icon { color: #3498db; }

.discount-tag {
  background: #fff5f1;
  border: 1px solid #ffd8c4;
}
.discount-tag::before { background: #ee4d2d; }
.discount-tag .tag-icon { color: #ee4d2d; }

.tag-icon {
  font-size: 1.2rem;
  margin-right: 12px;
}

.tag-text {
  flex: 1;
  font-size: 0.95rem;
  color: #333;
  word-break: break-word;
}

.tag-text strong {
  color: #ee4d2d;
  font-size: 1.05rem;
}

.shipping-tag .tag-text strong {
  color: #3498db;
}

.tag-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 5px;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.tag-remove:hover {
  background: rgba(0,0,0,0.05);
  color: #e74c3c;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* Wallet Style */
.wallet-section { margin-top: 15px; padding: 15px; background: #e8f5e9; border-radius: 8px; border: 1px dashed #4caf50; }
.wallet-checkbox { display: flex; align-items: center; cursor: pointer; gap: 10px; font-size: 0.95rem; color: #2e7d32; }
.wallet-checkbox input { width: 18px; height: 18px; cursor: pointer; accent-color: #2e7d32; }

.lucide-spin { animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* Modal Voucher Styles */
.voucher-modal-content { 
  max-width: 550px; 
  padding: 0; 
  background: #f8f9fa; 
  border-radius: 16px;
  overflow: hidden;
}
.voucher-modal-content .modal-header { 
  padding: 20px 25px; 
  background: white; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}
.voucher-modal-content .modal-header h3 { margin: 0; font-size: 1.25rem; color: #2c3e50; font-weight: 700; display: flex; align-items: center; }
.voucher-modal-content .modal-header h3 i { color: #ee4d2d; margin-right: 10px; font-size: 1.4rem; }
.voucher-modal-content .close-btn {
  background: #f1f3f5; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.2rem;
  color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease; position: static;
}
.voucher-modal-content .close-btn:hover {
  background: #fee2e2; color: #e74c3c; transform: rotate(90deg);
}
.voucher-modal-body { padding: 25px; max-height: 65vh; overflow-y: auto; }
.voucher-list-container { display: flex; flex-direction: column; }
.voucher-category { margin-bottom: 25px; }
.voucher-category:last-child { margin-bottom: 0; }
.voucher-cat-title { font-size: 1rem; color: #2c3e50; margin-top: 0; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; font-weight: 700; border-bottom: 1px dashed #ddd; padding-bottom: 8px; }
.voucher-cat-title i { color: #ee4d2d; }
.voucher-list { display: flex; flex-direction: column; gap: 15px; }
.voucher-ticket { display: flex; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; position: relative; transition: all 0.3s ease; }
.voucher-ticket:hover:not(.disabled) { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(238, 77, 45, 0.15); border-color: #ffe8e0; }
.voucher-ticket.disabled { opacity: 0.6; filter: grayscale(100%); }
.ticket-left { width: 80px; display: flex; align-items: center; justify-content: center; border-right: 2px dashed #eee; color: white; font-size: 2rem; position: relative; }
.ticket-left.fixed, .ticket-left.percent { background: linear-gradient(135deg, #ff7337, #ee4d2d); }
.ticket-left.shipping { background: linear-gradient(135deg, #00c6ff, #0072ff); }
/* Tạo hiệu ứng rãnh xé vé */
.ticket-left::before, .ticket-left::after { content: ''; position: absolute; width: 20px; height: 20px; background: #f5f7fa; border-radius: 50%; right: -11px; z-index: 1; }
.ticket-left::before { top: -10px; }
.ticket-left::after { bottom: -10px; }
.ticket-right { flex: 1; padding: 15px; display: flex; flex-direction: column; overflow: hidden; }
.ticket-right h4 { margin: 0 0 5px 0; color: #2c3e50; font-size: 1.1rem; }
.ticket-right p { margin: 0 0 15px 0; color: #666; font-size: 0.9rem; line-height: 1.4; }
.ticket-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
.ticket-footer small { color: #888; font-weight: 500; font-size: 0.8rem; }
.ticket-footer small.text-danger { color: #dc3545; }
.btn-use-ticket { padding: 8px 18px; background: linear-gradient(135deg, #ee4d2d, #ff7337); color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(238, 77, 45, 0.3); }
.btn-use-ticket:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(238, 77, 45, 0.4); }
.btn-use-ticket:disabled { background: #ccc; cursor: not-allowed; }

/* Override for checkout page */
.form-group input, .address-selection select {
    height: 48px;
}
.form-group textarea {
    height: 100px;
}
.btn-apply-modern, .voucher-input-row input {
    height: 48px;
}
.address-input-group input {
    height: 48px;
}

/* Reponsive cho Voucher trên thiết bị di động */
@media (max-width: 480px) {
  .voucher-input-row { flex-direction: column; }
  .btn-apply-modern { width: 100%; }
  .v-tag { align-items: flex-start; }
  .tag-remove { align-self: flex-end; margin-left: auto; margin-top: -30px; }
}
</style>
