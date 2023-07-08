const express = require("express");
const router = express.Router();
const { upload } = require("../utils/helpers/multer.helper");
const testImagesController = require("../controllers/testImages.controller");
const checkAuth = require("../utils/validators/authCheck")


router.post("/",          checkAuth,  upload.single("singleFile"), testImagesController.create);
router.get("/",           checkAuth,  testImagesController.findAll);
router.get("/paginated",  checkAuth,  testImagesController.findAllPaginated);
router.get("/:id",        checkAuth,  testImagesController.findOne);
router.put("/:id",        checkAuth,  upload.single("singleFile"), testImagesController.update);
router.delete("/:id",     checkAuth,  testImagesController.delete);
router.delete("/",        checkAuth,  testImagesController.deleteAll);

module.exports = router;
