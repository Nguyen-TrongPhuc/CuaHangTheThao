const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

class CustomerService {
    constructor(client) {
        this.Customers = client.db().collection("customers");
    }

    // Lọc dữ liệu hợp lệ
    extractCustomerData(payload) {
        const customer = {
            first_name: payload.first_name,
            last_name: payload.last_name,
            birthday: payload.birthday,
            gender: payload.gender,
            address: payload.address,
            phone: payload.phone,
            customer_type: payload.customer_type,
            password: payload.password,
        };

        Object.keys(customer).forEach(
            (key) => customer[key] === undefined && delete customer[key]
        );

        return customer;
    }

    /* ================= CREATE ================= */
    async create(payload) {
        const customer = this.extractCustomerData(payload);
        const result = await this.Customers.insertOne(customer);
        return await this.findById(result.insertedId);
    }

    /* ================= FIND ================= */
    async find(filter) {
        const cursor = await this.Customers.find(filter);
        return await cursor.toArray();
    }

    /* ================= FIND BY NAME ================= */
    async findByName(name) {
        return await this.find({
            $or: [
                { first_name: { $regex: new RegExp(name), $options: "i" } },
                { last_name: { $regex: new RegExp(name), $options: "i" } },
            ],
        });
    }

    /* ================= FIND BY PHONE ================= */
    async findByPhone(phone) {
        return await this.Customers.findOne({ phone: phone });
    }

    /* ================= FIND BY ID ================= */
    async findById(id) {
        return await this.Customers.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(String(id)) : null,
        });
    }

    /* ================= UPDATE ================= */
    async update(id, payload) {
        const filter = {
            _id: ObjectId.isValid(id) ? new ObjectId(String(id)) : null,
        };

        const update = this.extractCustomerData(payload);

        // Nếu có password mới → hash tại đây
        if (update.password) {
            const salt = await bcrypt.genSalt(10);
            update.password = await bcrypt.hash(update.password, salt);
        }

        const result = await this.Customers.findOneAndUpdate(
            filter,
            { $set: update },
            { returnDocument: "after" }
        );

        return result.value;   // ⚠️ rất quan trọng
    }

    /* ================= DELETE ================= */
    async delete(id) {
        const result = await this.Customers.findOneAndDelete({
            _id: ObjectId.isValid(id) ? new ObjectId(String(id)) : null,
        });

        return result.value;
    }

    /* ================= DELETE ALL ================= */
    async deleteAll() {
        const result = await this.Customers.deleteMany({});
        return result.deletedCount;
    }
}

module.exports = CustomerService;
