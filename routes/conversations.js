const {
  createConversation,
  getAllConversation,
  markConversationAsRead,
  deleteConversation,
} = require("../controllers/conversationController");
const router = require("express").Router();

/**
 * @swagger
 * tags:
 *   name: Conversations
 *   description: Conversation management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Conversation:
 *       type: object
 *       required:
 *         - users
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the conversation
 *         users:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs in the conversation
 *         lastReadMessage:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Map of user IDs to their last read message ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/chat/conversations/create:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Conversations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             users: ["fromId", "toId"]
 *     responses:
 *       200:
 *         description: The created conversation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Some server error
 */
router.post("/create", createConversation);

/**
 * @swagger
 * /api/chat/conversations/all/{id}:
 *   get:
 *     summary: Get all conversations for a user
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The list of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 */
router.get("/all/:id", getAllConversation);

/**
 * @swagger
 * /api/chat/conversations/delete/{conversationId}:
 *   delete:
 *     summary: Delete a conversation
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The conversation id
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       404:
 *         description: Conversation not found
 */
router.delete("/delete/:conversationId", deleteConversation);

/**
 * @swagger
 * /api/chat/conversations/mark-read/{userId}/{conversationId}:
 *   put:
 *     summary: Mark a conversation as read for a user
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The conversation id
 *     responses:
 *       200:
 *         description: Conversation marked as read
 *       400:
 *         description: Some server error
 */
router.put("/mark-read/:userId/:conversationId", markConversationAsRead);

module.exports = router;
