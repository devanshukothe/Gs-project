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

const PdfSchemaModel = mongoose.model('PdfDetails', PdfSchema);
module.exports = PdfSchemaModel;

