const { createConversation, getAllConversation, markConversationAsRead } = require("../controllers/conversationController");
const router = require("express").Router();

router.post("/create", createConversation);
router.get("/all/:id", getAllConversation);
router.put("/:conversationId/:userId/read", markConversationAsRead);


module.exports = router;
