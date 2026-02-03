const { ObjectId } = require("mongodb");

class EmployeesService {
    constructor(client) {
        this.Employees = client.db().collection("employees");
    }

    // =======================
    // TẠO NHÂN VIÊN
    // =======================
    async create(payload) {
        const employee = {
            full_name: payload.full_name,
            admin_code: payload.admin_code,
            phone: payload.phone || null,
            password: payload.password,
            role: payload.role || "staff",   // mặc định là staff
            createdAt: new Date(),
        };

        const result = await this.Employees.insertOne(employee);
        return result.insertedId
            ? { _id: result.insertedId, ...employee }
            : null;
    }

    // =======================
    // TÌM THEO ĐIỀU KIỆN CHUNG
    // =======================
    async find(filter) {
        const cursor = await this.Employees.find(filter);
        return cursor.toArray();
    }

    // =======================
    // TÌM THEO ID
    // =======================
    async findById(id) {
        return await this.Employees.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
    }

    // =======================
    // TÌM THEO TÊN
    // =======================
    async findByName(name) {
        return await this.Employees.find({
            full_name: { $regex: new RegExp(name), $options: "i" },
        }).toArray();
    }

    // =======================
    // TÌM THEO VAI TRÒ
    // =======================
    async findByRole(role) {
        return await this.Employees.find({ role }).toArray();
    }

    // =======================
    // TÌM THEO SỐ ĐIỆN THOẠI
    // =======================
    async findByPhone(phone) {
        return await this.Employees.findOne({ phone });
    }

    // =======================
    // TÌM THEO MÃ ADMIN
    // =======================
    async findByAdminCode(admin_code) {
        return await this.Employees.findOne({ admin_code });
    }

    // =======================
    // CẬP NHẬT NHÂN VIÊN
    // =======================
    async update(id, payload) {
        const filter = {
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        };

        const update = {
            $set: {
                ...payload,
                updatedAt: new Date(),
            },
        };

        const result = await this.Employees.findOneAndUpdate(
            filter,
            update,
            { returnDocument: "after" }
        );

        return result;
    }

    // =======================
    // XÓA 1 NHÂN VIÊN
    // =======================
    async delete(id) {
        const result = await this.Employees.findOneAndDelete({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });

        return result;
    }

    // =======================
    // XÓA TẤT CẢ NHÂN VIÊN
    // =======================
    async deleteAll() {
        const result = await this.Employees.deleteMany({});
        return result.deletedCount;
    }
}

module.exports = EmployeesService;
