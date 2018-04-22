var mongoose = require("mongoose");
var model = mongoose.model("user", new mongoose.Schema({
  username: {type: String, unique: true}
  , salt: {type: String}
  , email: {type: String, unique: true}
  , password: {type: String}
}));

exports.getModel = function() {
  return model;
}
