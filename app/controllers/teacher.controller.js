const mongoose = require("mongoose");

const Institution = require("../models/institution.model.js");
const Teacher = require("../models/teacher.model.js");
const Person = require("../models/person.model.js");
const User = require("../models/user.model.js");
const Caso = require("../models/caso.model.js");
const { encrypt } = require("../utils/helpers/handle.password");
const { sendRecoveryCodeEmail } = require("../../config/mail.conf");
const { validateIDCard, generatorPass } = require("../utils/helpers/tools.js");

// Create and Save a new teacher
exports.createTeacher = async (req, res) => {
  console.log(req.body);
  try {
    const { CI, name, lastName, address, phone, email, nameInstitution } = req.body;

    const validateCard = await validateIDCard(CI);
    if (!validateCard) {
      console.log("La cédula que ingresaste es inválida");
      return res.status(400).send({ error: "La cédula que ingresaste es inválida" });
    }

    const existingInstitution = await Institution.findOne({ nameInstitution });
    if (!existingInstitution) {
      throw new Error("La institución no está registrada");
    }

  
    const existingPerson = await User.aggregate([
      {
        $lookup: {
          from: "people",
          localField: "person",
          foreignField: "_id",
          as: "personData",
        },
      },
      {
        $match: {
          $or: [{ "personData.CI": CI }, { "personData.email": email }],
        },
      },
    ]);

    if (existingPerson.length >0) {
      console.log("Este usuario ya se encuentra registrado");
      return res.status(400).send({ error: "Este usuario ya se encuentra registrado" });
    }
   
    const pass =  generatorPass();
    const hashedPassword = await encrypt(pass);
    const subject = 'SeriusGame - Nueva cuenta'
    const operation = 0;



    const newPerson = await Person.create({ CI, name, lastName, address, phone, email, institution: existingInstitution._id });
    const user = await User.create({ password: hashedPassword, person: newPerson._id, role: "TEACHER" });
    await Teacher.create({ user: user._id });

    sendRecoveryCodeEmail(email, pass , subject, operation).then((result) => {
      if (result === true) {
        console.log(`Código enviado exitosamente`);
      } else {
        console.log("Servicio no disponible, inténtelo más tarde");
      } 
    });
    

    res.status(201).send({ message: "Docente creado exitosamente" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Error al crear el docente" });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate({
      path: "user",
      select: "-_id role status",
      populate: {
        path: "person",
        select: "-_id CI name lastName phone email institution",
        populate: {
          path: "institution",
          select: "-_id nameInstitution",
        },
      },
    });

    const listaTeacher = await Promise.all(
      teachers.map(async (teacher) => {
        const user = teacher.user;
        const person = user?.person;
        const institution = person?.institution;
        return {
          id: teacher._id,
          CI: person ? person.CI : "no asignado",
          name: person ? person.name : "no asignado",
          lastName: person ? person.lastName : "no asignado",
          phone: person ? person.phone : "no asignado",
          email: person ? person.email : "no asignado",
          nameInstitution: institution
            ? person.institution.nameInstitution
            : "no asignado",
          role: user ? user.role : "no asignado",
          status: user ? user.status : "no asignado",
        };
      })
    );

    res.status(200).send({
      message: "Datos docente obtenidos exitosamente",
      data: listaTeacher,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error + "Error al obtener los docentes");
  }
};
exports.getTeachersCasos = async (req, res) => {
  try {
    const { data } = req.body;
    const teachers = await Teacher.find().populate({
      path: "user",
      select: "-_id role status",
      populate: {
        path: "person",
        select: "-_id CI name lastName phone email institution",
        populate: {
          path: "institution",
          select: "-_id nameInstitution",
        },
      },
    });

    const filteredTeachers = teachers.filter((teacher) => {
      return teacher.user.person.institution.nameInstitution === data;
    });


    const listaTeacher = await Promise.all(
      filteredTeachers.map(async (teacher) => {
        const user = teacher.user;
        const person = user?.person;
        const institution = person?.institution;
        return {
          id: teacher._id,
          CI: person ? person.CI : "no asignado",
          name: person ? person.name : "no asignado",
          lastName: person ? person.lastName : "no asignado",
          phone: person ? person.phone : "no asignado",
          email: person ? person.email : "no asignado",
          nameInstitution: institution
            ? person.institution.nameInstitution
            : "no asignado",
          role: user ? user.role : "no asignado",
          status: user ? user.status : "no asignado",
        };
      })
    );

    res.status(200).send({
      message: "Datos docente obtenidos exitosamente",
      data: listaTeacher,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error + "Error al obtener los docentes");
  }
};

exports.getTeacher = async (req, res) => {
console.log("llegue..")
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id)
      .populate({
        path: "user",
        select: "-_id role status",
        populate: {
          path: "person",
          select: "-_id CI name lastName phone email address",
          populate: {
            path: "institution",
            select: "-_id nameInstitution",
          },
        },
      })
      .lean();

    if (!teacher) {
      return res.status(400).send({ error: "Docente no encontrado" });
    }

    const teacherData = {
      id: teacher._id,
      CI: teacher.user?.person ? teacher.user.person.CI : "no asignado",
      name: teacher.user?.person ? teacher.user.person.name : "no asignado",
      lastName: teacher.user?.person
        ? teacher.user.person.lastName
        : "no asignado",
      address: teacher.user?.person
        ? teacher.user.person.address
        : "no asignado",
      phone: teacher.user?.person ? teacher.user.person.phone : "no asignado",
      email: teacher.user?.person ? teacher.user.person.email : "no asignado",
      nameInstitution: teacher.user?.person?.institution
        ? teacher.user?.person?.institution?.nameInstitution
        : "no asignado",
      role: teacher?.user ? teacher.user.role : "no asignado",
      status: teacher?.user ? teacher.user.status : "no asignado",
    };

    res
      .status(200)
      .send({ message: "Teacher found successfully!", data: teacherData });
  } catch (error) {
    console.log(error);
    res.status(400).send(error + "Error al obtener el docente");
  }
};

exports.updateTeacher = async (req, res) => {
  console.log(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { CI, name, lastName, address, phone, email, nameInstitution } =
      req.body;

    const teacher = await Teacher.findById(id).session(session);
    if (!teacher) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "El docente no se encuentra registrado" });
    }

    const existingPerson = await Person.findOne({ email }).session(session);

    if (!existingPerson) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "El docente no tiene datos informativos" });
    }

    const institution = await Institution.findOne({ nameInstitution }).session(
      session
    );

    if (!institution) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "La institución no está registrada" });
    }

    const updatedTeacher = await Person.findByIdAndUpdate(
      existingPerson._id,
      {
        CI,
        name,
        lastName,
        address,
        phone,
        email,
        institution: institution._id,
      },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).send({
      message: "Docente actualizado exitosamente",
      data: updatedTeacher,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(400).send({ error: "Error al actualizar el docente" });
  }
};

// Delete a teacher with the specified teacherId in the request
exports.deleteTeacher = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const teacherId = req.params.id;

    const teacher = await Teacher.findById(teacherId)
      .populate({
        path: "user",
        populate: {
          path: "person",
          select: "-_id CI",
        },
      })
      .session(session);

    if (!teacher) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "Docente no encontrado" });
    }

    const casoCount = await Caso.countDocuments({ teacher: teacherId }).session(
      session
    );

    if (teacher.user.person === null && casoCount === 0) {
      await User.findByIdAndRemove(teacher.user._id).session(session);
      await Teacher.findByIdAndRemove(deacherId).session(session);
      await session.commitTransaction();
      session.endSession();
      return res.status(200).send({ message: "Docente eliminado correctamente" });
    }

    if (teacher.user === null && casoCount === 0) {
      await Teacher.findByIdAndRemove(teacherId).session(session);
      await session.commitTransaction();
      session.endSession();
      return res.status(200).send({ message: "Docente eliminado correctamente" });
    }

    if (casoCount > 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: `El docente tiene ${casoCount} casos asociados` });
    }

    await Person.findOneAndRemove({ CI: teacher.user.person.CI }).session(session);
    await User.findByIdAndRemove(teacher.user._id).session(session);
    await Teacher.findByIdAndRemove(teacherId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).send({ message: "Docente eliminado correctamente" });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).send({ error: "Error al eliminar el docente" });
  }
};
