const express = require("express");
const upload = require("../controllers/upload.controller");
const router = express.Router();

router.post("/", upload.uploader, upload.uploadImage);

module.exports = router;