<template>
  <div class="contact-page-wrapper">
    <AppHeader />

    <main class="contact-chat-container">
      <!-- Header -->
      <div class="chat-header">
        <h1><i class="fa-solid fa-comments"></i> Liên hệ với chúng tôi</h1>
        <p class="subtitle">Gửi tin nhắn để nhận được hỗ trợ từ đội ngũ của chúng tôi</p>
      </div>

      <!-- Chat Container -->
      <div class="chat-wrapper">
        <!-- Left Sidebar - Messages History -->
        <div class="messages-sidebar">
          <div class="sidebar-header">
            <h3><i class="fa-solid fa-inbox"></i> Tin nhắn của bạn</h3>
            <span class="message-count">{{ userMessages.length }}</span>
          </div>

          <!-- Messages List -->
          <div class="messages-list">
            <div v-if="isLoadingMessages" class="loading-state">
              <i class="fa-solid fa-spinner fa-spin"></i> Đang tải...
            </div>
            <div v-else-if="userMessages.length === 0" class="empty-messages">
              <i class="fa-solid fa-envelope-open"></i>
              <p>Bạn chưa gửi tin nhắn nào</p>
            </div>
            <div v-else>
              <div 
                v-for="msg in userMessages"
                :key="msg._id"
                @click="selectMessage(msg)"
                :class="['message-item', { active: selectedMessage?._id === msg._id, unread: msg.status === 'unread' }]"
              >
                <div class="message-preview">
                  <div class="subject-preview">{{ subjectLabel(msg.subject) }}</div>
                  <div class="text-preview">{{ messagePreview(msg.message) }}</div>
                </div>
                <div class="message-meta">
                  <span v-if="msg.status === 'unread'" class="badge unread">●</span>
                  <span v-else-if="msg.status === 'replied'" class="badge replied">✓</span>
                  <div class="time-badge">{{ formatTime(msg.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Chat Area -->
        <div class="chat-area">
          <!-- Chat Display -->
          <div v-if="!selectedMessage && userMessages.length === 0" class="empty-chat">
            <i class="fa-solid fa-comments"></i>
            <h2>Chưa có tin nhắn nào</h2>
            <p>Hãy gửi tin nhắn đầu tiên của bạn</p>
          </div>

          <div v-else-if="!selectedMessage && userMessages.length > 0" class="empty-chat">
            <i class="fa-solid fa-envelope"></i>
            <h2>Chọn một tin nhắn để xem chi tiết</h2>
          </div>

          <div v-else class="chat-content">
            <!-- Chat Header -->
            <div class="chat-top-header">
              <div class="header-info">
                <h3>{{ subjectLabel(selectedMessage.subject) }}</h3>
                <p><i class="fa-solid fa-calendar"></i> {{ formatDateTime(selectedMessage.created_at) }}</p>
              </div>
              <div class="header-status">
                <span v-if="selectedMessage.status === 'unread'" class="status-badge unread">
                  <i class="fa-solid fa-envelope"></i> Chưa xem trả lời
                </span>
                <span v-else-if="selectedMessage.status === 'replied'" class="status-badge replied">
                  <i class="fa-solid fa-check-circle"></i> Đã trả lời
                </span>
                <span v-else class="status-badge read">
                  <i class="fa-solid fa-envelope-open"></i> Đã xem
                </span>
              </div>
            </div>

            <!-- Message Thread -->
            <div class="message-thread">
              <!-- User Message -->
              <div class="message-group">
                <div class="message-label">Tin nhắn của bạn</div>
                <div class="message-box user-message">
                  <div class="contact-info-display">
                    <div v-if="selectedMessage.email" class="info-line">
                      <strong>Email:</strong> {{ selectedMessage.email }}
                    </div>
                    <div v-if="selectedMessage.phone" class="info-line">
                      <strong>Số điện thoại:</strong> {{ selectedMessage.phone }}
                    </div>
                  </div>
                  <div class="message-text">{{ selectedMessage.message }}</div>
                  <div class="message-timestamp">{{ formatDateTime(selectedMessage.created_at) }}</div>
                </div>
              </div>

              <!-- Admin Reply (if exists) -->
              <div v-if="selectedMessage.reply_message" class="message-group">
                <div class="message-label">Trả lời từ quản lý</div>
                <div class="message-box admin-message">
                  <div class="message-text">{{ selectedMessage.reply_message }}</div>
                  <div class="message-timestamp">{{ formatDateTime(selectedMessage.replied_at) }}</div>
                </div>
              </div>

              <!-- No Reply Notice -->
              <div v-else class="no-reply-notice">
                <i class="fa-solid fa-hourglass-end"></i>
                <p>Quản lý chưa trả lời tin nhắn này. Chúng tôi sẽ phản hồi sớm nhất có thể.</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="chat-actions">
              <button 
                @click="markAsRead"
                v-if="selectedMessage.status === 'unread'"
                class="btn btn-secondary"
              >
                <i class="fa-solid fa-check"></i> Đánh dấu đã xem
              </button>
              <button 
                @click="scrollToNewMessage"
                class="btn btn-secondary"
              >
                <i class="fa-solid fa-paper-plane"></i> Gửi tin nhắn mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- New Message Form Section -->
      <div class="new-message-section" ref="newMessageSection">
        <div class="form-container">
          <h2><i class="fa-solid fa-pen-to-square"></i> Gửi tin nhắn mới</h2>
          
          <form @submit.prevent="submitForm" class="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Họ và tên *</label>
                <input 
                  v-model="formData.name" 
                  type="text" 
                  id="name" 
                  placeholder="Nhập họ và tên của bạn" 
                  required
                />
              </div>

              <div class="form-group">
                <label for="email">Email *</label>
                <input 
                  v-model="formData.email" 
                  type="email" 
                  id="email" 
                  placeholder="Nhập địa chỉ email của bạn" 
                  required
                />
              </div>

              <div class="form-group">
                <label for="phone">Số điện thoại</label>
                <input 
                  v-model="formData.phone" 
                  type="tel" 
                  id="phone" 
                  placeholder="Nhập số điện thoại của bạn"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="subject">Chủ đề *</label>
              <select v-model="formData.subject" id="subject" required>
                <option value="">-- Chọn chủ đề --</option>
                <option value="complaint">Khiếu nại / Báo cáo vấn đề</option>
                <option value="feedback">Phản hồi / Đề xuất</option>
                <option value="product">Thắc mắc về sản phẩm</option>
                <option value="order">Thắc mắc về đơn hàng</option>
                <option value="partnership">Hợp tác kinh doanh</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div class="form-group">
              <label for="message">Nội dung tin nhắn *</label>
              <textarea 
                v-model="formData.message" 
                id="message" 
                placeholder="Nhập nội dung tin nhắn của bạn" 
                rows="5"
                required
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-paper-plane"></i>
                {{ isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn' }}
              </button>
            </div>

            <div v-if="submitSuccess" class="success-message">
              <i class="fa-solid fa-check-circle"></i>
              Tin nhắn đã được gửi thành công! Bạn sẽ nhận được trả lời sớm nhất.
            </div>

            <div v-if="submitError" class="error-message">
              <i class="fa-solid fa-exclamation-circle"></i>
              {{ submitError }}
            </div>
          </form>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import ContactService from '@/services/contact.service';
import { showToast } from '@/utils/toast';

export default {
  components: {
    AppHeader,
    AppFooter
  },
  setup() {
    // Form data
    const formData = ref({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });

    // State
    const userMessages = ref([]);
    const selectedMessage = ref(null);
    const isLoadingMessages = ref(false);
    const isSubmitting = ref(false);
    const submitSuccess = ref(false);
    const submitError = ref('');
    const newMessageSection = ref(null);

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
    const loadMessages = async () => {
      isLoadingMessages.value = true;
      try {
        const response = await ContactService.getAll();
        const allMessages = response.data || response;
        const userEmail = formData.value.email || localStorage.getItem('user_email');
        
        // Filter messages by user email
        userMessages.value = allMessages
          .filter(msg => msg.email === userEmail)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } catch (error) {
        console.error('Error loading messages:', error);
        showToast('Lỗi tải tin nhắn', 'error');
      } finally {
        isLoadingMessages.value = false;
      }
    };

    // Select message
    const selectMessage = async (msg) => {
      selectedMessage.value = msg;
      
      // Mark as read if unread
      if (msg.status === 'unread') {
        try {
          await ContactService.markAsRead(msg._id);
          msg.status = 'read';
        } catch (error) {
          console.error('Error marking as read:', error);
        }
      }
    };

    // Mark current message as read
    const markAsRead = async () => {
      if (!selectedMessage.value) return;
      try {
        await ContactService.markAsRead(selectedMessage.value._id);
        selectedMessage.value.status = 'read';
        showToast('Đã đánh dấu là đã xem', 'success');
      } catch (error) {
        showToast('Lỗi cập nhật', 'error');
      }
    };

    // Submit form
    const submitForm = async () => {
      if (!formData.value.name || !formData.value.email || !formData.value.subject || !formData.value.message) {
        showToast('Vui lòng điền đầy đủ các trường bắt buộc', 'error');
        return;
      }

      if (formData.value.message.length < 10) {
        showToast('Tin nhắn phải có ít nhất 10 ký tự', 'error');
        return;
      }

      isSubmitting.value = true;
      submitError.value = '';

      try {
        await ContactService.create(formData.value);
        submitSuccess.value = true;
        showToast('Gửi tin nhắn thành công!', 'success');

        // Reset form
        formData.value.subject = '';
        formData.value.message = '';

        // Reload messages
        setTimeout(() => {
          loadMessages();
          submitSuccess.value = false;
        }, 2000);
      } catch (error) {
        submitError.value = 'Gửi tin nhắn thất bại. Vui lòng thử lại.';
        showToast(submitError.value, 'error');
      } finally {
        isSubmitting.value = false;
      }
    };

    // Scroll to new message form
    const scrollToNewMessage = () => {
      newMessageSection.value?.scrollIntoView({ behavior: 'smooth' });
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

    onMounted(() => {
      loadUserData();
      loadMessages();
    });

    return {
      formData,
      userMessages,
      selectedMessage,
      isLoadingMessages,
      isSubmitting,
      submitSuccess,
      submitError,
      newMessageSection,
      selectMessage,
      markAsRead,
      submitForm,
      scrollToNewMessage,
      formatDateTime,
      formatTime,
      messagePreview,
      subjectLabel
    };
  }
};
</script>

<style scoped>
.contact-page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.contact-chat-container {
  flex: 1;
  padding: 30px 20px;
}

/* Header */
.chat-header {
  text-align: center;
  margin-bottom: 30px;
}

.chat-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.chat-header i {
  color: #667eea;
  font-size: 28px;
}

.subtitle {
  font-size: 16px;
  color: #666;
}

/* Chat Wrapper */
.chat-wrapper {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  height: 600px;
}

/* Sidebar */
.messages-sidebar {
  width: 280px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-header i {
  color: #667eea;
  font-size: 16px;
}

.message-count {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Messages List */
.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.loading-state,
.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 12px;
  text-align: center;
}

.loading-state i,
.empty-messages i {
  font-size: 32px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.message-item {
  padding: 12px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.message-item:hover {
  background: #f9f9f9;
}

.message-item.active {
  background: #e8eaf6;
  border-left: 3px solid #667eea;
}

.message-item.unread {
  background: #fffbfb;
  font-weight: 500;
}

.message-preview {
  margin-bottom: 6px;
}

.subject-preview {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.text-preview {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
}

.badge {
  display: inline-block;
  font-size: 10px;
}

.badge.unread {
  color: #ff6b6b;
}

.badge.replied {
  color: #51cf66;
}

.time-badge {
  color: #999;
  font-size: 10px;
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
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.3;
}

.empty-chat h2 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.empty-chat p {
  margin: 0;
  font-size: 14px;
}

/* Chat Content */
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-top-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h3 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #333;
}

.header-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-status {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.status-badge.unread {
  background: #ffe0e0;
  color: #d63031;
}

.status-badge.replied {
  background: #d4edda;
  color: #155724;
}

.status-badge.read {
  background: #e7e7ff;
  color: #667eea;
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

.message-label {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  text-transform: uppercase;
  padding: 0 8px;
}

.message-box {
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
  max-width: 80%;
}

.user-message {
  background: #f0f0f0;
  color: #333;
}

.admin-message {
  background: #667eea;
  color: white;
  align-self: flex-end;
}

.contact-info-display {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 12px;
}

.info-line {
  margin-bottom: 4px;
}

.info-line strong {
  margin-right: 4px;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 8px 0;
}

.message-timestamp {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 6px;
}

.no-reply-notice {
  background: #fff3cd;
  border-left: 3px solid #ffc107;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  color: #856404;
}

.no-reply-notice i {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.no-reply-notice p {
  margin: 0;
  font-size: 13px;
}

/* Chat Actions */
.chat-actions {
  padding: 12px 15px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
}

/* Buttons */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  flex: 1;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

/* New Message Section */
.new-message-section {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 30px;
}

.form-container h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-container h2 i {
  color: #667eea;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.success-message,
.error-message {
  padding: 12px 15px;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Scrollbar */
.messages-list::-webkit-scrollbar,
.message-thread::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-track,
.message-thread::-webkit-scrollbar-track {
  background: transparent;
}

.messages-list::-webkit-scrollbar-thumb,
.message-thread::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.messages-list::-webkit-scrollbar-thumb:hover,
.message-thread::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Responsive */
@media (max-width: 1024px) {
  .chat-wrapper {
    height: 500px;
  }

  .messages-sidebar {
    width: 250px;
  }

  .form-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .status-badge {
    font-size: 10px;
    padding: 4px 10px;
  }
}

@media (max-width: 768px) {
  .chat-wrapper {
    flex-direction: column;
    height: auto;
    min-height: 500px;
  }

  .messages-sidebar {
    width: 100%;
    height: 250px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .chat-area {
    flex: 1;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .new-message-section {
    padding: 20px;
  }

  .chat-top-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .message-box {
    max-width: 100%;
  }

  .admin-message {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .chat-header h1 {
    font-size: 24px;
  }

  .chat-top-header {
    padding: 10px;
  }

  .message-thread {
    padding: 15px 10px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
</style>
