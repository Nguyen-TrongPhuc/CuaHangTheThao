<template>
  <div class="contact-replies-wrapper">
    <AppHeader />

    <main class="replies-container">
      <div class="replies-header">
        <h1><i class="fa-solid fa-inbox"></i> Trả lời liên hệ</h1>
        <p class="subtitle">Xem tất cả các trả lời từ quản lý</p>
      </div>

      <div class="replies-content">
        <div v-if="isLoading" class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i> Đang tải...
        </div>

        <div v-else-if="contacts.length === 0" class="empty-state">
          <i class="fa-solid fa-inbox"></i>
          <h2>Chưa có tin nhắn nào</h2>
          <p>Gửi một tin nhắn liên hệ để nhận được trả lời từ chúng tôi</p>
          <router-link to="/contact" class="btn btn-primary">
            <i class="fa-solid fa-paper-plane"></i> Gửi tin nhắn
          </router-link>
        </div>

        <div v-else class="replies-list">
          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button 
              v-for="status in ['all', 'unread', 'replied']"
              :key="status"
              @click="filterStatus = (status === 'all' ? '' : status)"
              :class="['tab-btn', { active: (status === 'all' ? filterStatus === '' : filterStatus === status) }]"
            >
              <i v-if="status === 'unread'" class="fa-solid fa-envelope"></i>
              <i v-else-if="status === 'replied'" class="fa-solid fa-check-circle"></i>
              <i v-else class="fa-solid fa-list"></i>
              {{ getTabLabel(status) }}
              <span class="count">{{ getStatusCount(status) }}</span>
            </button>
          </div>

          <!-- Replies Cards -->
          <div class="replies-grid">
            <div 
              v-for="contact in filteredContacts"
              :key="contact._id"
              :class="['reply-card', { unread: contact.status === 'unread', replied: contact.status === 'replied' }]"
            >
              <!-- Header with Status -->
              <div class="card-header">
                <div class="header-left">
                  <h3>{{ contact.subject ? subjectLabel(contact.subject) : 'Không có chủ đề' }}</h3>
                  <div class="meta-info">
                    <span class="date"><i class="fa-solid fa-calendar"></i> {{ formatDate(contact.created_at) }}</span>
                    <span v-if="contact.status === 'unread'" class="badge unread">
                      <i class="fa-solid fa-envelope"></i> Chưa xem trả lời
                    </span>
                    <span v-else-if="contact.status === 'replied'" class="badge replied">
                      <i class="fa-solid fa-check-circle"></i> Đã trả lời
                    </span>
                    <span v-else class="badge read">
                      <i class="fa-solid fa-envelope-open"></i> Đã xem
                    </span>
                  </div>
                </div>
                <div class="header-right">
                  <button 
                    @click="toggleExpand(contact._id)"
                    :class="['toggle-btn', { expanded: expandedId === contact._id }]"
                  >
                    <i class="fa-solid fa-chevron-down"></i>
                  </button>
                </div>
              </div>

              <!-- Original Message Preview (Collapsed) -->
              <div v-if="expandedId !== contact._id" class="card-preview">
                <p class="preview-text">{{ messagePreview(contact.message) }}</p>
              </div>

              <!-- Full Content (Expanded) -->
              <div v-else class="card-content">
                <!-- Original Message Section -->
                <div class="message-section">
                  <h4><i class="fa-solid fa-user"></i> Tin nhắn của bạn</h4>
                  <div class="original-message">
                    <div class="contact-detail">
                      <strong>Chủ đề:</strong> {{ subjectLabel(contact.subject) }}
                    </div>
                    <div v-if="contact.phone" class="contact-detail">
                      <strong>Số điện thoại:</strong> <a :href="`tel:${contact.phone}`">{{ contact.phone }}</a>
                    </div>
                    <div v-if="contact.email" class="contact-detail">
                      <strong>Email:</strong> <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
                    </div>
                    <div class="message-text">{{ contact.message }}</div>
                    <div class="message-time">
                      <i class="fa-solid fa-clock"></i> {{ formatDateTime(contact.created_at) }}
                    </div>
                  </div>
                </div>

                <!-- Reply Section -->
                <div v-if="contact.status === 'replied'" class="message-section reply-section">
                  <h4><i class="fa-solid fa-reply"></i> Trả lời từ quản lý</h4>
                  <div class="reply-message">
                    <div class="message-text">{{ contact.reply_message }}</div>
                    <div class="message-time">
                      <i class="fa-solid fa-clock"></i> {{ formatDateTime(contact.replied_at) }}
                    </div>
                  </div>
                </div>

                <!-- No Reply Yet -->
                <div v-else class="message-section no-reply-section">
                  <div class="no-reply-notice">
                    <i class="fa-solid fa-hourglass-end"></i>
                    <p>Quản lý chưa trả lời tin nhắn này. Chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="card-actions">
                  <button 
                    @click="markAsRead(contact)"
                    v-if="contact.status === 'unread'"
                    class="btn btn-secondary"
                  >
                    <i class="fa-solid fa-check"></i> Đánh dấu đã xem
                  </button>
                  <router-link 
                    to="/contact" 
                    class="btn btn-secondary"
                  >
                    <i class="fa-solid fa-paper-plane"></i> Gửi tin nhắn mới
                  </router-link>
                </div>
              </div>
            </div>
          </div>
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
    const contacts = ref([]);
    const isLoading = ref(false);
    const filterStatus = ref('');
    const expandedId = ref(null);
    const userEmail = ref('');

    // Computed
    const filteredContacts = computed(() => {
      let filtered = contacts.value;
      
      // Filter by status
      if (filterStatus.value) {
        filtered = filtered.filter(c => c.status === filterStatus.value);
      }
      
      return filtered;
    });

    // Methods
    const loadUserData = () => {
      userEmail.value = localStorage.getItem('user_email') || '';
    };

    const loadContacts = async () => {
      if (!userEmail.value) {
        showToast('Vui lòng đăng nhập để xem trả lời', 'error');
        return;
      }

      isLoading.value = true;
      try {
        const response = await ContactService.getAll();
        const allContacts = response.data || response;
        
        // Filter contacts by user email
        contacts.value = allContacts
          .filter(c => c.email === userEmail.value)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } catch (error) {
        showToast('Lỗi tải dữ liệu', 'error');
        console.error(error);
      } finally {
        isLoading.value = false;
      }
    };

    const toggleExpand = (id) => {
      expandedId.value = expandedId.value === id ? null : id;
    };

    const markAsRead = async (contact) => {
      try {
        await ContactService.markAsRead(contact._id);
        contact.status = 'read';
        showToast('Đã đánh dấu là đã xem', 'success');
      } catch (error) {
        showToast('Lỗi cập nhật', 'error');
      }
    };

    const getTabLabel = (status) => {
      const labels = {
        'all': 'Tất cả',
        'unread': 'Chưa xem',
        'replied': 'Đã trả lời'
      };
      return labels[status] || status;
    };

    const getStatusCount = (status) => {
      if (status === 'all') return contacts.value.length;
      return contacts.value.filter(c => c.status === status).length;
    };

    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

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

    const messagePreview = (text) => {
      return text.length > 100 ? text.substring(0, 100) + '...' : text;
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
      loadContacts();
    });

    return {
      contacts,
      isLoading,
      filterStatus,
      expandedId,
      filteredContacts,
      toggleExpand,
      markAsRead,
      getTabLabel,
      getStatusCount,
      formatDate,
      formatDateTime,
      messagePreview,
      subjectLabel
    };
  }
};
</script>

<style scoped>
.contact-replies-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.replies-container {
  flex: 1;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.replies-header {
  text-align: center;
  margin-bottom: 40px;
}

.replies-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.replies-header i {
  color: #667eea;
  font-size: 28px;
}

.subtitle {
  font-size: 16px;
  color: #666;
}

.replies-content {
  width: 100%;
}

/* Loading & Empty State */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.loading-state i,
.empty-state i {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.tab-btn .count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.tab-btn.active .count {
  background: rgba(255, 255, 255, 0.3);
}

/* Replies Grid */
.replies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 20px;
}

.reply-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s;
  border-left: 4px solid #ddd;
}

.reply-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.reply-card.unread {
  border-left-color: #ff6b6b;
  background: #fffbfb;
}

.reply-card.replied {
  border-left-color: #51cf66;
}

/* Card Header */
.card-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.header-left {
  flex: 1;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
}

.date {
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge.unread {
  background: #ffe0e0;
  color: #d63031;
}

.badge.replied {
  background: #d4edda;
  color: #155724;
}

.badge.read {
  background: #e7e7ff;
  color: #667eea;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s;
}

.toggle-btn:hover {
  background: #e0e0e0;
}

.toggle-btn.expanded {
  color: #667eea;
  background: #e8eaf6;
}

.toggle-btn i {
  transition: transform 0.3s;
}

.toggle-btn.expanded i {
  transform: rotate(180deg);
}

/* Card Preview */
.card-preview {
  padding: 12px 16px;
  background: #fafafa;
}

.preview-text {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

/* Card Content */
.card-content {
  padding: 16px;
}

.message-section {
  margin-bottom: 20px;
}

.message-section:last-of-type {
  margin-bottom: 0;
}

.message-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-section h4 i {
  font-size: 14px;
}

.original-message,
.reply-message {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.reply-message {
  border-left-color: #51cf66;
}

.contact-detail {
  font-size: 12px;
  margin-bottom: 8px;
  color: #666;
}

.contact-detail strong {
  color: #333;
}

.contact-detail a {
  color: #667eea;
  text-decoration: none;
}

.contact-detail a:hover {
  text-decoration: underline;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 12px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-time {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.no-reply-section {
  margin-bottom: 0;
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
  margin-bottom: 8px;
  display: block;
}

.no-reply-notice p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

/* Card Actions */
.card-actions {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  padding: 8px 16px;
  font-size: 13px;
  flex: 1;
  min-width: 140px;
  justify-content: center;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

/* Responsive */
@media (max-width: 768px) {
  .replies-container {
    padding: 20px 15px;
  }

  .replies-header h1 {
    font-size: 24px;
  }

  .replies-grid {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
    justify-content: space-between;
  }

  .card-actions {
    flex-direction: column;
  }

  .btn-secondary {
    width: 100%;
    margin: 0;
  }

  .meta-info {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .replies-header h1 {
    font-size: 20px;
  }

  .card-header {
    flex-direction: column;
  }

  .toggle-btn {
    align-self: flex-end;
  }
}
</style>
