const { verifyToken, decodeToken } = require("../helpers/handle.jwt");

const checkAuth = (roles) => async (req, res, next) => {
  try {
    //TODO: authorization: Bearer 1010101010101001010100
    const token = req.headers.authorization.split(" ").pop(); //TODO:123123213
    const tokenData = await verifyToken(token);
    console.log(
      "Token decodificado:",
      decodeToken(token).payload.role,
      "llega: ",
      roles
    );
    const decodedToken = decodeToken(token);

    if (tokenData && roles.includes(decodedToken.payload.role)) {
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
