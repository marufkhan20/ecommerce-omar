const express = require("express");
const app = express();
const dotenv = require("dotenv");
const ErrorHandler = require("./middlewares/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

// import routes
const user = require("./controllers/userController");
const shop = require("./controllers/shopController");

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use("/", express.static("public"));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// config
if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: "config/.env",
  });
}

// use routes
app.use("/api/v2/user", user);
app.use("/api/v2/shop", shop);

app.use("/", (req, res) => {
  res.render("/index.html");
});

// It's for error handling
app.use(ErrorHandler);

module.exports = app;
