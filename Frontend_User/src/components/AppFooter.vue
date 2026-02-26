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
        <p><i class="fa-solid fa-map-location-dot"></i> 123 Đường 3/2, Cần Thơ</p>
        <p><i class="fa-solid fa-phone"></i> 0999 999 999</p>
        <p><i class="fa-solid fa-envelope"></i> support@sportstore.com</p>
      </div>
    </div>

    <div class="footer-bottom">
      &copy; 2026 SportStore. All rights reserved.
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding-top: 40px;
  margin-top: auto; /* Đẩy footer xuống đáy nếu nội dung ngắn */
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

.contact p {
  margin-bottom: 10px;
  color: #bdc3c7;
}

.contact i {
  margin-right: 10px;
  color: #00c6ff;
}

.footer-bottom {
  background: #1a252f;
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: #7f8c8d;
}
</style>