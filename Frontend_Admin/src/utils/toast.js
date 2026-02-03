import { reactive } from "vue";

export const toastState = reactive({
  visible: false,
  message: "",
  type: "success", // success, error
});

let timeout;

export function showToast(message, type = "success") {
  toastState.message = message;
  toastState.type = type;
  toastState.visible = true;

  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(() => {
    toastState.visible = false;
  }, 3000); // Tự động ẩn sau 3 giây
}
