const mongoose = require('mongoose');

const PdfSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  pdf: {
    type: String,
    required: true,
  },
});

const PdfSchemaModel = mongoose.model('Pdfdetails', PdfSchema);
module.exports = PdfSchemaModel;

