const ShiftsService = require("../services/shifts.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const { ObjectId } = require("mongodb");

exports.create = async (req, res, next) => {
    try {
        if (!req.body.employee_id || !req.body.date || !req.body.shift_type) {
            return next(new ApiError(400, "Vui lòng cung cấp đủ thông tin phân công."));
        }
        const shiftsService = new ShiftsService(MongoDB.client);
        const document = await shiftsService.create(req.body);
        return res.send(document);
    } catch (error) {
        if (error.message.includes("đã được phân công")) return next(new ApiError(400, error.message));
        return next(new ApiError(500, "Lỗi khi tạo ca trực"));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const shiftsService = new ShiftsService(MongoDB.client);
        const filter = {};
        
        // Lọc theo khoảng thời gian (Dùng cho xem lịch tuần)
        if (req.query.startDate && req.query.endDate) {
            filter.date = { $gte: req.query.startDate, $lte: req.query.endDate };
        } else if (req.query.date) {
            filter.date = req.query.date;
        }

        // Phân quyền: Nhân viên chỉ thấy lịch của mình, Admin thì được xem/lọc tất cả
        if (req.user && req.user.role !== 'admin') {
            filter.employee_id = new ObjectId(req.user.userId);
        } else if (req.query.employee_id) {
            filter.employee_id = new ObjectId(req.query.employee_id);
        }
        
        const documents = await shiftsService.findAll(filter);
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi lấy danh sách ca trực"));
    }
};

exports.update = async (req, res, next) => {
    try {
        const shiftsService = new ShiftsService(MongoDB.client);
        const document = await shiftsService.update(req.params.id, req.body);
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, "Lỗi cập nhật ca trực"));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const shiftsService = new ShiftsService(MongoDB.client);
        await shiftsService.delete(req.params.id);
        return res.send({ message: "Xóa thành công" });
    } catch (error) { return next(new ApiError(500, "Lỗi xóa ca trực")); }
};