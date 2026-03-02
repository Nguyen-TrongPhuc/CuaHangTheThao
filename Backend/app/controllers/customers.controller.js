const CustomerService = require("../services/customer.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config/index.js");
const sendEmail = require("../utils/mailer.util"); // Import hàm gửi mail

/* ================= CREATE ================= */
exports.create = async (req, res, next) => {
    if (!req.body?.email || !req.body?.password) {
        return next(new ApiError(400, "Email and password can not be empty"));
    }

    // Validate định dạng Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        return next(new ApiError(400, "Địa chỉ Email không hợp lệ"));
    }

    // Validate số điện thoại (10 số, bắt đầu bằng 0)
    const phoneRegex = /^0\d{9}$/;
    if (req.body.phone && !phoneRegex.test(req.body.phone)) {
        return next(new ApiError(400, "Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 0)"));
    }

    try {
        const customerService = new CustomerService(MongoDB.client);

        const existing = await customerService.findByEmail(req.body.email);
        if (existing) {
            return next(new ApiError(409, "Email already exists"));
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);

        const document = await customerService.create(req.body);
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while creating the customer")
        );
    }
};

/* ================= FIND ALL ================= */
exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const customerService = new CustomerService(MongoDB.client);
        const { name } = req.query;

        if (name) {
            documents = await customerService.findByName(name);
        } else {
            documents = await customerService.find({});
        }
    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while retrieving customers")
        );
    }
    return res.send(documents);
};

/* ================= FIND ONE ================= */
exports.findOne = async (req, res, next) => {
    try {
        const customerService = new CustomerService(MongoDB.client);
        const document = await customerService.findById(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Customer not found"));
        }
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(500, `Error retrieving customer with id=${req.params.id}`)
        );
    }
};

/* ================= UPDATE ================= */
exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update can not be empty"));
    }

    try {
        const customerService = new CustomerService(MongoDB.client);
        const document = await customerService.update(req.params.id, req.body);

        if (!document) {
            return next(new ApiError(404, "Customer not found"));
        }
        return res.send({ message: "Customer was updated successfully" });
    } catch (error) {
        return next(
            new ApiError(500, `Error updating customer with id=${req.params.id}`)
        );
    }
};

/* ================= DELETE ================= */
exports.delete = async (req, res, next) => {
    try {
        const customerService = new CustomerService(MongoDB.client);
        const document = await customerService.delete(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Customer not found"));
        }
        return res.send({ message: "Customer was deleted successfully" });
    } catch (error) {
        return next(
            new ApiError(500, `Could not delete customer with id=${req.params.id}`)
        );
    }
};

/* ================= DELETE ALL ================= */
exports.deleteAll = async (_req, res, next) => {
    try {
        const customerService = new CustomerService(MongoDB.client);
        const deletedCount = await customerService.deleteAll();

        return res.send({
            message: `${deletedCount} customers were deleted successfully`,
        });
    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while removing all customers")
        );
    }
};

/* ================= LOGIN ================= */
exports.login = async (req, res, next) => {
    if (!req.body?.email || !req.body?.password) {
        return next(new ApiError(400, "Email and password are required"));
    }

    try {
        const customerService = new CustomerService(MongoDB.client);
        const user = await customerService.findByEmail(req.body.email);

        if (!user) {
            return next(new ApiError(401, "Incorrect email or password"));
        }

        const passwordMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!passwordMatch) {
            return next(new ApiError(401, "Incorrect email or password"));
        }

        const token = jwt.sign(
            { userId: user._id, role: "customer" },
            config.jwt.secret,
            { expiresIn: "1h" }
        );

        const { password, ...userWithoutPassword } = user;

        return res.send({
            message: "Login successful",
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        return next(new ApiError(500, "An error occurred during login"));
    }
};

/* ================= GET PROFILE ================= */
exports.getProfile = async (req, res, next) => {
    try {
        const customerService = new CustomerService(MongoDB.client);
        const userId = req.user.userId;
        const document = await customerService.findById(userId);

        if (!document) {
            return next(new ApiError(404, "Customer not found"));
        }
        const { password, ...userWithoutPassword } = document;
        return res.send(userWithoutPassword);
    } catch (error) {
        return next(new ApiError(500, "Error retrieving profile"));
    }
};

/* ================= UPDATE PROFILE ================= */
exports.updateProfile = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update can not be empty"));
    }

    // Validate số điện thoại nếu có cập nhật
    const phoneRegex = /^0\d{9}$/;
    if (req.body.phone && !phoneRegex.test(req.body.phone)) {
        return next(new ApiError(400, "Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 0)"));
    }

    try {
        const customerService = new CustomerService(MongoDB.client);
        const userId = req.user.userId;

        const updateData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            birthday: req.body.birthday,
            gender: req.body.gender,
            address: req.body.address,
            phone: req.body.phone,
            email: req.body.email,
            avatar: req.body.avatar, // <--- Thêm dòng này để lưu Avatar
        };

        const document = await customerService.update(userId, updateData);
        if (!document) {
            return next(new ApiError(404, "Customer not found"));
        }

        return res.send({
            message: "Profile updated successfully",
            user: document,
        });
    } catch (error) {
        return next(new ApiError(500, "Error updating profile"));
    }
};

/* ================= CHANGE PASSWORD ================= */
exports.changePassword = async (req, res, next) => {
    if (!req.body?.oldPassword || !req.body?.newPassword) {
        return next(
            new ApiError(400, "Old password and new password are required")
        );
    }

    try {
        const customerService = new CustomerService(MongoDB.client);
        const userId = req.user.userId;

        const user = await customerService.findById(userId);
        if (!user) {
            return next(new ApiError(404, "User not found"));
        }

        const passwordIsValid = await bcrypt.compare(
            req.body.oldPassword,
            user.password
        );

        if (!passwordIsValid) {
            return next(new ApiError(401, "Mật khẩu cũ không đúng"));
        }

        await customerService.update(userId, {
            password: req.body.newPassword,
        });

        return res.send({ message: "Password changed successfully!" });
    } catch (error) {
        return next(new ApiError(500, "Error changing password"));
    }
};

/* ================= FORGOT PASSWORD (GỬI OTP) ================= */
exports.forgotPassword = async (req, res, next) => {
    if (!req.body?.email) {
        return next(new ApiError(400, "Vui lòng cung cấp email"));
    }

    try {
        const customerService = new CustomerService(MongoDB.client);
        const user = await customerService.findByEmail(req.body.email);

        if (!user) {
            return next(new ApiError(404, "Email không tồn tại trong hệ thống"));
        }

        // Tạo OTP ngẫu nhiên 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

        // Lưu OTP vào database
        console.log(`📧 Tạo OTP cho ${req.body.email}: ${otp}`);
        console.log(`⏰ OTP hết hạn lúc: ${otpExpiry}`);
        await customerService.update(user._id, {
            otp: otp,
            otp_expiry: otpExpiry
        });

        // Gửi email thật qua Nodemailer
        const subject = "Mã xác thực OTP - SportStore";
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Xin chào,</h2>
                <p>Bạn đã yêu cầu khôi phục mật khẩu tại SportStore.</p>
                <p>Mã OTP của bạn là: <b style="font-size: 24px; color: #302b63;">${otp}</b></p>
                <p>Mã này sẽ hết hạn sau 5 phút.</p>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            </div>
        `;
        
        const emailResult = await sendEmail(req.body.email, subject, htmlContent);
        if (!emailResult) {
            console.error("❌ Không gửi được email OTP");
            throw new Error("Gửi email thất bại. Vui lòng kiểm tra cấu hình email server.");
        }
        console.log(`✅ OTP gửi thành công tới ${req.body.email}`);
        return res.send({ message: "✅ Mã OTP đã được gửi thành công!" });
    } catch (error) {
        console.error("❌ Lỗi tại forgotPassword:", error.message);
        if (error.code === 'EAUTH') console.error("--> Gợi ý: Kiểm tra lại Email và Mật khẩu ứng dụng trong file .env");
        return next(new ApiError(500, "Lỗi hệ thống: " + error.message));
    }
};

/* ================= XÁC THỰC OTP (Bước kiểm tra OTP) ================= */
exports.verifyOtp = async (req, res, next) => {
    if (!req.body?.email || !req.body?.otp) {
        return next(new ApiError(400, "Vui lòng cung cấp email và mã OTP"));
    }

    try {
        const customerService = new CustomerService(MongoDB.client);
        const user = await customerService.findByEmail(req.body.email);

        console.log(`🔍 Kiểm tra OTP cho email: ${req.body.email}`);
        if (!user) {
            console.error(`❌ Email không tồn tại: ${req.body.email}`);
            return next(new ApiError(404, "Email không tồn tại"));
        }
        
        console.log(`OTP nhập vào: ${req.body.otp}, OTP lưu: ${user.otp}`);
        if (user.otp !== req.body.otp) {
            console.error(`❌ OTP sai! Nhập: ${req.body.otp}, Đúng: ${user.otp}`);
            return next(new ApiError(400, "❌ Mã OTP không chính xác"));
        }
        
        console.log(`OTP hết hạn lúc: ${user.otp_expiry}, Hiện tại: ${new Date()}`);
        if (new Date() > new Date(user.otp_expiry)) {
            console.error(`❌ OTP đã hết hạn`);
            return next(new ApiError(400, "❌ Mã OTP đã hết hạn (5 phút)"));
        }
        
        console.log(`✅ OTP chính xác!`);
        return res.send({ message: "✅ Mã OTP chính xác! Vui lòng tạo mật khẩu mới." });
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi xác thực OTP"));
    }
};

/* ================= RESET PASSWORD (ĐỔI MẬT KHẨU SAU KHI OTP ĐÃ XÁC THỰC) ================= */
exports.resetPassword = async (req, res, next) => {
    if (!req.body?.email || !req.body?.otp || !req.body?.newPassword) {
        return next(new ApiError(400, "Vui lòng nhập đầy đủ thông tin"));
    }

    try {
        const customerService = new CustomerService(MongoDB.client);
        const user = await customerService.findByEmail(req.body.email);

        console.log(`🔐 Kiểm tra reset password cho email: ${req.body.email}`);
        if (!user) {
            console.error(`❌ Email không tồn tại: ${req.body.email}`);
            return next(new ApiError(404, "Email không tồn tại"));
        }
        
        // ✅ Kiểm tra lại OTP (an toàn)
        console.log(`OTP nhập vào: ${req.body.otp}, OTP lưu: ${user.otp}`);
        if (user.otp !== req.body.otp) {
            console.error(`❌ OTP sai! Nhập: ${req.body.otp}, Đúng: ${user.otp}`);
            return next(new ApiError(400, "❌ Mã OTP không chính xác"));
        }
        
        console.log(`OTP hết hạn lúc: ${user.otp_expiry}, Hiện tại: ${new Date()}`);
        if (new Date() > new Date(user.otp_expiry)) {
            console.error(`❌ OTP đã hết hạn`);
            return next(new ApiError(400, "❌ Mã OTP đã hết hạn (5 phút)"));
        }
        
        console.log(`✅ OTP chính xác, tiếp tục cập nhật mật khẩu`);
        
        // Cập nhật mật khẩu mới và xóa OTP
        await customerService.update(user._id, {
            password: req.body.newPassword, // Service sẽ tự hash password này
            otp: null,
            otp_expiry: null
        });
        console.log(`✅ Đổi mật khẩu thành công cho email: ${req.body.email}`);
        return res.send({ message: "✅ Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới." });
    } catch (error) {
        console.error("❌ Lỗi tại resetPassword:", error.message);
        return next(new ApiError(500, "Lỗi khi đặt lại mật khẩu"));
    }
};
