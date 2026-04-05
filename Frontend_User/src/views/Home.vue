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
              <component :is="getCategoryIcon(cat.name)" :size="40" stroke-width="1.5" />
            </div>
            <span class="cat-name">{{ cat.name }}</span>
          </div>
        </div>
      </section>

      <!-- 2. Sản phẩm Mới nhất (New Arrivals) -->
      <section class="section-container new-arrivals" id="shop-now">
        <div class="section-header">
          <h2 class="section-title">Sản phẩm Mới nhất</h2>
          <router-link :to="{ path: '/products', query: { sort: 'newest' } }" class="view-all-link" style="display:flex;align-items:center;gap:5px;">
            Xem tất cả <ArrowRight :size="16" />
          </router-link>
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
                <div class="price-box" style="text-align: right;">
                    <span v-if="loyalty && loyalty.discountPercent > 0" style="font-size: 0.8rem; color: #999; text-decoration: line-through; display: block;">
                        {{ formatPrice(product.price) }}đ
                    </span>
                    <span class="price">{{ formatPrice(getDisplayPrice(product.price)) }}đ</span>
                </div>
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
        <div class="section-header">
          <div>
            <h2 class="section-title" style="margin-bottom: 5px; text-align: left;">Sản phẩm Đánh giá cao</h2>
            <p class="section-subtitle" style="margin-bottom: 0;">Những sản phẩm được khách hàng yêu thích và đánh giá tốt nhất</p>
          </div>
          <router-link :to="{ path: '/products', query: { sort: 'rating' } }" class="view-all-link" style="display:flex;align-items:center;gap:5px;">
            Xem tất cả <ArrowRight :size="16" />
          </router-link>
        </div>
        <div class="product-grid">
          <div v-for="product in topRatedProducts" :key="product._id" class="product-card" @click="goToProductDetail(product._id)">
            <div class="image-container">
              <img :src="(product.images && product.images.length ? product.images[0].url : product.image) || 'https://via.placeholder.com/300'" :alt="product.name" />
            </div>
            <div class="card-body">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-meta">
                <div class="rating-display" style="display:flex; align-items:center;">
                  <template v-if="product.reviewCount > 0">
                    <Star v-for="n in 5" :key="n" :size="14" :class="[n <= Math.round(product.averageRating) ? 'star-active' : 'star-inactive']" />
                    <span style="color:#7f8c8d; font-size:0.85rem; margin-left:5px;">({{ product.averageRating.toFixed(1) }})</span>
                  </template>
                  <template v-else>
                    <span style="color:#999; font-size:0.85rem; font-style: italic;">Chưa có đánh giá</span>
                  </template>
                </div>
                <div class="price-box" style="text-align: right;">
                    <span v-if="loyalty && loyalty.discountPercent > 0" style="font-size: 0.8rem; color: #999; text-decoration: line-through; display: block;">
                        {{ formatPrice(product.price) }}đ
                    </span>
                    <span class="price">{{ formatPrice(getDisplayPrice(product.price)) }}đ</span>
                </div>
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
        <div class="section-header">
          <h2 class="section-title" style="margin-bottom: 0;">Sản phẩm Bán chạy</h2>
          <router-link :to="{ path: '/products', query: { sort: 'bestseller' } }" class="view-all-link" style="display:flex;align-items:center;gap:5px;">
            Xem tất cả <ArrowRight :size="16" />
          </router-link>
        </div>
        <div class="product-grid">
          <div v-for="product in bestSellers" :key="product._id" class="product-card" @click="goToProductDetail(product._id)">
            <div class="image-container">
              <img :src="(product.images && product.images.length ? product.images[0].url : product.image) || 'https://via.placeholder.com/300'" :alt="product.name" />
              <span class="badge-hot">Hot</span>
            </div>
            <div class="card-body">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-meta">
                <span class="sold-count" style="display:flex;align-items:center;gap:3px;">
                  <Flame :size="14" color="#e67e22" /> Đã bán {{ product.sold || 0 }}
                </span>
                <div class="price-box" style="text-align: right;">
                    <span v-if="loyalty && loyalty.discountPercent > 0" style="font-size: 0.8rem; color: #999; text-decoration: line-through; display: block;">
                        {{ formatPrice(product.price) }}đ
                    </span>
                    <span class="price">{{ formatPrice(getDisplayPrice(product.price)) }}đ</span>
                </div>
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
import CustomerService from "@/services/customer.service";
import { ArrowRight, Flame, Footprints, Shirt, Dribbble, Target, ShoppingBag, Wind, Layers, Star } from "lucide-vue-next";

export default {
  components: {
    AppHeader, AppFooter,
    ArrowRight, Flame, Footprints, Shirt, Dribbble, Target, ShoppingBag, Wind, Layers, Star
  },
  data() {
    return { 
      allProducts: [],
      newArrivals: [],
      topRatedProducts: [],
      bestSellers: [],
      categories: [],
      sports: [],
      loyalty: null,
    };
  },
  methods: {
    async fetchProducts() {
      try {
        const response = await ProductService.getAll();
        this.allProducts = Array.isArray(response) ? response : [];

        // 1. New Arrivals: Backend đã tự sắp xếp mới nhất -> cũ nhất (createdAt: -1).
        // Ta chỉ việc cắt lấy 8 sản phẩm đầu tiên mà không cần quan tâm ngày tạo.
        this.newArrivals = this.allProducts.slice(0, 8);

        // 2. Top Rated: Lấy 4 sản phẩm có ĐIỂM THẬT CAO NHẤT
        const productsWithReviews = this.allProducts
            .filter(p => p.averageRating > 0)
            .sort((a, b) => b.averageRating - a.averageRating || (b.reviewCount || 0) - (a.reviewCount || 0));
            
        if (productsWithReviews.length >= 8) {
            this.topRatedProducts = productsWithReviews.slice(0, 8);
        } else {
            // Nếu chưa có ai đánh giá (hoặc không đủ 8), tự thêm ngẫu nhiên cho đầy 8 khung của giao diện
            const others = this.allProducts.filter(p => p.averageRating === 0).sort(() => 0.5 - Math.random());
            this.topRatedProducts = [...productsWithReviews, ...others].slice(0, 8);
        }

        // 3. Best Sellers: Sắp xếp giảm dần lượt bán (Lấy luôn cả những sản phẩm chưa bán được cho đủ 8 cái)
        this.bestSellers = [...this.allProducts]
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
    async fetchLoyalty() {
        const token = localStorage.getItem("user_token");
        if (!token) return;

        try {
            this.loyalty = await CustomerService.getLoyalty();
        } catch (e) {
            // Ignore if not logged in
        }
    },
    getDisplayPrice(price) {
        if (this.loyalty && this.loyalty.discountPercent > 0) {
            return Math.round(price * (1 - this.loyalty.discountPercent / 100));
        }
        return price;
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
      if (n.includes('giày')) return 'Footprints';
      if (n.includes('áo') || n.includes('quần')) return 'Shirt';
      if (n.includes('bóng')) return 'Dribbble';
      if (n.includes('vợt')) return 'Target';
      if (n.includes('túi') || n.includes('balo')) return 'ShoppingBag';
      if (n.includes('phụ kiện')) return 'Wind';
      return 'Layers';
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
    this.fetchLoyalty();
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.main-content {
  flex: 1;
  background-color: #fff;
}

/* Hero Banner */
.hero-banner {
  position: relative;
  background: url('https://www.fcbarcelona.com/photo-resources/2025/07/16/2f518d18-a8fb-4128-aa71-0b1c4c80638a/202507_1st_Kit_Sorteig_Leads_Banner_1800x900_01_ENG.jpg?width=1200&height=525') no-repeat center center/cover;
  height: 550px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  margin-bottom: 0;
}

.hero-banner::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  padding: 0 20px;
  animation: fadeInDown 1s ease-out;
}

.hero-content h1 {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.hero-content p {
  font-size: 1.5rem;
  margin-bottom: 40px;
  font-weight: 300;
  color: #e0e0e0;
}

.btn-cta {
  padding: 15px 40px;
  font-size: 1.2rem;
  font-weight: 600;
  background: #ee4d2d;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(238, 77, 45, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-cta:hover {
  background: #d73211;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(238, 77, 45, 0.6);
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* General Section Styles */
.section-container {
  padding: 80px 10%;
  background: white;
}

.section-container:nth-child(even) {
  background: #f8f9fa;
}

.section-title {
  text-align: center;
  font-size: 2.2rem;
  color: #2c3e50;
  margin-bottom: 40px;
  font-weight: 800;
  text-transform: uppercase;
  position: relative;
}

.section-title::after {
  content: '';
  display: block;
  width: 60px;
  height: 4px;
  background: #ee4d2d;
  margin: 15px auto 0;
  border-radius: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.section-header .section-title {
  margin-bottom: 0;
  text-align: left;
}

.section-header .section-title::after {
  margin: 15px 0 0 0;
}

.section-header.center {
  flex-direction: column;
  align-items: center;
}

.section-header.center .section-title::after {
  margin: 15px auto 0;
}

.section-subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-top: 5px;
  margin-bottom: 30px;
}

.view-all-link {
  color: #ee4d2d;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.05rem;
  padding: 8px 20px;
  border: 1px solid #ee4d2d;
  border-radius: 20px;
  transition: 0.3s;
}

.view-all-link:hover {
  background: #ee4d2d;
  color: white;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
}

.category-card {
  background: white;
  border-radius: 12px;
  padding: 25px 15px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid #f0f0f0;
}

.category-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.1);
  border-color: #ee4d2d;
}

.cat-icon {
  font-size: 2.5rem;
  color: #302b63;
  margin-bottom: 15px;
  transition: color 0.3s;
}

.category-card:hover .cat-icon {
  color: #ee4d2d;
}

.cat-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.05rem;
}

/* Product Grid */
.product-grid {
  display: flex;
  overflow-x: auto;
  gap: 30px;
  padding-bottom: 20px; /* Khoảng trống cho thanh cuộn và bóng đổ (shadow) */
  scroll-snap-type: x mandatory; /* Giúp vuốt mượt mà, tự động hút vào thẻ */
  -webkit-overflow-scrolling: touch;
}

.product-grid::-webkit-scrollbar {
  height: 6px;
}
.product-grid::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 4px;
}
.product-grid::-webkit-scrollbar-thumb {
  background: #dcdde1;
  border-radius: 4px;
}
.product-grid::-webkit-scrollbar-thumb:hover {
  background: #ee4d2d;
}

.product-card {
  flex: 0 0 260px; /* Cố định chiều rộng mỗi thẻ là 260px */
  scroll-snap-align: start;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.1);
  border-color: #eee;
}

.image-container {
  height: 260px;
  padding: 20px;
  position: relative;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.5s;
}

.product-card:hover .image-container img {
  transform: scale(1.08);
}

.badge-new, .badge-hot {
  position: absolute;
  top: 15px;
  left: 15px;
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-new { background: linear-gradient(135deg, #2ecc71, #27ae60); box-shadow: 0 2px 5px rgba(46, 204, 113, 0.4); }
.badge-hot { background: linear-gradient(135deg, #ff6b6b, #e74c3c); box-shadow: 0 2px 5px rgba(231, 76, 60, 0.4); }

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #fafafa;
  border-top: 1px solid #f5f5f5;
}

.product-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 10px;
  font-weight: 600;
  line-height: 1.4;
  height: 3.08rem; /* exactly 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: color 0.2s;
}

.product-name:hover {
  color: #ee4d2d;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 15px;
  margin-top: auto;
}

.category {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.sold-count {
  font-size: 0.85rem;
  color: #e67e22;
  font-weight: 600;
}

.price-box {
  text-align: right;
}

.price {
  font-size: 1.25rem;
  font-weight: 800;
  color: #e74c3c;
}

.btn-buy-now {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #ee4d2d;
  border: 1px solid #ee4d2d;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.product-card:hover .btn-buy-now {
  background: #ee4d2d;
  color: white;
}

/* Recommendations Section Specifics */
.recommendations-section {
  background: #f8f9fa;
}

.star-active { color: #f1c40f; fill: #f1c40f; }
.star-inactive { color: #ddd; fill: transparent; }
</style>