const socket = require("socket.io");
const messageService = require("./services/messageService");
const conversationService = require("./services/conversationService");
const { fetchSuggestionAns } = require("./helpers");
const { GET_CHAT_SUGGESTION_API } = require("./constants");
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
      const {
        conversationId,
        from,
        message,
        type = "text",
        files = [],
        ...restData
      } = data;

      try {
        // Save the original message
        const savedMessage = await messageService.addMessage({
          from,
          conversationId,
          message,
          type,
          files,
        });

        // Mark the conversation as read for the sender
        await conversationService.markConversationAsRead(from, conversationId);

        // Fetch the conversation to get all users
        const conversation = await conversationService.getConversationById(
          conversationId
        );

        if (!conversation) {
          console.error("Conversation not found");
          return;
        }

        console.log("sender conversation".data);

        // Handle auto-message when qid is present
        if (restData?.qid) {
          // Fetch suggestion answer based on qid
          const suggestionResponse = await fetchSuggestionAns(
            `${GET_CHAT_SUGGESTION_API}/${restData.qid}`
          );

          // Find the other user(s) in the conversation
          const otherUsers = conversation.users.filter(
            (user) => user.toString() !== from
          );

          // If suggestion found and other users exist
          if (suggestionResponse?.reply && otherUsers.length > 0) {
            // Choose the first other user as the auto-reply sender
            const autoReplyFrom = otherUsers[0].toString();

            // Save the auto-generated message
            const autoSavedMessage = await messageService.addMessage({
              from: autoReplyFrom,
              conversationId,
              message: suggestionResponse.reply,
              type: "text", // You might want to adjust this based on your requirements
              files: [],
            });

            // Emit the auto-reply to the original sender
            const senderSessions = onlineUsers.get(from);
            if (senderSessions) {
              senderSessions.forEach((_session, socketId) => {
                // Send the auto-reply message
                io.to(socketId).emit("msg-receive", {
                  from: autoReplyFrom,
                  conversationId,
                  message: suggestionResponse.reply,
                  type: "text",
                  messageId: autoSavedMessage._id,
                  createdAt: autoSavedMessage.createdAt,
                  isAutoReply: true, // Add a flag to identify auto-replies
                });

                // Update unread count
                io.to(socketId).emit("update-unread-count", {
                  conversationId,
                });
              });
            }
          }
        } else {
          // Regular message handling for non-auto-reply messages
          conversation.users.forEach((userId) => {
            console.log("All chat id for in convo", userId);
            if (userId.toString() !== from) {
              const userSessions = onlineUsers.get(userId.toString());
              console.log("Sessions", userSessions);
              if (userSessions) {
                userSessions.forEach((_session, socketId) => {
                  io.to(socketId).emit("msg-receive", {
                    ...data,
                    messageId: savedMessage._id,
                    createdAt: savedMessage.createdAt,
                  });
                  io.to(socketId).emit("update-unread-count", {
                    conversationId,
                  });
                });
              }
            }
          });
        }

        // Confirm message sent to the original sender
        const senderSessions = onlineUsers.get(from);
        if (senderSessions) {
          senderSessions.forEach((_session, socketId) => {
            io.to(socketId).emit("msg-sent", {
              status: "sent",
              messageId: savedMessage._id,
              conversationId,
            });
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);

        // Notify sender about the error
        const senderSessions = onlineUsers.get(from);
        if (senderSessions) {
          senderSessions.forEach((_session, socketId) => {
            io.to(socketId).emit("msg-error", {
              error: "Failed to send message",
              messageId: data.messageId,
            });
          });
        }
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
      }
      console.log("User disconnected:", socket.id);
    });

    socket.on("mark-read", async ({ conversationId, userId }) => {
      try {
        await conversationService.markConversationAsRead(
          userId,
          conversationId
        );
        socket.broadcast.emit("message-read", {
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
