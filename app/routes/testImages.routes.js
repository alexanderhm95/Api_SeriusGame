const express = require("express");
const router = express.Router();
const { upload } = require("../utils/helpers/multer.helper");
const testImagesController = require("../controllers/testImages.controller");

router.post("/", upload.single("singleFile"), testImagesController.create);
router.get("/", testImagesController.findAll);
router.get("/paginated", testImagesController.findAllPaginated);
router.get("/:id", testImagesController.findOne);
router.put("/:id", upload.single("singleFile"), testImagesController.update);
router.delete("/:id", testImagesController.delete);
router.delete("/", testImagesController.deleteAll);

module.exports = router;
