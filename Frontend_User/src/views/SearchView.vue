<template>
  <div class="search-page-wrapper">
    <AppHeader />

    <div class="container">
      <div class="search-header">
        <h1 v-if="query">Kết quả tìm kiếm cho: "{{ query }}"</h1>
        <h1 v-else>Tất cả sản phẩm</h1>
        <p v-if="!isLoading && products.length > 0">
          Tìm thấy {{ products.length }} sản phẩm
        </p>
      </div>

      <!-- BỘ LỌC NGANG (Giống trang chủ) -->
      <div class="filters-bar">
        <select v-model="selectedCategory" class="filter-select">
          <option value="">-- Tất cả danh mục --</option>
          <option v-for="cat in categories" :key="cat._id" :value="cat._id">
            {{ cat.name }}
          </option>
        </select>
        <select v-model="selectedSport" class="filter-select">
          <option value="">-- Tất cả môn thể thao --</option>
          <option v-for="sport in sports" :key="sport._id" :value="sport._id">
            {{ sport.name }}
          </option>
        </select>
      </div>

      <!-- KHU VỰC HIỂN THỊ SẢN PHẨM -->
      <div v-if="isLoading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i> Đang tìm kiếm...
      </div>

      <div v-else-if="products.length > 0" class="product-grid">
        <div v-for="product in products" :key="product._id" class="product-card">
          <router-link :to="{ name: 'product.detail', params: { id: product._id } }">
            <div class="image-wrapper">
              <img :src="(product.images && product.images.length ? product.images[0].url : product.image) || 'https://via.placeholder.com/300'" :alt="product.name" />
            </div>
            <div class="info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="price">{{ formatPrice(product.price) }}</p>
              
              <!-- Nút Mua ngay -->
              <div class="card-actions">
                <span class="btn-card-buy">Mua ngay</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <div v-else class="no-results">
        <i class="fa-solid fa-circle-question"></i>
        <p>Không tìm thấy sản phẩm nào phù hợp.</p>
        <router-link to="/" class="btn-home">Về trang chủ</router-link>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script>
import ProductService from "@/services/products.service";
import CategoryService from "@/services/categories.service";
import SportService from "@/services/sports.service";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";

export default {
  components: { AppHeader, AppFooter, },
  data() {
    return {
      products: [],
      allProducts: [], // Lưu trữ kết quả gốc từ API để lọc
      isLoading: false,
      query: "",
      categories: [],
      sports: [],
      selectedCategory: "",
      selectedSport: "",
    };
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(newQuery) {
        this.query = newQuery.q || "";
        this.selectedCategory = newQuery.category || "";
        this.selectedSport = newQuery.sport || "";
        this.fetchProducts();
      },
    },
    selectedCategory() {
      this.applyFilters();
    },
    selectedSport() {
      this.applyFilters();
    },
  },
  methods: {
    async fetchProducts() {
      this.isLoading = true;
      try {
        // FIX: Dùng getAll và lọc client-side để đảm bảo hoạt động ổn định
        const response = await ProductService.getAll();
        console.log("📦 Dữ liệu gốc từ API:", response); // Kiểm tra xem có dữ liệu không

        const allItems = Array.isArray(response) ? response : (response.data || []);
        
        if (this.query) {
            const lowerQuery = this.query.toLowerCase().trim();
            // FIX: Thêm kiểm tra p.name tồn tại trước khi toLowerCase() để tránh lỗi crash
            this.allProducts = allItems.filter(p => p.name && p.name.toLowerCase().includes(lowerQuery));
        } else {
            this.allProducts = allItems;
        }
        
        this.applyFilters();
      } catch (error) {
        console.error("❌ Lỗi tìm kiếm:", error);
        this.allProducts = [];
        this.products = [];
      } finally {
        this.isLoading = false;
      }
    },
    applyFilters() {
      let filtered = [...this.allProducts];

      if (this.selectedCategory) {
        // FIX: Chuyển về String để so sánh chính xác (tránh lỗi ObjectId vs String)
        filtered = filtered.filter(p => String(p.category_id) === String(this.selectedCategory));
      }

      if (this.selectedSport) {
        filtered = filtered.filter(p => String(p.sport_id) === String(this.selectedSport));
      }

      this.products = filtered;
    },
    async loadFilterData() {
      try {
        [this.categories, this.sports] = await Promise.all([
          CategoryService.getAll(),
          SportService.getAll(),
        ]);
        console.log("Dữ liệu bộ lọc:", { categories: this.categories, sports: this.sports });
      } catch (error) {
        console.error("Lỗi tải dữ liệu bộ lọc:", error);
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    },
  },
  created() {
    this.loadFilterData();
  },
};
</script>

<style scoped>
.search-page-wrapper { display: flex; flex-direction: column; min-height: 100vh; }
.container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; }
.search-header { text-align: center; margin-bottom: 40px; }
.search-header h1 { font-weight: 300; color: #2c3e50; margin-bottom: 10px; }

/* Style cho bộ lọc ngang */
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

.loading-state { text-align: center; font-size: 1.2rem; color: #7f8c8d; padding-top: 100px; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 25px; }
.product-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s; }
.product-card:hover { transform: translateY(-5px); }
.product-card a { text-decoration: none; color: inherit; }
.image-wrapper { height: 220px; overflow: hidden; }
.image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.info { padding: 15px; }
.product-name { font-size: 1rem; font-weight: 600; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.price { color: #e74c3c; font-weight: bold; margin: 0; }
.card-actions { margin-top: 10px; text-align: center; }
.btn-card-buy {
  background: #ff5722; color: white; border: none; padding: 8px 15px; 
  border-radius: 20px; font-size: 0.9rem; cursor: pointer; width: 100%;
  transition: background 0.2s;
}
.btn-card-buy:hover { background: #e64a19; }

.no-results { text-align: center; padding-top: 100px; color: #95a5a6; }
.no-results i { font-size: 4rem; margin-bottom: 20px; color: #bdc3c7; }
.btn-home { display: inline-block; margin-top: 20px; padding: 10px 25px; background: #2c3e50; color: white; text-decoration: none; border-radius: 25px; transition: 0.3s; }
.btn-home:hover { background: #34495e; }
</style>