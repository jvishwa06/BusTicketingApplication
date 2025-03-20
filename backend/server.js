const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const operatorRoutes = require('./routes/operatorRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(5000, () => {
      console.log('Server running on port 5000');
    });
  })
  .catch((err) => console.log(err));
