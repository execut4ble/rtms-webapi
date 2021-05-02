const jwt = require("jsonwebtoken");
const config = require("../config.json");

function authorizeRequest(request, response, next) {
  if (
    !request.headers.authorization ||
    !request.headers.authorization.startsWith("Bearer") ||
    !request.headers.authorization.split(" ")[1]
  ) {
    return response.status(422).json({
      message: "Please provide the token",
    });
  }

  const token = request.headers.authorization.split(" ")[1];
  const user = jwt.verify(token, config.jwtsecret);

  return user;
}

module.exports = {
  authorizeRequest,
};
