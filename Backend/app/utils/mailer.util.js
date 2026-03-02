const nodemailer = require("nodemailer");
const config = require("../config");

const sendEmail = async (to, subject, htmlContent) => {
    try {
        // LOG KIỂM TRA CẤU HÌNH (Sẽ hiện trong Terminal Backend)
        console.log("--- Đang thử gửi email ---");
        console.log("📧 Email người gửi:", config.email?.user || "❌ CHƯA CÓ");
        console.log("🔐 Mật khẩu:", config.email?.pass ? "✅ Đã nhập (*****)" : "❌ CHƯA CÓ");
        console.log("📬 Gửi tới:", to);

        if (!config.email?.user || !config.email?.pass) {
            console.error("❌ Lỗi: Thiếu MAIL_USER hoặc MAIL_PASSWORD trong file .env");
            return false;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });

        // Kiểm tra kết nối tới Gmail trước khi gửi
        await transporter.verify(); 

        const mailOptions = {
            from: '"SportStore Support" <no-reply@sportstore.com>',
            to: to,
            subject: subject,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Gửi email thành công tới: " + to);
        return true;
    } catch (error) {
        console.error("❌ Lỗi chi tiết khi gửi mail:", error.message);
        console.error("\n🔍 Gợi ý khắc phục:");
        if (error.message.includes('Application-specific password') || error.code === 'EAUTH' || error.responseCode === 534) {
            console.error("👉 Email yêu cầu App Password (Gmail có bảo vệ 2 lớp)");
            console.error("👉 Hướng dẫn: https://myaccount.google.com/apppasswords");
            console.error("👉 1. Tạo App Password từ link trên");
            console.error("👉 2. Cập nhật MAIL_PASSWORD trong .env (xóa dấu cách)");
            console.error("👉 3. Khởi động lại Backend");
        } else if (error.message.includes('Invalid login')) {
            console.error("👉 Email hoặc Mật khẩu sai. Kiểm tra lại MAIL_USER và MAIL_PASSWORD");
        } else {
            console.error("👉 Kiểm tra cấu hình email hoặc kết nối internet");
        }
        return false;
    }
};

module.exports = sendEmail;