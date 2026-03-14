import createApiClient from "./api.service";

class PaymentService {
    constructor(baseUrl = "/api/payment") {
        this.api = createApiClient(baseUrl);
    }

    // Get shipping fee calculation
    async getShippingFee(amount, shippingType = 'standard', lat = null, lng = null, province = null, district = null, ward = null, street = null, address = null) {
        let url = `/shipping-fee?amount=${amount}&shippingType=${shippingType}`;
        if (lat && lng) {
            url += `&lat=${lat}&lng=${lng}`;
        }
        if (province) {
            url += `&province=${encodeURIComponent(province)}`;
        }
        if (district) {
            url += `&district=${encodeURIComponent(district)}`;
        }
        if (ward) {
            url += `&ward=${encodeURIComponent(ward)}`;
        }
        if (street) {
            url += `&street=${encodeURIComponent(street)}`;
        }
        if (address) {
            url += `&address=${encodeURIComponent(address)}`;
        }
        return (await this.api.get(url)).data;
    }

    // Create VNPAY payment URL
    async createVnpayPayment(orderId) {
        return (await this.api.post("/vnpay/create", { orderId })).data;
    }

    // Create MoMo payment
    async createMomoPayment(orderId) {
        return (await this.api.post("/momo/create", { orderId })).data;
    }

    // Check payment status
    async checkPaymentStatus(orderId) {
        return (await this.api.get(`/status/${orderId}`)).data;
    }
}

export default new PaymentService();
