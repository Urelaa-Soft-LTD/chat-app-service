const socket = require("socket.io");
const Conversations = require("./models/conversationModel");
let io; // Declare io so it can be accessed outside the initialization function

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

    // Add user to onlineUsers
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("User added -->", onlineUsers);
    });

    // Handle sending a message
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

    // Handle disconnect
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




