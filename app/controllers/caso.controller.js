const Caso = require("../models/caso.model.js");
const User = require("../models/user.model.js");
const Dece = require("../models/dece.model.js");
const Student = require("../models/student.model.js");
const Teacher = require("../models/teacher.model.js");
const Person = require("../models/person.model.js");
const TestStudent = require("../models/testStudent.model.js");
const TestTeacher = require("../models/testTeacher.model.js");
const TestQuestion = require("../models/testQuestion.model.js");
const TestImages = require("../models/testImages.model.js");
const Institution = require("../models/institution.model.js");

// Create and Save a new caso
exports.create = async (req, res) => {
  try {
    const { emailDece, CIteacher, CIstudent, nameInstitution } = req.body;

    const personDece = await Person.findOne({ email: emailDece });
    console.log(personDece);
    const dece = await Dece.findOne({ person: personDece });
    console.log(dece);
    if (!dece) {
      return res.status(400).send({ error: "Dece not found" });
    }
    //compotation de que exista el teacher
    const personTeacher = await Person.findOne({ CI: CIteacher });
    console.log(personTeacher);
    const teacher = await Teacher.findOne({ person: personTeacher._id });
    console.log(teacher);
    if (!teacher) {
      return res.status(400).send({ error: "Teacher not found" });
    }

    const personStudent = await Person.findOne({ CI: CIstudent });
    console.log(personStudent);
    const student = await Student.findOne({ person: personStudent._id });
    console.log(student);
    if (!student) {
      return res.status(400).send({ error: "Student not found" });
    }

    const institution = await Institution.findOne({ nameInstitution });
    console.log(institution);
    if (!institution) {
      return res.status(400).send({ error: "Institution not found" });
    }

    const caso = new Caso({
      teacher: teacher._id,
      student: student._id,
      institution: institution._id,
      dateStart: Date.now(),
    });
    console.log(caso);
    await caso.save();
    res.status(201).send({ message: "Caso created successfully!" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error creating Caso" });
  }
};

exports.testStudent = async (req, res) => {
  console.log(req.body);
  try {
    const { ciStudent, answers } = req.body;

    const caso = await Caso.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $lookup: {
          from: "people",
          localField: "studentData.person",
          foreignField: "_id",
          as: "personaData",
        },
      },
      {
        $match: {
          "personaData.CI": ciStudent,
        },
      },
    ]);

    // Verificar si el usuario existe
    if (casoSearch.length == 0) {
      return res
        .status(400)
        .send({ error: "Usuario no encontrado o borrado previamente" });
    }

    const questions = await TestImages.find({}, { value: 1 }); // Solo recuperar el campo "value" de TestImages
    const scoreMax = questions.reduce(
      (total, question) => total + question.value,
      0
    );
    const score = answers.reduce(
      (total, answer) => total + answer.valueAnswer,
      0
    );
    const percent = (score / scoreMax) * 100;

    // const questions = await TestImages.find();
    // for (let i = 0; i < questions.length; i++) {
    //   scoreMax += questions[i].value;
    // }
    //const score = answers.reduce((a, b) => a + b.valueAnswer, 0);
    //const percent = (score / scoreMax) * 100;

    let diagnostic;
    if (percent >= 70) {
      diagnostic =
        "El alumno presenta un riesgo GRAVE de haber sido víctima de violencia sexual";
    } else if (percent >= 40) {
      diagnostic =
        "El alumno presenta un riesgo MODERADO de haber sido victima de violencia sexual";
    } else {
      diagnostic =
        "El alumno presenta un riesgo LEVE de haber sido victima de violencia sexual";
    }

    await new TestStudent({
      caso: caso[0]._id,
      scoreMax,
      score: score,
      diagnostic: diagnostic,
      answers,
      status: false,
    });

    const response = {
      score,
      diagnostic,
    };

    res.status(201).send({ message: "ok", data: response });
  } catch (error) {
    res.status(400).send({ error: error + "Error creating Caso" });
  }
};

exports.testTeacher = async (req, res) => {
  console.log(req.body);
  try {
    const { ciStudent, ciTeacher, answers } = req.body;

    let diagnostic;
    let scoreMax = 0;

    const studentPerson = await Person.findOne({ CI: ciStudent });
    const student = await Student.findOne({ person: studentPerson._id });
    if (!student) {
      return res.status(400).send({ error: "Student not found" });
    }

    const teacherPerson = await Person.findOne({ CI: ciTeacher });
    const teacher = await Teacher.findOne({ person: teacherPerson._id });
    if (!teacher) {
      return res.status(400).send({ error: "Teacher not found" });
    }

    const institution = await Institution.findOne({ _id: teacher.institution });
    console.log(institution);
    if (!institution) {
      return res.status(400).send({ error: "Institution not found" });
    }

    const questions = await TestQuestion.find();
    for (let i = 0; i < questions.length; i++) {
      scoreMax +=
        questions[i].answer[questions[i].answer.length - 1].valueAnswer;
    }

    const score = answers.reduce((a, b) => a + b.valueAnswer, 0);
    const percent = (score / scoreMax) * 100;
    console.log(percent);
    if (percent >= 70) {
      diagnostic =
        "El alumno presenta un riesgo GRAVE de haber sido víctima de violencia sexual";
    } else if (percent >= 40) {
      diagnostic =
        "El alumno presenta un riesgo MODERADO de haber sido victima de violencia sexual";
    } else {
      diagnostic =
        "El alumno presenta un riesgo LEVE de haber sido victima de violencia sexual";
    }
    const testTeacher = new TestTeacher({
      teacher: teacher._id,
      student: student._id,
      scoreMax,
      answers,
      status: "inactive",
      score: score,
      diagnostic: diagnostic,
    });
    console.log(testTeacher);
    const test = await testTeacher.save();
    Caso.findOne({ student: student._id })
      .then((caso) => {
        caso.testTeacher = test._id;
        caso.statusTestTeacher = "inactive";

        return caso.save();
      })
      .then(() => {
        res
          .status(201)
          .send({ message: "TestTeacher created successfully!", testTeacher });
      })
      .catch((error) => {
        console.log(error);
        res.status(400).send({ error: error + "Error creating Caso" });
      });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error creating Caso" });
  }
};

//Se lista todos los casos para el DECE
exports.findAll = async (req, res) => {
  try {
    const casos = await Caso.find()
      .populate({
        path: "student",
        select: "-_id grade parallel",
        populate: {
          path: "person",
          select: "-_id name lastName CI email",
          populate: {
            path: "institution",
            select: "-_id nameInstitution",
          },
        },
      })
      .populate({
        path: "dece",
        select: "-_id",
        populate: {
          path: "user",
          select: "-_id role ",
          populate: {
            path: "person",
            select: "-_id name lastName CI email",
            populate: {
              path: "institution",
              select: "-_id nameInstitution",
            },
          },
        },
      })
      .populate({
        path: "teacher",
        select: "-_id ",
        populate: {
          path: "user",
          select: "-_id role ",
          populate: {
            path: "person",
            select: "-_id name lastName CI email",
            populate: {
              path: "institution",
              select: "-_id nameInstitution",
            },
          },
        },
      })
      .lean();

    const listaCasos = await Promise.all(
      casos.map(async (caso) => {
        const student = caso.student;
        const dece = caso.dece;
        const teacher = caso.teacher;
        const testStudent = await TestStudent.findById(caso._id);
        const testTeacher = await TestTeacher.findById(caso._id);
        console.log(dece.user?.person);
        return {
          id: caso._id,
          dateStart: caso ? caso.dateStart : null,
          ciStudent: student.person ? student.person.CI : "no asignado",
          nameStudent: student.person ? student.person.name : "no asignado",
          lastNameStudent: student.person
            ? student.person.lastName
            : "no asignado",
          nameInstitutionStudent:
            student.person && student.person.institution
              ? student.person.institution.nameInstitution
              : "no asignado",

          ciTeacher: teacher.user?.person
            ? teacher.user?.person.CI
            : "no asignado",
          nameTeacher: teacher.user?.person
            ? teacher.user?.person.name
            : "no asignado",
          lastNameTeacher: teacher.user?.person
            ? teacher.user?.person.lastName
            : "no asignado",
          emailTeacher: teacher.user?.person
            ? teacher.user?.person.email
            : "no asignado",

          ciDece: dece.user?.person ? dece.user?.person.CI : "no asignado",
          namDece: dece.user?.person ? dece.user?.person.name : "no asignado",
          lastNameDece: dece.user?.person
            ? dece.user?.person.lastName
            : "no asignado",
          emailDece: dece.user?.person
            ? dece.user?.person.email
            : "no asignado",
          statusTestStudent: testStudent ? testStudent.status : false,
          statusTestTeacher: testTeacher ? testTeacher.status : false,
        };
      })
    );

    res.send({ message: "Datos extraidos correctamente", data: listaCasos });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error retrieving caso" });
  }
};

//Extrae todos los estudiantes que estan vinculados al docente por id
exports.getAllStudentsXTeacher = async (req, res) => {
  console.log("llego el id", req.params.id);
  try {
    const { id } = req.params;
    let listCaso = [];
    const docente = await Teacher.findOne({ user: id });
    const caso = await Caso.find({ teacher: docente._id });
    for (let i = 0; i < caso.length; i++) {
      const caso = caso[i];
      const student = await Student.findById(caso.student);
      const person = await Person.findById(student.person);
      console.log("persona ", person.CI, " student:", student._id);
      const teacher = await Teacher.findById(caso.teacher);
      const personTeacher = await Person.findById(teacher.person);
      console.log("persona ", personTeacher.CI, " teacher:", teacher._id);
      const institution = await Institution.findById(caso.institution);

      listCaso.push({
        id: caso ? caso._id : "no asignado",
        idStudent: student ? student._id : "no asignado",
        name: person ? person.name : "no asignado",
        lastName: person ? person.lastName : "no asignado",
        CI: person ? person.CI : "no asignado",
        nameT: personTeacher ? personTeacher.name : "no asignado",
        lastNameT: personTeacher ? personTeacher.lastName : "no asignado",
        CIteacher: personTeacher ? personTeacher.CI : "no asignado",
        institution: institution ? institution.nameInstitution : "no asignado",
        dateStart: caso.dateStart ? caso.dateStart : "no asignado",
        statusTestTeacher: caso ? caso.statusTestTeacher : "no asignado",
      });
    }
    res.send(listCaso);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error + "Error retrieving caso" });
  }
};

exports.getCaso = async (req, res) => {
  try {
    const caso = await Caso.findById(req.params.id);
    res.status(200).send(caso);
  } catch (error) {
    res.status(500).send({ error: error + "Error retrieving Caso" });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    await Caso.deleteMany();
    res.send({ message: "caso deleted successfully!" });
  } catch (error) {
    res.status(500).send({ error: error + "Error deleting caso" });
  }
};

exports.delete = async (req, res) => {
  try {
    const caso = await Caso.findByIdAndRemove(req.params.id);
    console.log("Caso eliminado: ", caso ? caso._id : "no asignado");
    const testStudent = await TestStudent.findByIdAndRemove(caso.testStudent);
    console.log(
      "TestStudent eliminado: ",
      testStudent ? testStudent._id : "no asignado"
    );
    const testTeacher = await TestTeacher.findByIdAndRemove(caso.testTeacher);
    console.log(
      "TestTeacher eliminado: ",
      testTeacher ? testTeacher._id : "no asignado"
    );
    const student = await Student.findByIdAndRemove(caso.student);
    console.log("Student eliminado: ", student ? student._id : "no asignado");
    const person = await Person.findByIdAndRemove(student.person);
    console.log("Person eliminado: ", person ? person._id : "no asignado");
    res.send({ message: "Caso deleted successfully!" });
  } catch (error) {
    res.status(500).send({ error: error + "Error deleting Caso" });
  }
};
