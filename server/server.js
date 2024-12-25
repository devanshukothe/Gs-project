const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
const multer = require("multer");
const PdfSchemaModel = require("./PdfDetails");
//mongodb connection----------------------------------------------
const dbPassword = encodeURIComponent("momdaddk21"); // Encode password for URI safety
const dbURI = `mongodb+srv://devanshukothe123:${dbPassword}@permission-app.qyvm4.mongodb.net/Permission-App?retryWrites=true&w=majority`;

mongoose.connect(dbURI, {
  useNewUrlParser: true,
})
.then(() => {
  console.log("Connected to database");
})
.catch((e) => console.log(e));

app.use(cors({
  origin:"http://localhost:5173",
  methods:["GET","PUT","POST","DELETE"],
  credentials:true
}));

app.use("/files", express.static("files"));

//multer------------------------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload-files", upload.single("file"), async (req, res) => {
  console.log(req.file);
  const title = req.body.title;
  const fileName = req.file.filename;
  try {
    await PdfSchemaModel.create({ title: title, pdf: fileName });
    res.send({ status: "ok" });
  } catch (error) {
    res.json({ status: error });
  }
});

app.get("/get-files", async (req, res) => {
  try {
    PdfSchemaModel.find({}).then((data) => {
      res.send({ status: "ok", data: data });
    });
  } catch (error) {}
});
app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});

app.listen(5000, () => {
  console.log("Server Started on http://127.0.0.1:5000");
});
