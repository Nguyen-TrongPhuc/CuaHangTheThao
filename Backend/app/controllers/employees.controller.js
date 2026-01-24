const EmployeesService = require("../services/employees.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config/index.js");

// =======================
// TẠO NHÂN VIÊN
// =======================
exports.create = async (req, res, next) => {
    if (!req.body?.full_name || !req.body?.password) {
        return next(new ApiError(400, "Full name and password can not be empty"));
    }

    try {
        const employeesService = new EmployeesService(MongoDB.client);

        // kiểm tra trùng số điện thoại
        if (req.body.phone) {
            const existing = await employeesService.findByPhone(req.body.phone);
            if (existing) {
                return next(new ApiError(409, "Employee already exists"));
            }
        }

        // mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);

        const document = await employeesService.create(req.body);
        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while creating the employee")
        );
    }
};

// =======================
// LẤY DANH SÁCH NHÂN VIÊN
// =======================
exports.findAll = async (req, res, next) => {
    let documents = [];

    try {
        const employeesService = new EmployeesService(MongoDB.client);
        const { name, role } = req.query;

        if (name) {
            documents = await employeesService.findByName(name);
        } else if (role) {
            documents = await employeesService.findByRole(role);
        } else {
            documents = await employeesService.find({});
        }

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while retrieving employees")
        );
    }

    return res.send(documents);
};

// =======================
// LẤY 1 NHÂN VIÊN
// =======================
exports.findOne = async (req, res, next) => {
    try {
        const employeesService = new EmployeesService(MongoDB.client);
        const document = await employeesService.findById(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Employee not found"));
        }

        return res.send(document);

    } catch (error) {
        return next(
            new ApiError(500, `Error retrieving employee with id=${req.params.id}`)
        );
    }
};

// =======================
// CẬP NHẬT NHÂN VIÊN
// =======================
exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update can not be empty"));
    }

    try {
        const employeesService = new EmployeesService(MongoDB.client);

        // nếu đổi mật khẩu thì mã hóa lại
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        const document = await employeesService.update(req.params.id, req.body);

        if (!document) {
            return next(new ApiError(404, "Employee not found"));
        }

        return res.send({ message: "Employee was updated successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Error updating employee with id=${req.params.id}`)
        );
    }
};

// =======================
// XÓA NHÂN VIÊN
// =======================
exports.delete = async (req, res, next) => {
    try {
        const employeesService = new EmployeesService(MongoDB.client);
        const document = await employeesService.delete(req.params.id);

        if (!document) {
            return next(new ApiError(404, "Employee not found"));
        }

        return res.send({ message: "Employee was deleted successfully" });

    } catch (error) {
        return next(
            new ApiError(500, `Could not delete employee with id=${req.params.id}`)
        );
    }
};

// =======================
// XÓA TẤT CẢ NHÂN VIÊN
// =======================
exports.deleteAll = async (_req, res, next) => {
    try {
        const employeesService = new EmployeesService(MongoDB.client);
        const deletedCount = await employeesService.deleteAll();

        return res.send({
            message: `${deletedCount} employees were deleted successfully`,
        });

    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while removing all employees")
        );
    }
};

// =======================
// ĐĂNG NHẬP NHÂN VIÊN
// =======================
exports.login = async (req, res, next) => {
    if (!req.body?.phone || !req.body?.password) {
        return next(new ApiError(400, "Phone and password are required"));
    }

    try {
        const employeesService = new EmployeesService(MongoDB.client);
        const user = await employeesService.findByPhone(req.body.phone);

        if (!user) {
            return next(new ApiError(401, "Incorrect phone or password"));
        }

        const passwordMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!passwordMatch) {
            return next(new ApiError(401, "Incorrect phone or password"));
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            config.jwt.secret,
            { expiresIn: "1h" }
        );

        const { password, ...userWithoutPassword } = user;

        return res.send({
            message: "Login successful",
            token: token,
            user: userWithoutPassword
        });

    } catch (error) {
        return next(new ApiError(500, "An error occurred during login"));
    }
};
