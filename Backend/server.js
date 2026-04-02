const app = require("./app");
const config = require("./app/config");
const MongoDB = require("./app/utils/mongodb.util");
const initLoyaltyCron = require("./loyalty.cron");

async function startServer() {
    try {
        // Kết nối đến MongoDB trước khi server bắt đầu lắng nghe
        await MongoDB.connect(config.db.uri);
        console.log("Connected to the database!");

        // Khởi động các tác vụ chạy ngầm (CronJobs)
        initLoyaltyCron();

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