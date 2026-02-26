const CustomerService = require("../services/customer.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config/index.js");

/* ================= CREATE ================= */
exports.create = async (req, res, next) => {
    if (!req.body?.email || !req.body?.password) {
        return next(new ApiError(400, "Email and password can not be empty"));
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
