let mongoose = require('mongoose');

let itemSchema = mongoose.Schema({
  product: {  type: String },
  qty:  {
    type: Number,
    min: 1,
    max:5
  },
  status: { type: String },
  timestamp: { type: Date, default: Date.now},
})



module.exports = mongoose.model('Item', itemSchema);
