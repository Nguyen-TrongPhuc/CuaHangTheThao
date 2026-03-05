<template>
  <div class="search-page-wrapper">
    <AppHeader />

    <div class="container">
      <div class="product-page-layout">
        <!-- SIDEBAR FILTER -->
        <aside class="sidebar-filter">
          <div class="filter-group search-internal">
            <h3><i class="fa-solid fa-magnifying-glass"></i> Tìm kiếm</h3>
            <input v-model="localSearch" placeholder="Nhập tên sản phẩm..." @input="applyFilters" />
          </div>

          <div class="filter-group">
            <h3>Danh mục</h3>
            <div class="filter-options">
              <label class="radio-container">
                <input type="radio" v-model="selectedCategory" value="" @change="applyFilters">
                <span class="checkmark"></span> Tất cả
              </label>
              <label v-for="cat in categories" :key="cat._id" class="radio-container">
                <input type="radio" v-model="selectedCategory" :value="cat._id" @change="applyFilters">
                <span class="checkmark"></span> {{ cat.name }}
              </label>
            </div>
          </div>

          <div class="filter-group">
            <h3>Môn thể thao</h3>
            <select v-model="selectedSport" @change="applyFilters" class="sidebar-select">
              <option value="">Tất cả môn</option>
              <option v-for="sport in sports" :key="sport._id" :value="sport._id">{{ sport.name }}</option>
            </select>
          </div>

          <div class="filter-group">
            <h3>Khoảng giá</h3>
            <div class="price-range">
              <input type="number" v-model.number="minPrice" placeholder="Từ" @change="applyFilters">
              <span>-</span>
              <input type="number" v-model.number="maxPrice" placeholder="Đến" @change="applyFilters">
            </div>
          </div>

          <button class="btn-reset-filter" @click="resetFilters">Xóa bộ lọc</button>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="product-list-content">
          <!-- Toolbar: Sort & Count -->
          <div class="toolbar">
            <div class="result-count">
              Tìm thấy <b>{{ filteredProducts.length }}</b> sản phẩm
            </div>
            <div class="sort-box">
              <label>Sắp xếp:</label>
              <select v-model="sortBy" @change="handleSort">
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="best-seller">Bán chạy nhất</option>
              </select>
            </div>
          </div>

          <div v-if="isLoading" class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...
          </div>

          <div v-else-if="paginatedProducts.length > 0" class="product-grid">
            <div v-for="product in paginatedProducts" :key="product._id" class="product-card">
              <router-link :to="{ name: 'product.detail', params: { id: product._id } }">
                <div class="image-wrapper">
                  <img :src="(product.images && product.images.length ? product.images[0].url : product.image) || 'https://via.placeholder.com/300'" :alt="product.name" />
                  <span v-if="product.sold > 0" class="sold-badge">Đã bán {{ product.sold }}</span>
                </div>
                <div class="info">
                  <h3 class="product-name">{{ product.name }}</h3>
                  <p class="price">{{ formatPrice(product.price) }}</p>
                  <div class="card-actions">
                    <span class="btn-card-buy">Xem chi tiết</span>
                  </div>
                </div>
              </router-link>
            </div>
          </div>

          <div v-else class="no-results">
            <i class="fa-solid fa-filter-circle-xmark"></i>
            <p>Không tìm thấy sản phẩm phù hợp với bộ lọc.</p>
            <button @click="resetFilters" class="btn-home">Xóa bộ lọc</button>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            
            <span class="page-info">Trang {{ currentPage }} / {{ totalPages }}</span>
            
            <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </main>
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
      filteredProducts: [], // Danh sách sau khi lọc
      allProducts: [], // Lưu trữ kết quả gốc từ API để lọc
      isLoading: false,
      
      // Filter Data
      categories: [],
      sports: [],

      // Filter State
      localSearch: "",
      selectedCategory: "",
      selectedSport: "",
      minPrice: null,
      maxPrice: null,
      sortBy: "newest",

      // Pagination
      currentPage: 1,
      itemsPerPage: 12,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    },
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredProducts.slice(start, end);
    }
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(newQuery) {
        // Khi URL thay đổi (từ Header search), cập nhật localSearch và reset các filter khác
        if (newQuery.q) {
            this.localSearch = newQuery.q;
        }
        this.selectedCategory = newQuery.category || "";
        this.selectedSport = newQuery.sport || "";
        
        // Nếu chưa có dữ liệu thì fetch, nếu có rồi thì chỉ apply filter
        if (this.allProducts.length === 0) {
            this.fetchProducts();
        } else {
            this.applyFilters();
        }
      },
    },
  },
  methods: {
    async fetchProducts() {
      this.isLoading = true;
      try {
        const response = await ProductService.getAll();
        this.allProducts = Array.isArray(response) ? response : (response.data || []);
        this.applyFilters();
      } catch (error) {
        console.error("❌ Lỗi tìm kiếm:", error);
        this.allProducts = [];
        this.filteredProducts = [];
      } finally {
        this.isLoading = false;
      }
    },
    applyFilters() {
      let filtered = [...this.allProducts];

      // 1. Search Text
      if (this.localSearch) {
        const lowerQuery = this.localSearch.toLowerCase().trim();
        filtered = filtered.filter(p => p.name && p.name.toLowerCase().includes(lowerQuery));
      }

      // 2. Category
      if (this.selectedCategory) {
        filtered = filtered.filter(p => String(p.category_id) === String(this.selectedCategory));
      }

      // 3. Sport
      if (this.selectedSport) {
        filtered = filtered.filter(p => String(p.sport_id) === String(this.selectedSport));
      }

      // 4. Price Range
      if (this.minPrice !== null && this.minPrice !== "") {
        filtered = filtered.filter(p => p.price >= this.minPrice);
      }
      if (this.maxPrice !== null && this.maxPrice !== "") {
        filtered = filtered.filter(p => p.price <= this.maxPrice);
      }

      this.filteredProducts = filtered;
      this.handleSort(); // Sắp xếp lại sau khi lọc
      this.currentPage = 1; // Reset về trang 1
    },
    handleSort() {
        const sorted = [...this.filteredProducts];
        switch (this.sortBy) {
            case 'price-asc':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'best-seller':
                sorted.sort((a, b) => (b.sold || 0) - (a.sold || 0));
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        this.filteredProducts = sorted;
    },
    resetFilters() {
        this.localSearch = "";
        this.selectedCategory = "";
        this.selectedSport = "";
        this.minPrice = null;
        this.maxPrice = null;
        this.sortBy = "newest";
        this.applyFilters();
    },
    changePage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },
    async loadFilterData() {
      try {
        [this.categories, this.sports] = await Promise.all([
          CategoryService.getAll(),
          SportService.getAll(),
        ]);
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
    // fetchProducts sẽ được gọi bởi watcher nếu có query, hoặc gọi thủ công nếu không
    if (!this.$route.query.q && !this.$route.query.category) {
        this.fetchProducts();
    }
  },
};
</script>

<style scoped>
.search-page-wrapper { display: flex; flex-direction: column; min-height: 100vh; }
.container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; }

/* Layout 2 cột */
.product-page-layout { display: flex; gap: 30px; align-items: flex-start; }

/* Sidebar Styles */
.sidebar-filter { width: 260px; flex-shrink: 0; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.filter-group { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
.filter-group:last-child { border-bottom: none; }
.filter-group h3 { font-size: 1rem; margin-bottom: 15px; color: #333; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.filter-group input[type="text"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }

.filter-options { display: flex; flex-direction: column; gap: 8px; }
.radio-container { display: flex; align-items: center; cursor: pointer; font-size: 0.95rem; color: #555; }
.radio-container input { margin-right: 10px; }

.sidebar-select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }

.price-range { display: flex; align-items: center; gap: 5px; }
.price-range input { width: 45%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; }

.size-options { display: flex; flex-wrap: wrap; gap: 8px; }
.size-tag { padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px; font-size: 0.85rem; transition: 0.2s; }
.size-tag:hover { border-color: #302b63; }
.size-tag.active { background: #302b63; color: white; border-color: #302b63; }

.color-options { display: flex; flex-wrap: wrap; gap: 8px; }
.color-tag { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 20px; font-size: 0.85rem; }
.color-tag.active { border-color: #302b63; background: #f0f0f0; font-weight: bold; }
.color-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); }

.btn-reset-filter { width: 100%; padding: 10px; background: #f8f9fa; border: 1px solid #ddd; cursor: pointer; border-radius: 4px; font-weight: bold; color: #555; transition: 0.2s; }
.btn-reset-filter:hover { background: #e2e6ea; }

/* Main Content Styles */
.product-list-content { flex: 1; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }
.result-count { color: #555; }
.sort-box label { margin-right: 10px; color: #555; }
.sort-box select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; outline: none; }

.loading-state { text-align: center; font-size: 1.2rem; color: #7f8c8d; padding-top: 100px; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 25px; }
.product-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s; }
.product-card:hover { transform: translateY(-5px); }
.product-card a { text-decoration: none; color: inherit; }
.image-wrapper { height: 220px; overflow: hidden; position: relative; }
.image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.sold-badge { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 3px 8px; font-size: 0.75rem; border-radius: 4px; }
.info { padding: 15px; }
.product-name { font-size: 1rem; font-weight: 600; color: #2c3e50; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.price { color: #e74c3c; font-weight: bold; margin: 0; }
.card-actions { margin-top: 10px; text-align: center; }
.btn-card-buy {
  background: white; color: #302b63; border: 1px solid #302b63; padding: 8px 15px; 
  border-radius: 20px; font-size: 0.9rem; cursor: pointer; width: 100%; display: block;
  transition: background 0.2s;
}
.btn-card-buy:hover { background: #302b63; color: white; }

.no-results { text-align: center; padding-top: 100px; color: #95a5a6; }
.no-results i { font-size: 4rem; margin-bottom: 20px; color: #bdc3c7; }
.btn-home { display: inline-block; margin-top: 20px; padding: 10px 25px; background: #2c3e50; color: white; text-decoration: none; border-radius: 25px; transition: 0.3s; }
.btn-home:hover { background: #34495e; }

/* Pagination */
.pagination { display: flex; justify-content: center; align-items: center; margin-top: 40px; gap: 15px; }
.pagination button { width: 40px; height: 40px; border-radius: 50%; border: 1px solid #ddd; background: white; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
.pagination button:hover:not(:disabled) { background: #302b63; color: white; border-color: #302b63; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-weight: 600; color: #555; }

@media (max-width: 768px) {
  .product-page-layout { flex-direction: column; }
  .sidebar-filter { width: 100%; box-sizing: border-box; }
}
</style>