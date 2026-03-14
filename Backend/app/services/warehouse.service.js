const { ObjectId } = require("mongodb");

class WarehouseService {
    constructor(client) {
        this.Warehouse = client.db().collection("warehouse"); // Bảng lưu lịch sử nhập hàng (ImportTickets)
        this.Products = client.db().collection("products");   // Bảng sản phẩm để cập nhật stock
    }

    async findAll() {
        const cursor = await this.Warehouse.find({}).sort({ createdAt: -1 });
        return await cursor.toArray();
    }

    async findById(id) {
        return await this.Warehouse.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
    }

    async create(payload) {
        // BƯỚC 1: Cập nhật tồn kho cho từng sản phẩm trong danh sách
        if (payload.items && Array.isArray(payload.items)) {
            for (const item of payload.items) {
                const pId = item.product_id || item.productId;
                if (!pId || !ObjectId.isValid(pId)) continue;
                
                const productId = new ObjectId(pId);
                const quantity = Number(item.quantity) || 0;

                if (item.variant_size_id || item.variant_color_id) {
                    const sizeId = (item.variant_size_id && ObjectId.isValid(item.variant_size_id)) ? new ObjectId(item.variant_size_id) : null;
                    const colorId = (item.variant_color_id && ObjectId.isValid(item.variant_color_id)) ? new ObjectId(item.variant_color_id) : null;

                    await this.Products.updateOne(
                        { _id: productId, variants: { $elemMatch: { size_id: sizeId, color_id: colorId } } },
                        { $inc: { "variants.$.stock": quantity, "stock": quantity } }
                    );
                } else {
                    await this.Products.updateOne(
                        { _id: productId },
                        { $inc: { stock: quantity } }
                    );
                }
            }
        }

        // BƯỚC 2: Lưu toàn bộ phiếu nhập (1 document duy nhất chứa mảng items)
        const receipt = {
            ...payload,
            createdAt: new Date()
        };
        
        const result = await this.Warehouse.insertOne(receipt);
        return result;
    }
}

module.exports = WarehouseService;
