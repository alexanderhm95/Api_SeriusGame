const mongoose = require("mongoose");

const Student = require("../models/student.model.js");
const Person = require("../models/person.model.js");
const Institution = require("../models/institution.model.js");

// Create and Save a new student
exports.createStudent = async (req, res) => {
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
      age,
      nameInstitution,
      grade,
      parallel,
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

    const institution = await Institution.findOne({ nameInstitution }).session(
      session
    );

    if (!institution) {
      throw new Error("La institución no está registrada");
    }

    await new Student({
      person: newPerson._id,
      institution: institution._id,
      grade,
      parallel,
    }).save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(201).send({ message: "Estudiante creado exitosamente!" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(400).send({ error: error + "Error creating student" });
  }
};

// Retrieve and return all students from the database.
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate({
      path: "person",
      select: "CI name lastName age email phone",
      populate: {
        path: "institution",
        select: "nameInstitution",
      },
    });

    const listaStudent = await Promise.all(
      students.map(async (student) => {
        const person = student.person;
        const institution = person?.institution;
        return {
          id: student._id,
          CI: person ? person.CI : "no asignado",
          name: person ? person.name : "no asignado",
          lastName: person ? person.lastName : "no asignado",
          age: person ? person.age : "no asignado",
          email: person ? person.email : "no asignado",
          phone: person ? person.phone : "no asignado",
          nameInstitution: institution
            ? institution.nameInstitution
            : "no asignado",
          grade: student.grade,
          parallel: student.parallel,
          status: student.status,
        };
      })
    );

    res
      .status(200)
      .send({ message: "Students found successfully!", listaStudent });
  } catch (error) {
    console.log(error);
    res.status(400).send(error + "Error al obtener los estudiantes");
  }
};

// Find a single student with a studentId
exports.getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id)
      .select("person institution grade parallel")
      .populate({
        path: "person",
        select: "CI name lastName age email phone address",
        populate: {
          path: "institution",
          select: "nameInstitution",
        },
      })
      .lean();

    if (!student) {
      return res.status(400).send({ error: "Student not found" });
    }

    const studentData = {
      id: student._id,
      CI: student.person ? student.person.CI : "no asignado",
      name: student.person ? student.person.name : "no asignado",
      lastName: student.person ? student.person.lastName : "no asignado",
      age: student.person ? student.person.age : "no asignado",
      address: student.person ? student.person.address : "no asignado",
      phone: student.person ? student.person.phone : "no asignado",
      email: student.person ? student.person.email : "no asignado",
      nameInstitution: student.person.institution.nameInstitution,
      grade: student.grade,
      parallel: student.parallel,
    };

    res.status(200).send({
      message: "Estudiante encontrado exitosamente!",
      data: studentData,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send("Error al obtener el estudiante");
  }
};

// Update a student identified by the studentId in the request
exports.updateStudent = async (req, res) => {
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
      age,
      nameInstitution,
      grade,
      parallel,
    } = req.body;

    const existingPerson = await Person.findOne({ email }).session(session);
    if (!existingPerson) {
      return res.status(400).send({ error: "La persona no esta registrada" });
    }

    await Person.findByIdAndUpdate(existingPerson._id, {
      CI,
      name,
      lastName,
      address,
      phone,
      email,
      age,
    }).session(session);

    const institution = await Institution.findOne({ nameInstitution }).session(
      session
    );

    if (!institution) {
      return res
        .status(400)
        .send({ error: "La institución no está registrada" });
    }

    const studentUpdate = await Student.findByIdAndUpdate(req.params.id, {
      institution: institution._id,
      parallel,
      grade,
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).send({
      message: "Estudiante actualizado correctamente",
      data: studentUpdate,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(400).send({ error: "Error al actualizar el estudiante" });
  }
};

// Delete a student with the specified studentId in the request
exports.deleteStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const studentId = req.params.id;

    const student = await Student.findByIdAndDelete(studentId).session(session);
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "Estudiante no encontrado" });
    }

    const personId = student.person;
    const person = await Person.findByIdAndDelete(personId).session(session);
    if (!person) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "Error al eliminar la persona asociada" });
    }

    await session.commitTransaction();
    session.endSession();
    res.status(200).send({ message: "Estudiante eliminado correctamente" });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: "Error al eliminar el estudiante" });
  }
};

//Generate passtemporaly and return passwordTemporaly
exports.generatePassStudent = async (req, res) => {
  console.log(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { CI } = req.body;

    const studentSearch = await Student.aggregate([
      {
        $lookup: {
          from: "people",
          localField: "person",
          foreignField: "_id",
          as: "person",
        },
      },
      {
        $unwind: "$person",
      },
      {
        $match: {
          "person.CI": CI,
        },
      },
    ]);

    // Verificar si el usuario existe
    if (studentSearch.length == 0) {
      return res.status(400).send({ error: "Estudiante encontrado" });
    }

    const student = studentSearch[0];

    const passwordTemporaly = Math.floor(100000 + Math.random() * 900000);

    student.passwordTemporaly = passwordTemporaly;
    student.passwordTemporalyExpiration = Date.now() + 300000; // 300000 milisegundos = 5 minutos
    // Limpiar el código de recuperación y su fecha de expiración después de 5 minutos
    setTimeout(() => {
      student.passwordTemporaly = null;
      student.passwordTemporalyExpiration = null;
      Student.findByIdAndUpdate(student._id, student).exec();
    }, 300000);

    await Student.findByIdAndUpdate(student._id, student).exec();

    res.status(200).send({ message: "ok", data: student.passwordTemporaly });
  } catch (error) {
    console.log(error);
    res.status(400).send(error + "Error al iniciar sesión.");
  }
};

//Login student
exports.loginStudent = async (req, res) => {
  console.log(req.body);
  try {
    const { passwordTemporaly } = req.body;

    const student = await Student.findOne(passwordTemporaly)
    .populate({
      path:"person",
      select:"-id CI"
    })
    if (!student && student.passwordTemporaly !== passwordTemporaly) {
      return res.status(400).send({ message: "Credenciales incorrectas" });
    }

    if (student.passwordTemporalyExpiration < Date.now()) {
      return res.status(400).send({ message: "Codigo expirado" });
    }
    console.log(person.CI)
    res.status(200).send({ message: "ok", data: person.CI });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Error al iniciar sesión" });
  }
};
