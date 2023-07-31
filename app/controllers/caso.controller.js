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
const { validateIDCard } = require("../utils/helpers/tools.js");

// Create and Save a new caso    Listo el create
exports.create = async (req, res) => {
  console.log(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    //Ingreso de datos
    const {
      ciStudent,
      nameStudent,
      lastNameStudent,
      gender,
      ageStudent,
      addressStudent,
      phoneStudent,
      gradeStudent,
      parallelStudent,
      ciTeacher, //Docente para el caso
      idDece, //Dece para el caso
      nameInstitution, //institución para el docente
    } = req.body;

    //Comprueba la cédula
    const validateCard = await validateIDCard(ciStudent);

    //Si la cédula es invalida este emitirá un mensaje de error
    if (!validateCard) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "La cédula que ingresaste es inválida" });
    }

    //Comprueba la existencia de la institución
    const institution = await Institution.findOne({ nameInstitution }).session(session);

    //Si la institución no es encontrada este emitirá un mensaje de error 
    if (!institution) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "Institución no registrada" });
    }

    //Comprueba si el estudiante ya ha sido registrado
    const personStudent = await Person.findOne({ CI: ciStudent }).session(session);

    //devuelve una alerta si el estudiante ya esta registrado
    if (personStudent) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "El estudiante ya se encuentra registrado" });
    }
    //Crea la persona 
    const person = new Person({
      name: nameStudent,
      lastName: lastNameStudent,
      gender: gender,
      age: ageStudent,
      address: addressStudent,
      phone: phoneStudent,
      CI: ciStudent,
      institution: institution._id,
    });

    //Crea el estudiante
    const student = new Student({
      person: person._id,
      grade: gradeStudent,
      parallel: parallelStudent,
    });

    //Los guarda en las colecciones para el estudiante
    await person.save({ session });
    await student.save({ session });
  

  
    let teacher = await Teacher.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: "$userData"
      },
      {
        $lookup: {
          from: "people",
          localField: "userData.person",
          foreignField: "_id",
          as: "personData",
        },
      },
      {
        $unwind: {
          path: "$personData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          "personData.CI": ciTeacher,
        },
      },
    ]).session(session);



    const teacherFound = teacher.length > 0 ? teacher[0] : null;

    //Se emite un error si el docente no se encuentra registrado
    if(!teacherFound){
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "El docente no se encuentra registrado.." });      
    }

    const deceFound = await Dece.findOne({ user: idDece }).session(session);

    //Se emite un error si el docente no se encuentra registrado
    if(!deceFound){
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "El dece no se encuentra registrado.." });      
    }

    const caso = await new Caso({
      dece: deceFound._id,
      teacher: teacherFound._id,
      student: student._id,
      dateStart: Date.now(),
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).send({ message: "Caso creado con éxito!" });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: "Error al crear el caso" });
  }
};

exports.update = async (req, res) => {
  console.log(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const {
      idStudent,
      ciStudent,
      nameStudent,
      lastNameStudent,
      gender,
      ageStudent,
      addressStudent,
      phoneStudent,
      gradeStudent,
      parallelStudent,
      ciTeacher,
    } = req.body;


    //Busca la existencia del dece 
    const student = await Student.findById(idStudent).session(session);
    //Busca la existencia de la persona
    const person = await Person.findById(student.person)
    .populate({
      path:"institution",
      select:"nameInstitution"
    })
    .session(session);

    if (!student || !person) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "El estudiante no se encuentra registrado" });
    }
    //Verifica la validez de la cédula
    const validateCard = await validateIDCard(ciStudent);

    if (!validateCard) {
      await session.abortTransaction();
      session.endSession();  
      console.log("La cédula que ingresaste es inválida");
      return res
        .status(400)
        .send({ error: "La cédula que ingresaste es inválida" });
    }

    //Verifica  si existen el CI o correo en otras cuentas
    const isCINotDuplicated = await Person.findOne({ _id: { $ne: person._id }, CI: ciStudent }).exec();
 
    //Emite un error en el caso de que la cédula pertenezca a otro usuario
    if (isCINotDuplicated){
      await session.abortTransaction();
      session.endSession();
      console.log("La cédula pertenece a otro usuario")
      return res
        .status(400)
        .send({ error: "La cédula pertenece a otro usuario"});
    }


    // Actualizar información del estudiante
    const personStudent = await Person.findOneAndUpdate(
      { CI: ciStudent },
      {
        $set: {
          name: nameStudent,
          lastName: lastNameStudent,
          gender,
          age: ageStudent,
          address: addressStudent,
          phone: phoneStudent,
        },
      },
      { new: true, session }
    );

    // Actualizar información del estudiante en la colección Student
    await Student.findOneAndUpdate(
      { person: personStudent._id },
      { $set: { grade: gradeStudent, parallel: parallelStudent } },
      { new: true, session }
    );

    const newTeacher = await Teacher.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
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
          "personaTeacherData.CI": ciTeacher,
        },
      },
    ]);
    
    if (newTeacher.length > 0) {
      console.log(newTeacher[0]);
    } else {
      console.log("Profesor no encontrado");
    }

    // Actualizar el profesor del caso
    await Caso.findByIdAndUpdate(
      id,
      { teacher: newTeacher[0]._id },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).send({ message: "Caso actualizado exitosamente" });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: "Error al actualizar el caso" });
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

    const questions = await TestImages.find({ section: { $ne: 0 } }, { value: 1 });
    const scoreMax = answers.length()
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

    res.status(201).send({ message: "Test Docente creado con éxito!" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error + "Error al crear Test Docente" });
  }
};

//Se lista todos los casos para el DECE
exports.findAll = async (req, res) => {
  try {
    const { id } = req.params;

    const dece = await Dece.findOne({ user: id }).lean();
    console.log(dece)

    const casos = await Caso.find({dece:dece._id})
    .populate({
      path: "student",
      select:"id grade parallel",
      populate:{

      path: "person",
      select:"CI name lastName",
      populate:{

      path: "institution",
      select:"nameInstitution",
      
      }
      }
    })
    .populate({
      path: "dece",
      populate:{
      path: "user",
      populate:{
      path: "person",
      select:"CI name lastName email",      
      }
      }
    })
    .populate({
      path: "teacher",
      populate:{
      path: "user",
      populate:{
      path: "person",
      select:"CI name lastName email",
      populate:{
        path:"institution",
        select:"nameInstitution"
      }      
      }
      }
    })

// Mapear y ajustar los campos con valores por defecto en caso de null
const listaCasos = await Promise.all(casos.map(async (caso) => {
  const student = caso?.student;
  const personStudent = student?.person;
  const institutionStudent = personStudent?.institution ;

  const dece = caso?.dece;
  const userDece = dece?.user ;
  const personDece = userDece?.person;

  const teacher = caso?.teacher;
  const userTeacher = teacher?.user ;
  const personTeacher = userTeacher?.person ;
  const institutionTeacher = personTeacher?.institution ;

  const testTeacher =  await TestTeacher.findOne({caso})
  const testStudent =  await TestStudent.findOne({caso})

  return {
    _id: caso._id,
    dateStart: caso?.dateStart || null,
    idStudent: student._id || null,
    ciStudent: personStudent.CI || null,
    nameStudent: personStudent.name || null,
    lastNameStudent: personStudent.lastName || null,
    gradeStudent: student.grade || null,
    parallelStudent: student.parallel || null,
    nameInstitutionStudent: institutionStudent.nameInstitution || null,
    ciDece: personDece?.CI || null,
    nameDece: personDece?.name || null,
    lastNameDece: personDece?.lastName || null,
    emailDece: personDece?.email || null,
    ciTeacher: personTeacher?.CI || null,
    nameTeacher: personTeacher?.name || null,
    lastNameTeacher: personTeacher?.lastName || null,
    emailTeacher: personTeacher?.email || null,
    nameInstitutionTeacher: institutionTeacher?.nameInstitution || null,
    statusTestStudent: testStudent?.status || false,
    statusTestTeacher: testTeacher?.status || false,
  };
}));

    console.log("Numero de casos: ", listaCasos);


    res
      .status(200)
      .send({ message: "Datos extraídos correctamente ${listaCasos}", data: listaCasos });

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
      return res.status(200).send({ message: "No hay casos asignados" });
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
    res.status(200).send({ message: "Datos  recuperados con éxito", data: listCaso });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error al recuperar caso" });
  }
};

exports.getReporte = async (req, res) => {
  console.log("llegue al reporte")
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

exports.getCaso = async (req, res) => {
  const { id } = req.params;

  try {
    const caso = await Caso.findById(id)
      .populate({
        path: "student",
        select: "_id grade parallel",
        populate: {
          path: "person",
          select: "name lastName CI address gender age phone",
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

 

    const casoData = {
      id: caso._id,
      dateStart: caso.dateStart || null,
      idStudent: caso.student._id || null,
      ciStudent: caso.student?.person?.CI || "no asignado",
      nameStudent: caso.student?.person?.name || "no asignado",
      lastNameStudent: caso.student?.person?.lastName || "no asignado",
      addressStudent: caso.student?.person?.address || "no asignado",
      phoneStudent: caso.student?.person?.phone || "no asignado",
      ageStudent: caso.student?.person?.age || "no asignado",
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

    };

    res.send({ message: "Caso encontrado", data: casoData });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error al buscar el caso" });
  }
};



exports.delete = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
      const { id } = req.params;
      console.log(id)
      const caso = await Caso.findById(id).session(session);
      console.log(caso)

      const student = await Student.findById(caso.student).session(session); 

      //Comprueba si el estudiante tiene test ejecutados
      const testTeacherPromise = await TestTeacher.findOne({caso: caso._id}).session(session);
      const testStudentPromise = await TestStudent.findOne({caso: caso._id}).session(session);
      console.log("Test docente:",testTeacherPromise)
      console.log("Test estudiante:",testStudentPromise)

      if(testTeacherPromise || testStudentPromise){
        await session.abortTransaction();
        session.endSession();
        return res.status(400).send({ error: "Error al eliminar caso, tiene test ejecutados.." });
      }

      
      if (student) {
        await Person.findByIdAndRemove(student.person).session(session);
        await Student.findByIdAndRemove(student._id).session(session);
        console.log("Se eliminaron el estudiante y persona vinculada")
      }
    
    //Elimina el caso   
    await caso.remove();
    //Cierra sesion
    await session.commitTransaction();
    session.endSession();

    res.send({ message: "Caso eliminado con éxito!" });
  }  catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: "Error al eliminar el caso" });
  }
};
