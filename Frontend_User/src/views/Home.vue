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

      <!-- 1. Danh mục sản phẩm (Categories Grid) -->
      <section class="section-container categories-section">
        <h2 class="section-title">Danh mục nổi bật</h2>
        <div class="categories-grid">
          <div 
            v-for="cat in categories" 
            :key="cat._id" 
            class="category-card"
            @click="filterByCategory(cat._id)"
          >
            <div class="cat-icon">
              <i :class="getCategoryIcon(cat.name)"></i>
            </div>
            <span class="cat-name">{{ cat.name }}</span>
          </div>
        </div>
      </section>

      <!-- 2. Sản phẩm Mới nhất (New Arrivals) -->
      <section class="section-container new-arrivals" id="shop-now">
        <div class="section-header">
          <h2 class="section-title">Sản phẩm Mới nhất</h2>
          <router-link to="/products" class="view-all-link">Xem tất cả <i class="fa-solid fa-arrow-right"></i></router-link>
        </div>
        <div class="product-grid">
          <div v-for="product in newArrivals" :key="product._id" class="product-card" @click="goToProductDetail(product._id)">
            <div class="image-container">
              <img :src="(product.images && product.images.length ? product.images[0].url : product.image) || 'https://via.placeholder.com/300'" :alt="product.name" />
              <span class="badge-new">Mới</span>
            </div>
            <div class="card-body">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-meta">
                <span class="category">{{ product.category_name || 'Thể thao' }}</span>
                <span class="price">{{ formatPrice(product.price) }}đ</span>
              </div>
              <button class="btn-buy-now" @click.stop="goToProductDetail(product._id)">
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Sản phẩm Gợi ý (Personalized Recommendations) -->
      <section class="section-container recommendations-section">
        <div class="section-header center">
          <h2 class="section-title">Gợi ý dành riêng cho bạn</h2>
          <p class="section-subtitle">Dựa trên sở thích và xu hướng thể thao hiện nay</p>
        </div>
        <div class="product-grid">
          <div v-for="product in recommendedProducts" :key="product._id" class="product-card" @click="goToProductDetail(product._id)">
            <div class="image-container">
              <img :src="(product.images && product.images.length ? product.images[0].url : product.image) || 'https://via.placeholder.com/300'" :alt="product.name" />
            </div>
            <div class="card-body">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-meta">
                <span class="category">{{ product.category_name || 'Gợi ý' }}</span>
                <span class="price">{{ formatPrice(product.price) }}đ</span>
              </div>
              <button class="btn-buy-now" @click.stop="goToProductDetail(product._id)">
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Sản phẩm Bán chạy/Khuyến mãi -->
      <section class="section-container best-sellers">
        <h2 class="section-title">Sản phẩm Bán chạy</h2>
        <div class="product-grid">
          <div v-for="product in bestSellers" :key="product._id" class="product-card" @click="goToProductDetail(product._id)">
            <div class="image-container">
              <img :src="(product.images && product.images.length ? product.images[0].url : product.image) || 'https://via.placeholder.com/300'" :alt="product.name" />
              <span class="badge-hot">Hot</span>
            </div>
            <div class="card-body">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-meta">
                <span class="sold-count"><i class="fa-solid fa-fire"></i> Đã bán {{ product.sold || 0 }}</span>
                <span class="price">{{ formatPrice(product.price) }}đ</span>
              </div>
              <button class="btn-buy-now" @click.stop="goToProductDetail(product._id)">
                Xem chi tiết
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
      allProducts: [],
      newArrivals: [],
      recommendedProducts: [],
      bestSellers: [],
      categories: [],
      sports: [],
    };
  },
  methods: {
    async fetchProducts() {
      try {
        const response = await ProductService.getAll();
        this.allProducts = Array.isArray(response) ? response : [];

        // 1. New Arrivals: Chỉ lấy sản phẩm được tạo trong vòng 30 ngày gần đây
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        this.newArrivals = this.allProducts.filter(p => {
            return p.createdAt && new Date(p.createdAt) >= thirtyDaysAgo;
        }).slice(0, 8);

        // 2. Recommendations: Lấy ngẫu nhiên hoặc theo logic (ở đây lấy đoạn giữa làm ví dụ)
        this.recommendedProducts = [...this.allProducts].sort(() => 0.5 - Math.random()).slice(0, 4);

        // 3. Best Sellers: Sắp xếp giảm dần VÀ CHỈ LẤY sản phẩm có lượt bán > 0
        this.bestSellers = [...this.allProducts]
            .filter(p => (p.sold || 0) > 0)
            .sort((a, b) => (b.sold || 0) - (a.sold || 0))
            .slice(0, 8);

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
    },
    getCategoryIcon(name) {
      // Helper đơn giản để map icon
      const n = name.toLowerCase();
      if (n.includes('giày')) return 'fa-solid fa-shoe-prints';
      if (n.includes('áo') || n.includes('quần')) return 'fa-solid fa-shirt';
      if (n.includes('bóng')) return 'fa-solid fa-futbol';
      if (n.includes('vợt')) return 'fa-solid fa-table-tennis-paddle-ball';
      if (n.includes('túi') || n.includes('balo')) return 'fa-solid fa-bag-shopping';
      if (n.includes('phụ kiện')) return 'fa-solid fa-socks';
      return 'fa-solid fa-layer-group';
    },
    filterByCategory(id) {
      // Chuyển hướng sang trang tìm kiếm/sản phẩm với filter category
      this.$router.push({ name: 'product.search', query: { category: id } }); 
      // Lưu ý: Cần update SearchView để nhận query param 'category' nếu chưa hỗ trợ, 
      // hoặc chuyển sang trang /products nếu trang đó hỗ trợ filter.
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

/* General Section Styles */
.section-container {
  padding: 60px 10%;
  margin-bottom: 20px;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
  position: relative;
  font-weight: 700;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
  border-bottom: 2px solid #eee;
  padding-bottom: 15px;
}

.section-header.center {
  flex-direction: column;
  align-items: center;
  border-bottom: none;
}

.section-subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-top: 5px;
}

.view-all-link {
  color: #302b63;
  text-decoration: none;
  font-weight: 600;
  transition: 0.3s;
}
.view-all-link:hover {
  color: #e74c3c;
  transform: translateX(5px);
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 25px;
  justify-items: center;
}

.category-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid transparent;
}

.category-card:hover {
  transform: translateY(-5px);
  border-color: #302b63;
  box-shadow: 0 10px 25px rgba(48, 43, 99, 0.15);
}

.cat-icon {
  font-size: 2.5rem;
  color: #302b63;
  margin-bottom: 15px;
}

.cat-name {
  font-weight: 600;
  color: #2c3e50;
  display: block;
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
}

.product-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
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
  position: relative;
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

.badge-new, .badge-hot {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  border-radius: 4px;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  z-index: 2;
}
.badge-new { background: #27ae60; }
.badge-hot { background: #e74c3c; }

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

.sold-count {
  font-size: 0.85rem;
  color: #e67e22;
  font-weight: 600;
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
  background: white;
  color: #302b63;
  border: 1px solid #302b63;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-buy-now:hover {
  background: #302b63;
  color: white;
  transform: translateY(-2px);
}

/* Recommendations Section Specifics */
.recommendations-section {
  background: linear-gradient(to bottom, #f9f9f9, #fff);
  padding-top: 80px;
  padding-bottom: 80px;
}
</style>