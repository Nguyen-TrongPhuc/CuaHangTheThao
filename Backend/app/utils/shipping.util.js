const config = require("../config");

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Calculate shipping fee based on distance
 * @param {number} customerLat - Customer's latitude
 * @param {number} customerLng - Customer's longitude
 * @param {number} orderAmount - Total order amount in VND
 * @param {string} shippingType - 'standard' or 'express'
 * @returns {Object} Shipping calculation result
 */
const calculateShippingFee = (customerLat, customerLng, orderAmount, shippingType = 'standard') => {
    const shopLat = config.shop.lat;
    const shopLng = config.shop.lng;
    
    // Calculate distance
    const distance = calculateDistance(shopLat, shopLng, customerLat, customerLng);
    const distanceKm = Math.round(distance * 10) / 10; // Round to 1 decimal
    
    // Calculate base fee based on distance
    let shippingFee = config.shipping.baseShippingFee + (distanceKm * config.shipping.perKmFee);
    
    // Apply express multiplier if needed
    if (shippingType === 'express') {
        shippingFee = shippingFee * config.shipping.expressMultiplier;
    }
    
    // Round to nearest 1000 VND
    shippingFee = Math.ceil(shippingFee / 1000) * 1000;
    
    // Free shipping within radius or above threshold
    const isFreeShipping = distanceKm <= config.shipping.freeShippingRadius || 
                          orderAmount >= config.shipping.freeShippingThreshold;
    
    if (isFreeShipping) {
        shippingFee = 0;
    }
    
    return {
        distance: distanceKm,
        shippingFee,
        isFreeShipping,
        shippingType,
        orderAmount
    };
};

/**
 * Get shipping fee info for display (without customer location)
 * @param {number} orderAmount - Total order amount in VND
 * @returns {Object} Shipping info object
 */
const getShippingInfo = (orderAmount) => {
    const threshold = config.shipping.freeShippingThreshold;
    const baseFee = config.shipping.baseShippingFee;
    const perKmFee = config.shipping.perKmFee;
    const freeRadius = config.shipping.freeShippingRadius;
    
    const isFreeAmount = orderAmount >= threshold;
    const remainingForFree = threshold - orderAmount;
    
    return {
        isFreeShipping: isFreeAmount,
        baseFee,
        perKmFee,
        freeRadius,
        freeShippingThreshold: threshold,
        threshold,
        remainingForFree: isFreeAmount ? 0 : remainingForFree,
        message: isFreeAmount 
            ? `Bạn được miễn phí vận chuyển!` 
            : `Mua thêm ${new Intl.NumberFormat('vi-VN').format(remainingForFree)}đ để được miễn phí vận chuyển`,
        note: `Phí vận chuyển sẽ được tính dựa trên khoảng cách từ cửa hàng đến địa chỉ giao hàng. Miễn phí trong phạm vi ${freeRadius}km.`
    };
};

/**
 * Get shop info
 * @returns {Object} Shop information
 */
const getShopInfo = () => {
    return {
        address: config.shop.address,
        lat: config.shop.lat,
        lng: config.shop.lng,
        name: config.shop.name
    };
};

module.exports = {
    calculateShippingFee,
    getShippingInfo,
    getShopInfo,
    calculateDistance
};

