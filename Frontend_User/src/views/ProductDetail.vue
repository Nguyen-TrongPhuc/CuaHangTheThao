<template>
  <div class="product-detail-page">
    <AppHeader />

    <div class="container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <router-link to="/">Trang chủ</router-link> 
        <i class="fa-solid fa-chevron-right"></i>
        <router-link to="/products">Sản phẩm</router-link>
        <i class="fa-solid fa-chevron-right"></i>
        <span>{{ product ? product.name : 'Chi tiết' }}</span>
      </div>

      <div v-if="isLoading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i> Đang tải sản phẩm...
      </div>

      <div v-else-if="product" class="product-main-wrapper">
        <div class="product-overview-card">
        <div class="product-image-gallery">
            <div class="main-image-container">
              <img :src="displayedImage" :alt="product.name" class="main-image" />
              <button v-if="imageList.length > 1" class="img-nav prev" @click="prevImage">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <button v-if="imageList.length > 1" class="img-nav next" @click="nextImage">
                <i class="fa-solid fa-chevron-right"></i>
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
             <span class="stars"><i v-for="n in 5" :key="n" :class="['fa-solid fa-star', n <= Math.round(averageRating) ? 'active' : '']"></i></span>
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
              <span class="variant-label">Kích thước</span>
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
              <i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ hàng
            </button>
            <button class="btn-buy-now" @click="buyNow" :disabled="maxQuantity === 0 || quantity <= 0 || (hasVariants && !selectedVariant)">
              Mua ngay
            </button>
            <button class="btn-chat-now" @click="chatNow">
              <i class="fa-solid fa-comments"></i> Chat ngay
            </button>
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
                            <div class="user-rating"><i v-for="n in 5" :key="n" :class="['fa-solid fa-star', n <= review.rating ? 'active' : '']"></i></div>
                        </div>
                        <span class="review-date">{{ new Date(review.createdAt).toLocaleDateString('vi-VN') }}</span>
                    </div>
                    <p class="review-content">{{ review.comment }}</p>
                    <img v-if="review.image" :src="review.image" class="review-image-attachment" @click="openImage(review.image)" />
                    <div v-if="review.reply" class="store-reply"><strong>Phản hồi từ cửa hàng:</strong> {{ review.reply.text }}</div>
                </div>
                
                <div v-if="reviews.length > 3" class="review-actions">
                    <button v-if="visibleReviewsCount < reviews.length" @click="showMoreReviews" class="btn-show-more">Xem thêm đánh giá <i class="fa-solid fa-chevron-down"></i></button>
                    <button v-if="visibleReviewsCount > 3" @click="showLessReviews" class="btn-show-less">Thu gọn <i class="fa-solid fa-chevron-up"></i></button>
                </div>
            </div>
          </div>
        </div>

      </div>

      <div v-else class="no-product-found">
        <i class="fa-solid fa-box-open"></i>
        <p>Không tìm thấy sản phẩm này.</p>
        <router-link to="/products" class="btn-back">Quay lại danh sách sản phẩm</router-link>
      </div>
    </div>

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

export default {
  components: { AppHeader, AppFooter },
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
      displayedImage: ''
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
    }
  },
  methods: {
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
      // Nếu chưa chọn màu nào -> Chỉ disable những size không có hàng hoặc không tồn tại trong bất kỳ biến thể nào
      if (!this.selectedColorId && this.availableColors.length > 0) {
        return !this.product.variants.some(v => 
          String(v.size_id) === String(sizeId) && v.stock > 0
        );
      }

      // Nếu đã chọn màu -> Kiểm tra xem cặp (Size này + Màu đang chọn) có tồn tại và còn hàng không
      return !this.product.variants.some(v => 
        String(v.size_id) === String(sizeId) && 
        (this.selectedColorId ? String(v.color_id) === String(this.selectedColorId) : !v.color_id) && 
        v.stock > 0
      );
    },
    // Kiểm tra xem Màu có nên bị disable không
    isColorDisabled(colorId) {
      // Tương tự logic của Size
      if (!this.selectedSizeId && this.availableSizes.length > 0) {
        return !this.product.variants.some(v => 
          String(v.color_id) === String(colorId) && v.stock > 0
        );
      }

      return !this.product.variants.some(v => 
        (this.selectedSizeId ? String(v.size_id) === String(this.selectedSizeId) : !v.size_id) && 
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
    // Hàm xử lý logic thêm vào giỏ hàng (dùng chung cho cả 2 nút)
    processAddToCart(isBuyNow = false) {
      // Tính toán giá sau giảm
      const originalPrice = this.hasVariants ? this.selectedVariant.price : this.product.price;
      const finalPrice = this.discountPercent > 0 
          ? Math.round(originalPrice * (1 - this.discountPercent / 100)) 
          : originalPrice;

      if (this.hasVariants) {
          if (!this.selectedVariant || this.selectedVariant.stock === 0 || this.quantity <= 0) {
            showToast("Vui lòng chọn biến thể và số lượng hợp lệ.", "warning");
            return false;
          }
          if (this.quantity > this.selectedVariant.stock) {
            showToast(`Số lượng mua (${this.quantity}) vượt quá tồn kho (${this.selectedVariant.stock}).`, "warning");
            return false;
          }
      } else {
          if (this.product.stock === 0 || this.quantity <= 0) {
              showToast("Sản phẩm đã hết hàng.", "warning");
              return false;
          }
          if (this.quantity > this.product.stock) {
              showToast(`Số lượng mua (${this.quantity}) vượt quá tồn kho (${this.product.stock}).`, "warning");
              return false;
          }
      }

      // Nếu là Mua ngay, bỏ chọn tất cả sản phẩm khác trong giỏ để chỉ thanh toán sản phẩm này
      if (isBuyNow) {
        cartStore.state.items.forEach(item => item.selected = false);
      }

      // Sử dụng hàm addToCart từ store
      cartStore.addToCart(
        this.product, 
        this.hasVariants ? {
          size_id: this.selectedVariant.size_id,
          color_id: this.selectedVariant.color_id,
          price: finalPrice, // Sử dụng giá đã giảm
          originalPrice: originalPrice, // Lưu giá gốc để hiển thị
          vipDiscountPercent: this.discountPercent,
          vipPrice: finalPrice,
          stock: this.selectedVariant.stock // Thêm stock để validate bên Cart
        } : null,
        this.quantity,
        isBuyNow, // isSelected
        isBuyNow // replaceQuantity: Nếu là Mua ngay thì thay thế số lượng cũ
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
      if (this.processAddToCart(false)) {
        showToast(`Đã thêm ${this.quantity} sản phẩm vào giỏ hàng!`, "success");
      }
    },
    buyNow() {
      if (this.processAddToCart(true)) {
        // Chuyển hướng ngay đến trang thanh toán
        this.$router.push("/checkout");
      }
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
    openImage(url) {
        window.open(url, '_blank');
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
  },
  watch: {
    // Theo dõi thay đổi ID sản phẩm trên URL để tải lại dữ liệu
    "$route.params.id": function() {
        window.scrollTo(0, 0);
        this.fetchProduct();
        this.fetchReviews();
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
.main-image { width: 100%; height: auto; border-radius: 8px; object-fit: contain; max-height: 500px; }

.main-image-container { position: relative; }
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
.product-rating-summary .stars i { color: #ddd; margin-right: 2px; }
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
.qty-input-group input { width: 50px; text-align: center; border: none; outline: none; font-size: 1rem; -moz-appearance: textfield; }
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
  background: #302b63;
  color: white;
  border: 1px solid #302b63;
}
.btn-chat-now:hover {
  background: #241f4b;
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
.product-details-container { background: white; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); padding: 20px; }
.section-header { background: #fafafa; padding: 15px; font-size: 1.1rem; font-weight: 500; color: #333; margin: 0 0 20px 0; text-transform: uppercase; }

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
.user-rating i { font-size: 0.8rem; color: #ddd; }
.user-rating i.active { color: #f1c40f; }
.review-date { font-size: 0.85rem; color: #999; }
.review-content { color: #555; line-height: 1.5; margin-bottom: 10px; }
.review-image-attachment { width: 100px; height: 100px; object-fit: cover; border-radius: 5px; cursor: pointer; border: 1px solid #eee; }
.store-reply { background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 0.9rem; color: #333; border-left: 3px solid #302b63; }
.review-actions { text-align: center; margin-top: 20px; }
.btn-show-more, .btn-show-less { background: none; border: 1px solid #ddd; padding: 8px 20px; border-radius: 20px; cursor: pointer; color: #555; font-size: 0.9rem; transition: 0.3s; margin: 0 5px; }
.btn-show-more:hover, .btn-show-less:hover { background: #f0f0f0; color: #302b63; border-color: #302b63; }


@media (max-width: 768px) {
  .product-content { flex-direction: column; }
  .product-image-gallery, .product-details { max-width: 100%; }
  .variant-group { flex-direction: column; align-items: flex-start; gap: 10px; }
  .variant-label { width: auto; }
  .action-buttons { flex-direction: column; }
}
</style>