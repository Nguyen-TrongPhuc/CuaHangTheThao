<template>
  <div class="contact-manager-chat">
    <!-- Header -->
    <div class="chat-header">
      <h1><i class="fa-solid fa-comments"></i> Quản lý liên hệ</h1>
      <div class="header-stats">
        <span class="stat"><i class="fa-solid fa-envelope"></i> {{ unreadCount }} hội thoại có tin mới</span>
      </div>
    </div>

    <!-- Chat Container -->
    <div class="chat-container">
      <!-- Left Sidebar - Contacts List -->
      <div class="contacts-sidebar">
        <div class="sidebar-header">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Tìm kiếm..." 
            class="search-box"
          />
          <div class="sidebar-filters">
            <button 
              v-for="status in ['all', 'unread', 'replied']"
              :key="status"
              @click="filterStatus = (status === 'all' ? '' : status)"
              :class="['filter-btn', {active: (status === 'all' ? filterStatus === '' : filterStatus === status)}]"
            >
              {{ statusLabel(status) }}
            </button>
          </div>
        </div>

        <!-- Contacts List -->
        <div class="contacts-list">
          <div v-if="isLoading" class="empty-state">
            <i class="fa-solid fa-spinner fa-spin"></i> Đang tải...
          </div>
          <div v-else-if="filteredConversations.length === 0" class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <p>Không có hội thoại</p>
          </div>
          <div v-else>
            <div 
              v-for="conv in filteredConversations"
              :key="conv.email"
              @click="selectConversation(conv)"
              :class="['contact-item', { active: selectedConversation?.email === conv.email, unread: conv.hasUnread }]"
            >
              <div class="contact-avatar">
                {{ conv.name ? conv.name.charAt(0).toUpperCase() : '?' }}
              </div>
              <div class="contact-info">
                <div class="contact-name">{{ conv.name }}</div>
                <div class="contact-preview">{{ messagePreview(getLastMessage(conv).message) }}</div>
              </div>
              <div class="contact-meta">
                <span v-if="conv.hasUnread" class="badge unread">●</span>
                <div class="contact-time">{{ formatTime(conv.latestDate) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Chat Area -->
      <div class="chat-area">
        <div v-if="!selectedConversation" class="empty-chat">
          <i class="fa-solid fa-comments"></i>
          <h2>Chọn một hội thoại để xem chi tiết</h2>
        </div>
        
        <div v-else class="chat-content">
          <!-- Chat Header -->
          <div class="chat-top-header">
            <div class="chat-contact-info">
              <div class="avatar">{{ selectedConversation.name.charAt(0).toUpperCase() }}</div>
              <div class="info">
                <h3>{{ selectedConversation.name }}</h3>
                <p>{{ selectedConversation.email }}</p>
              </div>
            </div>
            <div class="chat-actions">
              <button 
                @click="deleteConversation"
                class="btn-action danger"
                title="Xóa hội thoại"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- Message Thread -->
          <div class="message-thread" ref="messageThread">
            <div v-for="msg in selectedConversation.messages" :key="msg._id" class="thread-item">
                <!-- User Message -->
                <div class="message-group user">
                    <div class="message-header-small">
                        <span class="sender">Khách hàng</span>
                        <span class="time">{{ formatDateTime(msg.created_at) }}</span>
                    </div>
                    <div class="message-box customer">
                        <div class="subject-line" v-if="msg.subject"><strong>Chủ đề:</strong> {{ subjectLabel(msg.subject) }}</div>
                        
                        <!-- Thẻ sản phẩm đính kèm -->
                        <div v-if="parseMessage(msg.message).hasProduct" class="chat-product-card">
                            <div class="card-body" @click="viewProductDetails(parseMessage(msg.message).id)">
                                <img :src="parseMessage(msg.message).image" alt="Product" />
                                <div class="chat-product-info">
                                    <span class="chat-product-name">{{ parseMessage(msg.message).name }}</span>
                                    <div class="chat-product-rating"><i class="fa-solid fa-star"></i> {{ parseMessage(msg.message).rating }}</div>
                                    <span class="chat-product-price">{{ formatPrice(parseMessage(msg.message).price) }}đ</span>
                                </div>
                            </div>
                        </div>
                        <div class="text" v-if="parseMessage(msg.message).text">{{ parseMessage(msg.message).text }}</div>
                    </div>
                </div>

                <!-- Admin Reply -->
                <div v-if="msg.reply_message" class="message-group admin">
                    <div class="message-header-small right">
                        <span class="time">{{ formatDateTime(msg.replied_at) }}</span>
                        <span class="sender">Quản lý</span>
                    </div>
                    <div class="message-box admin">
                        <div class="text">{{ msg.reply_message }}</div>
                    </div>
                </div>
            </div>
          </div>

          <!-- Reply Input -->
          <div class="chat-input-area">
            <div v-if="latestMessageReplied" class="already-replied">
               <i class="fa-solid fa-check-circle"></i> Tin nhắn cuối cùng đã được trả lời.
            </div>
            <div v-else class="input-form">
              <textarea 
                v-model="replyMessage"
                placeholder="Nhập tin nhắn trả lời..."
                class="reply-input"
                @keydown.enter.ctrl="sendReply"
                rows="4"
              ></textarea>
              <div class="input-actions">
                <button 
                  @click="sendReply"
                  class="btn btn-primary"
                  :disabled="!replyMessage.trim()"
                >
                  <i class="fa-solid fa-paper-plane"></i> Gửi (Ctrl+Enter)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <div v-if="showProductModal" class="modal-overlay" @click.self="closeProductModal">
      <div class="modal-content">
        <button class="close-btn" @click="closeProductModal">&times;</button>
        <div v-if="productLoading" class="loading-spinner">
            <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <div v-else-if="selectedProduct" class="product-detail-view">
            <img :src="(selectedProduct.images && selectedProduct.images[0] && selectedProduct.images[0].url) || selectedProduct.image || 'https://via.placeholder.com/150'" alt="Product" class="modal-product-img" />
            <h3>{{ selectedProduct.name }}</h3>
            <p class="modal-price">{{ formatPrice(selectedProduct.price) }}đ</p>
            <div class="modal-info-grid">
                <div class="info-item"><strong>Kho:</strong> {{ getDisplayStock(selectedProduct) }}</div>
                <div class="info-item"><strong>Đã bán:</strong> {{ selectedProduct.sold || 0 }}</div>
                <div class="info-item"><strong>Danh mục:</strong> {{ getCategoryName(selectedProduct.category_id) }}</div>
            </div>
            <p class="modal-desc">{{ selectedProduct.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import ContactService from '@/services/contacts.service';
import ProductService from '@/services/products.service';
import CategoryService from '@/services/categories.service';
import { showToast } from '@/utils/toast';

export default {
  setup() {
    const contacts = ref([]);
    const conversations = ref([]);
    const selectedConversation = ref(null);
    const replyMessage = ref('');
    const isLoading = ref(false);
    const filterStatus = ref('');
    const searchQuery = ref('');
    const messageThread = ref(null);
    
    const showProductModal = ref(false);
    const selectedProduct = ref(null);
    const productLoading = ref(false);
    const categories = ref([]);

    // Computed properties
    const unreadCount = computed(() => conversations.value.filter(c => c.hasUnread).length);
    
    const latestMessageReplied = computed(() => {
        if (!selectedConversation.value) return false;
        const msgs = selectedConversation.value.messages;
        if (msgs.length === 0) return false;
        const last = msgs[msgs.length - 1];
        return !!last.reply_message;
    });

    const filteredConversations = computed(() => {
      return conversations.value.filter(conv => {
        // Filter status: 'unread' means conversation has unread messages
        // 'replied' means conversation has no unread messages (all replied or read)
        let matchStatus = true;
        if (filterStatus.value === 'unread') {
            matchStatus = conv.hasUnread;
        } else if (filterStatus.value === 'replied') {
            matchStatus = !conv.hasUnread;
        }

        const matchSearch = !searchQuery.value || 
          conv.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          conv.email.toLowerCase().includes(searchQuery.value.toLowerCase());
          
        return matchStatus && matchSearch;
      });
    });

    // Methods
    const groupContacts = (allContacts) => {
        const groups = {};
        allContacts.forEach(c => {
            const email = c.email;
            if (!groups[email]) {
                groups[email] = {
                    email: email,
                    name: c.name,
                    messages: [],
                    latestDate: new Date(0),
                    hasUnread: false
                };
            }
            groups[email].messages.push(c);
            
            const cDate = new Date(c.created_at);
            if (cDate > groups[email].latestDate) {
                groups[email].latestDate = cDate;
                groups[email].name = c.name; // Update name to latest provided
            }
            if (c.status === 'unread') groups[email].hasUnread = true;
        });

        // Convert to array and sort messages inside
        return Object.values(groups).map(g => {
            g.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return g;
        }).sort((a, b) => b.latestDate - a.latestDate);
    };

    const loadContacts = async () => {
      isLoading.value = true;
      try {
        const response = await ContactService.getAll();
        contacts.value = response.data || response;
        conversations.value = groupContacts(contacts.value);
        
        // Refresh selected conversation if exists
        if (selectedConversation.value) {
            const updated = conversations.value.find(c => c.email === selectedConversation.value.email);
            if (updated) selectedConversation.value = updated;
        }
      } catch (error) {
        showToast('Lỗi tải dữ liệu', 'error');
        console.error(error);
      } finally {
        isLoading.value = false;
      }
    };

    const loadCategories = async () => {
        try {
            const res = await CategoryService.getAll();
            categories.value = res.data || res;
        } catch (e) { console.error(e); }
    };

    const selectConversation = async (conv) => {
      selectedConversation.value = conv;
      replyMessage.value = '';
      
      // Scroll to bottom
      nextTick(() => {
          if (messageThread.value) messageThread.value.scrollTop = messageThread.value.scrollHeight;
      });

      // Mark all unread messages in this conversation as read
      const unreadMsgs = conv.messages.filter(m => m.status === 'unread');
      if (unreadMsgs.length > 0) {
          try {
              await Promise.all(unreadMsgs.map(m => ContactService.markAsRead(m._id)));
              unreadMsgs.forEach(m => m.status = 'read');
              conv.hasUnread = false;
          } catch (error) {
              console.error('Lỗi đánh dấu đã đọc:', error);
          }
      }
    };

    const sendReply = async () => {
      if (!replyMessage.value.trim()) {
        showToast('Vui lòng nhập tin nhắn trả lời', 'error');
        return;
      }

      // Reply to the last message
      const msgs = selectedConversation.value.messages;
      const targetMsg = msgs[msgs.length - 1];

      try {
        const updateData = {
          reply_message: replyMessage.value,
          status: 'replied'
        };
        await ContactService.update(targetMsg._id, updateData);
        
        replyMessage.value = '';
        showToast('Trả lời thành công', 'success');
        await loadContacts();
      } catch (error) {
        showToast('Lỗi gửi trả lời', 'error');
        console.error(error);
      }
    };

    const deleteConversation = async () => {
      if (confirm('Bạn chắc chắn muốn xóa toàn bộ hội thoại này?')) {
        try {
          // Delete all messages in conversation
          const ids = selectedConversation.value.messages.map(m => m._id);
          // Assuming backend doesn't have bulk delete, loop delete (or implement bulk in backend)
          // For now loop:
          await Promise.all(ids.map(id => ContactService.delete(id)));
          
          showToast('Xóa thành công', 'success');
          loadContacts();
          selectedConversation.value = null;
        } catch (error) {
          showToast('Lỗi xóa', 'error');
        }
      }
    };

    const viewProductDetails = async (id) => {
        if (!id) return;
        showProductModal.value = true;
        productLoading.value = true;
        selectedProduct.value = null;
        try {
            // Fetch product details
            // Sử dụng getAll và lọc vì service bên Admin có thể chưa có hàm get/findById
            const response = await ProductService.getAll();
            const products = response.data || response;
            selectedProduct.value = products.find(p => p._id === id);
        } catch (error) {
            console.error(error);
            showToast("Không thể tải thông tin sản phẩm", "error");
        } finally {
            productLoading.value = false;
        }
    };

    const closeProductModal = () => {
        showProductModal.value = false;
    };

    const getCategoryName = (id) => {
        const cat = categories.value.find(c => c._id === id);
        return cat ? cat.name : '---';
    };

    const getDisplayStock = (product) => {
        if (product && product.variants && product.variants.length > 0) {
            return product.variants.reduce((total, v) => total + (Number(v.stock) || 0), 0);
        }
        return product ? (product.stock || 0) : 0;
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

    const formatPrice = (value) => {
      return new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
    };

    const messagePreview = (text) => {
      const parsed = parseMessage(text);
      let display = parsed.hasProduct ? `[Quan tâm: ${parsed.name}] ${parsed.text}` : parsed.text;
      return display.length > 50 ? display.substring(0, 50) + '...' : display;
    };

    const getLastMessage = (conv) => {
        return conv.messages[conv.messages.length - 1] || {};
    };

    const subjectLabel = (subject) => {
      const labels = {
        'complaint': 'Khiếu nại / Báo cáo vấn đề',
        'feedback': 'Phản hồi / Đề xuất',
        'product': 'Thắc mắc về sản phẩm',
        'order': 'Thắc mắc về đơn hàng',
        'partnership': 'Hợp tác kinh doanh',
        'other': 'Khác'
      };
      return labels[subject] || subject;
    };

    const statusLabel = (status) => {
      const labels = {
        'all': 'Tất cả',
        'unread': 'Chưa đọc',
        'read': 'Đã đọc',
        'replied': 'Đã trả lời'
      };
      return labels[status] || status;
    };

    onMounted(() => {
      loadContacts();
      loadCategories();
    });

    return {
      contacts,
      conversations,
      selectedConversation,
      replyMessage,
      isLoading,
      filterStatus,
      searchQuery,
      unreadCount,
      filteredConversations,
      selectConversation,
      sendReply,
      deleteConversation,
      latestMessageReplied,
      messageThread,
      formatDateTime,
      formatTime,
      parseMessage,
      formatPrice,
      messagePreview,
      getLastMessage,
      subjectLabel,
      statusLabel,
      showProductModal,
      selectedProduct,
      productLoading,
      viewProductDetails,
      closeProductModal,
      getCategoryName,
      getDisplayStock
    };
  }
};
</script>

<style scoped>
.contact-manager-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

/* Header */
.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chat-header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  opacity: 0.9;
}

.header-stats .stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Chat Container */
.chat-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
}

/* Contacts Sidebar */
.contacts-sidebar {
  width: 350px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.search-box {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  margin-bottom: 10px;
  transition: border-color 0.3s;
}

.search-box:focus {
  outline: none;
  border-color: #667eea;
}

.sidebar-filters {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 15px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Contacts List */
.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 12px;
}

.empty-state i {
  font-size: 40px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.contact-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  gap: 12px;
  align-items: center;
  transition: all 0.3s;
  background: white;
}

.contact-item:hover {
  background: #f9f9f9;
}

.contact-item.active {
  background: #e8eaf6;
  border-left: 3px solid #667eea;
}

.contact-item.unread {
  font-weight: 500;
  background: #fafafa;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.contact-preview {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.badge {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  font-size: 10px;
}

.badge.unread {
  background: #ff6b6b;
  color: white;
}

.badge.replied {
  color: #51cf66;
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-chat i {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.3;
}

/* Chat Content */
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-top-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.chat-contact-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.chat-contact-info .info h3 {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.chat-contact-info .info p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #999;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s;
}

.btn-action:hover {
  background: #f5f5f5;
  border-color: #667eea;
  color: #667eea;
}

.btn-action.danger:hover {
  background: #ffebee;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

/* Message Thread */
.message-thread {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 15px;
}

.message-header-small {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
  padding: 0 5px;
}

.message-header-small.right {
    justify-content: flex-end;
}

.sender {
  font-weight: bold;
  color: #555;
}

.message-box {
  display: inline-block;
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
  font-size: 15px;
}

.message-box.customer {
  background: #f0f0f0;
  color: #333;
  border-top-left-radius: 2px;
}

.message-box.admin {
  background: #667eea;
  color: white;
  align-self: flex-end;
  border-top-right-radius: 2px;
}

.subject-line {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 5px;
    opacity: 0.8;
    border-bottom: 1px solid rgba(0,0,0,0.1);
    padding-bottom: 3px;
}

.text {
    white-space: pre-wrap;
}

/* Product Card Style */
.chat-product-card {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
    color: #333;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    width: 250px;
}
.chat-product-card .card-body { cursor: pointer; transition: background 0.2s; }
.chat-product-card .card-body:hover { background: #f9f9f9; }
.chat-product-card .card-body { display: flex; gap: 10px; padding: 10px; border-bottom: 1px solid #eee; }
.chat-product-card img { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; }
.chat-product-info { display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
.chat-product-name { font-weight: bold; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.chat-product-rating { font-size: 10px; color: #f1c40f; margin-bottom: 2px; }
.chat-product-price { font-weight: bold; color: #e74c3c; font-size: 12px; }

/* Chat Input Area */
.chat-input-area {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.already-replied {
  padding: 12px;
  text-align: center;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.input-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  transition: border-color 0.3s;
}

.reply-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.input-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar */
.contacts-list::-webkit-scrollbar,
.message-thread::-webkit-scrollbar {
  width: 6px;
}

.contacts-list::-webkit-scrollbar-track,
.message-thread::-webkit-scrollbar-track {
  background: transparent;
}

.contacts-list::-webkit-scrollbar-thumb,
.message-thread::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.contacts-list::-webkit-scrollbar-thumb:hover,
.message-thread::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Responsive */
@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }

  .contacts-sidebar {
    width: 100%;
    height: 250px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .message-box {
    max-width: 90%;
  }
}

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 25px; border-radius: 8px; width: 90%; max-width: 400px; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.close-btn { position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
.close-btn:hover { color: #333; }
.loading-spinner { text-align: center; padding: 20px; font-size: 24px; color: #667eea; }

.product-detail-view { text-align: center; }
.modal-product-img { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; border: 1px solid #eee; }
.product-detail-view h3 { margin: 0 0 10px; color: #333; font-size: 18px; }
.modal-price { font-size: 20px; font-weight: bold; color: #e74c3c; margin-bottom: 15px; }
.modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; background: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 14px; }
.info-item { color: #555; }
.info-item strong { color: #333; }
.modal-desc { font-size: 14px; color: #666; line-height: 1.5; text-align: left; max-height: 100px; overflow-y: auto; }
</style>
