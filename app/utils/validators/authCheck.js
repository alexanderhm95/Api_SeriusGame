const { verifyToken, decodeToken } = require("../helpers/handle.jwt");
const User = require("../../models/user.model");

const checkAuth = (roles) => async (req, res, next) => {
  try {
    //TODO: authorization: Bearer 1010101010101001010100
    const token = req.headers.authorization.split(" ").pop(); //TODO:123123213
    const tokenData = verifyToken(token);
    console.log(
      "Token decodificado:",
      decodeToken(token).payload.role,
      "llega: ",
      roles
    );

    const decodedToken = decodeToken(token);

    const existUser = await User.findById(decodedToken.payload.user);

    if (tokenData && roles.includes(decodedToken.payload.role) && existUser) {
      next();
    } else {
      res.status(403);
      res.send({
        error: "Acceso denegado. No tienes los permisos necesarios.",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(409);
    res.send({ error: "Acceso invalido !" });
  }
};

module.exports = checkAuth;
