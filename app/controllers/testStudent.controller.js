const TestStudent = require("../models/testStudent.model.js");
const Person = require("../models/person.model.js");
const Teacher = require("../models/teacher.model.js");
const Dece = require("../models/dece.model.js");
const Student = require("../models/student.model.js");
const Institution = require("../models/institution.model.js");
const Case = require("../models/caso.model.js");

exports.findAll = async (req, res) => {
  try {
    const tests = await TestStudent.aggregate([
      {
        $lookup: {
          from: "casos",
          localField: "caso",
          foreignField: "_id",
          as: "casoData",
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "casoData.student",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $lookup: {
          from: "people",
          localField: "studentData.person",
          foreignField: "_id",
          as: "personStudentData",
        },
      },
      {
        $lookup: {
          from: "deces",
          localField: "casoData.dece",
          foreignField: "_id",
          as: "deceData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "deceData.user",
          foreignField: "_id",
          as: "userDeceData",
        },
      },
      {
        $lookup: {
          from: "people",
          localField: "userDeceData.person",
          foreignField: "_id",
          as: "personDeceData",
        },
      },
      {
        $project: {
          _id: 1, // Incluir el campo _id,
          scoreMax: 1, // Incluir el campo scoreMax
          score: 1, // Incluir el campo score
          scoreEvaluator: 1,
          diagnostic: 1, // Incluir el campo diagnostic
          status: 1, // Incluir el campo status
          createdAt: 1, //Incluir fechas de creacion
          "studentData.grade": 1, // Incluir el campo "student" de "casoData"
          "studentData.parallel": 1, // Incluir el campo "student" de "casoData"
          "personStudentData.CI": 1, // Incluir el campo "name" de "personStudentData"
          "personStudentData.name": 1, // Incluir el campo "name" de "personStudentData"
          "personStudentData.lastName": 1, // Incluir el campo "name" de "personStudentData"
          "personStudentData.age": 1, // Incluir el campo "name" de "personStudentData"
          "personStudentData.email": 1, // Incluir el campo "name" de "personStudentData"
          "personDeceData.CI": 1, // Incluir el campo "name" de "personStudentData"
          "personDeceData.name": 1, // Incluir el campo "name" de "personStudentData"
          "personDeceData.lastName": 1, // Incluir el campo "name" de "personStudentData"
          "personDeceData.email": 1, // Incluir el campo "name" de "personStudentData"
        },
      },
    ]);
    console.log(tests);

    const listTests = await Promise.all(
      tests.map(async (test) => {
        const student = test.studentData[0];
        const personStudent = test.personStudentData[0];
        const personDece = test.personDeceData[0];

        return {
          id: test._id,
          scoreMax: test.scoreMax,
          score: test.score,
          scoreEvaluator: test.scoreEvaluator,
          diagnostic: test.diagnostic,
          statusTestStudent: test.status ? test.status : false,
          dateAplication: test.createdAt,
          ciStudent: personStudent.CI,
          nameStudent: personStudent.name,
          lastNameStudent: personStudent.lastName,
          emailStudent: personStudent.email,
          ageStudent: personStudent.age,
          gradeStudent: student.grade,
          parallelStudent: student.parallel,
          ciDece: personDece.CI,
          nameDece: personDece.name,
          lastNameDece: personDece.lastName,
          emailDece: personDece.email,
          createAt: test.createdAt,
        };
      })
    );

    res
      .status(200)
      .send({ message: "Datos obtenidos correctamente", data: listTests });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error finding testStudent" });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const testStudent = await TestStudent.findByIdAndDelete(req.params.id);

    res.status(200).send({ message: "Test Student eliminado correctamente" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error deleting testStudent" });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    const testStudent = await TestStudent.deleteMany();
    res.status(200).send(testStudent);
  } catch (error) {
    res.status(400).send({ error: error + "Error deleting testStudent" });
  }
};

exports.getTestStudent = async (req, res) => {
  try {
    console.log("llegue.. al test student");
    const test = await TestStudent.findById(req.params.id);
    res.status(200).send(test);
  } catch (error) {
    res.status(400).send({ error: error + "Error finding testStudent" });
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
