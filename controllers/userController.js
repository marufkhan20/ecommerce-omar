const express = require("express");
const path = require("path");
const { upload } = require("../multer");
const User = require("../models/User");
const ErrorHandler = require("../utils/ErrorHandler");
const router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated } = require("../middlewares/auth");

// create new user
router.post("/create-user", upload.single("file"), async (req, res, next) => {
  const { name, email, password } = req.body || {};

  // check email dublications
  const userEmail = await User.findOne({ email });

  if (userEmail) {
    // delete uploaded image
    const filename = req.file.filename;
    const filePath = `uploads/${filename}`;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error deleting file" });
      }
    });

    return next(new ErrorHandler("User already exists", 400));
  }

  // get file
  const filename = req.file.filename;
  const fileUrl = path.join(filename);
  const avatar = `uploads/${fileUrl}`;

  // create new user
  const user = {
    name,
    email,
    password,
    avatar,
  };

  // generate activation token
  const activationToken = createActivationToken(user);

  const activationUrl = `${process.env.CLIENT_URL}/activation/${activationToken}`;

  try {
    await sendMail({
      email,
      subject: "Activate your account",
      message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
    });

    res.status(201).json({
      success: true,
      message: `Please check your email:- ${email} to activate your account`,
    });
  } catch (err) {
    console.log("err", err);
    return next(new ErrorHandler(err.message, 500));
  }
});

// create activation token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("hello");

      const { activationToken } = req.body || {};

      const newUser = jwt.verify(
        activationToken,
        process.env.ACTIVATION_SECRET
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid activation token", 400));
      }

      const { name, email, password, avatar } = newUser || {};

      // check user validation
      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }

      // create new user
      user = await User.create({ name, email, password, avatar });

      // send resonse with cookies
      sendToken(user, 201, res);
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  })
);

// login user controller
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body || {};

      // find user
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      // check is password valid
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information!", 400)
        );
      }

      sendToken(user, 200, res);
    } catch (err) {
      console.log("error", err);
      next(new ErrorHandler(err.message, 500));
    }
  })
);

// load user
router.get(
  "/get-user",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exits!", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(new ErrorHandler(err.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });

      res.status(200).json({
        success: true,
        message: "Log out Successful",
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
