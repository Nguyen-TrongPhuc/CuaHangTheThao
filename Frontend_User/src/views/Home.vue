<template>
  <div class="home-container">
    <AppHeader />

    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-banner">
        <div class="hero-content">
          <h1>Bứt phá giới hạn bản thân</h1>
          <p>Trang bị thể thao chuyên nghiệp cho mọi đam mê.</p>
          <button class="btn-cta" @click="scrollToProducts">Mua sắm ngay</button>
        </div>
      </section>

      <!-- Product Section -->
      <section class="products-section" id="shop-now">
        <h2 class="section-title">Sản phẩm nổi bật</h2>
        
        <!-- Bộ lọc -->
        <div class="filters-bar">
          <select v-model="selectedCategory" class="filter-select">
            <option value="">-- Tất cả danh mục --</option>
            <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
          </select>
          <select v-model="selectedSport" class="filter-select">
            <option value="">-- Tất cả môn thể thao --</option>
            <option v-for="s in sports" :key="s._id" :value="s._id">{{ s.name }}</option>
          </select>
        </div>

        <div class="product-grid">
          <div v-for="product in filteredProducts" :key="product._id" class="product-card" @click="goToProductDetail(product._id)">
            <div class="image-container">
              <img :src="product.image || 'https://via.placeholder.com/300'" :alt="product.name" />
            </div>
            <div class="card-body">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-meta">
                <span class="category">{{ product.category_name || 'Thể thao' }}</span>
                <span class="price">{{ formatPrice(product.price) }}đ</span>
              </div>
              <button class="btn-buy-now" @click.stop="goToProductDetail(product._id)">
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script>
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import ProductService from "@/services/products.service";
import CategoryService from "@/services/categories.service";
import SportService from "@/services/sports.service";
import { showToast } from "@/utils/toast";

export default {
  components: {
    AppHeader,
    AppFooter
  },
  data() {
    return { 
      products: [],
      categories: [],
      sports: [],
      selectedCategory: "",
      selectedSport: ""
    };
  },
  computed: {
    filteredProducts() {
      return this.products.filter(p => {
        // So sánh ID dạng chuỗi để tránh lỗi khác kiểu dữ liệu
        const matchCat = this.selectedCategory ? String(p.category_id) === String(this.selectedCategory) : true;
        const matchSport = this.selectedSport ? String(p.sport_id) === String(this.selectedSport) : true;
        return matchCat && matchSport;
      });
    }
  },
  methods: {
    async fetchProducts() {
      try {
        this.products = await ProductService.getAll();
      } catch (error) {
        console.error("Lỗi tải sản phẩm", error);
      }
    },
    async fetchFilters() {
      try {
        const [cats, sports] = await Promise.all([
          CategoryService.getAll(),
          SportService.getAll()
        ]);
        this.categories = cats;
        this.sports = sports;
      } catch (error) {
        console.error("Lỗi tải bộ lọc", error);
      }
    },
    formatPrice(v) { return new Intl.NumberFormat('vi-VN').format(v); },
    goToProductDetail(id) {
      this.$router.push({ name: 'product.detail', params: { id } });
    },
    scrollToProducts() {
      document.getElementById('shop-now').scrollIntoView({ behavior: 'smooth' });
    }
  },
  mounted() { 
    this.fetchProducts(); 
    this.fetchFilters();
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.main-content {
  flex: 1;
  background-color: #f9f9f9;
}

/* Hero Banner */
.hero-banner {
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

.hero-content h1 {
  font-size: 3.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.hero-content p {
  font-size: 1.5rem;
  margin-bottom: 30px;
}

.btn-cta {
  padding: 12px 30px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: transform 0.3s, background-color 0.3s;
}

.btn-cta:hover {
  background: linear-gradient(135deg, #24243e, #302b63, #0f0c29);
  box-shadow: 0 5px 15px rgba(48, 43, 99, 0.4);
  transform: translateY(-3px);
}

/* Products Section */
.products-section {
  padding: 60px 10%;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 40px;
  position: relative;
}

.section-title::after {
  content: '';
  display: block;
  width: 60px;
  height: 4px;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  margin: 10px auto 0;
  border-radius: 2px;
}

.filters-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 25px;
  background-color: white;
  font-size: 1rem;
  color: #2c3e50;
  outline: none;
  cursor: pointer;
  transition: border-color 0.3s;
}

.filter-select:focus {
  border-color: #302b63;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
}

/* Product Card */
.product-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.1);
}

.image-container {
  height: 250px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Đảm bảo ảnh không bị méo */
  transition: transform 0.5s;
}

.product-card:hover .image-container img {
  transform: scale(1.1);
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.category {
  font-size: 0.9rem;
  color: #7f8c8d;
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #302b63;
}

.btn-buy-now {
  margin-top: auto;
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #ff5722, #f4511e);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-buy-now:hover {
  background: linear-gradient(135deg, #f4511e, #e64a19);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(244, 81, 30, 0.3);
}
</style>