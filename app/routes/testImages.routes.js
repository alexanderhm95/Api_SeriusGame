const express = require("express");
const router = express.Router();
const { upload } = require("../utils/helpers/multer.helper");
const testImagesController = require("../controllers/testImages.controller");
const checkAuth = require("../utils/validators/authCheck")
const { cacheInit } = require("../utils/helpers/handle.cache")

router.post("/",          checkAuth(['ADMIN','DECE']),  upload.single("singleFile"), testImagesController.create);
router.get("/",           checkAuth(['ADMIN','DECE']),  cacheInit, testImagesController.findAll);
router.get("/paginated",  checkAuth(['ADMIN','DECE']),  cacheInit, testImagesController.findAllPaginated);
router.get("/:id",        checkAuth(['ADMIN','DECE']),  testImagesController.findOne);
router.put("/:id",        checkAuth(['ADMIN','DECE']),  upload.single("singleFile"), testImagesController.update);
router.delete("/:id",     checkAuth(['ADMIN','DECE']),  testImagesController.delete);
router.delete("/",        checkAuth(['ADMIN','DECE']),  testImagesController.deleteAll);

module.exports = router;
