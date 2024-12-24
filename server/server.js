const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const dbPassword = encodeURIComponent('momdaddk21'); // Encode password for URI safety
const dbURI = `mongodb+srv://devanshukothe123:${dbPassword}@permission-app.qyvm4.mongodb.net/Permission-App?retryWrites=true&w=majority`;

mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a Mongoose schema and model
const userSchema = new mongoose.Schema({
  name:String,
  age:Number,
});
const User = mongoose.model('User', userSchema);

// Define routes
app.get('/', (req, res) => {
  res.send('Server is running.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
