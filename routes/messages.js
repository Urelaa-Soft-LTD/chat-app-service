const { addMessage, getMessages } = require("../controllers/messageController");
const router = require("express").Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - from
 *         - conversationId
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the message
 *         from:
 *           type: string
 *           description: The user ID of the sender
 *         conversationId:
 *           type: string
 *           description: The ID of the conversation this message belongs to
 *         message:
 *           type: string
 *           description: The content of the message
 *         type:
 *           type: string
 *           enum: [text, image, video, audio]
 *           default: text
 *           description: The type of the message
 *         files:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of file URLs (for non-text messages)
 *         read:
 *           type: boolean
 *           default: false
 *           description: Whether the message has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/chat/messages/addmsg:
 *   post:
 *     summary: Add a new message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - conversationId
 *               - message
 *             properties:
 *               from:
 *                 type: string
 *               conversationId:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image, video, audio]
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Message added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Failed to add message
 */
router.post("/addmsg/", addMessage);

/**
 * @swagger
 * /api/chat/messages/getmsg:
 *   post:
 *     summary: Get messages for a conversation
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - conversationId
 *             properties:
 *               from:
 *                 type: string
 *               conversationId:
 *                 type: string
 *               page:
 *                 type: number
 *                 default: 1
 *               limit:
 *                 type: number
 *                 default: 30
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 currentPage:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *                 hasMore:
 *                   type: boolean
 */
router.post("/getmsg/", getMessages);

module.exports = router;
