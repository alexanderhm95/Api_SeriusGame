const TestTeacher = require("../models/testTeacher.model.js");
const Person = require("../models/person.model.js");
const Teacher = require("../models/teacher.model.js");
const Student = require("../models/student.model.js");
const Caso = require("../models/caso.model.js");
const Institution = require("../models/institution.model.js");

exports.findAll = async (req, res) => {
  try {
    const tests = await TestTeacher.aggregate([
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
          from: "teachers",
          localField: "casoData.teacher",
          foreignField: "_id",
          as: "teacherData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "teacherData.user",
          foreignField: "_id",
          as: "userTeacherData",
        },
      },
      {
        $lookup: {
          from: "people",
          localField: "userTeacherData.person",
          foreignField: "_id",
          as: "personTeacherData",
        },
      },
      {
        $project: {
          _id: 1, // Incluir el campo _id,
          scoreMax: 1, // Incluir el campo scoreMax
          score: 1, // Incluir el campo score
          diagnostic: 1, // Incluir el campo diagnostic
          status: 1, // Incluir el campo status
          "studentData.grade": 1, // Incluir el campo "student" de "casoData"
          "studentData.parallel": 1, // Incluir el campo "student" de "casoData"
          "personStudentData.CI": 1, // Incluir el campo "name" de "personStudentData"
          "personStudentData.name": 1, // Incluir el campo "name" de "personStudentData"
          "personStudentData.lastName": 1, // Incluir el campo "name" de "personStudentData"
          "personStudentData.age": 1, // Incluir el campo "name" de "personStudentData"
          "personStudentData.email": 1, // Incluir el campo "name" de "personStudentData"
          "personTeacherData.CI": 1, // Incluir el campo "name" de "personStudentData"
          "personTeacherData.name": 1, // Incluir el campo "name" de "personStudentData"
          "personTeacherData.lastName": 1, // Incluir el campo "name" de "personStudentData"
          "personTeacherData.email": 1, // Incluir el campo "name" de "personStudentData"
        },
      },
    ]);

    const listTests = await Promise.all(
      tests.map(async (test) => {
        const student = test.studentData[0];
        const personStudent = test.personStudentData[0];
        const personTeacher = test.personTeacherData[0];

        return {
          id: test._id,
          scoreMax: test.scoreMax,
          score: test.score,
          diagnostic: test.diagnostic,
          statusTestTeacher: test.status,
          ciStudent: personStudent.CI,
          nameStudent: personStudent.name,
          lastNameStudent: personStudent.lastName,
          emailStudent: personStudent.email,
          ageStudent: personStudent.age,
          gradeStudent: student.grade,
          parallelStudent: student.parallel,
          ciTeacher: personTeacher.CI,
          nameTeacher: personTeacher.name,
          lastNameTeacher: personTeacher.lastName,
          emailTeacher: personTeacher.email,
        };
      })
    );

    res
      .status(200)
      .send({ message: "Datos obtenidos correctamente", data: listTests });
  } catch (error) {
    res.status(400).send({ error: error + "Error finding testTeacher" });
  }
};

exports.getTestTeacher = async (req, res) => {
  try {
    const test = await TestTeacher.findById(req.params.id);

    res.status(200).send(test);
  } catch (error) {
    res.status(400).send({ error: error + "Error finding testTeacher" });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const testTeacher = await TestTeacher.deleteOne({ _id: req.params.id });
    console.log("Mostrar testTeacher", testTeacher);
    const caso = await Caso.findOne({ testTeacher: req.params.id });
    console.log("Mostrar caso", caso);
    caso.statusTestTeacher = "active";
    console.log("Mostrar caso editado ", caso);
    await caso.save();
    res.status(200).send(testTeacher);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error deleting testTeacher" });
  }
};
