const express = require("express");
const uploadController = require("../controllers/upload.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * Upload ảnh (chỉ nhân viên / admin được phép)
 * POST /api/upload
 * form-data: image
 */
router.route("/")
    .post(
        [auth.verifyToken, auth.isEmployeeOrAdmin],
        uploadController.uploader,
        uploadController.uploadImage
    );

module.exports = router;
