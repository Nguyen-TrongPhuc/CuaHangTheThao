const { ObjectId } = require("mongodb");

class SalariesService {
    constructor(client) {
        this.Salaries = client.db().collection("salaries");
        this.Employees = client.db().collection("employees");
        this.Orders = client.db().collection("orders");
        this.Shifts = client.db().collection("shifts");
    }

    // ==========================================
    // TỰ ĐỘNG TÍNH LƯƠNG & HOA HỒNG (ADVANCED)
    // ==========================================
    async generatePayroll(month, year, commissionRate = 0.01) { // Mặc định hoa hồng 1%
        const m = parseInt(month);
        const y = parseInt(year);

        // 1. Lấy danh sách nhân viên (CHỈ lấy 'staff', KHÔNG lấy 'admin')
        const employees = await this.Employees.find({ role: "staff" }).toArray();
        
        // 2. Mốc thời gian mặc định của tháng cần tính
        const normalStartDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        // Để xử lý việc cộng dồn hoa hồng từ tháng trước, ta kéo dữ liệu từ đầu tháng trước nữa
        const prevMonthStartDate = new Date(y, m - 2, 1);

        // 3. Quét tất cả Đơn hàng đã "Hoàn thành" và "Trả hàng" trong khoảng thời gian rộng
        const allCompletedOrders = await this.Orders.find({
            status: "completed",
            updatedAt: { $gte: prevMonthStartDate, $lte: endDate },
            employee_id: { $ne: null }
        }).toArray();

        const allReturnedOrders = await this.Orders.find({
            status: "returned",
            updatedAt: { $gte: prevMonthStartDate, $lte: endDate },
            employee_id: { $ne: null }
        }).toArray();

        // 3.2. QUÉT CA TRỰC (SHIFTS): Đếm tổng số ca được xếp TRỪ đi các ca Vắng mặt
        const validShifts = await this.Shifts.aggregate([
            {
                $match: {
                    status: { $in: ["scheduled", "attended"] }, // Xem như đi làm nếu được xếp lịch mà không bị đánh vắng
                    date: { $gte: normalStartDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] }
                }
            },
            {
                $group: {
                    _id: "$employee_id",
                    working_days: { $sum: 1 }
                }
            }
        ]).toArray();

        // 3.3. QUÉT CA TRỰC BỊ VẮNG MẶT (ABSENT) ĐỂ PHẠT
        const absentShifts = await this.Shifts.aggregate([
            {
                $match: {
                    status: "absent",
                    date: { $gte: normalStartDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] }
                }
            },
            {
                $group: { _id: "$employee_id", absent_count: { $sum: 1 } }
            }
        ]).toArray();

        const payrolls = [];

        // 4. Lặp qua từng nhân viên để tạo/cập nhật phiếu lương
        for (const emp of employees) {
            // Lấy lại phiếu lương cũ (nếu có) để không bị ghi đè
            const existingSalary = await this.Salaries.findOne({ employee_id: emp._id, month: m, year: y });
            
            // BẢO VỆ KẾT TOÁN (LOCK)
            if (existingSalary && existingSalary.status === "paid") {
                payrolls.push(existingSalary);
                continue; 
            }

            // --- LOGIC CỘNG DỒN HOA HỒNG (CARRY-OVER COMMISSION) ---
            const prevMonth = m === 1 ? 12 : m - 1;
            const prevYear = m === 1 ? y - 1 : y;
            const prevSalary = await this.Salaries.findOne({ employee_id: emp._id, month: prevMonth, year: prevYear });
            
            let empStartDate = normalStartDate;
            let carryOverNote = "";
            
            // Nếu tháng trước đã thanh toán sớm (payment_date < ngày cuối tháng trước)
            if (prevSalary && prevSalary.status === "paid" && prevSalary.payment_date) {
                const prevMonthEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);
                if (new Date(prevSalary.payment_date) < prevMonthEndDate) {
                    // Dời ngày bắt đầu tính hoa hồng về thời điểm bấm nút Thanh toán của tháng trước
                    empStartDate = new Date(prevSalary.payment_date);
                    carryOverNote = ` (Cộng dồn hoa hồng từ ngày ${empStartDate.toLocaleDateString('vi-VN')} của tháng trước).`;
                }
            }

            // Lọc đơn hàng của nhân viên này
            const empCompletedOrders = allCompletedOrders.filter(o => {
                const isMyOrder = String(o.employee_id) === String(emp._id);
                const orderDate = new Date(o.updatedAt);
                // Dùng > thay vì >= để tránh trùng khớp giây bấm thanh toán
                const isAfterStart = (empStartDate.getTime() === normalStartDate.getTime()) 
                                     ? orderDate >= empStartDate 
                                     : orderDate > empStartDate;
                return isMyOrder && isAfterStart && orderDate <= endDate;
            });

            const empReturnedOrders = allReturnedOrders.filter(o => {
                const isMyOrder = String(o.employee_id) === String(emp._id);
                const orderDate = new Date(o.updatedAt);
                const isAfterStart = (empStartDate.getTime() === normalStartDate.getTime()) 
                                     ? orderDate >= empStartDate 
                                     : orderDate > empStartDate;
                return isMyOrder && isAfterStart && orderDate <= endDate;
            });

            // Tìm doanh thu mà nhân viên này mang lại
            const revenue = empCompletedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            const orderCount = empCompletedOrders.length;
            
            // Tìm doanh thu bị hoàn trả để TRUY THU
            const returnedRevenue = empReturnedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            const returnedCount = empReturnedOrders.length;

            // Tính toán tiền thưởng từ hoa hồng
            const calculatedCommission = revenue * commissionRate;

            // Tìm số ca vắng mặt để phạt (Mặc định phạt 100.000đ/ca vắng mặt không phép)
            const absent_count = absentShifts.find(s => String(s._id) === String(emp._id))?.absent_count || 0;
            const absent_penalty = absent_count * 100000;

            const autoDeduction = (returnedRevenue * commissionRate) + absent_penalty; // Tiền truy thu đơn hàng + Tiền phạt vắng

            // Mức lương cơ bản mặc định nếu chưa được Admin thiết lập
            const baseSalary = emp.base_salary || 5000000; 
            const allowance = emp.allowance || 0;

            // TÍNH LƯƠNG THEO CHẤM CÔNG
            // 1. CỐ ĐỊNH ngày công chuẩn là 26 để đơn giá 1 ngày lương luôn cố định
            const standard_days = 26;

            // 2. Đếm số công thực tế dựa trên số ca trực (Bỏ qua ca vắng mặt)
            const auto_working_days = validShifts.find(s => String(s._id) === String(emp._id))?.working_days || 0;

            // Luôn ưu tiên tính lại số công tự động từ lịch trực mỗi khi bấm "Tính lương"
            const working_days = auto_working_days;

            // Lương cơ bản thực tế = (Lương gốc / Ngày chuẩn) * Ngày làm thực tế
            const actual_base_salary = Math.round((baseSalary / standard_days) * working_days);

            // TÍNH LƯƠNG TĂNG CA (OT)
            const ot_hours = existingSalary ? (existingSalary.ot_hours || 0) : 0;
            const ot_rate = 1.5; // 150%
            const ot_salary = Math.round((baseSalary / standard_days / 8) * ot_rate * ot_hours);
            
            const manualBonus = existingSalary ? (existingSalary.bonus || 0) : 0;
            // Tự động ghi đè phạt hệ thống, trừ khi Admin nhập tay mức phạt nặng hơn
            const manualDeduction = (existingSalary && existingSalary.deduction > autoDeduction) ? existingSalary.deduction : autoDeduction;
            const status = existingSalary ? existingSalary.status : "unpaid";
            const payment_date = existingSalary ? existingSalary.payment_date : null;
            
            // Tạo câu ghi chú động
            let noteText = `Lương T${m}/${y}. Hoa hồng ${(commissionRate*100).toFixed(1)}% từ ${revenue.toLocaleString()}đ (${orderCount} đơn).${carryOverNote}`;
            if (returnedCount > 0) {
                noteText += ` TRUY THU: -${(returnedRevenue * commissionRate).toLocaleString()}đ do ${returnedCount} đơn bị khách trả hàng.`;
            }
            if (absent_count > 0) {
                noteText += ` PHẠT VẮNG: -${absent_penalty.toLocaleString()}đ (${absent_count} ca).`;
            }

            const payrollInfo = {
                employee_id: emp._id,
                employee_name: emp.full_name,
                employee_role: emp.role,
                month: m,
                year: y,
                base_salary: baseSalary,
                standard_days: standard_days,
                working_days: working_days,
                actual_base_salary: actual_base_salary,
                ot_hours: ot_hours,
                ot_salary: ot_salary,
                allowance: allowance,
                commission_revenue: revenue,
                commission_amount: calculatedCommission, // Lưu riêng tiền hoa hồng tự động
                order_count: orderCount,
                bonus: manualBonus, // Giữ nguyên tiền thưởng tay của bạn
                deduction: manualDeduction, // Giữ nguyên tiền phạt tay của bạn
                net_salary: actual_base_salary + ot_salary + allowance + calculatedCommission + manualBonus - manualDeduction, // Thực lãnh mới
                status: status,
                payment_date: payment_date,
                note: noteText,
                updatedAt: new Date()
            };

            // Cập nhật nếu đã có phiếu lương tháng này, hoặc tạo mới nếu chưa có (upsert)
            const result = await this.Salaries.findOneAndUpdate(
                { employee_id: emp._id, month: m, year: y },
                { $set: payrollInfo, $setOnInsert: { createdAt: new Date() } },
                { upsert: true, returnDocument: "after" }
            );
            
            payrolls.push(result);
        }
        return payrolls;
    }

    async findAll(filter = {}) {
        filter.employee_role = "staff"; // BẢO VỆ: Luôn chặn và ẩn Role Admin khỏi danh sách
        return await this.Salaries.find(filter).sort({ year: -1, month: -1, employee_name: 1 }).toArray();
    }

    async update(id, payload) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const salary = await this.Salaries.findOne(filter);
        if (!salary) throw new Error("Không tìm thấy bảng lương");

        const updateData = { ...payload, updatedAt: new Date() };
        
        // Khi sửa tay, không cho phép thay đổi ngày công. Nó được tính tự động.
        // Giữ nguyên lương cơ bản thực tế và ngày công đã được tính từ `generatePayroll`.
        delete updateData.working_days;
        const actual_base_salary = salary.actual_base_salary || 0;
        const allowance = salary.allowance || 0;

        // Chỉ tính lại các khoản do Admin nhập tay
        const ot_hours = updateData.ot_hours !== undefined ? Number(updateData.ot_hours) : (salary.ot_hours || 0);
        const ot_rate = 1.5;
        const ot_salary = Math.round((salary.base_salary / (salary.standard_days || 26) / 8) * ot_rate * ot_hours);
        
        const commission_amount = salary.commission_amount || 0; // Lấy hoa hồng tự động hiện tại
        const bonus = updateData.bonus !== undefined ? Number(updateData.bonus) : salary.bonus;
        const deduction = updateData.deduction !== undefined ? Number(updateData.deduction) : salary.deduction;
        
        updateData.ot_hours = ot_hours;
        updateData.ot_salary = ot_salary;
        updateData.net_salary = actual_base_salary + ot_salary + allowance + commission_amount + bonus - deduction;

        return await this.Salaries.findOneAndUpdate(filter, { $set: updateData }, { returnDocument: "after" });
    }
}

module.exports = SalariesService;