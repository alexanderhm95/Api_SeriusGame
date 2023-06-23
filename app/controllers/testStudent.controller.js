const TestStudent = require("../models/testStudent.model.js");
const Person = require("../models/person.model.js");
const Teacher = require("../models/teacher.model.js");
const Dece = require("../models/dece.model.js");
const Student = require("../models/student.model.js");
const Institution = require("../models/institution.model.js");
const Case = require("../models/caso.model.js");

exports.findAll = async (req, res) => {
  try {
    const listTest = await TestStudent.find()
      .populate({
        path: "dece",
        populate: {
          path: "person",
          select: "CI name lastName",
        },
      })
      .populate({
        path: "student",
        populate: {
          path: "person",
          select: "CI name lastName",
        },
      })
      .select("_id dece student score status createdAt")
      .lean();

      const listaTest = listTest.map((test) => ({
        _id: test._id,
        ciDece: test.dece?.person?.CI || "No asignado",
        nameDece: test.dece?.person?.name || "No asignado",
        lastNameDece: test.dece?.person?.lastName || "No asignado",
        ciStudent: test.student?.person?.CI || "No asignado",
        nameStudent: test.student?.person?.name || "No asignado",
        lastNameStudent: test.student?.person?.lastName || "No asignado",
        score: test.score,
        status: test.status,
        createdAt: test.createdAt,
      }));
  
      res.status(200).send(listaTest);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error finding testStudent" });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const testStudent = await TestStudent.deleteOne({ _id: req.params.id });
    const cases = await Case.findOne({ testStudent: req.params.id });
    cases.statusTestStudent = "active";
    await cases.save();
    res.status(200).send({ message: "TestStudent deleted" });
  } catch (error) {
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
