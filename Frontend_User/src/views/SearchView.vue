<template>
  <div class="search-page-wrapper">
    <AppHeader />

    <div class="container">
      <div class="product-page-layout">
        <!-- SIDEBAR FILTER -->
        <aside class="sidebar-filter">
          <div class="filter-group search-internal">
            <h3 style="display:flex;align-items:center;gap:5px;"><Search :size="18" /> Tìm kiếm</h3>
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
            <Loader2 class="lucide-spin" :size="32" style="margin-right:10px" /> Đang tải dữ liệu...
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
                  <div class="price-box" style="margin-bottom: 5px;">
                    <span v-if="loyalty && loyalty.discountPercent > 0" style="font-size: 0.9rem; color: #999; text-decoration: line-through; margin-right: 8px;">
                        {{ formatPrice(product.price) }}
                    </span>
                    <span class="price">{{ formatPrice(getDisplayPrice(product.price)) }}</span>
                  </div>
                  <div class="card-actions">
                    <span class="btn-card-buy">Xem chi tiết</span>
                  </div>
                </div>
              </router-link>
            </div>
          </div>

          <div v-else class="no-results">
            <FilterX :size="64" color="#bdc3c7" style="margin-bottom: 20px" />
            <p>Không tìm thấy sản phẩm phù hợp với bộ lọc.</p>
            <button @click="resetFilters" class="btn-home">Xóa bộ lọc</button>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
              <ChevronLeft :size="16" />
            </button>
            
            <span class="page-info">Trang {{ currentPage }} / {{ totalPages }}</span>
            
            <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
              <ChevronRight :size="16" />
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
import CustomerService from "@/services/customer.service";
import { Search, Loader2, FilterX, ChevronLeft, ChevronRight } from "lucide-vue-next";

export default {
  components: { AppHeader, AppFooter, Search, Loader2, FilterX, ChevronLeft, ChevronRight },
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
      loyalty: null,
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
    async fetchLoyalty() {
        const token = localStorage.getItem("user_token");
        if (!token) return;

        try {
            this.loyalty = await CustomerService.getLoyalty();
        } catch (e) {
            // Ignore
        }
    },
    getDisplayPrice(price) {
        if (this.loyalty && this.loyalty.discountPercent > 0) {
            return Math.round(price * (1 - this.loyalty.discountPercent / 100));
        }
        return price;
    },
    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    },
  },
  created() {
    this.loadFilterData();
    this.fetchLoyalty();
    // fetchProducts sẽ được gọi bởi watcher nếu có query, hoặc gọi thủ công nếu không
    if (!this.$route.query.q && !this.$route.query.category) {
        this.fetchProducts();
    }
  },
};
</script>

<style scoped>
.search-page-wrapper { display: flex; flex-direction: column; min-height: 100vh; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8f9fa; }
.container { flex: 1; max-width: 1400px; margin: 0 auto; padding: 20px; width: 100%; box-sizing: border-box; }

/* Layout 2 cột */
.product-page-layout { 
  display: flex; gap: 30px; align-items: flex-start; 
  height: calc(100vh - 130px); /* Tách biệt vùng cuộn độc lập so với màn hình */
}

/* Sidebar Styles */
.sidebar-filter { 
  width: 260px; flex-shrink: 0; background: white; padding: 20px; 
  border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; 
  height: 100%; overflow-y: auto; 
}

/* Tùy chỉnh thanh cuộn mỏng cho Sidebar */
.sidebar-filter::-webkit-scrollbar { width: 4px; }
.sidebar-filter::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
.sidebar-filter::-webkit-scrollbar-thumb:hover { background: #ee4d2d; }

.filter-group { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.filter-group:last-child { border-bottom: none; padding-bottom: 0; }
.filter-group h3 { font-size: 1.05rem; margin-bottom: 15px; color: #2c3e50; font-weight: 800; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

.filter-group input[type="text"], .sidebar-select, .price-range input { 
  width: 100%; padding: 10px 15px; border: 1px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; font-family: inherit; transition: all 0.3s ease; background: #fafafa; font-size: 0.95rem;
}
.filter-group input[type="text"]:focus, .sidebar-select:focus, .price-range input:focus {
  border-color: #ee4d2d; background: #fff; box-shadow: 0 0 0 3px rgba(238, 77, 45, 0.1); outline: none;
}

.filter-options { display: flex; flex-direction: column; gap: 8px; }
.radio-container { display: flex; align-items: center; cursor: pointer; font-size: 0.95rem; color: #555; margin-bottom: 5px; transition: color 0.2s; }
.radio-container:hover { color: #ee4d2d; }
.radio-container input { margin-right: 10px; accent-color: #ee4d2d; width: 16px; height: 16px; cursor: pointer; }

.price-range { display: flex; align-items: center; gap: 5px; }
.price-range input { width: 45%; text-align: center; }

.btn-reset-filter { width: 100%; padding: 12px; background: #fff5f1; border: 1px dashed #ee4d2d; cursor: pointer; border-radius: 8px; font-weight: bold; color: #ee4d2d; transition: all 0.3s; margin-top: 10px; }
.btn-reset-filter:hover { background: #ee4d2d; color: white; }

/* Main Content Styles */
.product-list-content { 
  flex: 1; 
  height: 100%; 
  overflow-y: auto; 
  padding-right: 15px; /* Giữ khoảng cách không cho thanh cuộn đè vào nội dung */
}
/* Thanh cuộn mượt mà riêng biệt cho vùng sản phẩm */
.product-list-content::-webkit-scrollbar { width: 6px; }
.product-list-content::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
.product-list-content::-webkit-scrollbar-thumb:hover { background: #ee4d2d; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }
.result-count { color: #555; font-size: 1.05rem; }
.result-count b { color: #ee4d2d; font-weight: 800; font-size: 1.15rem; }
.sort-box label { margin-right: 10px; color: #2c3e50; font-weight: 600; }
.sort-box select { padding: 8px 15px; border: 1px solid #ddd; border-radius: 8px; outline: none; background: #fafafa; font-family: inherit; font-size: 0.95rem; transition: border-color 0.3s; cursor: pointer; }
.sort-box select:focus { border-color: #ee4d2d; }

.loading-state { text-align: center; font-size: 1.2rem; color: #7f8c8d; padding-top: 100px; }
.lucide-spin { animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 25px; }
.product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: all 0.3s ease; border: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.product-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); border-color: #eee; }
.product-card a { text-decoration: none; color: inherit; display: flex; flex-direction: column; height: 100%; }

.image-wrapper { height: 240px; padding: 20px; position: relative; background: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.image-wrapper img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.5s ease; }
.product-card:hover .image-wrapper img { transform: scale(1.08); }

.sold-badge { position: absolute; top: 15px; left: 15px; background: linear-gradient(135deg, #ff6b6b, #e74c3c); color: white; padding: 4px 12px; font-size: 0.8rem; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(231, 76, 60, 0.4); z-index: 2;}

.info { padding: 20px; display: flex; flex-direction: column; flex-grow: 1; background: #fafafa; border-top: 1px solid #f5f5f5; }
.product-name { font-size: 1.1rem; color: #2c3e50; margin: 0 0 10px; font-weight: 600; line-height: 1.4; height: 3.08rem; display: -webkit-box; -webkit-line-clamp: 2;line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; transition: color 0.2s; }
.product-card:hover .product-name { color: #ee4d2d; }

.price-box { margin-bottom: 15px; margin-top: auto; text-align: right; }
.price { color: #ee4d2d; font-weight: 800; margin: 0; font-size: 1.25rem; }

.card-actions { margin-top: auto; }
.btn-card-buy {
  background: transparent; color: #ee4d2d; border: 1px solid #ee4d2d; padding: 12px; 
  border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; width: 100%; display: block;
  transition: all 0.3s ease; text-align: center;
}
.product-card:hover .btn-card-buy { background: #ee4d2d; color: white; }

.no-results { text-align: center; padding-top: 100px; color: #95a5a6; }
.no-results i { font-size: 4rem; margin-bottom: 20px; color: #bdc3c7; }
.btn-home { display: inline-block; margin-top: 20px; padding: 12px 30px; background: #ee4d2d; color: white; text-decoration: none; border: none; border-radius: 50px; font-weight: 600; transition: all 0.3s ease; cursor: pointer; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(238, 77, 45, 0.3); }
.btn-home:hover { background: #d73211; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(238, 77, 45, 0.4); }

/* Pagination */
.pagination { display: flex; justify-content: center; align-items: center; margin-top: 40px; gap: 15px; }
.pagination button { width: 45px; height: 45px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; color: #555; }
.pagination button:hover:not(:disabled) { background: #ee4d2d; color: white; border-color: #ee4d2d; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(238, 77, 45, 0.2); }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-weight: 600; color: #2c3e50; font-size: 1.05rem; }

@media (max-width: 768px) {
  .product-page-layout { flex-direction: column; height: auto; }
  .sidebar-filter { width: 100%; box-sizing: border-box; height: auto; overflow-y: visible; }
  .product-list-content { height: auto; overflow-y: visible; padding-right: 0; }
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
}
@media (max-width: 480px) {
  .product-grid { grid-template-columns: 1fr; }
}
</style>