const TestStudent = require("../models/testStudent.model.js");
const Person = require("../models/person.model.js");
const Teacher = require("../models/teacher.model.js");
const Student = require("../models/student.model.js");
const Dece = require("../models/dece.model.js");
const Caso = require("../models/caso.model.js");
const User = require("../models/user.model.js");
const Institution = require("../models/institution.model.js");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");

const {
  obtenerDatosInforme,
  generarContenidoInforme,
} = require("../utils/helpers/reportStudent.js");

exports.findAll = async (req, res) => {
  try {
    console.log(req.params)
    const {id} = req.params;

  // Realizar múltiples consultas en paralelo para mejorar el rendimiento
    const [user, dece] = await Promise.all([
      User.findById(id),
      Dece.findOne({ user: id }),
    ]);

  const casos = await Caso.find({ dece })
      .populate({
        path: "student",
        populate: {
          path: "person",
          select: "CI name lastName",
        },
      })
      .populate({
        path: "dece",
        populate: {
          path: "user",
          populate: {
            path: "person",
            select: "CI name lastName",
          },
        },
      }).lean();

    const listTests = await Promise.all(
      casos.map(async (test) => {
        const student = test?.student?.person;
        const dece = test?.dece?.user?.person;
        const testStudent = await TestStudent.findOne({ caso: test._id });
        if (!testStudent) {
          return null;
        }
       return {
            id: testStudent._id ? testStudent._id : null,
            scoreMax: testStudent.scoreMax ? testStudent.scoreMax : 0,
            score: testStudent.score ? testStudent.score : 0,
            statusTestStudent: testStudent.status ? testStudent.status : false,
            scoreEvaluator:testStudent.scoreEvaluator ? testStudent.scoreEvaluator : 0,
            ciStudent: student.CI,
            nameStudent: student.name,
            lastNameStudent: student.lastName,
            ciDece: dece.CI,
            nameDece: dece.name,
            lastNameDece: dece.lastName,
            createAt: testStudent.createdAt ? testStudent.createdAt : null,
          };
      })
    );


      // Filtrar cualquier objeto nulo que haya quedado en el array
      const filteredListTests = listTests.filter((test) => test !== null);

    res
      .status(200)
      .send({ message: "Datos obtenidos correctamente", data: filteredListTests });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error obtener el testStudent" });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const testStudent = await TestStudent.findByIdAndDelete(req.params.id);

    res.status(200).send({ message: "Test Student eliminado correctamente" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error al eliminar testStudent" });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    const testStudent = await TestStudent.deleteMany();
    res.status(200).send(testStudent);
  } catch (error) {
    res.status(400).send({ error: error + "Error al eliminar testStudent" });
  }
};

exports.getTestStudentReport = async (req, res) => {
  try {
    // Obtener los datos necesarios para el informe desde tu base de datos
    const casoData = await obtenerDatosInforme(req.params.id);

    // Generar el contenido del informe
    const docDefinition = await generarContenidoInforme(casoData);

    // Crear el documento PDF
    const printer = new PdfPrinter({
      Roboto: {
        normal: __dirname + "/fonts/Roboto-Regular.ttf",
        bold: __dirname + "/fonts/Roboto-Bold.ttf",
        italics: __dirname + "/fonts/Roboto-Italic.ttf",
        bolditalics: __dirname + "/fonts/Roboto-BoldItalic.ttf",
      },
    });

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const directory = "./temp";
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }

    const filePath = path.join(__dirname, "../../temp/informe.pdf");

    // Descargar el informe en la respuesta
    pdfDoc.pipe(fs.createWriteStream(filePath)).on("finish", () => {
      res.download(filePath, "informe.pdf", (error) => {
        // Eliminar el archivo temporal después de descargarlo
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error al eliminar el archivo temporal", err);
          }
        });

        if (error) {
          console.error("Error al descargar el informe", error);
        }
      });
    });

    pdfDoc.end();
    
  } catch (error) {
    console.error("Error al generar el informe", error);
    res.status(500).send({ error: "Error al generar el informe" });
  }
};

exports.getTestStudent = async (req, res) => {
  try {
    const test = await TestStudent.findOne({ caso: req.params.id });
    res.status(200).send(test);
  } catch (error) {
    res.status(400).send({ error: error + "Error al encontrar testStudent" });
  }
};

exports.scoreUpdate = async (req, res) => {
  console.log(req.body);
  try {
    const { scoreEvaluator } = req.body;
    const testStudent = await TestStudent.findById(req.params.id);

    if (!testStudent) {
      return res
        .status(400)
        .send({ error: "El test no se encuentra registrado" });
    }

    if (
      (scoreEvaluator && testStudent.scoreEvaluator === 1) ||
      (!scoreEvaluator && testStudent.scoreEvaluator === 0)
    ) {
      return res
        .status(400)
        .send({ error: "No se permite modificar la puntuación del test." });
    }

    const scoreChange = scoreEvaluator ? 1 : -1;

    testStudent.score += scoreChange;
    testStudent.scoreEvaluator = scoreEvaluator ? 1 : 0;

    if (testStudent.score < 0 || testStudent.score > testStudent.scoreMax) {
      return res
        .status(400)
        .send({ error: "Error al cambiar la puntuación del test" });
    }

    const percent = (testStudent.score / testStudent.scoreMax) * 100;

    let diagnosticUpdate;
    if (percent >= 70) {
      diagnosticUpdate =
        "El alumno presenta un riesgo GRAVE de haber sido víctima de violencia sexual";
    } else if (percent >= 40) {
      diagnosticUpdate =
        "El alumno presenta un riesgo MODERADO de haber sido víctima de violencia sexual";
    } else {
      diagnosticUpdate =
        "El alumno presenta un riesgo LEVE de haber sido víctima de violencia sexual";
    }

    testStudent.diagnostic = diagnosticUpdate;
    await testStudent.save();

    res.status(200).send({ message: "Test Teacher actualizado correctamente" });
  } catch (error) {
    res.status(400).send({ error: "Error updating testTeacher: " + error });
  }
};
