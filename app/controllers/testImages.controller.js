const TestImages = require("../models/testImages.model");
const { resolve } = require("path");
const fs = require("fs");
const path = require("path");
const { shuffle } = require("../utils/helpers/tools.js")

// Create and Save a new TestImages
exports.create = async (req, res) => {
  let srcImageTmp = ""; // Inicializar la variable srcImageTmp
  console.log(req.body);

  try {
    const { data } = req.body;
    const testImages = JSON.parse(data);
    const test = new TestImages({
      name: testImages.name,
      link: testImages.urlImage,
      value: testImages.value,
      section: testImages.section,
    });
    const countSection = await TestImages.find({section:test.section}).lean()
    
    if(countSection.length >= 3){
    return res.status(400).send({ error: "Solo se permiten 3 imagenes por sección" });
}
    srcImageTmp = test.link;
    await test.save();
    res.status(201).send({ message: "ok", test });
  } catch (error) {
    // si ocurre un error, se elimina la imagen subida
    const deleteFile = resolve(__dirname, "..", `../${srcImageTmp}`);

    fs.unlink(deleteFile, (err) => {
      if (err) {
        console.log("Error deleting file:", err);
      } else {
        console.log("File deleted:", deleteFile);
      }
    });

    console.log(error);
    res.status(400).send({ error: error + "Error creating TestImages" });
  }
};

exports.update = async (req, res) => {
    let srcImageNew  = ''; 
    let srcImageOld = ''; 
  try {
    const { data } = req.body;

    const testImagesOld = await TestImages.findById(req.params.id);

    const testImages = JSON.parse(data);

    const test = {
      name: testImages.name,
      link: testImages.urlImage,
      value: testImages.value,
      section: testImages.section,
    };

   const countSection = await TestImages.find({section:test.section}).lean()
    
    if((countSection.length-1) >= 3){
      return res.status(400).send({ error: "Solo se permiten 3 imagenes por sección" });
    }

    srcImageNew  = tes.link;
    srcImageOld = testImagesOld.link;
    
    testImagesOld.name=test.name;
    testImagesOld.link=test.link;
    testImagesOld.valuetest.value;
    testImagesOld.section=test.section;



    //const updatedTestImages = await TestImages.findByIdAndUpdate(
    //  req.params.id,
    //  test,
    //  { new: true }
    //);



    if (srcImageNew != srcImageOld) {
      // Eliminar la imagen anterior
      console.log("Entro a eliminar la imagen ",srcImageOld)
      const deleteFile = resolve(__dirname, "..", `../${srcImageOld}`);
      fs.unlink(deleteFile, (err) => {
        if (err) {
          console.log("Error deleting file:", err);
        } else {
          console.log("File deleted:", deleteFile);
        }
      });
    }

    await testImagesOld.save();

    res.status(200).send(updatedTestImages);
  } catch (error) {

    const deleteFile = resolve(__dirname, "..", `../${srcImageNew}`);

    fs.unlink(deleteFile, (err) => {
      if (err) {
        console.log("Error deleting file:", err);
      } else {
        console.log("File deleted:", deleteFile);
      }
    });

    console.log(error);
    res.status(400).send({ error: "Error updating TestImages" });
  }
};

const options = {
  defaultPage: 1,
  defaultLimit: 6,
};

exports.findAllPaginated = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const currentPage = page ? parseInt(page) : options.defaultPage;
    const pageSize = limit ? parseInt(limit) : options.defaultLimit;

    const testImages = await TestImages.paginate({}, { page: currentPage, limit: pageSize }); 
    const totalCount = await TestImages.countDocuments();

    res.status(200).json({ message: "ok", data: {testImages, totalCount} });
  } catch (error) {
    console.error("Error getting TestImages:", error);
    res.status(400).json({ error: "Error getting TestImages" });
  }
};

// Retrieve and return all testImages from the database.
exports.findAll = async (req, res) => {
  try {
    const testImages = await TestImages.find();
    const data = await shuffle(testImages) 
     res.status(200).send({ message: "ok", data});
  } catch (error) {
    res.status(400).send({ error: error + "Error getting TestImages" });
  }
};

// Find a single testImages with a testImagesId
exports.findOne = async (req, res) => {
  try {
    const testImages = await TestImages.findById(req.params.id);
    if (!testImages) {
      return res.status(400).send({ error: "TestImages not found" });
    }
    res.status(200).send(testImages);
  } catch (error) {
    res.status(400).send({ error: error + "Error getting TestImages" });
  }
};

exports.update = async (req, res) => {
    let srcImageTmp  = ''; 
    let srcImageTmp2 = ''; 
  try {
    const { data } = req.body;
    const testImagesOld = await TestImages.findById(req.params.id);

    const testImages = JSON.parse(data);
    const test = {
      name: testImages.name,
      link: testImages.urlImage,
      value: testImages.value,
      section: testImages.section,
    };
  const countSection = await TestImages.find({section:test.section}).lean()
    
    if((countSection.length-1) >= 3){
    return res.status(400).send({ error: "Solo se permiten 3 imagenes por sección" });
}
    const updatedTestImages = await TestImages.findByIdAndUpdate(
      req.params.id,
      test,
      { new: true }
    );

    srcImageTmp  = updatedTestImages.link;
    srcImageTmp2 = testImagesOld.link;



    if (srcImageTmp !== srcImageTmp2) {
      // Eliminar la imagen anterior
      const deleteFile = resolve(__dirname, "..", `../${srcImageTmp2}`);
      fs.unlink(deleteFile, (err) => {
        if (err) {
          console.log("Error deleting file:", err);
        } else {
          console.log("File deleted:", deleteFile);
        }
      });
    }

    res.status(200).send(updatedTestImages);
  } catch (error) {
    const deleteFile = resolve(__dirname, "..", `../${srcImageTmp}`);

    fs.unlink(deleteFile, (err) => {
      if (err) {
        console.log("Error deleting file:", err);
      } else {
        console.log("File deleted:", deleteFile);
      }
    });

    console.log(error);
    res.status(400).send({ error: "Error updating TestImages" });
  }
};

// Delete a testImages with the specified testImagesId in the request
exports.delete = async (req, res) => {
  try {
    const testImages = await TestImages.findByIdAndRemove(req.params.id);

    //se comprueba si la imagen existe para eliminarla
    const deleteFile = resolve(__dirname, "..", "..", testImages.link);

    fs.access(deleteFile, fs.constants.F_OK, (err) => {
      if (!err) {
        fs.unlink(deleteFile, (err) => {
          console.log("file was deleted");
        });
      } else {
        console.log("file does not exist");
      }
    });

    res
      .status(200)
      .send({ message: "TestImages deleted successfully!", testImages });
  } catch (error) {
    res.status(400).send({ error: error + "Error deleting TestImages" });
  }
};

// // Delete all testImages from the database.
exports.deleteAll = async (req, res) => {
  try {
    await TestImages.deleteMany({});
    res.status(200).send({ message: "All TestImages deleted successfully!" });
  } catch (error) {
    res.status(400).send({ error: error + "Error deleting TestImages" });
  }
};
