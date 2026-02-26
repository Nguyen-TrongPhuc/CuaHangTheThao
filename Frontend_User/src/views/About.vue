<template>
  <div class="page-container">
    <AppHeader />
    
    <main class="about-content">
      <!-- Hero Section -->
      <section class="about-hero">
        <div class="hero-text">
          <h1>Về SportStore</h1>
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
              <i class="fa-solid fa-medal"></i>
              <h3>Chất lượng hàng đầu</h3>
              <p>Cam kết sản phẩm chính hãng, bền bỉ và hỗ trợ tối đa hiệu suất thi đấu.</p>
            </div>
            <div class="value-card">
              <i class="fa-solid fa-heart"></i>
              <h3>Đam mê</h3>
              <p>Chúng tôi làm việc với tình yêu thể thao và mong muốn lan tỏa tinh thần đó.</p>
            </div>
            <div class="value-card">
              <i class="fa-solid fa-users"></i>
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

export default {
  components: { AppHeader, AppFooter }
};
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.about-hero {
  background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://www.fcbarcelona.com/photo-resources/2025/07/16/2f518d18-a8fb-4128-aa71-0b1c4c80638a/202507_1st_Kit_Sorteig_Leads_Banner_1800x900_01_ENG.jpg?width=1200&height=525');
  background-size: cover;
  background-position: center;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}

.hero-text h1 { font-size: 3rem; margin-bottom: 10px; }
.hero-text p { font-size: 1.2rem; font-weight: 300; }

.container { max-width: 1100px; margin: 0 auto; padding: 60px 20px; }

.section { margin-bottom: 80px; }
.section h2 { text-align: center; color: #2c3e50; font-size: 2rem; margin-bottom: 40px; position: relative; }
.section h2::after { content: ''; display: block; width: 60px; height: 4px; background: #302b63; margin: 15px auto 0; }

/* Story */
.story { display: flex; gap: 50px; align-items: center; }
.story .text { flex: 1; font-size: 1.1rem; line-height: 1.8; color: #555; }
.story .image { flex: 1; }
.story .image img { width: 100%; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }

/* Values */
.values-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
.value-card { text-align: center; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: transform 0.3s; }
.value-card:hover { transform: translateY(-10px); }
.value-card i { font-size: 3rem; color: #302b63; margin-bottom: 20px; }
.value-card h3 { margin-bottom: 15px; color: #333; }
.value-card p { color: #666; line-height: 1.6; }

/* CTA */
.cta { text-align: center; background: #f9f9f9; padding: 60px; border-radius: 15px; }
.cta p { font-size: 1.2rem; margin-bottom: 30px; color: #555; }
.btn-shop { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #0f0c29, #302b63); color: white; text-decoration: none; border-radius: 30px; font-weight: bold; transition: 0.3s; }
.btn-shop:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(48, 43, 99, 0.3); }

@media (max-width: 768px) {
  .story { flex-direction: column; }
  .about-hero { height: 200px; }
  .hero-text h1 { font-size: 2rem; }
}
</style>