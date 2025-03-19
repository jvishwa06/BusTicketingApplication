const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true },
    busType: { type: String, enum: ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater'], required: true },
    seatLayout: { type: [[String]], required: true }, 
    amenities: { type: [String], enum: ['Wi-Fi', 'Charging Ports', 'Water Bottles', 'Bedsheets', 'Pillow'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });
  
  busSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
  
  module.exports = mongoose.model('Bus', busSchema);
  