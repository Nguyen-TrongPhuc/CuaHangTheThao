<template>
  <div class="cart-page-wrapper">
    <AppHeader />

    <main class="cart-container">
    <h2 class="page-title">Giỏ hàng của bạn</h2>

    <div v-if="cart.state.items.length > 0" class="cart-content">
      <div class="cart-items">
        <div v-for="(item, index) in cart.state.items" :key="index" class="cart-item">
          <!-- Checkbox chọn sản phẩm -->
          <div class="item-checkbox">
            <input type="checkbox" v-model="item.selected" @change="cart.save()" />
          </div>

          <img :src="item.image || 'https://via.placeholder.com/100'" alt="Product" class="item-image" />
          
          <div class="item-details">
            <h3>{{ item.name }}</h3>
            <div class="item-variant" v-if="item.variant">
               <span v-if="item.variant.size_id">Size: {{ getSizeName(item.variant.size_id) }}</span>
               <span v-if="item.variant.size_id && item.variant.color_id"> - </span>
               <span v-if="item.variant.color_id">Màu: {{ getColorName(item.variant.color_id) }}</span>
            </div>
            <p class="item-price">{{ formatPrice(item.price) }}đ</p>
          </div>

          <div class="item-quantity">
            <button @click="updateQuantity(item, -1)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="updateQuantity(item, 1)">+</button>
          </div>

          <div class="item-total">
            {{ formatPrice(item.price * item.quantity) }}đ
          </div>

          <button class="btn-remove" @click="removeItem(index)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <div class="cart-summary">
        <h3>Tổng cộng</h3>
        <div class="summary-row">
          <span>Tạm tính:</span>
          <span>{{ formatPrice(totalAmount) }}đ</span>
        </div>
        <div class="summary-row total">
          <span>Thành tiền:</span>
          <span>{{ formatPrice(totalAmount) }}đ</span>
        </div>
        <button class="btn-checkout" @click="handleCheckout">Mua Ngay</button>
      </div>
    </div>

    <div v-else class="empty-cart">
      <i class="fa-solid fa-shopping-bag"></i>
      <p>Giỏ hàng của bạn đang trống</p>
      <router-link to="/" class="btn-continue">Tiếp tục mua sắm</router-link>
    </div>
    </main>

    <AppFooter />
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { cartStore } from "@/utils/cart";
import { showToast } from "@/utils/toast";
import SizesService from "@/services/sizes.service";
import ColorsService from "@/services/colors.service";

export default {
  components: { AppHeader, AppFooter },
  setup() {
    const totalAmount = computed(() => {
      return cartStore.state.items
        .filter(item => item.selected)
        .reduce((total, item) => total + (item.price * item.quantity), 0);
    });

    const sizes = ref([]);
    const colors = ref([]);

    const loadMetadata = async () => {
        try {
            const [s, c] = await Promise.all([SizesService.getAll(), ColorsService.getAll()]);
            sizes.value = s;
            colors.value = c;
        } catch (e) { console.error(e); }
    };

    onMounted(() => {
        loadMetadata();
    });

    const getSizeName = (id) => {
        const s = sizes.value.find(x => String(x._id) === String(id));
        return s ? s.name : '';
    };
    const getColorName = (id) => {
        const c = colors.value.find(x => String(x._id) === String(id));
        return c ? c.name : '';
    };

    return { 
      cart: cartStore,
      totalAmount,
      getSizeName,
      getColorName
    };
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat('vi-VN').format(value);
    },
    updateQuantity(item, change) {
      if (item.quantity + change > 0) {
        item.quantity += change;
        // Trigger save state manually or update cart store logic to watch changes
        if (this.cart.save) this.cart.save();
        else localStorage.setItem("cart_items", JSON.stringify(this.cart.state.items));
      }
    },
    removeItem(index) {
      this.cart.state.items.splice(index, 1);
      if (this.cart.save) this.cart.save();
      else localStorage.setItem("cart_items", JSON.stringify(this.cart.state.items));
    },
    handleCheckout() {
      const token = localStorage.getItem("user_token");
      if (!token) {
        showToast("Vui lòng đăng nhập để thanh toán!", "warning");
        this.$router.push("/login");
        return;
      }

      const itemsToCheckout = this.cart.state.items.filter(item => item.selected);

      if (itemsToCheckout.length === 0) {
        showToast("Vui lòng chọn ít nhất một sản phẩm để thanh toán!", "warning");
        return;
      }

      // Chuyển hướng sang trang thanh toán
      this.$router.push("/checkout");
    }
  }
};
</script>

<style scoped>
.cart-page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.cart-container { flex: 1; padding: 40px 10%; background-color: #f9f9f9; }
.page-title { text-align: center; margin-bottom: 30px; color: #2c3e50; }

.cart-content { display: flex; gap: 30px; flex-wrap: wrap; }
.cart-items { flex: 2; min-width: 300px; }
.cart-summary { flex: 1; min-width: 250px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); height: fit-content; }

.cart-item { display: flex; align-items: center; background: white; padding: 15px; margin-bottom: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.item-checkbox { margin-right: 15px; }
.item-checkbox input { width: 18px; height: 18px; cursor: pointer; }
.item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 5px; margin-right: 15px; }
.item-details { flex: 1; }
.item-details h3 { font-size: 1rem; margin: 0 0 5px; color: #2c3e50; }
.item-price { color: #7f8c8d; font-size: 0.9rem; }
.item-variant { font-size: 0.85rem; color: #666; margin-bottom: 5px; }

.item-quantity { display: flex; align-items: center; margin: 0 15px; border: 1px solid #ddd; border-radius: 5px; }
.item-quantity button { background: none; border: none; padding: 5px 10px; cursor: pointer; font-size: 1.2rem; }
.item-quantity span { padding: 0 10px; }

.item-total { font-weight: bold; color: #302b63; margin-right: 15px; min-width: 80px; text-align: right; }
.btn-remove { background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.1rem; }

.summary-row { display: flex; justify-content: space-between; margin-bottom: 15px; color: #2c3e50; }
.summary-row.total { font-weight: bold; font-size: 1.2rem; color: #302b63; border-top: 1px solid #eee; padding-top: 15px; }

.btn-checkout { width: 100%; padding: 12px; background: linear-gradient(135deg, #0f0c29, #302b63); color: white; border: none; border-radius: 25px; font-weight: bold; cursor: pointer; transition: 0.3s; }
.btn-checkout:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(48, 43, 99, 0.3); }

.empty-cart { text-align: center; padding: 50px; color: #7f8c8d; }
.empty-cart i { font-size: 4rem; margin-bottom: 20px; color: #bdc3c7; }
.btn-continue { display: inline-block; margin-top: 20px; padding: 10px 25px; background: #302b63; color: white; text-decoration: none; border-radius: 25px; }
</style>