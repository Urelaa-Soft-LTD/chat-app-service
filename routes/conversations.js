const {
  createConversation,
  getAllConversation,
  markConversationAsRead,
  deleteConversation,
} = require("../controllers/conversationController");
const router = require("express").Router();

router.post("/create", createConversation);
router.get("/all/:id", getAllConversation);
router.delete("/delete/:conversationId", deleteConversation);
router.put("/mark-read/:userId/:conversationId", markConversationAsRead);

module.exports = router;
