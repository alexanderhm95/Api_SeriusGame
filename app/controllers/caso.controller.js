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
const { encrypt } = require("../utils/helpers/handle.password");

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
      gender,
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
        gender: gender,
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

      //encriptamos la contraseña
      const pass = generatorPass();
      const hashedPassword = await encrypt(pass);
      const subject = "SeriusGame - Nueva cuenta";
      const operation = 0;

      sendRecoveryCodeEmail(email, pass, subject, operation).then((result) => {
        if (result === true) {
          const message = `Código enviado exitosamente`;
          res.status(200).send({
            message,
          });
        } else {
          res.status(403).send({
            error: "Servicio no disponible, inténtelo más tarde",
          });
        }
      });
      const user = new User({
        person: personTeacher._id,
        password: hashedPassword,
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

    const testOld = await TestStudent.findOne({ caso: caso._id }).lean();
    if (testOld) {
      return res.status(400).send({ error: "El test ya ha sido ejecutado" });
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
        $lookup: {
          from: "teachers",
          localField: "teacher",
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
          as: "personaTeacherData",
        },
      },
      {
        $match: {
          $and: [
            { "personaData.CI": ciStudent },
            { "personaTeacherData.CI": ciTeacher },
          ],
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
    const { id } = req.params;

    const dece = await Dece.findOne({ user: id }).lean();

    const casos = await Caso.aggregate([
      {
        $match: { dece: dece._id },
      },
      {
        $lookup: {
          from: "teststudents",
          localField: "_id",
          foreignField: "caso",
          as: "testStudent",
        },
      },
      {
        $unwind: {
          path: "$testStudent",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "testteachers",
          localField: "_id",
          foreignField: "caso",
          as: "testTeacher",
        },
      },
      {
        $unwind: {
          path: "$testTeacher",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $lookup: {
          from: "people",
          localField: "student.person",
          foreignField: "_id",
          as: "student.person",
        },
      },
      {
        $unwind: "$student.person",
      },
      {
        $lookup: {
          from: "institutions",
          localField: "student.person.institution",
          foreignField: "_id",
          as: "student.person.institution",
        },
      },
      {
        $unwind: {
          path: "$student.person.institution",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "deces",
          localField: "dece",
          foreignField: "_id",
          as: "dece",
        },
      },
      {
        $unwind: "$dece",
      },
      {
        $lookup: {
          from: "users",
          localField: "dece.user",
          foreignField: "_id",
          as: "dece.user",
        },
      },
      {
        $unwind: "$dece.user",
      },
      {
        $lookup: {
          from: "people",
          localField: "dece.user.person",
          foreignField: "_id",
          as: "dece.user.person",
        },
      },
      {
        $unwind: "$dece.user.person",
      },
      {
        $lookup: {
          from: "institutions",
          localField: "dece.user.person.institution",
          foreignField: "_id",
          as: "dece.user.person.institution",
        },
      },
      {
        $unwind: {
          path: "$dece.user.person.institution",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "teachers",
          localField: "teacher",
          foreignField: "_id",
          as: "teacher",
        },
      },
      {
        $unwind: "$teacher",
      },
      {
        $lookup: {
          from: "users",
          localField: "teacher.user",
          foreignField: "_id",
          as: "teacher.user",
        },
      },
      {
        $unwind: "$teacher.user",
      },
      {
        $lookup: {
          from: "people",
          localField: "teacher.user.person",
          foreignField: "_id",
          as: "teacher.user.person",
        },
      },
      {
        $unwind: "$teacher.user.person",
      },
      {
        $lookup: {
          from: "institutions",
          localField: "teacher.user.person.institution",
          foreignField: "_id",
          as: "teacher.user.person.institution",
        },
      },
      {
        $unwind: {
          path: "$teacher.user.person.institution",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          results: [
            {
              $project: {
                _id: 1,
                dateStart: 1,
                ciStudent: "$student.person.CI",
                nameStudent: "$student.person.name",
                lastNameStudent: "$student.person.lastName",
                gender: "$student.person.gender",
                gradeStudent: "$student.grade",
                parallelStudent: "$student.parallel",
                nameInstitutionStudent:
                  "$student.person.institution.nameInstitution",
                ciDece: "$dece.user.person.CI",
                nameDece: "$dece.user.person.name",
                lastNameDece: "$dece.user.person.lastName",
                ciTeacher: "$teacher.user.person.CI",
                nameTeacher: "$teacher.user.person.name",
                lastNameTeacher: "$teacher.user.person.lastName",
                statusTestStudent: { $ifNull: ["$testStudent.status", false] },
                statusTestTeacher: { $ifNull: ["$testTeacher.status", false] },
              },
            },
          ],
        },
      },
    ]);

    console.log("Numero de casos: ", casos[0].results.length);

    const listaCasos = casos[0].results;

    res
      .status(200)
      .send({ message: "Datos extraídos correctamente", data: listaCasos });
    //return res.status(200).json({
    //  totalCount: casos[0].totalCount[0].count,
    //  listaCasos,
    //});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error al buscar los casos" });
  }
};

//Extrae todos los estudiantes que estan vinculados al docente por id
exports.getAllStudentsXTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const userTeacher = await User.findById(id).select("_id").lean().exec();

    if (!userTeacher) {
      return res.status(404).send({ message: "Docente no encontrado" });
    }

    const teacher = await Teacher.findOne({ user: userTeacher._id })
      .select("_id")
      .populate({
        path: "user",
        populate: {
          path: "person",
          select: "-_id CI name lastName phone email ",
        },
      })
      .lean()
      .exec();

    if (!teacher) {
      return res.status(404).send({ message: "Docente no encontrado" });
    }

    const casoIds = await Caso.find({ teacher: teacher._id })
      .select("_id")
      .lean()
      .exec();

    if (casoIds.length === 0) {
      return res.status(404).send({ message: "No hay casos asignados" });
    }

    const casoPromises = casoIds.map((caso) => {
      return Caso.findById(caso._id)
        .populate("student", "_id")
        .populate("teacher", "_id")
        .lean()
        .exec();
    });

    const casos = await Promise.all(casoPromises);

    const studentIds = casos.map((caso) => caso.student);

    const students = await Student.find({ _id: { $in: studentIds } })
      .select("_id")
      .populate({
        path: "person",
        select: "-_id CI name lastName phone email institution gender",
        populate: {
          path: "institution",
          select: "-_id nameInstitution",
        },
      })
      .lean()
      .exec();

    const listCaso = await Promise.all(
      casos.map(async (caso) => {
        const student = students.filter(
          (student) => String(student._id) === String(caso.student._id)
        )[0];

        const testTeacher = await TestTeacher.findOne({
          caso: caso._id,
        }).exec();

        return {
          id: caso._id || "no asignado",
          idStudent: student ? student._id : "no asignado",
          name: student?.person?.name || "no asignado",
          lastName: student?.person?.lastName || "no asignado",
          gender: student?.person?.gender || "no asignado",
          CI: student?.person?.CI || "no asignado",
          nameT: teacher?.user?.person?.name || "no asignado",
          lastNameT: teacher?.user?.person?.lastName || "no asignado",
          CIteacher: teacher?.user?.person?.CI || "no asignado",
          institution:
            student?.person?.institution?.nameInstitution || "no asignado",
          dateStart: caso.dateStart || "no asignado",
          statusTestTeacher: testTeacher ? testTeacher.status : false,
        };
      })
    );
    res.status(200).send({ message: "Datos extraidos", data: listCaso });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error retrieving caso" });
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
          select: "name lastName CI email gender",
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
      gender: caso.student?.person?.gender || "no asignado",
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
      scoreEvaluator: testStudent?.scoreEvaluator || null,

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
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const caso = await Caso.findById(req.params.id).session(session);

      if (caso) {
        const student = await Student.findById(caso.student).session(session);
        const testTeacherPromise = TestTeacher.findOneAndRemove({
          caso: caso._id,
        }).session(session);
        const testStudentPromise = TestStudent.findOneAndRemove({
          caso: caso._id,
        }).session(session);

        await Promise.all([testTeacherPromise, testStudentPromise]);

        if (student) {
          await Person.findByIdAndRemove(student.person).session(session);
          await Student.findByIdAndRemove(student._id).session(session);
        }

        await caso.remove();
      }
    });

    res.send({ message: "Caso deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error deleting caso" });
  } finally {
    session.endSession();
  }
};
