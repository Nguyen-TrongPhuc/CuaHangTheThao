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
                const importPrice = Number(item.import_price) || 0;

                // Lấy thông tin sản phẩm hiện tại để tính Giá bình quân
                const product = await this.Products.findOne({ _id: productId });
                if (!product) continue;

                // FIX: Mở rộng cách lấy ID biến thể để khớp với nhiều định dạng payload từ Frontend
                const vSizeId = item.variant_size_id || item.size_id || (item.variant ? item.variant.size_id : null);
                const vColorId = item.variant_color_id || item.color_id || (item.variant ? item.variant.color_id : null);

                if (vSizeId || vColorId) {
                    const sizeId = (vSizeId && ObjectId.isValid(vSizeId)) ? new ObjectId(vSizeId) : null;
                    const colorId = (vColorId && ObjectId.isValid(vColorId)) ? new ObjectId(vColorId) : null;

                    // Tìm biến thể hiện tại
                    const variant = (product.variants || []).find(v => 
                        String(v.size_id) === String(sizeId) && String(v.color_id) === String(colorId)
                    );
                    
                    const oldStock = variant ? (Number(variant.stock) || 0) : 0;
                    const oldPrice = variant ? (Number(variant.import_price) || 0) : 0;
                    const newStock = oldStock + quantity;
                    
                    // AUTO-FETCH: Tự động lội ngược dòng tìm Giá nhập cũ trong lịch sử Phiếu nhập kho
                    let effectiveOldPrice = oldPrice;
                    if (oldPrice === 0 && oldStock > 0) {
                        const lastReceipt = await this.Warehouse.findOne(
                            { "items.product_id": { $in: [String(productId), productId] } },
                            { sort: { createdAt: -1 } }
                        );
                        
                        if (lastReceipt && lastReceipt.items) {
                            const pastItem = lastReceipt.items.find(i => {
                                const iSizeId = i.variant_size_id || i.size_id || (i.variant ? i.variant.size_id : null);
                                const iColorId = i.variant_color_id || i.color_id || (i.variant ? i.variant.color_id : null);
                                return String(i.product_id) === String(productId) && 
                                (iSizeId ? String(iSizeId) : null) === (sizeId ? String(sizeId) : null) && 
                                (iColorId ? String(iColorId) : null) === (colorId ? String(colorId) : null);
                            });
                            if (pastItem && Number(pastItem.import_price) > 0) {
                                effectiveOldPrice = Number(pastItem.import_price);
                            } else effectiveOldPrice = importPrice; // Fallback nếu trong phiếu cũ giá cũng = 0
                        } else effectiveOldPrice = importPrice; // Fallback nếu chưa từng có phiếu nhập nào
                    }

                    // Công thức tính giá bình quân gia quyền
                    const newAvgPrice = newStock > 0 
                        ? Math.round(((oldStock * effectiveOldPrice) + (quantity * importPrice)) / newStock)
                        : importPrice;

                    await this.Products.updateOne(
                        { _id: productId, variants: { $elemMatch: { size_id: sizeId, color_id: colorId } } },
                        { 
                            $inc: { "variants.$.stock": quantity, "stock": quantity },
                            $set: { "variants.$.import_price": newAvgPrice }
                        }
                    );

                    // TÍNH LẠI GIÁ VỐN TỔNG CHO TOÀN BỘ SẢN PHẨM DỰA TRÊN TẤT CẢ BIẾN THỂ
                    const updatedProduct = await this.Products.findOne({ _id: productId });
                    if (updatedProduct && updatedProduct.variants && updatedProduct.variants.length > 0) {
                        let totalValue = 0;
                        let totalStock = 0;
                        for (const v of updatedProduct.variants) {
                            const vStock = Number(v.stock) || 0;
                            const vPrice = Number(v.import_price) || 0;
                            totalValue += (vStock * vPrice);
                            totalStock += vStock;
                        }
                        const rootAvgPrice = totalStock > 0 ? Math.round(totalValue / totalStock) : 0;
                        
                        await this.Products.updateOne(
                            { _id: productId },
                            { $set: { import_price: rootAvgPrice } }
                        );
                    }
                } else {
                    const oldStock = Number(product.stock) || 0;
                    const oldPrice = Number(product.import_price) || 0;
                    const newStock = oldStock + quantity;
                    
                    // AUTO-FETCH: Tự động lội ngược dòng tìm Giá nhập cũ cho sản phẩm cơ bản
                    let effectiveOldPrice = oldPrice;
                    if (oldPrice === 0 && oldStock > 0) {
                        const lastReceipt = await this.Warehouse.findOne(
                            { "items.product_id": { $in: [String(productId), productId] } },
                            { sort: { createdAt: -1 } }
                        );
                        
                        if (lastReceipt && lastReceipt.items) {
                            const pastItem = lastReceipt.items.find(i => {
                                const iSizeId = i.variant_size_id || i.size_id || (i.variant ? i.variant.size_id : null);
                                const iColorId = i.variant_color_id || i.color_id || (i.variant ? i.variant.color_id : null);
                                return String(i.product_id) === String(productId) && 
                                !iSizeId && 
                                !iColorId;
                            });
                            if (pastItem && Number(pastItem.import_price) > 0) {
                                effectiveOldPrice = Number(pastItem.import_price);
                            } else effectiveOldPrice = importPrice;
                        } else effectiveOldPrice = importPrice;
                    }

                    // Công thức tính giá bình quân gia quyền cho sản phẩm cơ bản
                    const newAvgPrice = newStock > 0 
                        ? Math.round(((oldStock * effectiveOldPrice) + (quantity * importPrice)) / newStock)
                        : importPrice;

                    await this.Products.updateOne(
                        { _id: productId },
                        { 
                            $inc: { stock: quantity },
                            $set: { import_price: newAvgPrice }
                        }
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

    async findByDateRange(year, month) {
        if (!year || !month || month === 'all') {
            return this.findAll();
        }
        const y = parseInt(year);
        const m = parseInt(month);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59, 999);
        const cursor = await this.Warehouse.find({
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: -1 });
        return await cursor.toArray();
    }
}

module.exports = WarehouseService;
