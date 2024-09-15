const socket = require("socket.io");
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
    socket.on("send-msg", (data) => {
      console.log("send", data);
      const sendUserSocket = onlineUsers.get(data.from);
      if (sendUserSocket) {
        io.emit("msg-recieve", data);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected");
      // Optionally: remove the user from the map if needed
    });
  });
};

const getIoInstance = () => io;

module.exports = { initializeSocket, getIoInstance };
