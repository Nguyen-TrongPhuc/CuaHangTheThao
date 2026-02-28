<template>
  <div class="product-detail-page">
    <AppHeader />

    <div class="container">
      <div v-if="isLoading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i> Đang tải sản phẩm...
      </div>

      <div v-else-if="product" class="product-content">
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

        <div class="product-details">
          <h1 class="product-name">{{ product.name }}</h1>
          
          <div class="product-rating-summary" v-if="reviews.length > 0">
             <span class="stars"><i v-for="n in 5" :key="n" :class="['fa-solid fa-star', n <= Math.round(averageRating) ? 'active' : '']"></i></span>
             <span class="rating-text">({{ averageRating }}/5 - {{ reviews.length }} đánh giá)</span>
          </div>

          <p class="product-price">{{ formatPrice(selectedVariant ? selectedVariant.price : product.price) }}</p>

          <div class="variant-selection" v-if="hasVariants">
            <div class="variant-group" v-if="availableSizes.length > 0">
              <span class="variant-label">Kích thước:</span>
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
              <span class="variant-label">Màu sắc:</span>
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

          <div v-if="hasVariants && selectedVariant" class="variant-info-display">
            <p><strong>Tồn kho:</strong> {{ selectedVariant.stock }} sản phẩm</p>
            <p v-if="selectedVariant.stock === 0" class="out-of-stock">Hết hàng!</p>
          </div>
          <div v-else-if="hasVariants && (selectedSizeId || selectedColorId)" class="no-variant-match">
            <p>Không có biến thể phù hợp với lựa chọn của bạn.</p>
          </div>
          <div v-else-if="!hasVariants" class="variant-info-display">
             <p><strong>Tồn kho:</strong> {{ product.stock }} sản phẩm</p>
             <p v-if="product.stock === 0" class="out-of-stock">Hết hàng!</p>
          </div>

          <div class="quantity-selector">
            <label for="quantity">Số lượng:</label>
            <input type="number" id="quantity" v-model.number="quantity" min="1" :max="maxQuantity" :disabled="maxQuantity === 0" />
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

          <div class="product-description">
            <h2>Mô tả sản phẩm</h2>
            <p>{{ product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.' }}</p>
          </div>

          <!-- Phần Đánh giá -->
          <div class="product-reviews-section">
            <h2>Đánh giá từ khách hàng</h2>
            <div v-if="reviews.length === 0" class="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</div>
            <div v-else class="reviews-list">
                <div v-for="review in reviews" :key="review._id" class="review-item">
                    <div class="review-header">
                        <img :src="review.user.avatar || 'https://via.placeholder.com/40'" class="user-avatar" />
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
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { showToast } from "@/utils/toast";
import { cartStore } from "@/utils/cart";
import ReviewsService from "@/services/reviews.service";

export default {
  components: { AppHeader, AppFooter },
  data() {
    return {
      product: null,
      isLoading: true,
      sizes: [],
      colors: [],
      selectedSizeId: "",
      selectedColorId: "",
      selectedVariant: null,
      quantity: 1,
      reviews: []
      ,
      displayedImage: ''
    };
  },
  computed: {
    hasVariants() {
        return this.product && this.product.variants && this.product.variants.length > 0;
    },
    maxQuantity() {
        if (this.hasVariants) {
            return this.selectedVariant ? this.selectedVariant.stock : 0;
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
    }
  },
  methods: {
    async fetchProduct() {
      this.isLoading = true;
      try {
        const productId = this.$route.params.id;
        this.product = await ProductService.findById(productId);
        if (this.product && this.product.variants && this.product.variants.length > 0) {
          // Chọn biến thể đầu tiên làm mặc định nếu có
          this.selectedSizeId = this.product.variants[0].size_id;
          this.selectedColorId = this.product.variants[0].color_id;
          this.updateSelectedVariant();
        }
        // thiết lập ảnh hiển thị mặc định
        const imgs = this.imageList;
        this.displayedImage = imgs.length ? imgs[0] : 'https://via.placeholder.com/600x400';
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        this.product = null;
      } finally {
        this.isLoading = false;
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
        [this.sizes, this.colors] = await Promise.all([
          SizesService.getAll(),
          ColorsService.getAll(),
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
      // Đảm bảo số lượng không vượt quá tồn kho
      if (this.selectedVariant && this.quantity > this.selectedVariant.stock) {
        this.quantity = this.selectedVariant.stock > 0 ? 1 : 0;
      } else if (!this.selectedVariant || this.selectedVariant.stock === 0) {
        this.quantity = 0;
      }
    },
    // Hàm xử lý logic thêm vào giỏ hàng (dùng chung cho cả 2 nút)
    processAddToCart(isBuyNow = false) {
      if (this.hasVariants) {
          if (!this.selectedVariant || this.selectedVariant.stock === 0 || this.quantity <= 0) {
            showToast("Vui lòng chọn biến thể và số lượng hợp lệ.", "warning");
            return false;
          }
      } else {
          if (this.product.stock === 0 || this.quantity <= 0) {
              showToast("Sản phẩm đã hết hàng.", "warning");
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
          price: this.selectedVariant.price
        } : null,
        this.quantity,
        isBuyNow, // isSelected
        isBuyNow // replaceQuantity: Nếu là Mua ngay thì thay thế số lượng cũ
      );

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
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    },
    openImage(url) {
        window.open(url, '_blank');
    }
  },
  async created() {
    await this.loadFilterData(); // Tải Size và Color trước
    await this.fetchProduct(); // Sau đó tải sản phẩm
    await this.fetchReviews(); // Tải đánh giá
  },
  watch: {
    // Theo dõi thay đổi ID sản phẩm trên URL để tải lại dữ liệu
    "$route.params.id": function() {
        this.fetchProduct();
        this.fetchReviews();
    },
  },
};
</script>

<style scoped>
.product-detail-page { display: flex; flex-direction: column; min-height: 100vh; }
.container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; }

.loading-state, .no-product-found { text-align: center; padding: 100px 20px; font-size: 1.2rem; color: #7f8c8d; }
.loading-state i, .no-product-found i { font-size: 3rem; margin-bottom: 20px; color: #bdc3c7; }
.no-product-found .btn-back { display: inline-block; margin-top: 20px; padding: 10px 25px; background: #2c3e50; color: white; text-decoration: none; border-radius: 25px; transition: 0.3s; }
.no-product-found .btn-back:hover { background: #34495e; }

.product-content { display: flex; flex-wrap: wrap; gap: 40px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

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

.product-details { flex: 1; min-width: 350px; }
.product-name { font-size: 2.2rem; font-weight: 700; color: #2c3e50; margin-bottom: 15px; }
.product-price { font-size: 1.8rem; font-weight: bold; color: #e74c3c; margin-bottom: 25px; }

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

.variant-info-display { background: #f0f8ff; border: 1px solid #e0f0ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.variant-info-display p { margin: 5px 0; color: #34495e; }
.out-of-stock { color: #e74c3c; font-weight: bold; }
.no-variant-match { background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #856404; }

.quantity-selector { display: flex; align-items: center; margin-bottom: 30px; }
.quantity-selector label { font-weight: 600; margin-right: 15px; color: #34495e; }
.quantity-selector input { width: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; text-align: center; font-size: 1rem; }

.action-buttons { display: flex; gap: 15px; }

.btn-add-to-cart {
  background: linear-gradient(135deg, #28a745, #218838);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.btn-add-to-cart:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838, #1e7e34);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}
.btn-add-to-cart:disabled {
  background: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-buy-now {
  background: linear-gradient(135deg, #ff5722, #f4511e);
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.3);
}
.btn-buy-now:hover:not(:disabled) {
  background: linear-gradient(135deg, #f4511e, #e64a19);
  transform: translateY(-2px);
}

.btn-chat-now {
  background: #3498db;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}
.btn-chat-now:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.product-description { margin-top: 40px; border-top: 1px solid #eee; padding-top: 30px; }
.product-description h2 { font-size: 1.5rem; color: #2c3e50; margin-bottom: 15px; }
.product-description p { line-height: 1.8; color: #555; }

/* Reviews Styles */
.product-reviews-section { margin-top: 40px; border-top: 1px solid #eee; padding-top: 30px; }
.product-reviews-section h2 { font-size: 1.5rem; color: #2c3e50; margin-bottom: 20px; }
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

@media (max-width: 768px) {
  .product-content { flex-direction: column; }
  .product-image-gallery, .product-details { max-width: 100%; }
  .variant-group { flex-direction: column; align-items: flex-start; gap: 10px; }
  .variant-label { width: auto; }
  .action-buttons { flex-direction: column; }
}
</style>