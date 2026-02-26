const ReviewsService = require("../services/reviews.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.create = async (req, res, next) => {
    try {
        const reviewsService = new ReviewsService(MongoDB.client);
        const document = await reviewsService.create({
            ...req.body,
            user_id: req.user.userId || req.user.id || req.user._id
        });
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while creating the review"));
    }
};

exports.findByProduct = async (req, res, next) => {
    try {
        const reviewsService = new ReviewsService(MongoDB.client);
        const documents = await reviewsService.findByProduct(req.params.id);
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while retrieving reviews"));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const reviewsService = new ReviewsService(MongoDB.client);
        const documents = await reviewsService.findAll();
        return res.send(documents);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while retrieving all reviews"));
    }
};

exports.reply = async (req, res, next) => {
    if (!req.body.reply) {
        return next(new ApiError(400, "Reply content is required"));
    }
    try {
        const reviewsService = new ReviewsService(MongoDB.client);
        const document = await reviewsService.reply(req.params.id, req.body.reply);
        return res.send(document);
    } catch (error) {
        return next(new ApiError(500, "An error occurred while replying"));
    }
};