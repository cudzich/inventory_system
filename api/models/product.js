let mongoose = require('mongoose');

let productSchema = mongoose.Schema({
  _id: { type: String, required: true },
  qty_available:  { type: Number, default: null },
  qty_backordered: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now},
})

module.exports = mongoose.model('Product', productSchema);
