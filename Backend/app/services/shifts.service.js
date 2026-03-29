const { ObjectId } = require("mongodb");

class ShiftsService {
    constructor(client) {
        this.Shifts = client.db().collection("shifts");
    }

    async create(payload) {
        // Kiểm tra xem nhân viên đã có ca trực vào ngày/buổi này chưa
        const existing = await this.Shifts.findOne({
            employee_id: new ObjectId(payload.employee_id),
            date: payload.date,
            shift_type: payload.shift_type
        });

        if (existing) {
            throw new Error("Nhân viên này đã được phân công vào ca này rồi.");
        }

        const shift = {
            employee_id: new ObjectId(payload.employee_id),
            employee_name: payload.employee_name,
            date: payload.date, // Định dạng YYYY-MM-DD
            shift_type: payload.shift_type, // morning, afternoon, evening, full
            status: payload.status || "scheduled", // scheduled, attended, absent
            note: payload.note || "",
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await this.Shifts.insertOne(shift);
        return result;
    }

    async findAll(filter) {
        return await this.Shifts.find(filter).sort({ date: -1, shift_type: 1 }).toArray();
    }

    async update(id, payload) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const updateData = { ...payload, updatedAt: new Date() };
        // Xóa _id nếu có để không ghi đè
        delete updateData._id;
        return await this.Shifts.findOneAndUpdate(filter, { $set: updateData }, { returnDocument: "after" });
    }

    async delete(id) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        return await this.Shifts.deleteOne(filter);
    }
}

module.exports = ShiftsService;