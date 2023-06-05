const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
// const { errorHandler } = require("./middlewares/errorHandler");

//connection with mongodb database;
const { connection } = require("./config/db");
//routes
const { userRouter } = require("./routes/userRoutes");
const { chatRouter } = require("./routes/chatRoutes");
const { messageRoutes } = require("./routes/messageRoutes");
const { authMiddleware } = require("./middlewares/authMiddleware");
const { use } = require("bcrypt/promises");

const app = express();
app.use(cors({ credentials: true, origin: process.env.FRONT_END_URL }));
// app.use((req, res, next) => {
//   console.log(process.env.FRONT_END_URL);
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");
//   res.setHeader("Access-Control-Allow-Origin", process.env.FRONT_END_URL);
//   res.setHeader("Access-Control-Allow-Credentials", true);
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS, PUT, DELETE"
//   );
//   next();
// });
app.use(cookieParser());
app.use(express.json());

app.get("/", authMiddleware, (req, res) => {
  console.log(req.user);
  res.json({ message: "working" });
});

//routes
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRoutes);

//for handling invalid routes -> 404 Not Found
app.all("*", (req, res, next) => {
  let error = { message: `404 Not Found: ${req.url}`, statusCode: 404 };
  next(error);
});

// app.use(errorHandler);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "something went wrong";
  res.status(statusCode).json({
    status: statusCode,
    message,
  });
});

const httpServer = app.listen(8080, async () => {
  console.log("server is running...");
  try {
    await connection;
    console.log("connected to database");
  } catch (err) {
    console.log(err);
    console.log("Not connected to database");
  }
});

const io = require("socket.io")(httpServer, {
  cors: {
    // origin: `${process.env.FRONT_END_URL}`,
    origin: "https://rik1o5-3000.csb.app",
    credential: true,
  },
});

io.on("connection", (socket) => {
  // console.log(socket);
  console.log("connected to sockets");
  socket.on("setup",(userId)=>{
    socket.join(userId);
    socket.emit("connected");
  })
  
  //join chat/room
  socket.on("join chat",(chatId)=>{
    socket.join(chatId);
  });
  
  socket.on("new message",(newMessageData)=>{
    console.log("new message called",newMessageData.message);
    let chat = newMessageData?.chatId;
    if(!chat?.users) return;
    // console.log("yes")
    chat.users.forEach((elem)=>{
      console.log("forEach working",elem,newMessageData.sender._id);
      if(elem != newMessageData.sender._id){
        console.log(true,"for each");
        socket.in(elem).emit('arrived',newMessageData);
      }
    })
  })  
});

