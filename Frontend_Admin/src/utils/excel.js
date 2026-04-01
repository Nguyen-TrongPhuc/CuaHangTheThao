import * as XLSX from 'xlsx';

const getOrderStatus = (status) => {
    const map = {
        'pending': 'Chờ xử lý',
        'shipping': 'Đang giao',
        'delivered': 'Đã giao',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy',
        'return_requested': 'Yêu cầu trả hàng',
        'return_accepted': 'Đồng ý trả',
        'returned': 'Đã trả hàng'
    };
    return map[status] || status;
};

export const exportOrdersToExcel = (orders) => {
    const data = orders.map(order => ({
        "Mã ĐH": order._id,
        "Ngày đặt": new Date(order.createdAt).toLocaleString('vi-VN'),
        "Khách hàng": order.name,
        "SĐT": order.phone,
        "Tổng tiền (VNĐ)": order.total_amount,
        "Phương thức TT": order.payment_method?.toUpperCase(),
        "Trạng thái TT": order.payment_status === 'paid' ? 'Đã thanh toán' : (order.payment_status === 'unpaid' ? 'Chưa thanh toán' : order.payment_status),
        "Trạng thái ĐH": getOrderStatus(order.status)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachDonHang");
    XLSX.writeFile(wb, `DonHang_${new Date().toISOString().slice(0,10)}.xlsx`);
};

export const exportInventoryToExcel = (products, sizes = [], colors = []) => {
    const data = [];
    
    products.forEach(p => {
        if (p.variants && p.variants.length > 0) {
            p.variants.forEach(v => {
                const sizeName = sizes.find(s => s._id === v.size_id)?.name || v.size_id || '';
                const colorName = colors.find(c => c._id === v.color_id)?.name || v.color_id || '';
                data.push({
                    "Mã SP": p._id,
                    "Tên sản phẩm": p.name,
                    "Phân loại": `Size: ${sizeName} - Màu: ${colorName}`,
                    "Tồn kho": v.stock,
                    "Đã bán": p.sold || 0,
                    "Giá bán (VNĐ)": v.price || p.price
                });
            });
        } else {
            data.push({
                "Mã SP": p._id,
                "Tên sản phẩm": p.name,
                "Phân loại": "Mặc định",
                "Tồn kho": p.stock,
                "Đã bán": p.sold || 0,
                "Giá bán (VNĐ)": p.price
            });
        }
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TonKho");
    XLSX.writeFile(wb, `TonKho_${new Date().toISOString().slice(0,10)}.xlsx`);
};

export const exportWarehouseToExcel = (receipts) => {
    const data = [];
    
    receipts.forEach(receipt => {
        if (receipt.items && receipt.items.length > 0) {
            receipt.items.forEach(item => {
                data.push({
                    "Mã Phiếu": receipt._id,
                    "Ngày lập": new Date(receipt.createdAt).toLocaleString('vi-VN'),
                    "Người lập phiếu": receipt.staff_name || 'Admin',
                    "Tên sản phẩm": item.product_name || item.name || '',
                    "Phân loại": item.variant_desc || 'Mặc định',
                    "Số lượng": item.quantity,
                    "Giá nhập (VNĐ)": item.import_price || item.price || 0,
                    "Thành tiền (VNĐ)": (item.import_price || item.price || 0) * item.quantity
                });
            });
        }
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PhieuNhapKho");
    XLSX.writeFile(wb, `PhieuNhapKho_${new Date().toISOString().slice(0,10)}.xlsx`);
};

export const exportCashbookToExcel = (data, date) => {
    const excelData = data.transactions.map(txn => ({
        "Thời gian": new Date(txn.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        "Loại": txn.type === 'revenue' ? 'THU' : 'CHI',
        "Nguồn": txn.source,
        "Mô tả chi tiết": txn.description,
        "Số tiền (VNĐ)": txn.type === 'revenue' ? txn.amount : -txn.amount
    }));

    // Thêm dòng tổng kết vào cuối file Excel
    excelData.push({});
    excelData.push({
        "Thời gian": "TỔNG THU", "Số tiền (VNĐ)": data.totalRevenue
    });
    excelData.push({
        "Thời gian": "TỔNG CHI", "Số tiền (VNĐ)": -data.totalCost
    });
    excelData.push({
        "Thời gian": "LỢI NHUẬN", "Số tiền (VNĐ)": data.profit
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SoQuy_DongTien");
    XLSX.writeFile(wb, `SaoKe_SoQuy_${date.replace(/-/g, '')}.xlsx`);
};