const SalariesService = require("../services/salaries.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const { ObjectId } = require("mongodb");

// Admin sinh bảng lương tự động
exports.generate = async (req, res, next) => {
    try {
        const { month, year, commissionRate } = req.body;
        if (!month || !year) {
            return next(new ApiError(400, "Vui lòng cung cấp Tháng và Năm"));
        }

        const salariesService = new SalariesService(MongoDB.client);
        const result = await salariesService.generatePayroll(month, year, commissionRate);
        return res.send({ message: `Đã tính lương tháng ${month}/${year} thành công!`, data: result });
    } catch (error) {
        return next(new ApiError(500, "Đã xảy ra lỗi khi tính lương"));
    }
};

// Xem danh sách bảng lương (Có bộ lọc)
exports.findAll = async (req, res, next) => {
    try {
        const salariesService = new SalariesService(MongoDB.client);
        const filter = {};
        if (req.query.month) filter.month = parseInt(req.query.month);
        if (req.query.year) filter.year = parseInt(req.query.year);
        if (req.query.employee_id) filter.employee_id = new ObjectId(req.query.employee_id);
        
        const documents = await salariesService.findAll(filter);
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách lương"));
    }
};

// Nhân viên tự xem lương của mình
exports.findMySalaries = async (req, res, next) => {
    try {
        const salariesService = new SalariesService(MongoDB.client);
        // req.user.userId được lấy từ auth.middleware (JWT)
        const filter = { employee_id: new ObjectId(req.user.userId) };
        const documents = await salariesService.findAll(filter);
        return res.send(documents);
    } catch (error) {
        console.error("Lỗi lấy phiếu lương:", error);
        return next(new ApiError(500, "Đã xảy ra lỗi khi lấy phiếu lương của bạn"));
    }
};

// Cập nhật bảng lương (Sửa thưởng, phạt, đánh dấu đã thanh toán)
exports.update = async (req, res, next) => {
    try {
        const salariesService = new SalariesService(MongoDB.client);
        const document = await salariesService.update(req.params.id, req.body);
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi cập nhật bảng lương"));
    }
};