import { reactive, computed } from "vue";

// Khởi tạo state từ localStorage nếu có
const savedCart = localStorage.getItem("cart_items");
const state = reactive({
    items: savedCart ? JSON.parse(savedCart).map(item => ({
        ...item,
        selected: item.selected ?? true // Mặc định chọn nếu chưa có
    })) : []
});

// Hàm lưu vào localStorage
const saveState = () => {
    localStorage.setItem("cart_items", JSON.stringify(state.items));
};

export const cartStore = {
    state,
    
    addToCart(product, variant = null, quantity = 1, isSelected = true, replaceQuantity = false) {
        // Hàm so sánh 2 biến thể
        const compareVariant = (v1, v2) => {
            if (!v1 && !v2) return true;
            if (!v1 || !v2) return false;
            return String(v1.size_id) === String(v2.size_id) && String(v1.color_id) === String(v2.color_id);
        };

        const existingItem = state.items.find(item => 
            item._id === product._id && compareVariant(item.variant, variant)
        );

        if (existingItem) {
            if (replaceQuantity) {
                existingItem.quantity = quantity; // Thay thế số lượng nếu là Mua ngay
            } else {
                existingItem.quantity += quantity; // Cộng dồn nếu là Thêm vào giỏ
            }
            if (isSelected) existingItem.selected = true;
        } else {
            // determine image to store: prefer color-specific or first from images array
            let imgUrl = product.image || '';
            if (product.images && product.images.length) {
                if (variant && variant.color_id) {
                    const match = product.images.find(i => String(i.color_id) === String(variant.color_id));
                    if (match && match.url) {
                        imgUrl = match.url;
                    } else if (product.images[0].url) {
                        imgUrl = product.images[0].url;
                    }
                } else if (product.images[0].url) {
                    imgUrl = product.images[0].url;
                }
            }
            state.items.push({ 
                _id: product._id,
                name: product.name,
                // Nếu có biến thể thì lấy giá của biến thể, ngược lại lấy giá gốc
                price: variant?.price || product.price,
                image: imgUrl,
                variant: variant ? { size_id: variant.size_id, color_id: variant.color_id } : null,
                quantity,
                selected: isSelected
            });
        }
        saveState();
    },

    removeFromCart(productId) {
        const index = state.items.findIndex(item => item._id === productId);
        if (index > -1) {
            state.items.splice(index, 1);
            saveState();
        }
    },

    clearCart() {
        state.items = [];
        saveState();
    },

    // Hàm lưu trạng thái thủ công (dùng khi checkbox thay đổi)
    save() {
        saveState();
    },

    totalAmount: computed(() => state.items.reduce((total, item) => total + (item.price * item.quantity), 0)),
    totalItems: computed(() => state.items.reduce((total, item) => total + item.quantity, 0))
};