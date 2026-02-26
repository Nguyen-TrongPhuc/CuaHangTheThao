const db = require("../config");

class Contact {
    constructor(contact) {
        this.name = contact.name;
        this.email = contact.email;
        this.phone = contact.phone;
        this.subject = contact.subject;
        this.message = contact.message;
        this.status = contact.status || "unread";
        this.created_at = contact.created_at || new Date();
        this.replied_at = contact.replied_at;
        this.reply_message = contact.reply_message;
    }

    static create(contact, result) {
        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO contacts (name, email, phone, subject, message, status, created_at, replied_at, reply_message)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    contact.name,
                    contact.email,
                    contact.phone,
                    contact.subject,
                    contact.message,
                    contact.status,
                    contact.created_at,
                    contact.replied_at,
                    contact.reply_message
                ],
                (err, res) => {
                    if (err) {
                        console.log("Lỗi: ", err);
                        reject(err);
                        return;
                    }
                    resolve({ id: res.insertId, ...contact });
                }
            );
        });
    }

    static findAll(result) {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM contacts ORDER BY created_at DESC",
                (err, res) => {
                    if (err) {
                        console.log("Lỗi: ", err);
                        reject(err);
                        return;
                    }
                    resolve(res || []);
                }
            );
        });
    }

    static findById(id, result) {
        return new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM contacts WHERE id = ?",
                [id],
                (err, res) => {
                    if (err) {
                        console.log("Lỗi: ", err);
                        reject(err);
                        return;
                    }

                    if (res.length) {
                        resolve(res[0]);
                        return;
                    }

                    reject({ kind: "not_found" });
                }
            );
        });
    }

    static update(id, contact, result) {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE contacts SET 
                 name = ?, email = ?, phone = ?, subject = ?, message = ?, 
                 status = ?, replied_at = ?, reply_message = ?
                 WHERE id = ?`,
                [
                    contact.name,
                    contact.email,
                    contact.phone,
                    contact.subject,
                    contact.message,
                    contact.status,
                    contact.replied_at,
                    contact.reply_message,
                    id
                ],
                (err, res) => {
                    if (err) {
                        console.log("Lỗi: ", err);
                        reject(err);
                        return;
                    }

                    if (res.affectedRows == 0) {
                        reject({ kind: "not_found" });
                        return;
                    }

                    resolve({ id: id, ...contact });
                }
            );
        });
    }

    static delete(id, result) {
        return new Promise((resolve, reject) => {
            db.query("DELETE FROM contacts WHERE id = ?", [id], (err, res) => {
                if (err) {
                    console.log("Lỗi: ", err);
                    reject(err);
                    return;
                }

                if (res.affectedRows == 0) {
                    reject({ kind: "not_found" });
                    return;
                }

                resolve(res);
            });
        });
    }

    static deleteAll(result) {
        return new Promise((resolve, reject) => {
            db.query("DELETE FROM contacts", (err, res) => {
                if (err) {
                    console.log("Lỗi: ", err);
                    reject(err);
                    return;
                }

                resolve(res);
            });
        });
    }
}

module.exports = Contact;
