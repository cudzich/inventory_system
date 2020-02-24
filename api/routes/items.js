let mongoose = require('mongoose');
let express    = require('express');
let router   = express.Router();

let Order = require('../models/order');
let Item = require('../models/item');
let Product  = require('../models/product');

router.get('/', (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'reached items endpoint'
  })
})

module.exports = router;
