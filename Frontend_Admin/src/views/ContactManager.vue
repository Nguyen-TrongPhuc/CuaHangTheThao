<template>
  <div class="contact-manager-chat">
    <!-- Header -->
    <div class="chat-header">
      <h1><i class="fa-solid fa-comments"></i> Quản lý liên hệ</h1>
      <div class="header-stats">
        <span class="stat"><i class="fa-solid fa-envelope"></i> {{ unreadCount }} chưa đọc</span>
        <span class="stat"><i class="fa-solid fa-check-circle"></i> {{ repliedCount }} đã trả lời</span>
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
              v-for="status in ['all', 'unread', 'read', 'replied']"
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
          <div v-else-if="filteredContacts.length === 0" class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <p>Không có tin nhắn</p>
          </div>
          <div v-else>
            <div 
              v-for="contact in filteredContacts"
              :key="contact._id"
              @click="selectContact(contact)"
              :class="['contact-item', { active: selectedContact?._id === contact._id, unread: contact.status === 'unread' }]"
            >
              <div class="contact-avatar">
                {{ contact.name ? contact.name.charAt(0).toUpperCase() : '?' }}
              </div>
              <div class="contact-info">
                <div class="contact-name">{{ contact.name }}</div>
                <div class="contact-preview">{{ messagePreview(contact.message) }}</div>
              </div>
              <div class="contact-meta">
                <span v-if="contact.status === 'unread'" class="badge unread">●</span>
                <span v-else-if="contact.status === 'replied'" class="badge replied">✓</span>
                <div class="contact-time">{{ formatTime(contact.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Chat Area -->
      <div class="chat-area">
        <div v-if="!selectedContact" class="empty-chat">
          <i class="fa-solid fa-comments"></i>
          <h2>Chọn một liên hệ để xem chi tiết</h2>
        </div>
        
        <div v-else class="chat-content">
          <!-- Chat Header -->
          <div class="chat-top-header">
            <div class="chat-contact-info">
              <div class="avatar">{{ selectedContact?.name ? selectedContact.name.charAt(0).toUpperCase() : '?' }}</div>
              <div class="info">
                <h3>{{ selectedContact?.name }}</h3>
                <p>{{ selectedContact?.email }}</p>
              </div>
            </div>
            <div class="chat-actions">
              <button 
                v-if="selectedContact.status === 'unread'"
                @click="markAsRead"
                class="btn-action"
                title="Đánh dấu đã đọc"
              >
                <i class="fa-solid fa-envelope-open"></i>
              </button>
              <button 
                @click="deleteContact(selectedContact._id)"
                class="btn-action danger"
                title="Xóa"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- Message Thread -->
          <div class="message-thread">
            <!-- Customer Message -->
            <div class="message-group">
              <div class="message-header">
                <span class="sender-name">{{ selectedContact.name }}</span>
                <span class="timestamp">{{ formatDateTime(selectedContact.created_at) }}</span>
              </div>
              
              <div class="message-box customer">
                <div class="subject">
                  <strong>Chủ đề:</strong> {{ subjectLabel(selectedContact.subject) }}
                </div>
                <div v-if="selectedContact.phone" class="contact-detail">
                  <strong>SĐT:</strong> {{ selectedContact.phone }}
                </div>
                <div class="message-text">{{ selectedContact.message }}</div>
              </div>
            </div>

            <!-- Reply Message (if exists) -->
            <div v-if="selectedContact.reply_message" class="message-group">
              <div class="message-header">
                <span class="sender-name">Quản lý</span>
                <span class="timestamp">{{ formatDateTime(selectedContact.replied_at) }}</span>
              </div>
              <div class="message-box admin">
                <div class="message-text">{{ selectedContact.reply_message }}</div>
              </div>
            </div>
          </div>

          <!-- Reply Input -->
          <div class="chat-input-area">
            <div v-if="selectedContact.status === 'replied'" class="already-replied">
              <i class="fa-solid fa-check-double"></i> Đã trả lời
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import ContactService from '@/services/contacts.service';
import { showToast } from '@/utils/toast';

export default {
  setup() {
    const contacts = ref([]);
    const selectedContact = ref(null);
    const replyMessage = ref('');
    const isLoading = ref(false);
    const filterStatus = ref('');
    const searchQuery = ref('');

    // Computed properties
    const unreadCount = computed(() => contacts.value.filter(c => c.status === 'unread').length);
    const repliedCount = computed(() => contacts.value.filter(c => c.status === 'replied').length);

    const filteredContacts = computed(() => {
      return contacts.value.filter(contact => {
        const matchStatus = !filterStatus.value || contact.status === filterStatus.value;
        const matchSearch = !searchQuery.value || 
          contact.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          contact.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          contact.subject.toLowerCase().includes(searchQuery.value.toLowerCase());
        return matchStatus && matchSearch;
      });
    });

    // Methods
    const loadContacts = async () => {
      isLoading.value = true;
      try {
        const response = await ContactService.getAll();
        contacts.value = response.data || response;
      } catch (error) {
        showToast('Lỗi tải dữ liệu', 'error');
        console.error(error);
      } finally {
        isLoading.value = false;
      }
    };

    const selectContact = async (contact) => {
      selectedContact.value = contact;
      replyMessage.value = '';
      
      // Mark as read if unread
      if (contact.status === 'unread') {
        try {
          await ContactService.markAsRead(contact._id);
          contact.status = 'read';
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

      try {
        const updateData = {
          reply_message: replyMessage.value,
          status: 'replied'
        };
        const response = await ContactService.update(selectedContact.value._id, updateData);
        const updatedContact = response.data || response;
        selectedContact.value = updatedContact;
        replyMessage.value = '';
        showToast('Trả lời thành công', 'success');
        await loadContacts();
      } catch (error) {
        showToast('Lỗi gửi trả lời', 'error');
        console.error(error);
      }
    };

    const markAsRead = async () => {
      try {
        await ContactService.markAsRead(selectedContact.value._id);
        selectedContact.value.status = 'read';
        showToast('Đã đánh dấu là đã đọc', 'success');
        loadContacts();
      } catch (error) {
        showToast('Lỗi cập nhật', 'error');
      }
    };

    const deleteContact = async (id) => {
      if (confirm('Bạn chắc chắn muốn xóa tin nhắn này?')) {
        try {
          await ContactService.delete(id);
          showToast('Xóa thành công', 'success');
          loadContacts();
          selectedContact.value = null;
        } catch (error) {
          showToast('Lỗi xóa', 'error');
        }
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
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
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
    });

    return {
      contacts,
      selectedContact,
      replyMessage,
      isLoading,
      filterStatus,
      searchQuery,
      unreadCount,
      repliedCount,
      filteredContacts,
      selectContact,
      sendReply,
      markAsRead,
      deleteContact,
      formatDateTime,
      formatTime,
      messagePreview,
      subjectLabel,
      statusLabel
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
  width: 300px;
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
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.contact-preview {
  font-size: 12px;
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
  gap: 8px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
}

.sender-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.timestamp {
  font-size: 12px;
  color: #999;
}

.message-box {
  display: inline-block;
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message-box.customer {
  background: #f0f0f0;
  color: #333;
}

.message-box.admin {
  background: #667eea;
  color: white;
  align-self: flex-end;
}

.subject {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.contact-detail {
  font-size: 12px;
  margin-bottom: 8px;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
}

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
</style>
