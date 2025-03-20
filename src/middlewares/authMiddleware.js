const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

module.exports =  async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing token" });
  }

  const token = authHeader.split(" ")[1]; 

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findById(decoded.id);
    next();
  } catch (error) {
    const message = error.name === "TokenExpiredError" 
      ? "Token expired, please log in again" 
      : "Invalid token";
      
    return res.status(401).json({ error: message });
  }
};
