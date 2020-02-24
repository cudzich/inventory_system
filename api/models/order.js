const mongoose = require('mongoose');
let Schema = mongoose.Schema;
let Item = require('../models/item');
let ItemSchema = require('mongoose').model('Item').schema;

const orderSchema = mongoose.Schema({
  header: {
    type: Number,
    required: true
  },
  items: [],
  timestamp: {
    type: Date,
    default: Date.now
  },
})

module.exports = mongoose.model('Order', orderSchema);
