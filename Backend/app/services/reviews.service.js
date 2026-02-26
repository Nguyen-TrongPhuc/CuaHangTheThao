const { ObjectId } = require("mongodb");

class ReviewsService {
    constructor(client) {
        this.Reviews = client.db().collection("reviews");
    }

    async create(payload) {
        const review = {
            user_id: new ObjectId(payload.user_id),
            product_id: new ObjectId(payload.product_id),
            order_id: new ObjectId(payload.order_id),
            rating: Number(payload.rating),
            comment: payload.comment,
            image: payload.image || null,
            reply: null,
            createdAt: new Date(),
        };
        return await this.Reviews.insertOne(review);
    }

    async findByProduct(productId) {
        return await this.Reviews.aggregate([
            { $match: { product_id: new ObjectId(productId) } },
            {
                $lookup: {
                    from: "customers",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            { $sort: { createdAt: -1 } }
        ]).toArray();
    }

    async findAll() {
        return await this.Reviews.aggregate([
            {
                $lookup: {
                    from: "customers",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();
    }

    async reply(id, replyText) {
        return await this.Reviews.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    reply: {
                        text: replyText,
                        createdAt: new Date()
                    }
                } 
            },
            { returnDocument: "after" }
        );
    }
}

module.exports = ReviewsService;