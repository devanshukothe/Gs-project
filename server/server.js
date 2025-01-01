const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const PdfSchemaModel = require("./PdfDetails");

const dbPassword = encodeURIComponent("momdaddk21");
const dbURI = `mongodb+srv://devanshukothe123:${dbPassword}@permission-app.qyvm4.mongodb.net/Permission-App?retryWrites=true&w=majority`;

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to database"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "PUT", "POST", "DELETE"],
  credentials: true,
}));

let gfsBucket;
mongoose.connection.once("open", () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "pdfs" });
  console.log("GridFSBucket initialized");
});

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload file to GridFS
app.post("/upload-files", upload.single("file"), (req, res) => {
  const { title } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  const uploadStream = gfsBucket.openUploadStream(file.originalname, {
    contentType: file.mimetype,
  });

  uploadStream.end(file.buffer);

  uploadStream.on("finish", async () => {
    try {
      await PdfSchemaModel.create({ title: title, pdf: file.originalname });
      res.status(200).send({ status: "ok" });
    } catch (err) {
      res.status(500).send({ status: "error", message: err.message });
    }
  });

  uploadStream.on("error", (err) => {
    res.status(500).send({ status: "error", message: err.message });
  });
});

// Retrieve a file by filename
app.get("/get-file/:filename", (req, res) => {
  const { filename } = req.params;

  gfsBucket.find({ filename }).toArray((err, files) => {
    if (err || files.length === 0) {
      return res.status(404).json({ status: "error", message: "File not found" });
    }

    const file = files[0];
    const downloadStream = gfsBucket.openDownloadStreamByName(filename);

    res.set("Content-Type", file.contentType);
    downloadStream.pipe(res);
  });
});

// Retrieve all files metadata
app.post("/get-files", async (req, res) => {
  const {names} = req.body;
  try {
    let metadata;
    // Retrieve all metadata from the database
    if(!names){
      metadata = await PdfSchemaModel.find({});
      if (metadata.length === 0) {
        return res.status(404).json({ status: "error", message: "No files found" });
      }
    }
    else{
      metadata = await PdfSchemaModel.find({pdf:{$in:names}});
      if (metadata.length === 0) {
        return res.status(404).json({ status: "error", message: "No files found" });
      }
    }
    // Prepare an array to store file data along with metadata
    const filesWithMetadata = [];

    for (const data of metadata) {
      // Find the file in GridFS by its filename
      const file = await gfsBucket.find({ filename: data.pdf }).toArray();

      if (file.length > 0) {
        // Read the file content as a buffer
        const downloadStream = gfsBucket.openDownloadStreamByName(data.pdf);

        let fileBuffer = Buffer.alloc(0);
        await new Promise((resolve, reject) => {
          downloadStream.on("data", (chunk) => {
            fileBuffer = Buffer.concat([fileBuffer, chunk]);
          });

          downloadStream.on("end", resolve);
          downloadStream.on("error", reject);
        });

        // Add metadata and file buffer to the response array
        filesWithMetadata.push({
          id:data.id,
          title: data.title,
          filename: file[0].filename,
          contentType: file[0].contentType,
          fileContent: fileBuffer.toString("base64"), // Convert file to Base64 for easier transport
        });
      }
    }

    res.status(200).json({ status: "ok", files: filesWithMetadata });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});


app.listen(5000, () => {
  console.log("Server Started on http://127.0.0.1:5000");
});
