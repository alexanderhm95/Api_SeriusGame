const TestTeacher = require("../models/testTeacher.model.js");
const TestQuestion = require("../models/testQuestion.model.js");
const Person = require("../models/person.model.js");
const Teacher = require("../models/teacher.model.js");
const Student = require("../models/student.model.js");
const Dece = require("../models/dece.model.js");
const Caso = require("../models/caso.model.js");
const User = require("../models/user.model.js");
const Institution = require("../models/institution.model.js");

exports.findAll = async (req, res) => {
  try {
    console.log(req.params);
    const { id } = req.params;

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
        path: "teacher",
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
          const teacher = test?.teacher?.user?.person;
          const testTeacher = await TestTeacher.findOne({ caso: test._id });
      
          // Si testTeacher es null, no lo incluimos en el resultado
          if (!testTeacher) {
            return null;
          }
      
          return {
            id: testTeacher._id ? testTeacher._id : null,
            scoreMax: testTeacher.scoreMax ? testTeacher.scoreMax : 0,
            score: testTeacher.score ? testTeacher.score : 0,
            statusTestTeacher: testTeacher?.status ? testTeacher.status : false,
            ciStudent: student.CI,
            nameStudent: student.name,
            lastNameStudent: student.lastName,
            ciTeacher: teacher?.CI ? teacher.CI : null,
            nameTeacher: teacher?.name ? teacher.name : null,
            lastNameTeacher: teacher?.lastName ? teacher.lastName : null,
            createAt: testTeacher?.createdAt ? testTeacher.createdAt : null,
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
    res.status(400).send({ error: error + "Error al encontrar testTeacher" });
  }
};

exports.getTestTeacher = async (req, res) => {
  try {
    const answers = await TestTeacher.findOne({caso: req.params.id});
    const test = answers.map(
      (answer) => {
        const select =  TestQuestion.findById(answer.refQuestion);
        return {
          name:select?.nameQuestion || null,
          value: answer.valueAnswer  || 0
        }
      }
    )

    res.status(200).send(test);
  } catch (error) {
    console.log(error)
    res.status(400).send({ error: error + "Error al encontrar testTeacher" });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const testTeacher = await TestTeacher.findByIdAndDelete(req.params.id);

    res.status(200).send({ message: "Test Teacher eliminado correctamente" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error al eliminar testTeacher" });
  }
};
