<template>
  <div class="product-detail-page">
    <AppHeader />

    <div class="container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <router-link to="/">Trang chủ</router-link> 
        <ChevronRight :size="12" />
        <router-link to="/products">Sản phẩm</router-link>
        <ChevronRight :size="12" />
        <span>{{ product ? product.name : 'Chi tiết' }}</span>
      </div>

      <div v-if="isLoading" class="loading-state">
        <Loader2 class="lucide-spin" :size="48" style="margin-bottom: 20px;" /> Đang tải sản phẩm...
      </div>

      <div v-else-if="product" class="product-main-wrapper">
        <div class="product-overview-card">
        <div class="product-image-gallery">
            <div class="main-image-container" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="openFullscreen(displayedImage)">
              <img :src="displayedImage" :alt="product.name" class="main-image" :style="zoomStyle" title="Bấm để xem ảnh lớn" />
              <button v-if="imageList.length > 1" class="img-nav prev" @click.stop="prevImage">
                <ChevronLeft :size="24" />
              </button>
              <button v-if="imageList.length > 1" class="img-nav next" @click.stop="nextImage">
                <ChevronRight :size="24" />
              </button>
            </div>
            <!-- thumbnails -->
            <div v-if="imageList.length > 1" class="thumbnails">
              <img
                v-for="(img, idx) in imageList"
                :key="idx"
                :src="img"
                :class="['thumb', { active: img === displayedImage }]"
                @click="displayedImage = img"
              />
            </div>
        </div>

        <div class="product-summary-info">
          <h1 class="product-name">{{ product.name }}</h1>
          
          <div class="product-rating-summary" v-if="reviews.length > 0">
             <span class="stars" style="display:flex;align-items:center;">
               <Star v-for="n in 5" :key="n" :size="16" :class="[n <= Math.round(averageRating) ? 'active' : 'inactive']" />
             </span>
             <span class="rating-text">({{ averageRating }}/5 - {{ reviews.length }} đánh giá)</span>
          </div>

          <div class="price-box">
            <p class="product-price">
              <span v-if="discountPercent > 0" style="font-size: 0.7em; color: #999; text-decoration: line-through; margin-right: 10px;">
                {{ formatPrice(currentOriginalPrice) }}
              </span>
              {{ formatPrice(currentDisplayPrice) }}
              <span v-if="discountPercent > 0" style="font-size: 0.6em; background: #ee4d2d; color: white; padding: 2px 6px; border-radius: 4px; vertical-align: middle;">
                -{{ discountPercent }}% VIP
              </span>
            </p>
          </div>

          <div class="variant-selection" v-if="hasVariants">
            <div class="variant-group" v-if="availableSizes.length > 0">
              <div style="width: 100px; flex-shrink: 0; display: flex; flex-direction: column;">
                <span class="variant-label" style="width: 100%;">Kích thước</span>
                <span class="size-guide-link" @click="showSizeGuide = true">Hướng dẫn</span>
              </div>
              <div class="variant-options">
                <button 
                  v-for="size in availableSizes" 
                  :key="size._id" 
                  :class="['variant-btn', { active: selectedSizeId === size._id, disabled: isSizeDisabled(size._id) }]"
                  @click="selectSize(size._id)"
                  :disabled="isSizeDisabled(size._id)"
                >{{ size.name }}</button>
              </div>
            </div>

            <div class="variant-group" v-if="availableColors.length > 0">
              <span class="variant-label">Màu sắc</span>
              <div class="variant-options">
                <button 
                  v-for="color in availableColors" 
                  :key="color._id" 
                  :class="['variant-btn', { active: selectedColorId === color._id, disabled: isColorDisabled(color._id) }]"
                  @click="selectColor(color._id)"
                  :disabled="isColorDisabled(color._id)"
                >{{ color.name }}</button>
              </div>
            </div>
          </div>

          <div class="quantity-selector">
            <label for="quantity">Số lượng</label>
            <div class="qty-input-group">
                <button @click="quantity > 1 ? quantity-- : null">-</button>
                <input type="number" id="quantity" v-model.number="quantity" min="1" :max="maxQuantity" :disabled="maxQuantity === 0" />
                <button @click="quantity < maxQuantity ? quantity++ : null">+</button>
            </div>
            <span class="stock-info">{{ maxQuantity }} sản phẩm có sẵn</span>
          </div>

          <div class="action-buttons">
            <button class="btn-add-to-cart" @click="addToCart" :disabled="maxQuantity === 0 || quantity <= 0 || (hasVariants && !selectedVariant)">
              <ShoppingCart :size="18" /> Thêm vào giỏ
            </button>
            <button class="btn-buy-now" @click="buyNow" :disabled="maxQuantity === 0 || quantity <= 0 || (hasVariants && !selectedVariant)">
              Mua ngay
            </button>
            <button class="btn-chat-now" @click="chatNow">
              <MessageCircle :size="18" /> Chat ngay
            </button>
          </div>
        </div>
        </div>

        <!-- Phần Sản phẩm gợi ý -->
        <div class="recommendations-section" v-if="recommendedProducts && recommendedProducts.length > 0">
          <div class="section-title-wrapper">
            <h2 class="section-header-rec">SẢN PHẨM TƯƠNG TỰ</h2>
            <div class="title-underline"></div>
          </div>
          <div class="product-grid-rec">
            <div v-for="rec in recommendedProducts" :key="rec._id" class="product-card-rec">
              <router-link :to="{ name: 'product.detail', params: { id: rec._id } }">
                <div class="image-wrapper-rec">
                  <img :src="rec.image || 'https://via.placeholder.com/300'" :alt="rec.name" />
                </div>
                <div class="info-rec">
                  <h3 class="product-name-rec">{{ rec.name }}</h3>
                  <div class="price-rec">
                    <span v-if="loyalty && loyalty.discountPercent > 0" style="font-size: 0.85rem; color: #999; text-decoration: line-through; display: block; line-height: 1; margin-bottom: 4px; font-weight: normal;">
                        {{ formatPrice(rec.price) }}
                    </span>
                    {{ formatPrice(getDisplayPrice(rec.price)) }}
                  </div>
                </div>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Phần dưới: Chi tiết, Mô tả, Đánh giá (Full width) -->
        <div class="product-details-container">
          <div class="details-section">
            <h2 class="section-header">CHI TIẾT SẢN PHẨM</h2>
            <div class="detail-grid">
                <div class="detail-row">
                    <label>Danh mục</label>
                    <div class="breadcrumb-link">
                        <router-link to="/">Trang chủ</router-link> &gt; 
                        <router-link to="/products">Sản phẩm</router-link> &gt; 
                        <span>{{ getCategoryName(product.category_id) }}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <label>Kho hàng</label>
                    <div>{{ totalStock }}</div>
                </div>
                <div class="detail-row">
                    <label>Đã bán</label>
                    <div>{{ product.sold || 0 }}</div>
                </div>
                <div class="detail-row">
                    <label>Gửi từ</label>
                    <div>Cần Thơ</div>
                </div>
            </div>
          </div>

          <div class="description-section">
            <h2 class="section-header">MÔ TẢ SẢN PHẨM</h2>
            <div class="description-content">
                <p class="disclaimer-text">✨ SẢN PHẨM CHÍNH HÃNG - CHẤT LƯỢNG CAO ✨</p>
                <div class="formatted-text">{{ product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.' }}</div>
            </div>
          </div>

          <!-- Phần Đánh giá -->
          <div class="product-reviews-section">
            <h2 class="section-header">ĐÁNH GIÁ SẢN PHẨM</h2>
            <div v-if="reviews.length === 0" class="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</div>
            <div v-else class="reviews-list">
                <div v-for="review in visibleReviews" :key="review._id" class="review-item">
                    <div class="review-header">
                        <img :src="review.user.avatar || 'https://placehold.co/40'" class="user-avatar" />
                        <div class="user-info">
                            <span class="user-name">{{ review.user.last_name }} {{ review.user.first_name }}</span>
                            <div class="user-rating" style="display:flex;">
                              <Star v-for="n in 5" :key="n" :size="12" :class="[n <= review.rating ? 'active' : 'inactive']" />
                            </div>
                        </div>
                        <span class="review-date">{{ new Date(review.createdAt).toLocaleDateString('vi-VN') }}</span>
                    </div>
                    <p class="review-content">{{ review.comment }}</p>
                    <img v-if="review.image" :src="review.image" class="review-image-attachment" @click="openFullscreen(review.image)" />
                    <div v-if="review.reply" class="store-reply"><strong>Phản hồi từ cửa hàng:</strong> {{ review.reply.text }}</div>
                </div>
                
                <div v-if="reviews.length > 3" class="review-actions">
                    <button v-if="visibleReviewsCount < reviews.length" @click="showMoreReviews" class="btn-show-more" style="display:inline-flex;align-items:center;gap:5px;">
                      Xem thêm đánh giá <ChevronDown :size="14" />
                    </button>
                    <button v-if="visibleReviewsCount > 3" @click="showLessReviews" class="btn-show-less" style="display:inline-flex;align-items:center;gap:5px;">
                      Thu gọn <ChevronUp :size="14" />
                    </button>
                </div>
            </div>
          </div>

       
        </div>

      </div>

      <div v-else class="no-product-found">
        <PackageOpen :size="64" color="#bdc3c7" style="margin-bottom: 20px" />
        <p>Không tìm thấy sản phẩm này.</p>
        <router-link to="/products" class="btn-back">Quay lại danh sách sản phẩm</router-link>
      </div>
    </div>

    <!-- Modal Xem ảnh Fullscreen phong cách Adidas -->
    <transition name="fade">
      <div v-if="showFullscreen" class="fullscreen-modal" @click.self="closeFullscreen">
        <button class="btn-close-fs" @click="closeFullscreen"><X :size="32" /></button>
        
        <!-- Nút điều hướng trái -->
        <button v-if="imageList.length > 1" class="fs-nav prev" @click.stop="prevFullscreenImage">
          <ChevronLeft :size="36" />
        </button>

        <div class="fullscreen-img-container" :class="{ 'is-zoomed': isFullscreenZoomed }" @click.stop="toggleFullscreenZoom" @mousemove="handleFullscreenMouseMove" @mouseleave="handleFullscreenMouseLeave">
          <img :src="fullscreenImage" class="fullscreen-img" :style="fullscreenZoomStyle" />
        </div>

        <!-- Nút điều hướng phải -->
        <button v-if="imageList.length > 1" class="fs-nav next" @click.stop="nextFullscreenImage">
          <ChevronRight :size="36" />
        </button>

        <!-- Thumbnails (Ảnh thu nhỏ ở dưới cùng) -->
        <div v-if="imageList.length > 1" class="fs-thumbnails" @click.stop>
          <img
            v-for="(img, idx) in imageList"
            :key="idx"
            :src="img"
            :class="['fs-thumb', { active: img === fullscreenImage }]"
            @click.stop="selectFullscreenImage(img)"
          />
        </div>
      </div>
    </transition>

    <!-- Modal Hướng dẫn chọn size -->
    <transition name="fade">
      <div v-if="showSizeGuide" class="modal-overlay" @click.self="showSizeGuide = false">
        <div class="modal-content size-guide-modal">
          <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
            <h3 style="margin:0; color:#2c3e50;">Hướng dẫn chọn kích thước</h3>
            <button class="btn-close-modal" @click="showSizeGuide = false"><X :size="24" /></button>
          </div>
          <div class="modal-body" style="overflow-y: auto; max-height: 70vh; padding-right: 5px;">
            <p style="color: #666; margin-bottom: 15px; font-size: 0.95rem; line-height: 1.5;">Bảng kích thước dưới đây mang tính chất tham khảo. Tùy thuộc vào form dáng sản phẩm và sở thích mặc ôm hay rộng mà bạn có thể cân nhắc tăng giảm size.</p>
            
            <!-- Bảng size Quần Áo -->
            <div v-if="productTypeForSizeGuide === 'clothes' || productTypeForSizeGuide === 'all'">
              <h4 style="color: #ee4d2d; margin-bottom: 10px;">Bảng size Quần Áo</h4>
              <table class="size-guide-table">
                <thead>
                  <tr><th>Size</th><th>Cân nặng (kg)</th><th>Chiều cao (cm)</th></tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>45 - 55</td><td>150 - 160</td></tr>
                  <tr><td>M</td><td>55 - 65</td><td>160 - 168</td></tr>
                  <tr><td>L</td><td>65 - 75</td><td>168 - 175</td></tr>
                  <tr><td>XL</td><td>75 - 85</td><td>175 - 180</td></tr>
                  <tr><td>XXL</td><td>85 - 95</td><td>180 - 185</td></tr>
                </tbody>
              </table>
            </div>

            <!-- Bảng size Giày -->
            <div v-if="productTypeForSizeGuide === 'shoes' || productTypeForSizeGuide === 'all'" style="margin-top: 25px;">
              <h4 style="color: #ee4d2d; margin-bottom: 10px;">Bảng size Giày</h4>
              <table class="size-guide-table">
              <thead>
                <tr><th>Size VN/EU</th><th>Chiều dài chân (cm)</th></tr>
              </thead>
              <tbody>
                <tr><td>36</td><td>22.5 - 23.0</td></tr><tr><td>37</td><td>23.1 - 23.5</td></tr>
                <tr><td>38</td><td>23.6 - 24.0</td></tr><tr><td>39</td><td>24.1 - 24.5</td></tr>
                <tr><td>40</td><td>24.6 - 25.0</td></tr><tr><td>41</td><td>25.1 - 25.5</td></tr>
                <tr><td>42</td><td>25.6 - 26.0</td></tr><tr><td>43</td><td>26.1 - 26.5</td></tr>
              </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <AppFooter />
  </div>
</template>

<script>
import ProductService from "@/services/products.service";
import SizesService from "@/services/sizes.service";
import ColorsService from "@/services/colors.service";
import CategoryService from "@/services/categories.service";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { cartStore } from "@/utils/cart";
import { showToast } from "@/utils/toast";
import ReviewsService from "@/services/reviews.service";
import CustomerService from "@/services/customer.service";
import { ChevronRight, Loader2, ChevronLeft, Star, ShoppingCart, MessageCircle, ChevronDown, ChevronUp, PackageOpen, X } from "lucide-vue-next";

export default {
  components: { AppHeader, AppFooter, ChevronRight, Loader2, ChevronLeft, Star, ShoppingCart, MessageCircle, ChevronDown, ChevronUp, PackageOpen, X },
  data() {
    return {
      product: null,
      isLoading: true,
      sizes: [],
      colors: [],
      categories: [],
      selectedSizeId: "",
      selectedColorId: "",
      selectedVariant: null,
      quantity: 1,
      reviews: []
      ,
      loyalty: null,
      visibleReviewsCount: 3,
      displayedImage: '',
      recommendedProducts: [],
      zoomStyle: { transformOrigin: 'center center', transform: 'scale(1)' },
      showFullscreen: false,
      fullscreenImage: '',
      fullscreenZoomStyle: { transformOrigin: 'center center', transform: 'scale(1)' },
      isFullscreenZoomed: false,
      showSizeGuide: false,
    };
  },
  computed: {
    hasVariants() {
        return this.product && this.product.variants && this.product.variants.length > 0;
    },
    maxQuantity() {
        if (this.hasVariants) {
            if (this.selectedVariant) {
                return this.selectedVariant.stock;
            }
            // Nếu chỉ chọn Size, tính tổng tồn kho của tất cả biến thể có Size đó
            if (this.selectedSizeId) {
                return this.product.variants.filter(v => String(v.size_id) === String(this.selectedSizeId)).reduce((sum, v) => sum + v.stock, 0);
            }
            // Nếu chỉ chọn Color, tính tổng tồn kho của tất cả biến thể có Color đó
            if (this.selectedColorId) {
                return this.product.variants.filter(v => String(v.color_id) === String(this.selectedColorId)).reduce((sum, v) => sum + v.stock, 0);
            }
            // Nếu chưa chọn gì, hiển thị tổng tồn kho của sản phẩm
            return this.product.variants.reduce((sum, v) => sum + v.stock, 0);
        }
        return this.product ? this.product.stock : 0;
    },
    // Lấy danh sách các Size có sẵn cho sản phẩm này
    availableSizes() {
      if (!this.product || !this.product.variants || !this.sizes.length) return [];
      const uniqueSizeIds = [...new Set(this.product.variants.map(v => v.size_id).filter(id => id))];
      return this.sizes.filter(s => uniqueSizeIds.some(id => String(id) === String(s._id)));
    },
    // Lấy danh sách các Color có sẵn cho sản phẩm này
    availableColors() {
      if (!this.product || !this.product.variants || !this.colors.length) return [];
      const uniqueColorIds = [...new Set(this.product.variants.map(v => v.color_id).filter(id => id))];
      return this.colors.filter(c => uniqueColorIds.some(id => String(id) === String(c._id)));
    },
    discountPercent() {
        return this.loyalty ? this.loyalty.discountPercent : 0;
    },
    currentOriginalPrice() {
        return this.selectedVariant ? this.selectedVariant.price : (this.product ? this.product.price : 0);
    },
    currentDisplayPrice() {
        const original = this.currentOriginalPrice;
        return this.discountPercent > 0 ? Math.round(original * (1 - this.discountPercent / 100)) : original;
    },
    // danh sách đường dẫn ảnh sẵn có để hiển thị trong gallery
    imageList() {
      if (this.product && Array.isArray(this.product.images) && this.product.images.length) {
        return this.product.images.map(i => i.url).filter(u => u);
      }
      if (this.product && this.product.image) return [this.product.image];
      return [];
    },
    // index of current displayedImage in the list (or -1 if not found)
    currentImageIndex() {
      return this.imageList.indexOf(this.displayedImage);
    },
    averageRating() {
        if (!this.reviews.length) return 0;
        const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
        return (total / this.reviews.length).toFixed(1);
    },
    visibleReviews() {
        return this.reviews.slice(0, this.visibleReviewsCount);
    },
    totalStock() {
        if (this.hasVariants) {
            return this.product.variants.reduce((sum, v) => sum + v.stock, 0);
        }
        return this.product ? this.product.stock : 0;
    },
    productTypeForSizeGuide() {
        if (!this.product || !this.categories.length) return 'all';
        const cat = this.categories.find(c => String(c._id) === String(this.product.category_id));
        if (!cat) return 'all';
        const name = cat.name.toLowerCase();
        if (name.includes('giày')) return 'shoes';
        if (name.includes('áo') || name.includes('quần')) return 'clothes';
        return 'all';
    }
  },
  methods: {
    handleMouseMove(e) {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        this.zoomStyle = {
            transformOrigin: `${x}% ${y}%`,
            transform: 'scale(2)' // Phóng to 2 lần tại vị trí chuột
        };
    },
    handleMouseLeave() {
        this.zoomStyle = { transformOrigin: 'center center', transform: 'scale(1)' };
    },
    openFullscreen(url) {
        this.fullscreenImage = url;
        this.showFullscreen = true;
        this.resetFullscreenZoom();
    },
    closeFullscreen() {
        this.showFullscreen = false;
        this.resetFullscreenZoom();
    },
    resetFullscreenZoom() {
        this.isFullscreenZoomed = false;
        this.fullscreenZoomStyle = { transformOrigin: 'center center', transform: 'scale(1)' };
    },
    handleFullscreenMouseMove(e) {
        if (!this.isFullscreenZoomed) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        this.fullscreenZoomStyle = {
            transformOrigin: `${x}% ${y}%`,
            transform: 'scale(2.5)' // Phóng to 2.5 lần trong chế độ Fullscreen
        };
    },
    handleFullscreenMouseLeave() {
        // Không cần làm gì để giữ nguyên vị trí cuối cùng
    },
    toggleFullscreenZoom(e) {
        this.isFullscreenZoomed = !this.isFullscreenZoomed;
        if (this.isFullscreenZoomed) this.handleFullscreenMouseMove(e);
        else this.fullscreenZoomStyle = { transformOrigin: 'center center', transform: 'scale(1)' };
    },
    selectFullscreenImage(img) {
        this.fullscreenImage = img;
        this.resetFullscreenZoom();
    },
    prevFullscreenImage() {
        if (!this.imageList || this.imageList.length <= 1) return;
        const currentIndex = this.imageList.indexOf(this.fullscreenImage);
        if (currentIndex > 0) {
            this.fullscreenImage = this.imageList[currentIndex - 1];
        } else {
            this.fullscreenImage = this.imageList[this.imageList.length - 1];
        }
        this.resetFullscreenZoom();
    },
    nextFullscreenImage() {
        if (!this.imageList || this.imageList.length <= 1) return;
        const currentIndex = this.imageList.indexOf(this.fullscreenImage);
        if (currentIndex < this.imageList.length - 1) {
            this.fullscreenImage = this.imageList[currentIndex + 1];
        } else {
            this.fullscreenImage = this.imageList[0];
        }
        this.resetFullscreenZoom();
    },
    prevImage() {
        if (!this.imageList || this.imageList.length <= 1) return;
        const currentIndex = this.currentImageIndex;
        if (currentIndex > 0) {
            this.displayedImage = this.imageList[currentIndex - 1];
        } else {
            this.displayedImage = this.imageList[this.imageList.length - 1]; // Vòng lại ảnh cuối cùng
        }
    },
    nextImage() {
        if (!this.imageList || this.imageList.length <= 1) return;
        const currentIndex = this.currentImageIndex;
        if (currentIndex < this.imageList.length - 1) {
            this.displayedImage = this.imageList[currentIndex + 1];
        } else {
            this.displayedImage = this.imageList[0]; // Vòng lại ảnh đầu tiên
        }
    },
    async fetchProduct() {
      this.isLoading = true;
      try {
        const productId = this.$route.params.id;
        this.product = await ProductService.findById(productId);
        // thiết lập ảnh hiển thị mặc định
        const imgs = this.imageList;
        this.displayedImage = imgs.length ? imgs[0] : 'https://placehold.co/600x400';
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        this.product = null;
      } finally {
        this.isLoading = false;
      }
    },
    async fetchLoyalty() {
        const token = localStorage.getItem("user_token");
        if (!token) return;

        try {
            this.loyalty = await CustomerService.getLoyalty();
        } catch (e) {
            // Không đăng nhập hoặc lỗi, bỏ qua
        }
    },
    async fetchReviews() {
        try {
            this.reviews = await ReviewsService.getByProduct(this.$route.params.id);
        } catch (error) {
            console.error("Lỗi tải đánh giá:", error);
        }
    },
    async fetchRecommendations() {
        try {
            const res = await fetch(`http://127.0.0.1:5555/api?id=${this.$route.params.id}`);
            if (res.ok) {
                const data = await res.json();
                this.recommendedProducts = data['san pham goi y'] || [];
            }
        } catch (e) {
            console.error("Lỗi tải API AI gợi ý:", e);
        }
    },
    async loadFilterData() {
      try {
        [this.sizes, this.colors, this.categories] = await Promise.all([
          SizesService.getAll(),
          ColorsService.getAll(),
          CategoryService.getAll(),
        ]);
      } catch (error) {
        console.error("Lỗi tải dữ liệu Size/Color:", error);
      }
    },
    selectSize(id) {
      // Nếu size này đang bị disable thì không làm gì cả (dù html attribute disabled đã chặn, thêm check cho chắc)
      if (this.isSizeDisabled(id)) return;
      
      // Nếu click lại vào size đang chọn -> bỏ chọn (toggle)
      if (this.selectedSizeId === id) {
        this.selectedSizeId = "";
        this.updateSelectedVariant();
        return;
      }

      this.selectedSizeId = id;
      this.updateSelectedVariant();
    },
    selectColor(id) {
      if (this.isColorDisabled(id)) return;

      if (this.selectedColorId === id) {
        this.selectedColorId = "";
        this.updateSelectedVariant();
        // nếu bỏ chọn màu, quay về ảnh mặc định nếu có
        const imgs = this.imageList;
        this.displayedImage = imgs.length ? imgs[0] : this.displayedImage;
        return;
      }

      this.selectedColorId = id;
      this.updateSelectedVariant();
      // chọn ảnh tương ứng với màu nếu có
      if (this.product && Array.isArray(this.product.images)) {
        const matched = this.product.images.find(img => String(img.color_id) === String(id));
        if (matched && matched.url) {
          this.displayedImage = matched.url;
        }
      }
    },
    // Kiểm tra xem Size có nên bị disable không
    isSizeDisabled(sizeId) {
      if (!this.selectedColorId) {
        // Nếu chưa chọn màu, Size được bật nếu CÓ ÍT NHẤT 1 biến thể mang size này còn hàng
        return !this.product.variants.some(v => String(v.size_id) === String(sizeId) && v.stock > 0);
      }

      // Nếu đã chọn màu, phải xét đúng cặp (Size + Màu)
      return !this.product.variants.some(v => 
        String(v.size_id) === String(sizeId) && 
        String(v.color_id) === String(this.selectedColorId) && 
        v.stock > 0
      );
    },
    // Kiểm tra xem Màu có nên bị disable không
    isColorDisabled(colorId) {
      if (!this.selectedSizeId) {
        return !this.product.variants.some(v => String(v.color_id) === String(colorId) && v.stock > 0);
      }

      return !this.product.variants.some(v => 
        String(v.size_id) === String(this.selectedSizeId) && 
        String(v.color_id) === String(colorId) && 
        v.stock > 0
      );
    },
    updateSelectedVariant() {
      if (!this.product || !this.product.variants) {
        this.selectedVariant = null;
        return;
      }
      this.selectedVariant = this.product.variants.find(v =>
        (v.size_id ? String(v.size_id) === String(this.selectedSizeId) : !this.selectedSizeId) &&
        (v.color_id ? String(v.color_id) === String(this.selectedColorId) : !this.selectedColorId)
      );
      
      // Logic cập nhật số lượng
      if (this.selectedVariant) {
        if (this.selectedVariant.stock > 0) {
            // Nếu số lượng đang là 0 (do trước đó chọn biến thể hết hàng), reset về 1
            if (this.quantity === 0) this.quantity = 1;
            // Nếu số lượng đang chọn lớn hơn tồn kho mới, giảm xuống bằng tồn kho
            if (this.quantity > this.selectedVariant.stock) this.quantity = this.selectedVariant.stock;
        } else {
            this.quantity = 0;
        }
      } else {
        // Trường hợp chưa chọn đủ biến thể, nếu có hàng tổng thì để mặc định là 1
        if (this.maxQuantity > 0 && this.quantity === 0) this.quantity = 1;
      }
    },
    // Hàm xử lý logic thêm vào giỏ hàng
    processAddToCart() {
      // Tính toán giá sau giảm
      const originalPrice = this.hasVariants ? this.selectedVariant.price : this.product.price;
      const finalPrice = this.discountPercent > 0 
          ? Math.round(originalPrice * (1 - this.discountPercent / 100)) 
          : originalPrice;

      // Kiểm tra số lượng sản phẩm này đã có sẵn trong giỏ hàng
      let currentCartQty = 0;
      if (this.hasVariants) {
          const existingItem = cartStore.state.items.find(i => 
              i._id === this.product._id && 
              i.variant && 
              String(i.variant.size_id) === String(this.selectedVariant.size_id) && 
              String(i.variant.color_id) === String(this.selectedVariant.color_id)
          );
          if (existingItem) currentCartQty = existingItem.quantity;
      } else {
          const existingItem = cartStore.state.items.find(i => i._id === this.product._id);
          if (existingItem) currentCartQty = existingItem.quantity;
      }

      const currentStock = this.hasVariants ? this.selectedVariant.stock : this.product.stock;
      const availableToAdd = currentStock - currentCartQty;

      if (this.hasVariants) {
          if (!this.selectedVariant || this.selectedVariant.stock === 0 || this.quantity <= 0) {
            showToast("Vui lòng chọn biến thể và số lượng hợp lệ.", "warning");
            return false;
          }
          if (this.quantity > availableToAdd) {
            if (availableToAdd > 0) showToast(`Bạn đã có ${currentCartQty} sản phẩm trong giỏ. Chỉ có thể thêm tối đa ${availableToAdd} sản phẩm nữa.`, "warning");
            else showToast(`Bạn đã thêm tối đa số lượng tồn kho vào giỏ hàng.`, "warning");
            return false;
          }
      } else {
          if (this.product.stock === 0 || this.quantity <= 0) {
              showToast("Sản phẩm đã hết hàng.", "warning");
              return false;
          }
          if (this.quantity > availableToAdd) {
              if (availableToAdd > 0) showToast(`Bạn đã có ${currentCartQty} sản phẩm trong giỏ. Chỉ có thể thêm tối đa ${availableToAdd} sản phẩm nữa.`, "warning");
              else showToast(`Bạn đã thêm tối đa số lượng tồn kho vào giỏ hàng.`, "warning");
              return false;
          }
      }

      // Sử dụng hàm addToCart từ store
      cartStore.addToCart(
        this.product, 
        this.hasVariants ? {
          _id: this.selectedVariant._id,
          size_id: this.selectedVariant.size_id,
          color_id: this.selectedVariant.color_id,
          price: finalPrice, // Sử dụng giá đã giảm
          originalPrice: originalPrice, // Lưu giá gốc để hiển thị
          vipDiscountPercent: this.discountPercent,
          vipPrice: finalPrice,
          stock: this.selectedVariant.stock // Thêm stock để validate bên Cart
        } : null,
        this.quantity,
        true, // isSelected
        false // replaceQuantity
      );

      // Xử lý cho sản phẩm đơn giản (không có biến thể)
      if (!this.hasVariants) {
          // Cần cập nhật lại item vừa thêm vào cartStore vì hàm addToCart mặc định dùng product.price
          const cartItem = cartStore.state.items.find(i => i._id === this.product._id);
          if (cartItem) {
              cartItem.price = finalPrice;
              cartItem.originalPrice = originalPrice;
              cartItem.vipDiscountPercent = this.discountPercent;
              cartItem.vipPrice = finalPrice;
          }
      }

      return true;
    },
    addToCart() {
      if (!localStorage.getItem("user_token")) {
        showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.", "warning");
        this.$router.push("/login");
        return;
      }
      
      if (this.processAddToCart()) {
        showToast(`Đã thêm ${this.quantity} sản phẩm vào giỏ hàng!`, "success");
      }
    },
    buyNow() {
      if (!localStorage.getItem("user_token")) {
        showToast("Vui lòng đăng nhập để tiến hành mua hàng.", "warning");
        this.$router.push("/login");
        return;
      }

      // Validate trước khi checkout
      if (this.hasVariants) {
          if (!this.selectedVariant || this.selectedVariant.stock === 0 || this.quantity <= 0) {
            showToast("Vui lòng chọn biến thể và số lượng hợp lệ.", "warning");
            return;
          }
          if (this.quantity > this.selectedVariant.stock) {
            showToast(`Số lượng mua (${this.quantity}) vượt quá tồn kho (${this.selectedVariant.stock}).`, "warning");
            return;
          }
      } else {
          if (this.product.stock === 0 || this.quantity <= 0) {
              showToast("Sản phẩm đã hết hàng.", "warning");
              return;
          }
          if (this.quantity > this.product.stock) {
              showToast(`Số lượng mua (${this.quantity}) vượt quá tồn kho (${this.product.stock}).`, "warning");
              return;
          }
      }

      const originalPrice = this.hasVariants ? this.selectedVariant.price : this.product.price;
      const finalPrice = this.discountPercent > 0 
          ? Math.round(originalPrice * (1 - this.discountPercent / 100)) 
          : originalPrice;
          
      // Tạo temp cart cho checkout trực tiếp (KHÔNG lưu vào cart localStorage)
      const checkoutItem = {
        _id: this.product._id,
        name: this.product.name,
        price: finalPrice,
        originalPrice: originalPrice,
        vipDiscountPercent: this.discountPercent,
        vipPrice: finalPrice,
        stock: this.hasVariants ? this.selectedVariant.stock : this.product.stock,
        image: this.displayedImage || (this.product.images && this.product.images.length ? this.product.images[0].url : this.product.image),
        variant: this.hasVariants ? { _id: this.selectedVariant._id, size_id: this.selectedVariant.size_id, color_id: this.selectedVariant.color_id, stock: this.selectedVariant.stock } : null,
        quantity: this.quantity,
        selected: true
      };
      
      sessionStorage.setItem('checkout_direct', JSON.stringify([checkoutItem]));
      this.$router.push({ path: "/checkout", query: { direct: '1' } });
    },
    chatNow() {
      this.$router.push({
        name: 'contact',
        query: {
          productId: this.product._id,
          productName: this.product.name,
          productImage: this.displayedImage,
          productPrice: this.selectedVariant ? this.selectedVariant.price : this.product.price,
          productRating: this.averageRating
        }
      });
    },
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    },
    getDisplayPrice(price) {
        if (this.loyalty && this.loyalty.discountPercent > 0) {
            return Math.round(price * (1 - this.loyalty.discountPercent / 100));
        }
        return price;
    },
    showMoreReviews() {
        this.visibleReviewsCount += 5;
    },
    showLessReviews() {
        this.visibleReviewsCount = 3;
    }
    ,
    getCategoryName(id) {
        const cat = this.categories.find(c => String(c._id) === String(id));
        return cat ? cat.name : "Khác";
    }
  },
  async created() {
    window.scrollTo(0, 0);
    await this.loadFilterData(); // Tải Size và Color trước
    await this.fetchProduct(); // Sau đó tải sản phẩm
    await this.fetchLoyalty(); // Tải thông tin VIP
    await this.fetchReviews(); // Tải đánh giá
    await this.fetchRecommendations(); // Tải gợi ý từ Python AI
  },
  watch: {
    // Theo dõi thay đổi ID sản phẩm trên URL để tải lại dữ liệu
    "$route.params.id": function() {
        window.scrollTo(0, 0);
        
        // Reset lại trạng thái các biến thể khi chuyển sang sản phẩm khác từ danh sách gợi ý
        this.selectedSizeId = "";
        this.selectedColorId = "";
        this.selectedVariant = null;
        this.quantity = 1;

        this.fetchProduct();
        this.fetchReviews();
        this.fetchRecommendations();
    },
    // Tự động điều chỉnh nếu nhập quá số lượng tồn kho
    quantity(newVal) {
        if (this.maxQuantity > 0 && newVal > this.maxQuantity) {
            this.quantity = this.maxQuantity;
            showToast(`Số lượng tối đa là ${this.maxQuantity}`, "info");
        }
    }
  },
};
</script>

<style scoped>
.product-detail-page { display: flex; flex-direction: column; min-height: 100vh; }
.container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; }
.breadcrumb { margin-bottom: 20px; font-size: 0.9rem; color: #555; display: flex; align-items: center; gap: 8px; }
.breadcrumb a { text-decoration: none; color: #0055aa; }
.breadcrumb i { font-size: 0.7rem; color: #999; }

.loading-state, .no-product-found { text-align: center; padding: 100px 20px; font-size: 1.2rem; color: #7f8c8d; }
.loading-state i, .no-product-found i { font-size: 3rem; margin-bottom: 20px; color: #bdc3c7; }
.no-product-found .btn-back { display: inline-block; margin-top: 20px; padding: 10px 25px; background: #2c3e50; color: white; text-decoration: none; border-radius: 25px; transition: 0.3s; }
.no-product-found .btn-back:hover { background: #34495e; }

.product-main-wrapper { display: flex; flex-direction: column; gap: 20px; }

.product-overview-card { display: flex; flex-wrap: wrap; gap: 30px; background: white; padding: 20px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }

.product-image-gallery { flex: 1; min-width: 300px; max-width: 50%; }
.main-image { width: 100%; height: auto; border-radius: 8px; object-fit: contain; max-height: 500px; transition: transform 0.15s ease-out; will-change: transform; pointer-events: none; }

.main-image-container { position: relative; overflow: hidden; border-radius: 8px; cursor: zoom-in; }
.img-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.4);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
}
.img-nav.prev { left: 10px; }
.img-nav.next { right: 10px; }
.img-nav:hover { background: rgba(0,0,0,0.6); }

/* gallery thumbnails */
.thumbnails {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.thumbnails .thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border 0.2s;
}
.thumbnails .thumb:hover {
  border-color: #ccc;
}
.thumbnails .thumb.active {
  border-color: #ee4d2d;
}

.product-summary-info { flex: 1; min-width: 350px; padding-left: 20px; }
.product-name { font-size: 1.5rem; font-weight: 500; color: #333; margin-bottom: 10px; line-height: 1.4; }

.price-box { background: #fafafa; padding: 15px; margin-bottom: 20px; }
.product-price { font-size: 1.8rem; font-weight: bold; color: #ee4d2d; margin: 0; }

.product-rating-summary { margin-bottom: 15px; color: #f1c40f; font-size: 1.1rem; }
.product-rating-summary .stars .active { color: #f1c40f; }
.product-rating-summary .stars .inactive { color: #ddd; }
.product-rating-summary .stars svg { margin-right: 2px; }
.product-rating-summary .rating-text { color: #7f8c8d; font-size: 0.9rem; margin-left: 8px; }

.variant-selection { margin-bottom: 20px; }
.variant-group { display: flex; align-items: baseline; margin-bottom: 20px; }
.variant-label { width: 100px; font-weight: 600; color: #757575; flex-shrink: 0; }
.variant-options { display: flex; flex-wrap: wrap; gap: 10px; }

.variant-btn {
  background: #fff;
  border: 1px solid rgba(0,0,0,.09);
  color: rgba(0,0,0,.8);
  padding: 8px 20px;
  cursor: pointer;
  border-radius: 2px;
  font-size: 0.95rem;
  transition: all 0.2s;
  min-width: 80px;
}
.variant-btn:hover { border-color: #ee4d2d; color: #ee4d2d; }
.variant-btn.active {
  border-color: #ee4d2d; color: #ee4d2d; background: #fff5f1; position: relative;
}
/* Style cho nút bị vô hiệu hóa */
.variant-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #f1f1f1;
  border-color: #ddd;
  color: #999;
}

.quantity-selector { display: flex; align-items: center; margin-bottom: 30px; }
.quantity-selector label { font-weight: 600; margin-right: 15px; color: #34495e; }
.qty-input-group { display: flex; border: 1px solid #ddd; border-radius: 2px; }
.qty-input-group button { background: white; border: none; width: 32px; height: 32px; cursor: pointer; font-size: 1.2rem; color: #555; border-right: 1px solid #ddd; }
.qty-input-group button:last-child { border-right: none; border-left: 1px solid #ddd; }
.qty-input-group input { width: 50px; text-align: center; border: none; outline: none; font-size: 1rem; -moz-appearance: textfield;appearance: none; }
.qty-input-group input::-webkit-outer-spin-button, .qty-input-group input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.stock-info { margin-left: 15px; color: #757575; font-size: 0.9rem; }

.action-buttons { display: flex; gap: 15px; flex-wrap: wrap; margin-top: 10px; }

.btn-add-to-cart, .btn-buy-now, .btn-chat-now {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  flex: 1;
  min-width: 140px;
  height: 48px;
}

/* Thêm vào giỏ: Style nhẹ nhàng, nền xanh nhạt, viền xanh */
.btn-add-to-cart {
  background-color: rgba(255,87,34,0.1);
  color: #ee4d2d;
  border: 1px solid #ee4d2d;
}
.btn-add-to-cart:hover:not(:disabled) {
  background-color: rgba(255,87,34,0.2);
}

/* Mua ngay: Nổi bật nhất với Gradient Cam/Đỏ */
.btn-buy-now {
  background: #ee4d2d;
  color: white;
  border: 1px solid #ee4d2d;
}
.btn-buy-now:hover:not(:disabled) {
  background: #d73211;
}

/* Chat ngay: Màu xanh dương/tím than */
.btn-chat-now {
  background: #2c3e50;
  color: white;
  border: 1px solid #2c3e50;
}
.btn-chat-now:hover {
  background: #1a252f;
}

/* Trạng thái Disabled chung cho các nút */
button:disabled {
  background: #f5f5f5 !important;
  color: #aaa !important;
  border: 1px solid #ddd !important;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: none !important;
}

/* Full width details section */
.product-details-container { background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 30px; border: 1px solid #f0f0f0; }
.section-header { font-size: 1.5rem; font-weight: 800; color: #2c3e50; margin: 0 0 25px 0; text-transform: uppercase; border-bottom: 2px solid #eee; padding-bottom: 10px; position: relative; }
.section-header::after { content: ''; position: absolute; left: 0; bottom: -2px; width: 60px; height: 4px; background: #ee4d2d; border-radius: 2px; }

.details-section, .description-section, .product-reviews-section { margin-bottom: 40px; }

.detail-grid { display: flex; flex-direction: column; gap: 15px; padding: 0 15px; }
.detail-row { display: flex; align-items: flex-start; }
.detail-row label { width: 150px; color: #999; font-size: 0.95rem; }
.detail-row div { color: #333; font-size: 0.95rem; }
.breadcrumb-link a { color: #0055aa; text-decoration: none; }

.description-content { padding: 0 15px; color: #333; line-height: 1.8; font-size: 0.95rem; }
.disclaimer-text { font-weight: bold; color: #ee4d2d; margin-bottom: 15px; }
.formatted-text { white-space: pre-line; }

/* Reviews Styles */
.no-reviews { color: #777; font-style: italic; }
.review-item { border-bottom: 1px solid #f1f1f1; padding-bottom: 20px; margin-bottom: 20px; }
.review-header { display: flex; align-items: center; margin-bottom: 10px; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover; }
.user-info { flex: 1; }
.user-name { font-weight: bold; color: #333; display: block; }
.user-rating svg { margin-right: 2px; }
.user-rating .active { color: #f1c40f; }
.user-rating .inactive { color: #ddd; }
.review-date { font-size: 0.85rem; color: #999; }
.review-content { color: #555; line-height: 1.5; margin-bottom: 10px; }
.review-image-attachment { width: 100px; height: 100px; object-fit: cover; border-radius: 5px; cursor: pointer; border: 1px solid #eee; }
.store-reply { background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 0.9rem; color: #333; border-left: 3px solid #302b63; }
.review-actions { text-align: center; margin-top: 20px; }
.btn-show-more, .btn-show-less { background: none; border: 1px solid #ddd; padding: 8px 20px; border-radius: 20px; cursor: pointer; color: #555; font-size: 0.9rem; transition: 0.3s; margin: 0 5px; }
.btn-show-more:hover, .btn-show-less:hover { background: #f0f0f0; color: #302b63; border-color: #302b63; }

/* Recommendation Styles Nâng Cấp */
.recommendations-section { margin-top: 40px; margin-bottom: 20px; padding: 40px 30px; background: #f8f9fa; border-radius: 12px; box-shadow: none; border: 1px solid #eee; }
.section-title-wrapper { text-align: center; margin-bottom: 40px; }
.section-header-rec { font-size: 2.2rem; font-weight: 800; color: #2c3e50; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
.title-underline { width: 60px; height: 4px; background-color: #ee4d2d; margin: 15px auto 0; border-radius: 2px; }

.product-grid-rec { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 30px; }
.product-card-rec { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: all 0.3s ease; border: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.product-card-rec:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); border-color: #eee; }
.product-card-rec a { text-decoration: none; color: inherit; display: flex; flex-direction: column; height: 100%; }

.image-wrapper-rec { position: relative; width: 100%; height: 240px; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
.image-wrapper-rec img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.5s ease; }
.product-card-rec:hover .image-wrapper-rec img { transform: scale(1.08); }

.info-rec { padding: 20px; display: flex; flex-direction: column; flex-grow: 1; background: #fafafa; border-top: 1px solid #f5f5f5; text-align: left; }
.product-name-rec { font-size: 1.1rem; font-weight: 600; color: #2c3e50; margin: 0 0 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2;line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; height: 3.08rem; transition: color 0.2s; }
.product-card-rec:hover .product-name-rec { color: #ee4d2d; }
.price-rec { color: #ee4d2d; font-weight: 800; margin: 0; font-size: 1.25rem; text-align: right; margin-top: auto; }

/* Fullscreen Modal Styles */
.fullscreen-modal {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
}
.btn-close-fs {
  position: absolute; top: 30px; right: 40px;
  background: rgba(0,0,0,0.05); border: none; color: #333; cursor: pointer;
  width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  z-index: 10000; transition: all 0.3s;
}
.btn-close-fs:hover { background: #ee4d2d; color: white; transform: rotate(90deg); }

.fullscreen-img-container {
  width: 100vw; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; cursor: zoom-in;
}
.fullscreen-img-container.is-zoomed { cursor: zoom-out; }
.fullscreen-img {
  max-width: 90vw; max-height: 90vh; object-fit: contain; pointer-events: none;
  transition: transform 0.15s ease-out; will-change: transform;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Fullscreen Navigation & Thumbnails */
.fs-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(0,0,0,0.05); border: none; color: #555;
  padding: 10px; border-radius: 50%; cursor: pointer;
  z-index: 10000; transition: all 0.3s; display: flex; align-items: center; justify-content: center;
}
.fs-nav:hover { background: #ee4d2d; color: white; }
.fs-nav.prev { left: 30px; }
.fs-nav.next { right: 30px; }

.fs-thumbnails {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 12px; z-index: 10000; background: rgba(255,255,255,0.9);
  padding: 10px 20px; border-radius: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  max-width: 90vw; overflow-x: auto;
}
.fs-thumbnails::-webkit-scrollbar { display: none; }
.fs-thumb {
  width: 60px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer;
  border: 2px solid transparent; transition: all 0.2s; opacity: 0.6;
}
.fs-thumb:hover { opacity: 1; }
.fs-thumb.active { border-color: #ee4d2d; opacity: 1; transform: scale(1.1); box-shadow: 0 4px 10px rgba(238,77,45,0.3); }

@media (max-width: 768px) {
  .product-content { flex-direction: column; }
  .product-grid-rec { grid-template-columns: repeat(2, 1fr); gap: 15px; }
  .product-image-gallery, .product-details { max-width: 100%; }
  .variant-group { flex-direction: column; align-items: flex-start; gap: 10px; }
  .variant-label { width: auto; }
  .action-buttons { flex-direction: column; }
}
@media (max-width: 480px) {
  .product-grid-rec { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .info-rec { padding: 10px; } .product-name-rec { font-size: 0.85rem; } .price-rec { font-size: 1rem; }
}
.lucide-spin { animation: spin 2s linear infinite; }
@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Size Guide Modal Styles */
.size-guide-link { font-size: 0.85rem; color: #3498db; cursor: pointer; margin-top: 5px; text-decoration: underline; display: inline-block; transition: 0.2s; }
.size-guide-link:hover { color: #2980b9; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; backdrop-filter: blur(2px); }
.modal-content.size-guide-modal { background: white; padding: 25px; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: fadeInDown 0.3s ease; }
.btn-close-modal { background: none; border: none; color: #999; cursor: pointer; transition: 0.2s; padding: 0; display: flex; align-items: center; justify-content: center; }
.btn-close-modal:hover { color: #e74c3c; transform: rotate(90deg); }

.size-guide-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 0.95rem; margin-bottom: 10px; }
.size-guide-table th, .size-guide-table td { border: 1px solid #eee; padding: 10px; color: #333; }
.size-guide-table th { background: #f8f9fa; color: #2c3e50; font-weight: 600; }
.size-guide-table tr:nth-child(even) { background: #fafafa; }
.modal-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
</style>