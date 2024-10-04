const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const conversationsRoutes = require("./routes/conversations");
const app = express();
const { initializeSocket } = require("./socket");
require("dotenv").config();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat API",
      version: "1.0.0",
      description: "API documentation for the Chat application",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./routes/*.js", "./socket.js"], // Path to the API routes files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// app.use(
//   cors({
//     origin: "*", // Allow all origins
//     credentials: true, // Allow credentials if needed
//   })
// );


// List of allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "localhost",
  "http://local.partner.cart24.qa:3000",
  "http://local.admin.cart24.qa:3000",
  "https://www.admin.cart24.qa",
  "https://partner.cart24.qa",
  "https://www.web.cart24.qa",
];

// Set up CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If the origin isn't in the list, reject the request
        return callback(new Error("CORS policy violation"), false);
      }
      // If the origin is in the list, allow the request
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connected Successfully");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/", (req, res) => {
  res.send("Chat Server is running");
});
app.use("/api/chat/auth", authRoutes);
app.use("/api/chat/conversations", conversationsRoutes);
app.use("/api/chat/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

initializeSocket(server, allowedOrigins);

// const io = socket(server, {
//   cors: {
//     origin: allowedOrigins,
//     credentials: true,
//   },
// });

// // Export the io object to be accessible in other files


// global.onlineUsers = new Map();
// io.on("connection", (socket) => {
//   global.chatSocket = socket;
//   socket.on("add-user", (userId) => {
//     onlineUsers.set(userId, socket.id);
//     console.log("user added --> ", onlineUsers);
//   });

//   socket.on("send-msg", (data) => {
//     console.log("send", data);
//     const sendUserSocket = onlineUsers.get(data.from);
//     if (sendUserSocket) {
//       io.emit("msg-recieve", data);
//     }
//   });
// });

// module.exports = io;
