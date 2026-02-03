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

    return instance;
};