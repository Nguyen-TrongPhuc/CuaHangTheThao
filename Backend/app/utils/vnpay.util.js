const crypto = require('crypto');
const config = require("../config");
const querystring = require('qs');

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key) && obj[key] !== '' && obj[key] !== undefined && obj[key] !== null) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(String(obj[decodeURIComponent(str[key])])).replace(/%20/g, "+");
    }
    return sorted;
}

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
    const { orderId, amount, orderInfo, returnUrl, ipAddr } = params;
    
    const date = new Date();
    
    const getVnTime = (d) => {
        // Luôn cộng 7 tiếng vào UTC để đảm bảo ra giờ VN chuẩn xác bất kể máy chủ ở đâu
        const vnTime = new Date(d.getTime() + (3600000 * 7));
        return vnTime.getUTCFullYear() +
        ("0" + (vnTime.getUTCMonth() + 1)).slice(-2) +
        ("0" + vnTime.getUTCDate()).slice(-2) +
        ("0" + vnTime.getUTCHours()).slice(-2) +
        ("0" + vnTime.getUTCMinutes()).slice(-2) +
        ("0" + vnTime.getUTCSeconds()).slice(-2);
    };

    const createDate = getVnTime(date);
    
    const expireTime = new Date(date.getTime() + 15 * 60000); // Hết hạn sau 15 phút
    const expireDate = getVnTime(expireTime);

    const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: config.payment.vnpay.tmnCode,
        vnp_Amount: Math.round(amount * 100), // Bắt buộc là số nguyên
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: returnUrl || config.payment.vnpay.returnUrl,
        vnp_IpAddr: ipAddr || '127.0.0.1',
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate // Bắt buộc cho chuẩn v2.1.0 hiện tại
    };

    const sortedParams = sortObject(vnpParams);

    // Sử dụng module querystring chuẩn giống hệt code mẫu của VNPAY
    const signData = querystring.stringify(sortedParams, { encode: false });

    const hmac = crypto.createHmac('sha512', config.payment.vnpay.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    const paymentUrl = `${config.payment.vnpay.url}?${signData}&vnp_SecureHash=${signed}`;
    
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
    const { vnp_SecureHash, vnp_SecureHashType, ...paramsToVerify } = vnpParams;
    
    const sortedParams = sortObject(paramsToVerify);

    const signData = querystring.stringify(sortedParams, { encode: false });

    const hmac = crypto.createHmac('sha512', config.payment.vnpay.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

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
