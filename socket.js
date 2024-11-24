const socket = require("socket.io");
const messageService = require("./services/messageService");

const conversationService = require("./services/conversationService");
let io; // Declare io so it can be accessed outside the initialization function

const getUserIdFromSocket = (socketId) => {
  for (const [userId, sessions] of onlineUsers.entries()) {
    if (sessions.has(socketId)) {
      return userId;
    }
  }
  return null;
};

const initializeSocket = (server, allowedOrigins) => {
  io = socket(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
  });

  global.onlineUsers = new Map();
  global.userRooms = new Map();

  io.on("connection", (socket) => {
    global.chatSocket = socket;
    console.log("New user connected:", socket.id);

    socket.on("add-user", (userId, deviceType = "web") => {
      const userSessions = onlineUsers.get(userId) || new Map();
      userSessions.set(socket.id, { deviceType });
      onlineUsers.set(userId, userSessions);
      console.log("User added -->", userId, deviceType);
    });

    socket.on("send-msg", async (data) => {
      const { conversationId, from, message, type = "text", files = [] } = data;

      try {
        const savedMessage = await messageService.addMessage({
          from,
          conversationId,
          message,
          type,
          files,
        });

        await conversationService.markConversationAsRead(from, conversationId);

        console.log("Conversation sending Id",conversationId)

        socket.to(conversationId).emit("msg-receive", {
          ...data,
          messageId: savedMessage._id,
          createdAt: savedMessage.createdAt,
        });
        // socket.emit("msg-receive", {
        //   ...data,
        //   messageId: savedMessage._id,
        //   createdAt: savedMessage.createdAt,
        // });

        socket.emit("msg-sent", {
          status: "sent",
          messageId: savedMessage._id,
          conversationId,
        });

        socket.to(conversationId).emit("update-unread-count", {
          conversationId,
          from,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("msg-error", {
          error: "Failed to send message",
          messageId: data.messageId,
        });
      }
    });

    socket.on("disconnect", () => {
      const userId = getUserIdFromSocket(socket.id);
      if (userId) {
        const userSessions = onlineUsers.get(userId);
        if (userSessions) {
          userSessions.delete(socket.id);
          if (userSessions.size === 0) {
            onlineUsers.delete(userId);
          }
        }

        const userRoomSet = userRooms.get(userId);
        if (userRoomSet) {
          userRoomSet.forEach((roomId) => {
            socket.leave(roomId);
          });
          userRooms.delete(userId);
        }
      }
      console.log("User disconnected:", socket.id);
    });

    socket.on("join-room", async ({ conversationId, users }) => {
      try {
        let conversation;

        if (!conversationId && users) {
          const result = await conversationService.createConversation(users);
          conversation = result;
          conversationId = result._id;

          // Move the socket emission here where we have direct access to io
          users.forEach((participantId) => {
            const userSessions = onlineUsers.get(participantId);
            if (userSessions) {
              userSessions.forEach((_, socketId) => {
                io.to(socketId).emit("new-conversation", conversation);
              });
            }
          });
        }

        socket.join(conversationId);
        const userId = getUserIdFromSocket(socket.id);

        if (userId) {
          const userRoomSet = userRooms.get(userId) || new Set();
          userRoomSet.add(conversationId);
          userRooms.set(userId, userRoomSet);

          await conversationService.markConversationAsRead(
            userId,
            conversationId
          );

          socket.to(conversationId).emit("user-joined", {
            userId,
            conversationId,
          });
        }

        if (conversation) {
          users.forEach((participantId) => {
            const userSessions = onlineUsers.get(participantId);
            if (userSessions) {
              userSessions.forEach((_, socketId) => {
                io.to(socketId).emit("new-conversation", conversation);
              });
            }
          });
        }

        console.log(`User joined room: ${conversationId}`);
      } catch (error) {
        console.error("Error in join-room:", error);
        socket.emit("room-error", {
          error: "Failed to join room",
          details: error.message,
        });
      }
    });

    socket.on("mark-read", async ({ conversationId, userId }) => {
      try {
        await conversationService.markConversationAsRead(
          userId,
          conversationId
        );

        socket.to(conversationId).emit("message-read", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });
  });
};

const getIoInstance = () => io;

module.exports = { initializeSocket, getIoInstance };
