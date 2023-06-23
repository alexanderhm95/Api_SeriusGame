const mongoose = require("mongoose");

const Institution = require("../models/institution.model.js");
const Teacher = require("../models/teacher.model.js");
const Person = require("../models/person.model.js");
const User = require("../models/user.model.js");

// Create and Save a new dece
exports.createTeacher = async (req, res) => {
  console.log(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      CI,
      name,
      lastName,
      address,
      phone,
      email,
      nameInstitution,
      password,
    } = req.body;

    const existingPerson = await Person.findOne({ email }).session(session);
    if (existingPerson) {
      throw new Error("La persona ya está registrada");
    }

    const newPerson = await new Person({
      CI,
      name,
      lastName,
      address,
      phone,
      email,
    }).save({ session });

    const existingUser = await User.findOne({ person: newPerson._id }).session(
      session
    );

    if (existingUser) {
      throw new Error("El usuario ya está registrado");
    }

    const institution = await Institution.findOne({ nameInstitution }).session(
      session
    );

    if (!institution) {
      throw new Error("La institución no está registrada");
    }

    const user = await new User({
      password,
      person: newPerson._id,
      role: "TEACHER",
    }).save({ session });

    await new Dece({
      user: user,
      institution: institution,
    }).save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).send({ message: "Docente creado exitosamente" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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

exports.getTeacher = async (req, res) => {
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
      CI: teacher.user.person ? teacher.user.person.CI : "no asignado",
      name: teacher.user.person ? teacher.user.person.name : "no asignado",
      lastName: teacher.user.person
        ? teacher.user.person.lastName
        : "no asignado",
      address: teacher.user.person
        ? teacher.user.person.address
        : "no asignado",
      phone: teacher.user.person ? teacher.user.person.phone : "no asignado",
      email: teacher.user.person ? teacher.user.person.email : "no asignado",
      nameInstitution: teacher.user.person.institution
        ? teacher.user.person.institution.nameInstitution
        : "no asignado",
      role: teacher.user ? teacher.user.role : "no asignado",
      status: teacher.user ? teacher.user.status : "no asignado",
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
    if(!teacher){
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({error: "El docente no se encuentra registrado"})
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

exports.deleteTeacher = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const teacherId = req.params.id;

    const teacher = await Teacher.findByIdAndRemove(teacherId).session(session);
    if (!teacher) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "Docente no encontrado" });
    }

    const userId = teacher.user;
    const userDelete = await User.findByIdAndRemove(userId).session(session);
    const personId = userDelete.person;
    const personDelete = await Person.findByIdAndRemove(personId).session(
      session
    );

    const [user, person] = await Promise.all([personDelete, userDelete]);
    if (!user || !person) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "Error al eliminar persona o usuario asociado" });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).send({ message: "Docente eliminado correctamente" });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();

    res.status(400).send({ error: "Error al eliminar el docente" });
  }
};
