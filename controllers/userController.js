const User = require("../models/userModel");

module.exports.getChatProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id });
    if (!user) return res.json({ msg: "Not found user", status: false });
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    // const {userId} = req.body;
    // const userCheck = await User.findOne({ userId });
    // if (userCheck)
    //   return res.json({ msg: "Username already used", status: false });
    const user = await User.create(req.body);
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const users = await User.find({ _id: { $ne: id } }).select([
      "fullName",
      "_id",
      "userId",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};

module.exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found', status: false });
    }

    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
}

module.exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.delete(req.params.id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (ex) {
    next(ex);
  }
};

