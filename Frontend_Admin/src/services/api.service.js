import axios from "axios";

const commonConfig = {
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
};

export default (baseURL) => {
    const instance = axios.create({
        baseURL,
        ...commonConfig,
    });

    // Thêm interceptor để tự động gắn Token vào header của mỗi request
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem("admin_token");
            if (token) {
                config.headers["Authorization"] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Thêm interceptor để xử lý lỗi phản hồi (Response)
    instance.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            // Nếu lỗi 401 (Unauthorized) -> Token hết hạn hoặc không hợp lệ
            if (error.response && error.response.status === 401) {
                // Xóa token và thông tin user
                localStorage.removeItem("admin_token");
                localStorage.removeItem("user_role");
                localStorage.removeItem("user_name");
                
                // Chuyển hướng về trang login (dùng window.location để reload lại app)
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
            return Promise.reject(error);
        }
    );

    return instance;
};