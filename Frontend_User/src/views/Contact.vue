<template>
  <div class="contact-page-wrapper">
    <AppHeader />

    <div class="messenger-container">
      <!-- Sidebar: Danh sách hội thoại -->
      <div class="messenger-sidebar">
        <div class="sidebar-header">
          <h2>Đoạn chat</h2>
        </div>
        
        <div class="conversation-list">
            <div class="conversation-item active">
                <div class="avatar">
                    <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="Admin">
                </div>
                <div class="info">
                    <div class="top-row">
                        <span class="name">Hỗ trợ viên SportStore</span>
                        <span class="time">Vừa truy cập</span>
                    </div>
                    <div class="bottom-row">
                        <span class="preview">Chúng tôi luôn sẵn sàng hỗ trợ bạn.</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="messenger-content">
        <div class="chat-window">
            <!-- Chat Header -->
            <div class="chat-header">
                <div class="user-info">
                    <div class="avatar">
                        <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="Admin">
                    </div>
                    <div class="details">
                        <span class="name">Hỗ trợ viên SportStore</span>
                        <span class="status">Đang hoạt động</span>
                    </div>
                </div>
            </div>

            <!-- Messages Flow -->
            <div class="messages-flow" ref="messagesContainer">
                <div v-if="isLoadingMessages" class="loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i> Đang tải tin nhắn...
                </div>
                <div v-else-if="userMessages.length === 0" class="system-notice">
                    <p>Bắt đầu cuộc trò chuyện với chúng tôi ngay hôm nay!</p>
                </div>
                
                <template v-for="msg in userMessages" :key="msg._id">
                    <!-- User Message -->
                    <div class="message-bubble me">
                        <div class="bubble-content" :title="formatDateTime(msg.created_at)"> 
                            <!-- Kiểm tra và hiển thị thẻ sản phẩm nếu có -->
                            <div v-if="parseMessage(msg.message).hasProduct" class="chat-product-card">
                                <div class="card-body" @click="goToProduct(parseMessage(msg.message).id)">
                                    <img :src="parseMessage(msg.message).image" alt="Product" />
                                    <div class="chat-product-info">
                                        <span class="chat-product-name">{{ parseMessage(msg.message).name }}</span>
                                        <div class="chat-product-rating">
                                            <i v-for="n in 5" :key="n" :class="['fa-solid fa-star', n <= Math.round(parseMessage(msg.message).rating) ? 'active' : '']"></i>
                                        </div>
                                        <span class="chat-product-price">{{ formatPrice(parseMessage(msg.message).price) }}đ</span>
                                    </div>
                                </div>
                                <div class="chat-product-actions">
                                    <button class="btn-chat-action cart" @click.stop="addToCartFromChat(parseMessage(msg.message))"><i class="fa-solid fa-cart-plus"></i> Thêm giỏ</button>
                                    <button class="btn-chat-action buy" @click.stop="buyNowFromChat(parseMessage(msg.message))">Mua ngay</button>
                                </div>
                            </div>
                            <!-- Hiển thị nội dung tin nhắn văn bản -->
                            <span v-if="parseMessage(msg.message).text" class="text-content">{{ parseMessage(msg.message).text }}</span>
                        </div>
                        <div class="bubble-meta">
                            {{ formatTime(msg.created_at) }}
                            <i v-if="msg.status === 'unread'" class="fa-solid fa-check" title="Đã gửi"></i>
                            <i v-else class="fa-solid fa-check-double" title="Đã xem/Trả lời"></i>
                        </div>
                    </div>

                    <!-- Admin Reply -->
                    <div v-if="msg.reply_message" class="message-bubble you">
                        <div class="avatar-small">
                            <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="Admin">
                        </div>
                        <div class="bubble-group">
                            <div class="bubble-content" :title="formatDateTime(msg.replied_at)">
                                {{ msg.reply_message }}
                            </div>
                            <div class="bubble-meta">{{ formatTime(msg.replied_at) }}</div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Chat Footer -->
            <div class="chat-footer">
                <div v-if="attachedProduct" class="product-attachment-preview">
                    <img :src="attachedProduct.image || 'https://via.placeholder.com/40'" alt="Product" />
                    <div class="attachment-info">
                        <span class="attachment-label">Đang quan tâm:</span>
                        <span class="attachment-name">{{ attachedProduct.name }}</span>
                    </div>
                    <button class="btn-remove-attachment" @click="attachedProduct = null"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form @submit.prevent="submitQuickMessage" class="input-wrapper">
                    <input 
                        type="text" 
                        v-model="formData.message" 
                        placeholder="Nhập tin nhắn..." 
                        :disabled="isSubmitting"
                    >
                    <button type="submit" class="btn-icon-send" :disabled="!formData.message || isSubmitting">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </form>
        </div>
      </div>
    </div>
    </div>

    <AppFooter />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import ContactService from '@/services/contact.service';
import { showToast } from '@/utils/toast';
import { cartStore } from "@/utils/cart";

export default {
  components: {
    AppHeader,
    AppFooter
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // Form data
    const formData = ref({
      name: '',
      email: '',
      phone: '', 
      subject: 'product', // Mặc định là product để backend nhận diện
      message: ''
    });

    // State
    const userMessages = ref([]);
    const isLoadingMessages = ref(false);
    const isSubmitting = ref(false);
    const messagesContainer = ref(null);
    const attachedProduct = ref(null);
    let pollingInterval = null;

    // Load user data
    const loadUserData = () => {
      const userName = localStorage.getItem('user_name') || '';
      const userEmail = localStorage.getItem('user_email') || '';
      const userPhone = localStorage.getItem('user_phone') || '';

      formData.value.name = userName;
      formData.value.email = userEmail;
      formData.value.phone = userPhone || '';
    };

    // Load user's messages
    const loadMessages = async (isBackground = false) => {
      if (!isBackground) isLoadingMessages.value = true;
      try {
        const response = await ContactService.getAll();
        const allMessages = response.data || response;
        
        // Lấy email và chuẩn hóa về chữ thường để so sánh chính xác
        const rawEmail = formData.value.email || localStorage.getItem('user_email') || '';
        const userEmail = rawEmail.toLowerCase().trim();
        
        // Filter messages by user email
        userMessages.value = allMessages
          .filter(msg => (msg.email || '').toLowerCase().trim() === userEmail)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Sort ASC for chat thread
          
        if (!isBackground) {
            scrollToBottom();
        }

      } catch (error) {
        console.error('Error loading messages:', error);
        if (!isBackground) showToast('Lỗi tải tin nhắn', 'error');
      } finally {
        if (!isBackground) isLoadingMessages.value = false;
      }
    };

    const scrollToBottom = () => {
        nextTick(() => {
            if (messagesContainer.value) {
                messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
            }
        });
    };

    // Submit quick message
    const submitQuickMessage = async () => {
      if (!formData.value.message.trim() && !attachedProduct.value) return;
      if (!formData.value.name || !formData.value.email) {
        showToast('Vui lòng đăng nhập để gửi tin nhắn', 'warning');
        return;
      }

      isSubmitting.value = true;
      try {
        // Nếu có sản phẩm đính kèm, thêm vào nội dung tin nhắn
        if (attachedProduct.value) {
            // Xử lý dữ liệu để tránh lỗi ký tự phân cách '|' trong tên hoặc ảnh làm sai lệch vị trí giá tiền
            const safeName = (attachedProduct.value.name || '').replace(/\|/g, ' - ');
            const safeImage = (attachedProduct.value.image || '').replace(/\|/g, '');

            // Tạo chuỗi định dạng đặc biệt: [PRODUCT|id|name|image|price|rating]
            const productMsg = `[PRODUCT|${attachedProduct.value.id || ''}|${safeName}|${safeImage}|${attachedProduct.value.price || 0}|${attachedProduct.value.rating || 0}]`;
            
            // Gửi tin nhắn sản phẩm riêng
            await ContactService.create({ ...formData.value, message: productMsg });
        }

        // Gửi tin nhắn văn bản riêng (nếu có)
        if (formData.value.message.trim()) {
            await ContactService.create(formData.value);
        }
        
        formData.value.message = '';
        await loadMessages(true);
        scrollToBottom();
      } catch (error) {
        showToast('Gửi tin nhắn thất bại', 'error');
      } finally {
        attachedProduct.value = null;
        isSubmitting.value = false;
      }
    };

    // Format helpers
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const now = new Date();
      const diff = now - d;

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes}m trước`;
      if (hours < 24) return `${hours}h trước`;
      if (days < 7) return `${days}d trước`;

      return d.toLocaleDateString('vi-VN');
    };

    const messagePreview = (text) => {
      return text.length > 60 ? text.substring(0, 60) + '...' : text;
    };

    // Hàm phân tích tin nhắn để tách thông tin sản phẩm
    const parseMessage = (content) => {
        if (!content) return { hasProduct: false, text: '' };
        
        // Regex tìm chuỗi [PRODUCT|id|name|image|price|rating]
        const regex = /\[PRODUCT\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/;
        const match = content.match(regex);

        if (match) {
            return {
                hasProduct: true,
                id: match[1],
                name: match[2],
                image: match[3],
                price: match[4],
                rating: match[5],
                text: content.replace(match[0], '').trim()
            };
        }
        return { hasProduct: false, text: content };
    };

    const goToProduct = (id) => {
        router.push({ name: 'product.detail', params: { id } });
    };

    const formatPrice = (value) => {
      const num = Number(value);
      if (isNaN(num)) return '0';
      return new Intl.NumberFormat('vi-VN').format(num);
    };

    const addToCartFromChat = (productInfo) => {
        const product = {
            _id: productInfo.id,
            name: productInfo.name,
            price: Number(productInfo.price),
            image: productInfo.image,
            slug: '' // Optional
        };
        // Thêm vào giỏ hàng (mặc định số lượng 1, không variant)
        cartStore.addToCart(product, null, 1);
        showToast("Đã thêm vào giỏ hàng", "success");
    };

    const buyNowFromChat = (productInfo) => {
        addToCartFromChat(productInfo);
        router.push("/checkout");
    };

    onMounted(() => {
      loadUserData();
      loadMessages();
      
      // Check query params for product attachment
      if (route.query.productId) {
          attachedProduct.value = {
              id: route.query.productId,
              name: route.query.productName,
              image: route.query.productImage,
              price: route.query.productPrice,
              rating: route.query.productRating
          };
      }

      // Tự động cập nhật tin nhắn mỗi 5 giây
      pollingInterval = setInterval(() => loadMessages(true), 5000);
    });

    onUnmounted(() => {
      if (pollingInterval) clearInterval(pollingInterval);
    });

    return {
      formData,
      userMessages,
      isLoadingMessages,
      attachedProduct,
      isSubmitting,
      messagesContainer,
      submitQuickMessage,
      formatDateTime,
      formatTime,
      messagePreview,
      parseMessage,
      goToProduct,
      formatPrice,
      addToCartFromChat,
      buyNowFromChat
    };
  }
};
</script>

<style scoped>
.contact-page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
}

/* Messenger Container */
.messenger-container {
  display: flex;
  height: calc(100vh - 70px); /* Trừ header */
  max-width: 100%;
  background: white;
  border-top: 1px solid #ddd;
}

/* Sidebar */
.messenger-sidebar {
  width: 360px;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  background: white;
}

.sidebar-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 { font-size: 24px; font-weight: bold; margin: 0; }

.conversation-list { flex: 1; overflow-y: auto; }

.conversation-item {
  padding: 10px 15px; display: flex; gap: 12px; cursor: pointer; border-radius: 8px; margin: 0 8px; transition: 0.2s;
}
.conversation-item:hover { background: #f0f2f5; }
.conversation-item.active { background: #e7f3ff; }

.avatar img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
.info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.top-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
.name { font-weight: 600; font-size: 15px; color: #050505; }
.time { font-size: 12px; color: #65676b; }
.bottom-row { display: flex; justify-content: space-between; align-items: center; }
.preview { font-size: 13px; color: #65676b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
.conversation-item.unread .name, .conversation-item.unread .preview { font-weight: bold; color: #050505; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-dot.unread { background: #0084ff; }
.status-dot.replied { background: #31a24c; }

/* Main Content */
.messenger-content { flex: 1; display: flex; flex-direction: column; background: white; }

.chat-window { display: flex; flex-direction: column; height: 100%; }
.chat-window.empty { align-items: center; justify-content: center; background: #fff; }

.chat-header {
  padding: 10px 15px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.user-info { display: flex; align-items: center; gap: 10px; }
.user-info .avatar img { width: 40px; height: 40px; }
.user-info .details { display: flex; flex-direction: column; }
.user-info .name { font-size: 16px; font-weight: 600; }
.user-info .status { font-size: 12px; color: #31a24c; }

/* Messages Flow */
.messages-flow { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; background: white; }

.message-bubble { max-width: 70%; display: flex; flex-direction: column; position: relative; }
.message-bubble.me { align-self: flex-end; align-items: flex-end; }
.message-bubble.you { align-self: flex-start; align-items: flex-start; }

.bubble-content {
  padding: 10px 15px; border-radius: 18px; font-size: 15px; line-height: 1.4; word-wrap: break-word;
}
.me .bubble-content { background: #e7f3ff; color: #050505; border-bottom-right-radius: 4px; }
.you .bubble-content { background: #e4e6eb; color: #050505; border-bottom-left-radius: 4px; }

/* Style cho thẻ sản phẩm trong tin nhắn */
.chat-product-card {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
    color: #333;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    width: 220px;
    border: 1px solid #eee;
}
.chat-product-card .card-body { display: flex; gap: 10px; padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; }
.chat-product-card img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
.chat-product-info { display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
.chat-product-name { font-weight: bold; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.chat-product-rating { font-size: 10px; color: #f1c40f; margin-bottom: 2px; }
.chat-product-price { font-weight: bold; color: #e74c3c; font-size: 13px; }

.chat-product-actions { display: flex; }
.btn-chat-action { flex: 1; border: none; padding: 8px 0; font-size: 11px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-chat-action.cart { background: #f8f9fa; color: #333; }
.btn-chat-action.cart:hover { background: #e9ecef; }
.btn-chat-action.buy { background: #e74c3c; color: white; }
.btn-chat-action.buy:hover { background: #c0392b; }

.text-content { white-space: pre-wrap; }

.bubble-group { display: flex; flex-direction: column; }
.you .avatar-small { margin-bottom: 5px; }
.you .avatar-small img { width: 28px; height: 28px; border-radius: 50%; }
.you { flex-direction: row; gap: 8px; }

.bubble-meta { font-size: 11px; color: #65676b; margin-top: 5px; }
.system-notice { text-align: center; color: #65676b; font-style: italic; margin-top: 10px; }

/* Chat Footer */
.chat-footer { padding: 10px; border-top: 1px solid #ddd; }

.product-attachment-preview { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f0f8ff; border-radius: 8px; margin-bottom: 10px; border: 1px solid #dbeeff; }
.product-attachment-preview img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
.attachment-info { flex: 1; display: flex; flex-direction: column; font-size: 12px; }
.attachment-label { color: #666; }
.attachment-name { font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
.btn-remove-attachment { background: none; border: none; color: #999; cursor: pointer; padding: 5px; }
.btn-remove-attachment:hover { color: #e74c3c; }

.input-wrapper {
  display: flex; align-items: center; gap: 15px; background: #f0f2f5; padding: 8px 15px; border-radius: 20px;
}
.input-wrapper input { flex: 1; border: none; background: transparent; outline: none; font-size: 15px; }

.btn-icon-send {
    background: none; border: none; color: #0084ff; font-size: 18px; cursor: pointer;
}
.btn-icon-send:disabled { color: #ccc; cursor: not-allowed; }

@media (max-width: 768px) {
  .messenger-container { flex-direction: column; height: auto; }
  .messenger-sidebar { width: 100%; height: 300px; border-right: none; border-bottom: 1px solid #ddd; }
  .messenger-content { height: 500px; }
}
</style>
