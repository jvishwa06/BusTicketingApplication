const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); 

const User = require('./models/User'); 

const app = express();
const port = 5000; 

// Middleware to parse incoming JSON requests
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.log("Error connecting to MongoDB", err));

app.post('/api/users', async (req, res) => {
  try {
    const { email, phone, password_hash, name, address } = req.body;

    const newUser = new User({
      email,
      phone,
      password_hash,
      name,
      address,
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser); // Respond with the newly created user
  } catch (error) {
    console.error('Error creating user', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});