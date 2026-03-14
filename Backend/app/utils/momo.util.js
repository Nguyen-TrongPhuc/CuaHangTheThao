const crypto = require('crypto');
const https = require('https');
const config = require('../config/index');

class MoMoUtil {
  static async createPayment(orderId, amount, orderInfo, customerEmail) {
    const accessKey = config.payment.momo.accessKey;
    const secretKey = config.payment.momo.secretKey;
    const partnerCode = config.payment.momo.partnerCode;
    const redirectUrl = `${config.app.baseUrl}/payment-result`; // Frontend result
    const ipnUrl = `http://localhost:${config.app.port}/api/payment/momo-callback`; // Server IPN
    const requestType = 'payWithMethod';
    const requestId = orderId;
    const extraData = customerEmail; // Encode customer info
    const lang = 'vi';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto.createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = JSON.stringify({
      partnerCode,
      partnerName: "SportStore",
      storeId: "SportStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      extraData,
      signature
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'test-payment.momo.vn', // Production: 'payment.momo.vn'
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error('MoMo response parse error'));
          }
        });
      });

      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });
  }
}

module.exports = MoMoUtil;
