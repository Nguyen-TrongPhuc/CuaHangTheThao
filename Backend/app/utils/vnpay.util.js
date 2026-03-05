const crypto = require('crypto');
const config = require("../config");

/**
 * Create VNPAY payment URL
 * @param {Object} params - Payment parameters
 * @param {string} params.orderId - Order ID
 * @param {number} params.amount - Amount in VND
 * @param {string} params.orderInfo - Order description
 * @param {string} params.returnUrl - Return URL after payment
 * @returns {string} Payment URL
 */
const createPaymentUrl = (params) => {
    const { orderId, amount, orderInfo, returnUrl } = params;
    
    // Lấy ngày giờ hiện tại theo giờ Việt Nam (UTC+7)
    const date = new Date();
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const vnTime = new Date(utc + (3600000 * 7));
    const createDate = vnTime.getFullYear() +
        ("0" + (vnTime.getMonth() + 1)).slice(-2) +
        ("0" + vnTime.getDate()).slice(-2) +
        ("0" + vnTime.getHours()).slice(-2) +
        ("0" + vnTime.getMinutes()).slice(-2) +
        ("0" + vnTime.getSeconds()).slice(-2);

    const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: config.payment.vnpay.tmnCode,
        vnp_Amount: amount * 100, // Convert to cents
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other', // Sử dụng 'other' an toàn hơn cho sandbox
        vnp_Locale: 'vn',
        vnp_ReturnUrl: returnUrl || config.payment.vnpay.returnUrl,
        vnp_IpAddr: '127.0.0.1',
        vnp_CreateDate: createDate
    };

    // Sort parameters by key
    const sortedParams = Object.keys(vnpParams).sort().reduce((obj, key) => {
        obj[key] = vnpParams[key];
        return obj;
    }, {});

    // Create query string
    const queryString = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

    // Create HMAC SHA512 signature (Chuẩn mới của VNPAY)
    const hmac = crypto.createHmac('sha512', config.payment.vnpay.hashSecret);
    const signed = hmac.update(queryString).digest('hex');
    
    const paymentUrl = `${config.payment.vnpay.url}?${queryString}&vnp_SecureHash=${signed}`;
    
    return paymentUrl;
};

/**
 * Verify VNPAY callback
 * @param {Object} vnpParams - Parameters from VNPAY callback
 * @returns {boolean} True if valid
 */
const verifyCallback = (vnpParams) => {
    const secureHash = vnpParams.vnp_SecureHash;
    
    // Remove secure hash from params to verify
    const { vnp_SecureHash, ...paramsToVerify } = vnpParams;
    
    // Sort parameters by key
    const sortedParams = Object.keys(paramsToVerify).sort().reduce((obj, key) => {
        obj[key] = paramsToVerify[key];
        return obj;
    }, {});

    // Create query string (excluding secure hash)
    const queryString = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

    // Create HMAC SHA512 signature
    const hmac = crypto.createHmac('sha512', config.payment.vnpay.hashSecret);
    const signed = hmac.update(queryString).digest('hex');

    return secureHash === signed;
};

/**
 * Check if payment is successful
 * @param {Object} vnpParams - Parameters from VNPAY callback
 * @returns {boolean} True if payment successful
 */
const isPaymentSuccess = (vnpParams) => {
    // Check response code: 00 = success
    return vnpParams.vnp_ResponseCode === '00' && vnpParams.vnp_TransactionStatus === '00';
};

/**
 * Get payment status message
 * @param {string} responseCode - VNPAY response code
 * @returns {string} Status message
 */
const getStatusMessage = (responseCode) => {
    const messages = {
        '00': 'Giao dịch thành công',
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo)',
        '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
        '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
        '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
        '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
        '13': 'Giao dịch không thành công do: Nhập sai mật khẩu xác thực thanh toán',
        '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
        '51': 'Giao dịch không thành công do: Tài khoản không đủ số dư để thanh toán',
        '65': 'Giao dịch không thành công do: Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
        '75': 'Ngân hàng thanh toán đang bảo trì',
        '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
        '99': 'Lỗi không xác định'
    };
    
    return messages[responseCode] || 'Lỗi không xác định';
};

module.exports = {
    createPaymentUrl,
    verifyCallback,
    isPaymentSuccess,
    getStatusMessage
};
