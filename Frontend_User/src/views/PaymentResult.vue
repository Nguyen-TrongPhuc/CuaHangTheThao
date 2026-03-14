<template>
  <div class="payment-result-page">
    <AppHeader />
    <div class="container">
      <div class="result-card" :class="{ success: isSuccess, failed: !isSuccess }">
        <div class="icon">
          <i :class="isSuccess ? 'fa-solid fa-check-circle' : 'fa-solid fa-times-circle'"></i>
        </div>
        <h1>{{ isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại!' }}</h1>
        
        <div v-if="orderInfo" class="order-info">
          <p><strong>Mã đơn hàng:</strong> {{ orderInfo.orderId }}</p>
          <p><strong>Phương thức:</strong> {{ getPaymentMethodName(orderInfo.method) }}</p>
          <p><strong>Tổng tiền:</strong> {{ formatPrice(orderInfo.amount) }}đ</p>
          <p v-if="!isSuccess && orderInfo.message" class="message">
            <strong>Lý do:</strong> {{ orderInfo.message }}
          </p>
        </div>

        <p v-if="isSuccess" style="color: #28a745; margin-bottom: 20px; font-weight: bold;">
           Hệ thống sẽ tự động chuyển về trang chủ sau vài giây...
        </p>

        <div class="actions">
          <button class="btn-home" @click="goHome">Về trang chủ</button>
          <button class="btn-orders" @click="viewOrders">Xem đơn hàng</button>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import PaymentService from "@/services/payment.service";
import { useRouter, useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { showToast } from "@/utils/toast";

export default {
  components: { AppHeader, AppFooter },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const isSuccess = ref(false);
    const orderInfo = ref(null);

    const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value);

    const getPaymentMethodName = (method) => {
        const methods = {
            'vnpay': 'VNPAY',
            'momo': 'MoMo',
            'bank_transfer': 'Chuyển khoản',
            'cod': 'Tiền mặt (COD)'
        };
        return methods[method] || method;
    };

    const goHome = () => router.push("/");
    const viewOrders = () => router.push("/orders");

    onMounted(async () => {
        const success = route.query.success === 'true';
        const orderId = route.query.orderId;
        const message = route.query.message;

        // Fallback to URL params
        isSuccess.value = success;
        orderInfo.value = {
            orderId: orderId || 'N/A',
            method: route.query.method || 'vnpay',
            amount: route.query.amount || 0,
            message: message
        };

        const handleSuccess = () => {
            showToast("Thanh toán thành công! Đang chuyển về trang chủ...", "success");
            setTimeout(() => {
                router.push("/");
            }, 3000); // Tự động chuyển về trang chủ sau 3 giây
        };

        // ✅ CHECK REAL DB STATUS (PRIORITY)
        if (orderId) {
            try {
                const status = await PaymentService.checkPaymentStatus(orderId);
                console.log('Real payment status:', status);
                isSuccess.value = status.payment_status === 'paid';
                orderInfo.value.method = status.payment_method || 'vnpay';
                orderInfo.value.amount = status.total_amount || 0;
                
                if (isSuccess.value) {
                    handleSuccess();
                } else {
                    showToast(`Trạng thái: ${status.payment_status}`, "error");
                }
            } catch (error) {
                console.log('Cannot check status, use URL params:', error.message);
                if (success) handleSuccess();
            }
        } else if (success) {
            handleSuccess();
        }
    });

    return {
        isSuccess,
        orderInfo,
        formatPrice,
        getPaymentMethodName,
        goHome,
        viewOrders
    };
  }
};
</script>

<style scoped>
.payment-result-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f9f9f9;
}

.container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.result-card {
  background: white;
  padding: 50px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.result-card.success .icon {
  color: #28a745;
}

.result-card.failed .icon {
  color: #dc3545;
}

.icon {
  font-size: 80px;
  margin-bottom: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

.order-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  text-align: left;
}

.order-info p {
  margin: 10px 0;
  color: #555;
}

.order-info .message {
  color: #dc3545;
  font-style: italic;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-home, .btn-orders {
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-home {
  background: #28a745;
  color: white;
}

.btn-home:hover {
  background: #218838;
}

.btn-orders {
  background: #007bff;
  color: white;
}

.btn-orders:hover {
  background: #0056b3;
}
</style>
