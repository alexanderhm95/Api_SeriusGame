const mongoose = require("mongoose");
const { validateIDCard } = require("../utils/helpers/tools.js");


const User = require("../models/user.model");
const Person = require("../models/person.model");
const { encrypt } = require("../utils/helpers/handle.password");

//metodo para crear un usuario en la base de datos
exports.createUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    //desestructuramos el body
    const { CI, name, lastName, address, phone, email, password } = req.body;

    const validateCard = await validateIDCard(CI);
    if (!validateCard) {
      console.log("La cédula que ingresaste es inválida");
      return res.status(400).send({ error: "La cédula que ingresaste es inválida" });
    }

    //validamos que el email no este registrado
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

    //si el email ya esta registrado retornamos un error
    if (existingPerson.length > 0) {
      return res
        .status(400)
        .send({ error: "Este usuario ya se encuentra registrado" });
    }

    //creamos la persona
    const newPerson = await new Person({
      CI,
      name,
      lastName,
      address,
      phone,
      email,
    }).save({ session });

    //encriptamos la contraseña
    const hashedPassword = await encrypt(password);

    //creamos el usuario
    await new User({
      person: newPerson._id,
      password: hashedPassword,
      role: "ADMIN",
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).send({ message: "Usuario creado con éxito" });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: "Error al crear el usuario" });
  }
};

//metodo para obtener todos los usuarios de la base de datos
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id role status ")
      .populate("person", "-_id CI email name lastName")
      .exec();

    const userData = users.map((user) => {
      return {
        id: user._id,
        CI: user.person.CI,
        name: user.person.name,
        lastName: user.person.lastName,
        email: user.person.email,
        role: user.role,
        status: user.status,
      };
    });

    res
      .status(200)
      .send({ message: "Datos extraídos con éxito", data: userData });
  } catch (error) {
    res.status(400).send({ error: "Error al obtener los usuarios" });
  }
};

//metodo para obtener un usuario de la base de datos
exports.getUser = async (req, res) => {
  try {
    //Desestructuramos el body
    const { id } = req.params;

    //Buscamos el usuario por id
    const user = await User.findById(id).select("_id role status").populate({
      path: "person",
      select: "_id CI email",
    });

    //Si el usuario no existe retornamos un error
    if (!user) {
      return res.status(400).send({ error: "Usuario no encontrado" });
    }

    //Si el usuario existe retornamos el usuario
    res.status(200).send({ message: "Usuario encontrado", data: user });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error + "Error al obtener el usuario" });
  }
};

//metodo para actualizar un usuario de la base de datos
//No esta terminado
exports.updateUser = async (req, res) => {
  try {
    const { email, password, status, role } = req.body;

    await User.findByIdAndUpdate(
      req.params.id,
      {
        email,
        password: await encrypt(password),
        status,
        role,
      },
      { new: true }
    );

    res.status(200).send({ message: "Usuario actualizado con éxito" });
  } catch (error) {
    res.status(401).send({ error: "Error al actualizar el usuario" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    //Desestructuramos el body
    const { id, action } = req.body;

    //Actualizamos el estado del usuario
    const user = await User.findByIdAndUpdate(
      id,
      { status: action },
      { new: true }
    );

    //Si el usuario no existe retornamos un error
    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }

    //Si el usuario existe retornamos el usuario
    const successMessage = action
      ? "Usuario activado con éxito"
      : "Usuario desactivado con éxito";

    //Retornamos el mensaje de exito
    res.status(200).send({ message: successMessage });
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .send({ error: "Error al actualizar el estado del usuario" });
  }
};

//metodo para eliminar un usuario de la base de datos
exports.deleteUser = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { id } = req.params;

    // Encuentra el usuario y obtén el ID de la persona asociada
    const user = await User.findById(id)
    .populate({
      path:"person",
      select: "_id CI "
    })
    .session(session);
    console.log(user)

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "Usuario no encontrado" });
    }

    if (user.person === null) {
      await User.findByIdAndDelete(id).session(session);
      await session.commitTransaction();
      session.endSession();
      return res
        .status(200)
        .send({ message: "Usuario eliminado correctamente" });
    }

    await Person.findByIdAndDelete(user.person._id).session(session);
    await User.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).send({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: "Error al eliminar el usuario" });
  }
};
