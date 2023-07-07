const mongoose = require("mongoose");

const Dece = require("../models/dece.model.js");
const Caso = require("../models/caso.model.js");
const Person = require("../models/person.model.js");
const User = require("../models/user.model.js");
const Institution = require("../models/institution.model.js");
const { encrypt } = require("../utils/helpers/handle.password");
const { validateIDCard } = require("../utils/helpers/tools.js");

// Create and Save a new dece
exports.createDece = async (req, res) => {
  try {
    const { CI, name, lastName, address, phone, email, nameInstitution } = req.body;

    const validateCard = await validateIDCard(CI);
    if (!validateCard) {
      console.log("La cédula que ingresaste es inválida");
      return res.status(400).send({ error: "La cédula que ingresaste es inválida" });
    }

    const existingInstitution = await Institution.findOne({ nameInstitution });
    if (!existingInstitution) {
      console.log("La institución no se encuentra registrada");
      return res.status(400).send({ error: "La institución no se encuentra registrada" });
    }

    const existingPerson = await User.exists({ "personData.CI": CI, "personData.email": email });
    console.log("La persona", existingPerson);

    if (existingPerson) {
      console.log("Este usuario ya se encuentra registrado");
      return res.status(400).send({ error: "Este usuario ya se encuentra registrado" });
    }

    const newPerson = await Person.create({ CI, name, lastName, address, phone, email, institution: existingInstitution._id });
    const hashedPassword = await encrypt(CI);
    const user = await User.create({ password: hashedPassword, person: newPerson._id, role: "DECE" });
    await Dece.create({ user: user._id });

    res.status(201).send({ message: "DECE creado correctamente" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Error al crear el DECE" });
  }
};


// Retrieve and return all dece from the database.
exports.getDeces = async (req, res) => {
  try {
    const deces = await Dece.find().populate({
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

    const listaDece = await Promise.all(
      deces.map(async (dece) => {
        const user = dece.user;
        const person = user?.person;
        const institution = person?.institution;
        return {
          id: dece._id,
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

    res
      .status(200)
      .send({ message: "Datos obtenidos correctamente", data: listaDece });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Error al obtener los dece" });
  }
};

// Find a single dece with a deceId
exports.getDece = async (req, res) => {
  try {
    const { id } = req.params;
    const dece = await Dece.findById(id)
      .select("_id  user institution")
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
      });

    if (!dece) {
      return res.status(400).send({ error: "Dece no encontrado" });
    }

    const deceData = {
      id: dece._id,
      CI: dece.user.person.CI,
      name: dece.user.person.name,
      lastName: dece.user.person.lastName,
      address: dece.user.person.address,
      phone: dece.user.person.phone,
      email: dece.user.person.email,
      nameInstitution: dece.user.person.institution.nameInstitution,
      role: dece.user.role,
      status: dece.user.status,
    };

    res.status(200).send({ message: "Dece encontrado!", data: deceData });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Error al obtener el dece" });
  }
};

// Update a dece identified by the deceId in the request
exports.updateDece = async (req, res) => {
  console.log(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { CI, name, lastName, address, phone, email, nameInstitution } =
      req.body;

    const dece = await Dece.findById(id).session(session);
    if (!dece) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "El dece no se encuentra registrado" });
    }

    const existingPerson = await Person.findOne({ email }).session(session);

    if (!existingPerson) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "La persona no esta registrada" });
    }

    const institution = await Institution.findOne({ nameInstitution }).session(
      session
    );

    if (!institution) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "La institución no esta registrada" });
    }

    //Se va a buscar el dece por el email del usuario mismo que pertenece ala persona
    const updateDece = await Person.findByIdAndUpdate(
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
    res
      .status(200)
      .send({ message: "Dece actualizado correctamente", data: updateDece });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    res.status(400).send(`${error}Error al actualizar el dece`);
  }
};

// Delete a dece with the specified deceId in the request
exports.deleteDece = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const deceId = req.params.id;

    const dece = await Dece.findById(deceId)
      .populate({
        path: "user",
        populate: {
          path: "person",
          select: "-_id CI",
        },
      })
      .session(session);

    if (!dece) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "Dece no encontrado" });
    }

    const casoCount = await Caso.countDocuments({ dece: deceId }).session(
      session
    );

    if (dece.user.person === null && casoCount === 0) {
      await User.findByIdAndRemove(dece.user._id).session(session);
      await Dece.findByIdAndRemove(deceId).session(session);
      await session.commitTransaction();
      session.endSession();
      return res.status(200).send({ message: "Dece eliminado correctamente" });
    }

    if (dece.user === null && casoCount === 0) {
      await Dece.findByIdAndRemove(deceId).session(session);
      await session.commitTransaction();
      session.endSession();
      return res.status(200).send({ message: "Dece eliminado correctamente" });
    }

    if (casoCount > 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: `El dece tiene ${casoCount} casos asociados` });
    }

    await Person.findOneAndRemove({ CI: dece.user.person.CI }).session(session);
    await User.findByIdAndRemove(dece.user._id).session(session);
    await Dece.findByIdAndRemove(deceId).session(session);

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
