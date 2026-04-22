const app = require("./app");
const config = require("./app/config");
const MongoDB = require("./app/utils/mongodb.util");
const initLoyaltyCron = require("./loyalty.cron");
const cron = require("node-cron");
const OrderService = require("./app/services/orders.service");

async function startServer() {
    try {
        // Kết nối đến MongoDB trước khi server bắt đầu lắng nghe
        await MongoDB.connect(config.db.uri);
        console.log("Connected to the database!");

        // Khởi động các tác vụ chạy ngầm (CronJobs)
        initLoyaltyCron();

        // 1. TỰ ĐỘNG HOÀN THÀNH ĐƠN HÀNG SAU 3 NGÀY (Chạy lúc 00:00 mỗi ngày)
        cron.schedule('0 0 * * *', async () => {
            console.log('⏳ [CRON] Đang quét các đơn hàng đã giao quá 3 ngày...');
            try {
                const orderService = new OrderService(MongoDB.client);
                await orderService.autoCompleteDeliveredOrders();
            } catch (error) {
                console.error('❌ [CRON] Lỗi khi tự động hoàn thành đơn hàng:', error);
            }
        });

        // 2. TỰ ĐỘNG HỦY ĐƠN CHƯA THANH TOÁN (Chạy mỗi 15 phút)
        cron.schedule('*/15 * * * *', async () => {
            try {
                const orderService = new OrderService(MongoDB.client);
                await orderService.cancelExpiredOrders();
            } catch (error) {
                console.error('❌ [CRON] Lỗi khi hủy đơn chưa thanh toán:', error);
            }
        });

        const PORT = config.app.port;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });
    } catch (error) {
        console.log("Cannot connect to the database!", error);
        process.exit();
    }
}

startServer();