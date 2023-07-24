const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    console.log("hello");
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    console.log("hello from multer");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    cb(null, filename + "-" + uniqueSuffix + ".png");
  },
});

exports.upload = multer({ storage });
