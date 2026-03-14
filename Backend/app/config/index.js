require('dotenv').config();

const config = {
    app: {
        port: process.env.PORT || 3003,
        baseUrl: process.env.BASE_URL || "http://localhost:3005"
    }, 
     db: {
        uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/SportStore",
    }, 
      jwt: {
        secret: "sportstore_secret_key"
    },

    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    },

    email: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    },

    // Shop address for shipping calculation
    shop: {
        address: process.env.SHOP_ADDRESS || "Khu II, Đ. 3/2, P. Xuân Khánh, Q. Ninh Kiều, TP. Cần Thơ",
        lat: parseFloat(process.env.SHOP_LAT) || 10.0299337,  // Tọa độ ĐH Cần Thơ
        lng: parseFloat(process.env.SHOP_LNG) || 105.7706153, // Tọa độ ĐH Cần Thơ
        name: process.env.SHOP_NAME || "SportStore Cần Thơ"
    },

    // Shipping configuration - Tính phí theo miền
    shipping: {
        freeShippingThreshold: 500000, // Free shipping for orders over 500k VND
        baseShippingFee: 20000,        // Base shipping fee: 20k VND
        perKmFee: 2000,               // 2k VND per km (for distance-based calculation)
        freeShippingRadius: 5,        // Free shipping within 5km (for distance-based calculation)
        expressMultiplier: 1.5,        // Express shipping is 1.5x normal fee
        
        // Cấu hình phí ship theo miền mới
        useZoneBasedShipping: true,    // Sử dụng tính phí theo miền
        
        // Định nghĩa các miền và tỉnh/thành
        zones: {
            // Miền Tây - Nơi shop đặt (Cần Thơ)
            southwest: {
                name: "Miền Tây",
                provinces: [
                    "Cần Thơ", "An Giang", "Bạc Liêu", "Bến Tre", "Đồng Tháp",
                    "Hậu Giang", "Kiên Giang", "Long An", "Sóc Trăng", "Tiền Giang", "Trà Vinh", "Vĩnh Long", "Cà Mau"
                ],
                fee: 20000,           // Phí ship trong miền
                freeInCity: true       // Miễn phí trong cùng thành phố với shop
            },
            // Miền Nam - Các tỉnh khác ở miền Nam
            south: {
                name: "Miền Nam",
                provinces: [
                    "Hồ Chí Minh", "Bà Rịa Vũng Tàu", "Bình Dương", "Bình Phước", 
                    "Đồng Nai", "Lâm Đồng", "Ninh Thuận", "Phú Yên", "Khánh Hòa", 
                    "Bình Thuận", "Tây Ninh"
                ],
                fee: 25000,           // Phí ship miền Nam
                freeInCity: false
            },
            // Miền Trung
            central: {
                name: "Miền Trung",
                provinces: [
                    "Đà Nẵng", 
                    "Thừa Thiên Huế", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên",
                    "Gia Lai", "Kon Tum", "Đắk Lắk", "Đắk Nông", "Lai Chau", "Điện Biên",
                    "Sơn La", "Hòa Bình", "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình",
                    "Hà Nam", "Nam Định", "Ninh Bình", "Thái Bình", "Vĩnh Phúc", "Phú Thọ",
                    "Bắc Giang", "Hưng Yên", "Hải Dương", "Bắc Ninh", "Tuyên Quang", "Lào Cai",
                    "Yên Bái", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Thái Nguyên", "Lạng Sơn"
                ],
                fee: 30000,           // Phí ship miền Trung
                freeInCity: false
            },
            // Miền Bắc
            north: {
                name: "Miền Bắc",
                provinces: [
                    "Hà Nội", "Hải Phòng", "Quảng Ninh"
                ],
                fee: 40000,           // Phí ship miền Bắc (xa hơn)
                freeInCity: false
            }
        }
    },

// Payment configuration
// IMPORTANT: Copy Backend/.env.example to Backend/.env and fill VNPay credentials
// For local testing: Use ngrok http 3003, update VNPAY_RETURN_URL with public callback URL
// Example: https://abc.ngrok-free.app/api/payment/vnpay/callback

    payment: {
        vnpay: {
            tmnCode: process.env.VNPAY_TMNCODE || "YOUR_TMNCODE",
            hashSecret: process.env.VNPAY_HASHSECRET || "YOUR_HASHSECRET",
            url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
returnUrl: process.env.VNPAY_RETURN_URL || `http://localhost:3003/api/payment/vnpay/callback`
        },
        momo: {
            endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
            partnerCode: process.env.MOMO_PARTNERCODE || "MOMO",
            accessKey: process.env.MOMO_ACCESSKEY || "F8BBA842ECF85",
            secretKey: process.env.MOMO_SECRETKEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz"
        }
    }
};

module.exports = config;
