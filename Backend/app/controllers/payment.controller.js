const OrderService = require("../services/orders.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const vnpayUtil = require("../utils/vnpay.util");
const config = require("../config");
const crypto = require('crypto');
const MoMoUtil = require("../utils/momo.util");

/**
 * Create VNPAY payment URL for an order
 */
exports.createVnpayPayment = async (req, res, next) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return next(new ApiError(400, "Order ID is required"));
        }

        const orderService = new OrderService(MongoDB.client);
        const order = await orderService.findById(orderId);

        if (!order) {
            return next(new ApiError(404, "Order not found"));
        }

        // Check if this order belongs to the user
        if (order.customer_id && order.customer_id.toString() !== req.user.userId) {
            return next(new ApiError(403, "Unauthorized"));
        }

        // Lấy IP Address của khách hàng theo chuẩn VNPAY
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null) || '127.0.0.1';
            
        // VNPAY chỉ chấp nhận 1 IP duy nhất dạng IPv4
        if (ipAddr && ipAddr.indexOf(',') !== -1) {
            ipAddr = ipAddr.split(',')[0].trim();
        }
        if (ipAddr === '::1' || ipAddr.indexOf(':') !== -1) {
            ipAddr = '127.0.0.1';
        }

        // VNPAY yêu cầu mô tả không dấu và không ký tự đặc biệt.
        // Chuẩn hóa chuỗi (thay dấu cách bằng gạch ngang) để đảm bảo tương thích.
        let orderInfo = `Thanh toan don hang ${order._id.toString()}`.replace(/\s/g, '-');

        // Create VNPAY payment URL
        const paymentUrl = vnpayUtil.createPaymentUrl({
            orderId: order._id.toString() + "_" + new Date().getTime(), // Thêm timestamp để tránh lỗi trùng mã giao dịch (vnp_TxnRef)
            amount: order.total_amount,
            orderInfo: orderInfo,
            returnUrl: config.payment.vnpay.returnUrl || `http://localhost:${config.app.port}/api/payment/vnpay/callback`,
            ipAddr: ipAddr
        });

        console.log("VNPAY Payment URL created:", paymentUrl);
        return res.send({ paymentUrl });
    } catch (error) {
        console.error("VNPAY Payment Error:", error);
        return next(new ApiError(500, "Error creating payment"));
    }
};

/**
 * Handle VNPAY callback (IPN - Instant Payment Notification)
 */
exports.vnpayCallback = async (req, res, next) => {
    try {
        const vnpParams = req.query;
        
        console.log("VNPAY Callback received:", vnpParams);

        // Verify callback signature
        if (!vnpayUtil.verifyCallback(vnpParams)) {
            return res.status(400).send("Invalid signature");
        }

        // Lấy lại ID đơn hàng thực tế bằng cách bỏ đi phần timestamp
        const orderId = vnpParams.vnp_TxnRef.split('_')[0];
        const orderService = new OrderService(MongoDB.client);
        const order = await orderService.findById(orderId);

        if (!order) {
            return res.status(404).send("Order not found");
        }

        // Check payment status
        if (vnpayUtil.isPaymentSuccess(vnpParams)) {
            // Update order payment status
            await orderService.update(orderId, {
                payment_status: 'paid',
                transaction_id: vnpParams.vnp_TransactionNo,
                vnpay_info: {
                    bankCode: vnpParams.vnp_BankCode,
                    bankTranNo: vnpParams.vnp_BankTranNo,
                    cardType: vnpParams.vnp_CardType,
                    payDate: vnpParams.vnp_PayDate,
                    responseCode: vnpParams.vnp_ResponseCode
                }
            });
            
            console.log(`Order ${orderId} payment successful`);
            return res.redirect(`${config.app.baseUrl}/payment-result?success=true&orderId=${orderId}`);
        } else {
            // Payment failed - update status
            await orderService.update(orderId, {
                payment_status: 'failed',
                vnpay_info: {
                    responseCode: vnpParams.vnp_ResponseCode,
                    responseMessage: vnpayUtil.getStatusMessage(vnpParams.vnp_ResponseCode)
                }
            });
            
            console.log(`Order ${orderId} payment failed: ${vnpayUtil.getStatusMessage(vnpParams.vnp_ResponseCode)}`);
            return res.redirect(`${config.app.baseUrl}/payment-result?success=false&orderId=${orderId}&message=${encodeURIComponent(vnpayUtil.getStatusMessage(vnpParams.vnp_ResponseCode))}`);
        }
    } catch (error) {
        console.error("VNPAY Callback Error:", error);
        return res.status(500).send("Error processing callback");
    }
};

/**
 * Check payment status for an order
 */
exports.checkPaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        
        const orderService = new OrderService(MongoDB.client);
        const order = await orderService.findById(orderId);

        if (!order) {
            return next(new ApiError(404, "Order not found"));
        }

        // Check if this order belongs to the user
        if (order.customer_id && order.customer_id.toString() !== req.user.userId) {
            return next(new ApiError(403, "Unauthorized"));
        }

        return res.send({
            orderId: order._id,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            total_amount: order.total_amount,
            status: order.status
        });
    } catch (error) {
        console.error("Check Payment Status Error:", error);
        return next(new ApiError(500, "Error checking payment status"));
    }
};

/**
 * Hàm tính khoảng cách giữa 2 tọa độ (Haversine formula)
 * Trả về km
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Geocoding: Chuyển đổi địa chỉ sang tọa độ sử dụng Nominatim API (OpenStreetMap)
 * @param {string} address - Địa chỉ đầy đủ (ví dụ: "Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ, Vietnam")
 * @returns {Object|null} - { lat, lon } hoặc null nếu không tìm thấy
 */
async function geocodeAddress(address) {
    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=vn`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SportStore/1.0'
            }
        });
        
        if (!response.ok) {
            console.error('Geocoding API error:', response.status);
            return null;
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Reverse Geocoding: Lấy địa chỉ từ tọa độ
 * @param {number} lat - Vĩ độ
 * @param {number} lon - Kinh độ
 * @returns {Object|null} - { address, district, city } hoặc null
 */
async function reverseGeocode(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SportStore/1.0'
            }
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        
        if (data && data.address) {
            return {
                address: data.display_name,
                district: data.address.county || data.address.city_district || data.address.district,
                city: data.address.city || data.address.province || data.address.state
            };
        }
        
        return null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

/**
 * Xác định miền dựa trên tỉnh/thành
 * @param {string} provinceName - Tên tỉnh/thành
 * @returns {Object} - { zone, zoneName, isSameCity }
 */
function getZoneFromProvince(provinceName) {
    if (!provinceName) return { zone: null, zoneName: 'Không xác định', isSameCity: false };
    
    const provinceLower = provinceName.toLowerCase().trim();
    const shopProvince = "cần thơ"; // Shop đặt tại Cần Thơ
    const shopCity = "Cần Thơ";
    
    // Lấy danh sách zones từ config
    const zones = config.shipping.zones;
    
    // Kiểm tra cùng thành phố với shop trước
    if (provinceLower === shopProvince || provinceName === shopCity) {
        return { zone: 'same_city', zoneName: 'Cùng thành phố', isSameCity: true };
    }
    
    // Kiểm tra từng miền
    // Ưu tiên kiểm tra: Miền Tây (southwest) trước vì là miền của shop
    if (zones.southwest && zones.southwest.provinces) {
        const found = zones.southwest.provinces.find(p => 
            p.toLowerCase() === provinceLower || 
            provinceLower.includes(p.toLowerCase())
        );
        if (found) {
            return { 
                zone: 'southwest', 
                zoneName: zones.southwest.name, 
                isSameCity: false,
                freeInCity: zones.southwest.freeInCity 
            };
        }
    }
    
    // Kiểm tra Miền Nam
    if (zones.south && zones.south.provinces) {
        const found = zones.south.provinces.find(p => 
            p.toLowerCase() === provinceLower || 
            provinceLower.includes(p.toLowerCase())
        );
        if (found) {
            return { zone: 'south', zoneName: zones.south.name, isSameCity: false };
        }
    }
    
    // Kiểm tra Miền Trung
    if (zones.central && zones.central.provinces) {
        const found = zones.central.provinces.find(p => 
            p.toLowerCase() === provinceLower || 
            provinceLower.includes(p.toLowerCase())
        );
        if (found) {
            return { zone: 'central', zoneName: zones.central.name, isSameCity: false };
        }
    }
    
    // Kiểm tra Miền Bắc
    if (zones.north && zones.north.provinces) {
        const found = zones.north.provinces.find(p => 
            p.toLowerCase() === provinceLower || 
            provinceLower.includes(p.toLowerCase())
        );
        if (found) {
            return { zone: 'north', zoneName: zones.north.name, isSameCity: false };
        }
    }
    
    // Không tìm thấy -> Mặc định tính phí cao nhất
    return { zone: 'unknown', zoneName: 'Khu vực khác', isSameCity: false };
}

/**
 * Trích xuất tên tỉnh từ một chuỗi địa chỉ đầy đủ
 * @param {string} address - Chuỗi địa chỉ
 * @param {Object} zones - Đối tượng zones từ config
 * @returns {string|null} Tên tỉnh hoặc null
 */
function extractProvinceFromAddress(address, zones) {
    if (!address) return null;
    const addressLower = address.toLowerCase();

    // Duyệt qua tất cả các tỉnh trong config để tìm kết quả khớp
    for (const zoneKey in zones) {
        const zone = zones[zoneKey];
        if (zone.provinces && Array.isArray(zone.provinces)) {
            for (const province of zone.provinces) {
                if (addressLower.includes(province.toLowerCase())) {
                    return province;
                }
            }
        }
    }
    return null;
}

/**
 * Get shipping fee calculation - với tính phí theo miền
 */
exports.getShippingFee = async (req, res, next) => {
    try {
        const { amount, shippingType, lat, lng, province, district, ward, street, address } = req.query;
        
        const subtotal = Number(amount) || 0;
        const type = shippingType || 'standard';
        
        let shippingFee = config.shipping.baseShippingFee;
        let distance = 0;
        let standardEstimatedTime = "3-5 ngày";
        let expressEstimatedTime = "1-2 ngày";
        let message = "";
        let isFreeShipping = false;
        let customerLat = lat ? parseFloat(lat) : null;
        let customerLng = lng ? parseFloat(lng) : null;
        let zoneInfo = { zone: 'unknown', zoneName: 'Khu vực khác', isSameCity: false };

        // Xác định tỉnh/thành phố để tính phí theo miền.
        // Ưu tiên `province` được gửi trực tiếp (từ dropdown).
        // Nếu không có, thử trích xuất từ chuỗi `address` đầy đủ.
        let effectiveProvince = province;
        if (!effectiveProvince && address) {
            effectiveProvince = extractProvinceFromAddress(address, config.shipping.zones);
        }

        // =====================================================
        // KIỂM TRA SỬ DỤNG TÍNH PHÍ THEO MIỀN
        // =====================================================
        const useZoneBased = config.shipping.useZoneBasedShipping;
        
        // TÍNH PHÍ THEO MIỀN (nếu được bật và có `effectiveProvince`)
        if (useZoneBased && effectiveProvince) {
            zoneInfo = getZoneFromProvince(effectiveProvince);
            
            if (zoneInfo.isSameCity) {
                // Cùng thành phố -> Miễn phí
                shippingFee = 0;
                isFreeShipping = true;
                message = "Miễn phí vận chuyển nội thành!";
                standardEstimatedTime = "Trong ngày hoặc 1 ngày";
            } else if (zoneInfo.zone === 'southwest') {
                // Miền Tây (cùng miền với shop)
                shippingFee = config.shipping.zones.southwest.fee;
                message = `Miền Tây - Phí vận chuyển: ${shippingFee.toLocaleString('vi-VN')}đ`;
                standardEstimatedTime = "1-2 ngày";
            } else if (zoneInfo.zone === 'south') {
                // Miền Nam (khác tỉnh)
                shippingFee = config.shipping.zones.south.fee;
                message = `Miền Nam - Phí vận chuyển: ${shippingFee.toLocaleString('vi-VN')}đ`;
                standardEstimatedTime = "2-3 ngày";
            } else if (zoneInfo.zone === 'central') {
                // Miền Trung
                shippingFee = config.shipping.zones.central.fee;
                message = `Miền Trung - Phí vận chuyển: ${shippingFee.toLocaleString('vi-VN')}đ`;
                standardEstimatedTime = "3-4 ngày";
            } else if (zoneInfo.zone === 'north') {
                // Miền Bắc
                shippingFee = config.shipping.zones.north.fee;
                message = `Miền Bắc - Phí vận chuyển: ${shippingFee.toLocaleString('vi-VN')}đ`;
                standardEstimatedTime = "4-5 ngày";
            } else {
                // Không xác định được miền -> Dùng logic cũ hoặc phí cao nhất
                shippingFee = config.shipping.zones.north ? config.shipping.zones.north.fee : 40000;
                message = "Khu vực xa - Phí vận chuyển: " + shippingFee.toLocaleString('vi-VN') + "đ";
                standardEstimatedTime = "5-7 ngày";
            }
        }
        // =====================================================
        // FALLBACK: Dùng logic khoảng cách (nếu không dùng tính phí theo miền)
        // =====================================================
        else {
            // Có tọa độ GPS
            if (customerLat && customerLng) {
                distance = getDistanceFromLatLonInKm(
                    config.shop.lat, 
                    config.shop.lng, 
                    customerLat, 
                    customerLng
                );
                distance = Math.round(distance * 10) / 10;
            }
            // Không có tọa độ nhưng có địa chỉ -> Geocoding.
            // Ưu tiên chuỗi `address` đầy đủ nếu có.
            else if (address || province || district || ward || street) {
                let fullAddress;
                if (address) {
                    fullAddress = `${address}, Vietnam`;
                } else {
                    const addressParts = [];
                    if (street) addressParts.push(street);
                    if (ward) addressParts.push(ward);
                    if (district) addressParts.push(district);
                    if (province) addressParts.push(province);
                    addressParts.push("Vietnam");
                    fullAddress = addressParts.join(", ");
                }

                console.log("Geocoding address:", fullAddress);

                const coords = await geocodeAddress(fullAddress);
                
                if (coords) {
                    customerLat = coords.lat;
                    customerLng = coords.lon;
                    
                    distance = getDistanceFromLatLonInKm(
                        config.shop.lat, 
                        config.shop.lng, 
                        customerLat, 
                        customerLng
                    );
                    distance = Math.round(distance * 10) / 10;
                    console.log(`Calculated distance: ${distance} km for address: ${fullAddress}`);
                }
            }

            // Tính phí dựa trên khoảng cách
            if (distance > 0) {
                if (distance <= config.shipping.freeShippingRadius) {
                    shippingFee = 0;
                    isFreeShipping = true;
                    message = `Miễn phí vận chuyển (Trong phạm vi ${config.shipping.freeShippingRadius}km)!`;
                    estimatedTime = "Trong ngày";
                } else {
                    shippingFee = config.shipping.baseShippingFee + (distance * config.shipping.perKmFee);
                    
                    if (distance < 20) standardEstimatedTime = "1-2 ngày";
                    else if (distance < 100) standardEstimatedTime = "2-3 ngày";
                    else if (distance < 300) standardEstimatedTime = "3-4 ngày";
                    else standardEstimatedTime = "5-7 ngày";
                    
                    message = `Khoảng cách: ${distance}km - Phí ship: ${Math.ceil(shippingFee/1000)*1000}đ`;
                }
            } else {
                // Không tính được khoảng cách
                const provinceLower = province ? province.toLowerCase() : '';
                if (provinceLower.includes("cần thơ") || provinceLower.includes("can thơ")) {
                    shippingFee = 0;
                    isFreeShipping = true;
                    standardEstimatedTime = "Trong ngày hoặc 1 ngày";
                    message = "Miễn phí vận chuyển nội thành Cần Thơ!";
                } else {
                    shippingFee = config.shipping.baseShippingFee;
                    message = "Phí vận chuyển cơ bản";
                    standardEstimatedTime = "3-5 ngày";
                }
            }
        }
        
        // =====================================================
        // Tính toán phí Giao nhanh (Luôn tính)
        // =====================================================
        let standardFee = shippingFee;
        let expressFee = shippingFee * config.shipping.expressMultiplier;
        
        // Tính thời gian giao nhanh (thường nhanh hơn 1 nửa hoặc cố định 1-2 ngày)
        if (standardEstimatedTime.includes("Trong ngày")) {
            expressEstimatedTime = "Hỏa tốc 2h";
        } else {
            expressEstimatedTime = "1-2 ngày (Giao nhanh)";
        }

        // =====================================================
        // Ưu tiên cao nhất: Miễn phí cho đơn hàng > 500k
        // =====================================================
        if (subtotal >= config.shipping.freeShippingThreshold) {
            standardFee = 0;
            expressFee = 0;
            isFreeShipping = true;
            message = "Miễn phí vận chuyển cho đơn hàng giá trị cao!";
            // Thời gian vẫn giữ nguyên logic địa lý
        }

        // Làm tròn phí ship (đơn vị nghìn đồng)
        standardFee = Math.ceil(standardFee / 1000) * 1000;
        expressFee = Math.ceil(expressFee / 1000) * 1000;

        // Xác định phí ship cuối cùng dựa trên loại khách chọn để trả về field shippingFee (cho tương thích ngược)
        const finalFee = (type === 'express') ? expressFee : standardFee;
        const finalTime = (type === 'express') ? expressEstimatedTime : standardEstimatedTime;
        
        return res.send({
            shipping_fee: {
                shippingFee: finalFee, // Phí của loại đang chọn
                standardFee: standardFee, // Phí tiêu chuẩn (luôn đúng)
                expressFee: expressFee,
                distance: distance,
                isFreeShipping: isFreeShipping,
                message: message,
                estimatedTime: finalTime, // Thời gian của loại đang chọn
                standardEstimatedTime: standardEstimatedTime, // Thời gian tiêu chuẩn
                expressEstimatedTime: expressEstimatedTime, // Thời gian giao nhanh
                customerLat: customerLat,
                customerLng: customerLng,
                zone: zoneInfo.zone,
                zoneName: zoneInfo.zoneName
            },
            subtotal: subtotal,
            total: subtotal + shippingFee,
            shipping_type: type,
        });
    } catch (error) {
        console.error("Get Shipping Fee Error:", error);
        return next(new ApiError(500, "Error calculating shipping fee"));
    }
};

/**
 * Handle MoMo payment (Real API integration)
 */
exports.createMomoPayment = async (req, res, next) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return next(new ApiError(400, "Order ID is required"));
        }

        const orderService = new OrderService(MongoDB.client);
        const order = await orderService.findById(orderId);

        if (!order) {
            return next(new ApiError(404, "Order not found"));
        }

        // Use MoMoUtil
        const paymentUrl = await MoMoUtil.createPayment(
            order._id.toString(),
            order.total_amount,
            `Thanh toan don hang ${order._id}`,
            order.customer_id ? order.customer_id.toString() : "guest"
        );

        if (paymentUrl.payUrl) {
            return res.send({ paymentUrl: paymentUrl.payUrl });
        } else {
            console.error("MoMo API Error:", paymentUrl);
            return next(new ApiError(500, "MoMo payment creation failed"));
        }
    } catch (error) {
        console.error("MoMo Payment Error:", error);
        return next(new ApiError(500, "Error creating MoMo payment"));
    }
};

/**
 * Handle MoMo Callback (IPN)
 */
exports.momoCallback = async (req, res, next) => {
    try {
        const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;

        console.log("MoMo Callback received:", req.body);

        // Verify Signature
        const { accessKey, secretKey } = config.payment.momo;
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        
        const generatedSignature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        if (signature !== generatedSignature) {
            console.error("MoMo Signature Mismatch");
            return res.status(400).json({ message: "Invalid signature" });
        }

        const orderService = new OrderService(MongoDB.client);
        
        if (resultCode == 0) {
            // Payment Success
            await orderService.update(orderId, {
                payment_status: 'paid',
                transaction_id: transId,
                momo_info: req.body
            });
            console.log(`Order ${orderId} paid successfully via MoMo`);
        } else {
            // Payment Failed
            await orderService.update(orderId, {
                payment_status: 'failed',
                momo_info: req.body
            });
            console.log(`Order ${orderId} payment failed via MoMo: ${message}`);
        }

        return res.status(204).json({});
    } catch (error) {
        console.error("MoMo Callback Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
