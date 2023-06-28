const mongoose = require("mongoose");

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

// Create and Save a new caso    Listo el create 
exports.create = async (req, res) => {
  console.log(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      ciStudent,
      nameStudent,
      lastNameStudent,
      ageStudent,
      addressStudent,
      phoneStudent,
      emailStudent,
      gradeStudent,
      parallelStudent,
      ciTeacher,
      nameTeacher,
      lastNameTeacher,
      addressTeacher,
      phoneTeacher,
      emailTeacher,
      nameInstitution,
      idDece,
    } = req.body;

    const institution = await Institution.findOne({ nameInstitution }).session(
      session
    );

    if (!institution) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "Institución no registrada" });
    }


    let student;
    let personStudent = await Student.findOne({ CI: ciStudent }).session(
      session
    );
    if (personStudent) {
      student = await Student.findOne({ person: personStudent._id }).session(
        session
      );
    }
   

    if (!student) {
      const person = new Person({
        name: nameStudent,
        lastName: lastNameStudent,
        age: ageStudent,
        address: addressStudent,
        phone: phoneStudent,
        email: emailStudent,
        CI: ciStudent,
        institution: institution._id,
      });

      student = new Student({
        person: person._id,
        grade: gradeStudent,
        parallel: parallelStudent,
      });

      await person.save({ session });
      await student.save({ session });
    }

    let teacher;
    let personTeac = await Person.findOne({ CI: ciTeacher }).session(session);
  
    if (personTeac) {
      let userTeac = await User.findOne({ person: personTeac }).session(
        session
      );
      if (userTeac) {
        teacher = await Teacher.findOne({ user: userTeac }).session(session);
  
      }
    }

   

    if (!teacher) {
      const personTeacher = new Person({
        name: nameTeacher,
        lastName: lastNameTeacher,
        address: addressTeacher,
        phone: phoneTeacher,
        email: emailTeacher,
        CI: ciTeacher,
        institution: institution._id,
      });

      const user = new User({
        person: personTeacher._id,
        password: ciTeacher,
        role: "TEACHER",
      });

      teacher = new Teacher({
        user: user._id,
      });

      await personTeacher.save({ session });
      await user.save({ session });
      await teacher.save({ session });
    }

    const dece = await Dece.findOne({ user: idDece }).session(session);

    const caso = await new Caso({
      dece: dece._id,
      teacher: teacher._id,
      student: student._id,
      dateStart: Date.now(),
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).send({ message: "Caso created successfully!" });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: "Error creating Caso" });
  }
};

exports.testStudent = async (req, res) => {
  console.log(req.body);
  try {
    const { CIstudent, answers } = req.body;

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
          "personaData.CI": CIstudent,
        },
      },
    ]);

    // Verificar si el usuario existe
    if (caso.length == 0) {
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
      status: true,
    }).save();

    const response = {
      score,
      diagnostic,
    };

    res.status(201).send({ message: "ok", data: response });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error creating Caso" });
  }
};

exports.testTeacher = async (req, res) => {
  console.log(req.body);
  try {
    const { ciStudent, ciTeacher, answers } = req.body;

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
    if (caso.length == 0) {
      return res
        .status(400)
        .send({ error: "Usuario no encontrado o borrado previamente" });
    }

    const questions = await TestQuestion.find();
    const scoreMax = questions.reduce(
      (sum, question) =>
        sum + question.answer[question.answer.length - 1].valueAnswer,
      0
    );
    const score = answers.reduce(
      (total, answer) => total + answer.valueAnswer,
      0
    );
    const percent = (score / scoreMax) * 100;

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
    await new TestTeacher({
      caso: caso[0]._id,
      scoreMax,
      score: score,
      answers,
      status: false,
      diagnostic: diagnostic,
    }).save();

    res.status(201).send({ message: "TestTeacher created successfully!" });
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
        const testStudent = await TestStudent.findOne({ caso: caso._id });
        const testTeacher = await TestTeacher.findOne({ caso: caso._id });

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
          grade: student ? student.grade : "no asignado",

          parrallel: student ? student.parallel : "no asignado",

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
  const { id } = req.params;

  try {
    const caso = await Caso.findById(id)
      .populate({
        path: "student",
        select: "grade parallel",
        populate: {
          path: "person",
          select: "name lastName CI email",
          populate: {
            path: "institution",
            select: "nameInstitution",
          },
        },
      })
      .populate({
        path: "dece",
        select: "",
        populate: {
          path: "user",
          select: "role",
          populate: {
            path: "person",
            select: "name lastName CI email",
          },
        },
      })
      .populate({
        path: "teacher",
        select: "",
        populate: {
          path: "user",
          select: "role",
          populate: {
            path: "person",
            select: "name lastName CI email",
          },
        },
      })
      .lean();

    if (!caso) {
      return res.status(404).send({ error: "Caso no encontrado" });
    }

    const [testStudent, testTeacher] = await Promise.all([
      TestStudent.findOne({ caso: caso._id }),
      TestTeacher.findOne({ caso: caso._id }),
    ]);

    const casoData = {
      id: caso._id,
      dateStart: caso.dateStart || null,
      ciStudent: caso.student?.person?.CI || "no asignado",
      nameStudent: caso.student?.person?.name || "no asignado",
      lastNameStudent: caso.student?.person?.lastName || "no asignado",
      nameInstitutionStudent:
        caso.student?.person?.institution?.nameInstitution || "no asignado",
      grade: caso.student?.grade || "no asignado",
      parallel: caso.student?.parallel || "no asignado",
      ciTeacher: caso.teacher?.user?.person?.CI || "no asignado",
      nameTeacher: caso.teacher?.user?.person?.name || "no asignado",
      lastNameTeacher: caso.teacher?.user?.person?.lastName || "no asignado",
      emailTeacher: caso.teacher?.user?.person?.email || "no asignado",
      ciDece: caso.dece?.user?.person?.CI || "no asignado",
      nameDece: caso.dece?.user?.person?.name || "no asignado",
      lastNameDece: caso.dece?.user?.person?.lastName || "no asignado",
      emailDece: caso.dece?.user?.person?.email || "no asignado",

      statusTestStudent: testStudent?.status || false,
      diagnosticStudent: testStudent?.diagnostic || "no asignado",
      scoreMaxStudent: testStudent?.scoreMax || null,
      scoreStudent: testStudent?.score || null,

      statusTestTeacher: testTeacher?.status || false,
      diagnosticTeacher: testTeacher?.diagnostic || "no asignado",
      scoreMaxTeacher: testTeacher?.scoreMax || null,
      scoreTeacher: testTeacher?.score || null,
    };

    res.send({ message: "Caso encontrado", data: casoData });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error al buscar el caso" });
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
