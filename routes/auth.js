const {
  getChatProfile,
  register,
  getAllUsers,
  logOut,
  deleteUser,
  updateUser,
} = require("../controllers/userController");

const router = require("express").Router();

router.get("/profile/:id", getChatProfile);
router.post("/register", register);
router.get("/allusers/:id", getAllUsers);
router.get("/logout/:id", logOut);
router.get("/delete/:id", deleteUser);
router.put('/update/:id', updateUser);

module.exports = router;
