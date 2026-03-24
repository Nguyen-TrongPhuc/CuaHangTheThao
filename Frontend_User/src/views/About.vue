<template>
  <div class="page-container">
    <AppHeader />
    
    <main class="about-content">
      <!-- Hero Section -->
      <section class="about-hero">
        <div class="hero-text">
          <h1> SportStore</h1>
          <p>Đồng hành cùng đam mê thể thao của bạn</p>
        </div>
      </section>

      <div class="container">
        <!-- Story Section -->
        <section class="section story">
          <div class="text">
            <h2>Câu chuyện của chúng tôi</h2>
            <p>
              Được thành lập vào năm 2024, SportStore bắt đầu với một sứ mệnh đơn giản: mang đến những sản phẩm thể thao chất lượng nhất cho cộng đồng người yêu vận động tại Việt Nam. 
              Chúng tôi tin rằng thể thao không chỉ là rèn luyện sức khỏe, mà còn là phong cách sống, là niềm đam mê và sự kết nối.
            </p>
            <p>
              Từ một cửa hàng nhỏ, SportStore đã phát triển thành hệ thống cung cấp đa dạng các mặt hàng từ quần áo, giày dép đến dụng cụ thi đấu cho nhiều môn thể thao như Bóng đá, Bóng rổ, Cầu lông, Gym & Yoga...
            </p>
          </div>
          <div class="image">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg9MsfkL7RM0BYWWOJBE6CX4sa9kl0IR9YZA&s" alt="Our Story" />
          </div>
        </section>

        <!-- Values Section -->
        <section class="section values">
          <h2>Giá trị cốt lõi</h2>
          <div class="values-grid">
            <div class="value-card">
            <Medal :size="48" class="val-icon" />
              <h3>Chất lượng hàng đầu</h3>
              <p>Cam kết sản phẩm chính hãng, bền bỉ và hỗ trợ tối đa hiệu suất thi đấu.</p>
            </div>
            <div class="value-card">
            <Heart :size="48" class="val-icon" />
              <h3>Đam mê</h3>
              <p>Chúng tôi làm việc với tình yêu thể thao và mong muốn lan tỏa tinh thần đó.</p>
            </div>
            <div class="value-card">
            <Users :size="48" class="val-icon" />
              <h3>Cộng đồng</h3>
              <p>Xây dựng cộng đồng người yêu thể thao lành mạnh và gắn kết.</p>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="section cta">
          <h2>Sẵn sàng bứt phá giới hạn?</h2>
          <p>Khám phá ngay bộ sưu tập mới nhất của chúng tôi.</p>
          <router-link to="/products" class="btn-shop">Mua sắm ngay</router-link>
        </section>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script>
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { Medal, Heart, Users } from "lucide-vue-next";

export default {
  components: { AppHeader, AppFooter, Medal, Heart, Users }
};
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.about-hero {
  position: relative;
  background: url('https://www.fcbarcelona.com/photo-resources/2025/07/16/2f518d18-a8fb-4128-aa71-0b1c4c80638a/202507_1st_Kit_Sorteig_Leads_Banner_1800x900_01_ENG.jpg?width=1200&height=525') no-repeat center center/cover;
  height: 550px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}
.about-hero::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
  z-index: 1;
}
.hero-text {
  position: relative;
  z-index: 2;
  animation: fadeInDown 1s ease-out;
  padding: 0 20px;
}
.hero-text h1 { font-size: 4rem; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
.hero-text p { font-size: 1.5rem; font-weight: 300; color: #e0e0e0; }

.container { max-width: 1200px; margin: 0 auto; padding: 80px 20px; }

.section { margin-bottom: 80px; }
.section h2 { text-align: center; color: #2c3e50; font-size: 2.2rem; font-weight: 800; text-transform: uppercase; margin-bottom: 40px; position: relative; }
.section h2::after { content: ''; display: block; width: 60px; height: 4px; background: #ee4d2d; margin: 15px auto 0; border-radius: 2px; }

/* Story */
.story { display: flex; gap: 50px; align-items: center; }
.story .text { flex: 1; font-size: 1.1rem; line-height: 1.8; color: #555; }
.story .image { flex: 1; }
.story .image img { width: 100%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }

/* Values */
.values-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
.value-card { text-align: center; padding: 40px 20px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); border: 1px solid #f0f0f0; }
.value-card:hover { transform: translateY(-8px); box-shadow: 0 12px 25px rgba(0,0,0,0.1); border-color: #ee4d2d; }
.val-icon { color: #ee4d2d; margin-bottom: 20px; transition: transform 0.3s; }
.value-card:hover .val-icon { transform: scale(1.1); }
.value-card h3 { margin-bottom: 15px; color: #333; font-size: 1.3rem; }
.value-card p { color: #666; line-height: 1.6; }

/* CTA */
.cta { text-align: center; background: #f8f9fa; padding: 60px; border-radius: 12px; border: 1px solid #eee; }
.cta p { font-size: 1.2rem; margin-bottom: 30px; color: #555; }
.btn-shop { display: inline-block; padding: 15px 40px; background: #ee4d2d; color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 1.2rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(238, 77, 45, 0.4); text-transform: uppercase; letter-spacing: 1px; }
.btn-shop:hover { transform: translateY(-3px); background: #d73211; box-shadow: 0 6px 20px rgba(238, 77, 45, 0.6); }

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .story { flex-direction: column; }
  .about-hero { height: 300px; }
  .hero-text h1 { font-size: 2.5rem; }
}
</style>