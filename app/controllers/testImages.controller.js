const TestImages = require("../models/testImages.model");
const { resolve } = require("path");
const fs = require("fs");
const { shuffle } = require("../utils/helpers/tools.js")

// Registro de preguntas para el test Imágenes
exports.create = async (req, res) => {
  let srcImageTmp = ""; 
  try {
    const { data } = req.body;
    const testImages = JSON.parse(data);
    const test = new TestImages({
      name: testImages.name,
      link: testImages.urlImage,
      value: testImages.value,
      section: testImages.section,
    });

    //Comprueba el numero de preguntas con esa sección
    const imageCountSection = await TestImages.countDocuments({ section: test.section });
    
    if(imageCountSection >= 3){
      console.log("Solo se permiten 3 imágenes")
      return res.status(400).send({ error: "Solo se permiten 3 imágenes por sección" });
    }
    srcImageTmp = test.link;
    await test.save();
    res.status(201).send({ message: "ok", test });
  } catch (error) {
    // si ocurre un error, se elimina la imagen subida
    const deleteFile = resolve(__dirname, "..", `../${srcImageTmp}`);

    fs.unlink(deleteFile, (err) => {
      if (err) {
        console.log("Error al eliminar archivo:", err);
      } else {
        console.log("Archivo eliminado:", deleteFile);
      }
    });

    console.log(error);
    res.status(400).send({ error: error + "Error al crear pregunta" });
  }
};


exports.findAllPaginated = async (req, res) => {
  try {
    const testImages = await TestImages.find().sort({ section: 1 });
    res.status(200).json({ message: "Preguntas del test docente recuperadas", data: testImages });
  } catch (error) {
    console.error("Error al cargar el test estudiante:", error);
    res.status(400).json({ error: "Error al cargar el test estudiante" });
  }
};

// Retrieve and return all testImages from the database.
exports.findAll = async (req, res) => {
  try {
    const testImages = await TestImages.find();
    const data = await shuffle(testImages) 
     res.status(200).send({ message: "ok", data});
  } catch (error) {
    console.log("Error al cargar el test estudiante",error)
    res.status(400).send({ error: "Error al cargar el test estudiante" });
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
    const {id} = req.params;
    const { data } = req.body;
    const testImagesOld = await TestImages.findById(id);

    const testImages = JSON.parse(data);
    const test = {
      name: testImages.name,
      link: testImages.urlImage,
      value: testImages.value,
      section: testImages.section,
    };
  const countSection = await TestImages.find({ _id: { $ne: id },section:test.section}).lean()
  console.log(countSection.length)
    
    if((countSection.length) >= 3){
    return res.status(400).send({ error: "Solo se permiten 3 imágenes por sección" });
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
          console.log("Error al eliminar archivo:", err);
        } else {
          console.log("Archivo eliminado:", deleteFile);
        }
      });
    }

    res.status(200).send(updatedTestImages);
  } catch (error) {
    const deleteFile = resolve(__dirname, "..", `../${srcImageTmp}`);

    fs.unlink(deleteFile, (err) => {
      if (err) {
        console.log("Error al eliminar archivo:", err);
      } else {
        console.log("Archivo eliminado:", deleteFile);
      }
    });

    console.log(error);
    res.status(400).send({ error: "Error al actualizar  Test Docente" });
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
          console.log("Archivo eliminado");
        });
      } else {
        console.log("Error al eliminar archivo");
      }
    });

    res
      .status(200)
      .send({ message: "Pregunta del Test Estudiante!", testImages });
  } catch (error) {
    res.status(400).send({ error: error + "Error al eliminar Test Student" });
  }
};


