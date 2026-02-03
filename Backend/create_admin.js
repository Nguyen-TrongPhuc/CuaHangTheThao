const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const config = require("./app/config");

async function createAdmin() {
    const uri = config.db.uri;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("--- Đã kết nối đến MongoDB ---");
        
        const db = client.db();
        const employees = db.collection("employees");

        // THÔNG TIN TÀI KHOẢN ADMIN MẶC ĐỊNH
        const admin_code = "ADMIN001"; 
        const password = "admin";   

        const existingUser = await employees.findOne({ admin_code: admin_code });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (existingUser) {
            console.log(`Tài khoản ${admin_code} đã tồn tại. Đang cập nhật lại quyền và mật khẩu...`);
            await employees.updateOne(
                { admin_code: admin_code },
                { $set: { password: hashedPassword, role: "admin", full_name: "Super Admin" } }
            );
            console.log("-> Cập nhật thành công!");
        } else {
            console.log(`Đang tạo tài khoản Admin mới...`);
            await employees.insertOne({
                full_name: "Super Admin",
                admin_code: admin_code,
                phone: "0999999999",
                password: hashedPassword,
                role: "admin",
                createdAt: new Date()
            });
            console.log("-> Tạo thành công!");
        }

        console.log("\n====================================");
        console.log("THÔNG TIN ĐĂNG NHẬP:");
        console.log("Mã Admin:      " + admin_code);
        console.log("Mật khẩu:      " + password);
        console.log("====================================\n");

    } catch (error) {
        console.error("Lỗi:", error);
    } finally {
        await client.close();
    }
}

createAdmin();