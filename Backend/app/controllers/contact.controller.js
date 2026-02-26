const ContactService = require("../services/contact.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.create = async (req, res, next) => {
    if (!req.body.name || !req.body.email || !req.body.subject || !req.body.message) {
        return next(new ApiError(400, "Vui lòng cung cấp tất cả các trường bắt buộc"));
    }

    try {
        const contactService = new ContactService(MongoDB.client);
        const result = await contactService.create(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return next(
            new ApiError(500, `Lỗi khi tạo liên hệ: ${error.message}`)
        );
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const contactService = new ContactService(MongoDB.client);
        const contacts = await contactService.findAll();
        return res.status(200).json(contacts);
    } catch (error) {
        return next(
            new ApiError(500, `Lỗi khi lấy danh sách liên hệ: ${error.message}`)
        );
    }
};

exports.findById = async (req, res, next) => {
    try {
        const contactService = new ContactService(MongoDB.client);
        const contact = await contactService.findById(req.params.id);
        if (!contact) {
            return next(new ApiError(404, "Không tìm thấy liên hệ"));
        }
        return res.status(200).json(contact);
    } catch (error) {
        return next(
            new ApiError(500, `Lỗi khi lấy chi tiết liên hệ: ${error.message}`)
        );
    }
};

exports.update = async (req, res, next) => {
    if (!req.params.id) {
        return next(new ApiError(400, "ID liên hệ không hợp lệ"));
    }

    try {
        const contactService = new ContactService(MongoDB.client);
        const contact = await contactService.findById(req.params.id);
        if (!contact) {
            return next(new ApiError(404, "Không tìm thấy liên hệ"));
        }

        const result = await contactService.update(req.params.id, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return next(
            new ApiError(500, `Lỗi khi cập nhật liên hệ: ${error.message}`)
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        const contactService = new ContactService(MongoDB.client);
        const result = await contactService.delete(req.params.id);
        if (!result || !result._id) {
            return next(new ApiError(404, "Không tìm thấy liên hệ"));
        }
        return res.status(200).json({ message: "Liên hệ đã được xóa thành công" });
    } catch (error) {
        return next(
            new ApiError(500, `Lỗi khi xóa liên hệ: ${error.message}`)
        );
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const contactService = new ContactService(MongoDB.client);
        const result = await contactService.deleteAll();
        return res.status(200).json({
            message: `${result.deletedCount} liên hệ đã được xóa`
        });
    } catch (error) {
        return next(
            new ApiError(500, `Lỗi khi xóa tất cả liên hệ: ${error.message}`)
        );
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const contactService = new ContactService(MongoDB.client);
        const contact = await contactService.findById(req.params.id);
        if (!contact) {
            return next(new ApiError(404, "Không tìm thấy liên hệ"));
        }

        const result = await contactService.markAsRead(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        return next(
            new ApiError(500, `Lỗi khi đánh dấu đã đọc: ${error.message}`)
        );
    }
};
