const socket = require("socket.io");
const Conversations = require("./models/conversationModel");
let io; // Declare io so it can be accessed outside the initialization function

/**
 * @swagger
 * tags:
 *   name: Socket
 *   description: Socket.IO operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SocketMessage:
 *       type: object
 *       required:
 *         - conversationId
 *         - from
 *         - message
 *       properties:
 *         conversationId:
 *           type: string
 *           description: The ID of the conversation
 *         from:
 *           type: string
 *           description: The ID of the sender
 *         message:
 *           type: string
 *           description: The content of the message
 *         messageId:
 *           type: string
 *           description: The ID of the message
 */

/**
 * @swagger
 * /socket.io:
 *   get:
 *     summary: Socket.IO endpoint
 *     tags: [Socket]
 *     description: |
 *       This is the main Socket.IO endpoint. Clients should connect to this endpoint to establish a WebSocket connection.
 *       
 *       Available events:
 *       - `add-user`: Add a user to the online users list
 *       - `send-msg`: Send a message to other users in a conversation
 *       - `disconnect`: Handle user disconnection
 *       
 *       Emitted events:
 *       - `msg-receive`: Receive a message from another user
 *       - `update-unread-count`: Update the unread message count for a conversation
 *       - `msg-sent`: Confirmation that a message was sent successfully
 *     responses:
 *       101:
 *         description: Switching Protocols to WebSocket
 */

const initializeSocket = (server, allowedOrigins) => {
  io = socket(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  global.onlineUsers = new Map();

  io.on("connection", (socket) => {
    global.chatSocket = socket;
    console.log("New user connected");

    /**
     * @swagger
     * /socket.io:
     *   post:
     *     summary: Add a user to online users
     *     tags: [Socket]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *             properties:
     *               userId:
     *                 type: string
     *                 description: The ID of the user to add
     *     responses:
     *       200:
     *         description: User added successfully
     */
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("User added -->", onlineUsers);
    });

    /**
     * @swagger
     * /socket.io:
     *   post:
     *     summary: Send a message event
     *     tags: [Socket]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SocketMessage'
     *     responses:
     *       200:
     *         description: Message sent successfully
     *       400:
     *         description: Error sending message
     */
    socket.on("send-msg", async (data) => {
      console.log("send", data);
      const { conversationId, from } = data;
      
      try {
        // Fetch the conversation to get all users
        const conversation = await Conversations.findById(conversationId);
        if (!conversation) {
          console.error("Conversation not found");
          return;
        }

        // Send message to all users in the conversation except the sender
        conversation.users.forEach(userId => {
          if (userId.toString() !== from) {
            const receiverSocket = onlineUsers.get(userId.toString());
            if (receiverSocket) {
              io.to(receiverSocket).emit("msg-receive", data);
              io.to(receiverSocket).emit("update-unread-count", {
                conversationId: conversationId,
              });
            }
          }
        });

        // Optionally, confirm to sender that message was sent
        const senderSocket = onlineUsers.get(from);
        if (senderSocket) {
          io.to(senderSocket).emit("msg-sent", {
            status: "sent",
            messageId: data.messageId, // Assuming you have a messageId
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    /**
     * @swagger
     * /socket.io:
     *   post:
     *     summary: Handle user disconnection
     *     tags: [Socket]
     *     responses:
     *       200:
     *         description: User disconnected successfully
     */
    socket.on("disconnect", () => {
      console.log("User disconnected");
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
};

const getIoInstance = () => io;

module.exports = { initializeSocket, getIoInstance };




