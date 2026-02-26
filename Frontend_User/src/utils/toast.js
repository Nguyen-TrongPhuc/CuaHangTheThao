import { reactive } from 'vue';

// Trạng thái chung của thông báo
export const toastState = reactive({
    message: '',
    type: 'success', // success, error, warning
    isVisible: false
});

// Hàm để gọi hiển thị thông báo ở bất cứ đâu
export const showToast = (message, type = 'success') => {
    toastState.message = message;
    toastState.type = type;
    toastState.isVisible = true;

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        toastState.isVisible = false;
    }, 3000);
};