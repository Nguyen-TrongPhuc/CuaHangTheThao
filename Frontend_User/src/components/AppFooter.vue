<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section about">
        <h3>SportStore</h3>
        <p>
          Nơi cung cấp các sản phẩm thể thao chính hãng, chất lượng cao. 
          Đồng hành cùng đam mê của bạn trên mọi chặng đường.
        </p>
      </div>

      <div class="footer-section links">
        <h3>Liên kết nhanh</h3>
        <ul>
          <li><router-link to="/">Trang chủ</router-link></li>
          <li><router-link to="/products">Sản phẩm</router-link></li>
          <li><router-link to="/about">Về chúng tôi</router-link></li>
          <li><router-link to="/contact">Liên hệ</router-link></li>
        </ul>
      </div>

      <div class="footer-section contact">
        <h3>Liên hệ</h3>
        <p class="contact-item"><MapPin :size="18" class="icon" /> 123 Đường 3/2, Cần Thơ</p>
        <p class="contact-item"><Phone :size="18" class="icon" /> 0999 999 999</p>
        <p class="contact-item"><Mail :size="18" class="icon" /> support@sportstore.com</p>
      </div>
    </div>

    <div class="footer-bottom">
      © 2026 SportStore. All rights reserved.
    </div>

    <!-- Nút quay lại đầu trang -->
    <button 
      v-show="showBackToTop" 
      class="back-to-top" 
      @click="scrollToTop"
      title="Lên đầu trang"
    >
      <ArrowUp :size="20" />
    </button>
  </footer>
</template>

<script>
import { MapPin, Phone, Mail, ArrowUp } from 'lucide-vue-next';

export default {
  components: { MapPin, Phone, Mail, ArrowUp },
  data() {
    return { showBackToTop: false };
  },
  methods: {
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    handleScroll() {
      this.showBackToTop = window.scrollY > 300;
    }
  },
  mounted() { window.addEventListener('scroll', this.handleScroll); },
  unmounted() { window.removeEventListener('scroll', this.handleScroll); }
};
</script>

<style scoped>
.footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding-top: 40px;
  margin-top: auto;
}

.footer-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 10%;
  padding-bottom: 40px;
}

.footer-section {
  flex: 1;
  min-width: 250px;
  margin: 20px;
}

.footer-section h3 {
  margin-bottom: 20px;
  color: #00c6ff;
  font-size: 18px;
  text-transform: uppercase;
}

.about p {
  line-height: 1.6;
  color: #bdc3c7;
}

.links ul {
  list-style: none;
  padding: 0;
}

.links ul li a {
  color: #bdc3c7;
  text-decoration: none;
  display: block;
  margin-bottom: 10px;
  transition: color 0.3s;
}

.links ul li a:hover {
  color: #00c6ff;
  padding-left: 5px;
}

.contact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
  color: #bdc3c7;
  white-space: nowrap;
}

.icon {
  color: #00c6ff;
  stroke-width: 2;
}

.footer-bottom {
  background: #1a252f;
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: #7f8c8d;
}

.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #302b63;
  color: white;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s;
  z-index: 999;
}

.back-to-top:hover {
  background: #00c6ff;
  transform: translateY(-5px);
}
</style>
