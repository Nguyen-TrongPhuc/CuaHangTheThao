const shippingUtil = require("../utils/shipping.util");

/**
 * Get shop information and shipping config
 */
exports.getShopInfo = (req, res) => {
    try {
        const shopInfo = shippingUtil.getShopInfo();
        const shippingInfo = shippingUtil.getShippingInfo(0); // Get base config
        
        return res.send({
            shop: shopInfo,
            shipping: shippingInfo
        });
    } catch (error) {
        console.error("Error getting shop info:", error);
        return res.status(500).send({ message: "Error getting shop info" });
    }
};

/**
 * Calculate shipping fee based on customer location
 */
exports.calculateShipping = (req, res) => {
    try {
        const { lat, lng, orderAmount, shippingType } = req.body;
        
        if (!lat || !lng) {
            return res.status(400).send({ message: "Vui lòng cung cấp tọa độ giao hàng" });
        }
        
        const result = shippingUtil.calculateShippingFee(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(orderAmount) || 0,
            shippingType || 'standard'
        );
        
        return res.send(result);
    } catch (error) {
        console.error("Error calculating shipping:", error);
        return res.status(500).send({ message: "Error calculating shipping fee" });
    }
};

/**
 * Get shipping info (base config)
 */
exports.getShippingInfo = (req, res) => {
    try {
        const orderAmount = parseFloat(req.query.amount) || 0;
        const result = shippingUtil.getShippingInfo(orderAmount);
        return res.send(result);
    } catch (error) {
        console.error("Error getting shipping info:", error);
        return res.status(500).send({ message: "Error getting shipping info" });
    }
};

