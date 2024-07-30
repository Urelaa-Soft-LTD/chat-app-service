const { createConversation, getAllConversation } = require("../controllers/conversationController");
const router = require("express").Router();

router.post("/create", createConversation);
router.get("/all/:id", getAllConversation);


module.exports = router;
