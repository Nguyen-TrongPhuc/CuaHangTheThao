const { ObjectId } = require("mongodb");

class ContactService {
    constructor(client) {
        this.Contacts = client.db().collection("contacts");
    }

    async create(payload) {
        const contact = {
            name: payload.name,
            email: payload.email,
            phone: payload.phone || null,
            subject: payload.subject,
            message: payload.message,
            status: "unread", // unread, read, replied
            created_at: new Date(),
            replied_at: null,
            reply_message: null
        };
        const result = await this.Contacts.insertOne(contact);
        return { _id: result.insertedId, ...contact };
    }

    async findAll() {
        const cursor = await this.Contacts.find({}).sort({ created_at: -1 });
        return cursor.toArray();
    }

    async findById(id) {
        return await this.Contacts.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
    }

    async update(id, payload) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const update = { $set: { ...payload, updated_at: new Date() } };
        const result = await this.Contacts.findOneAndUpdate(filter, update, { returnDocument: "after" });
        return result.value;
    }

    async delete(id) {
        const result = await this.Contacts.findOneAndDelete({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        });
        return result.value;
    }

    async deleteAll() {
        const result = await this.Contacts.deleteMany({});
        return result;
    }

    async markAsRead(id) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const update = { $set: { status: "read", read_at: new Date() } };
        const result = await this.Contacts.findOneAndUpdate(filter, update, { returnDocument: "after" });
        return result.value;
    }

    async reply(id, replyMessage) {
        const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
        const update = { 
            $set: { 
                status: "replied", 
                reply_message: replyMessage, 
                replied_at: new Date() 
            } 
        };
        const result = await this.Contacts.findOneAndUpdate(filter, update, { returnDocument: "after" });
        return result.value;
    }
}

module.exports = ContactService;
