var express    = require('express');
const router   = express.Router();

let Product = require('../models/product');
let Order = require('../models/order');

router.get('/', (req, res, next) => {

  var is_inv_zero = req.app.get('is_inv_zero');
  var is_inv_initialized = req.app.get('is_inv_initialized');

  res.status(200).json({
    response: 'success',
    message: 'Status of the application',
    details: {
        is_inv_initialized: is_inv_initialized,
        is_inv_zero: is_inv_zero
    }
  });

});

router.get('/reset', async (req, res, next) => {

  try {
    console.log('Removing Orders..');
    await Order.collection.drop();

    console.log('Clearing products inventory state');
    await Product.updateMany( {}, { $set: { 'qty_available': null, 'qty_backordered': 0 } },
      { multi: true }
    );

    console.log('Resetting application state');
    req.app.set('is_inv_initialized', false);
    req.app.set('is_inv_zero', false);

    res.status(200).json({
      status: 'success',
      message: 'Application state reset, please initialize inventory',
      is_inv_initialized: false,
      is_inv_zero: false,
      request: {
        type: 'PATCH',
        url: '/products'
      }
    })
  } catch (err) {
    res.status(500).json({
      status: 'fail - failed',
      message: err
    });
  }
});

module.exports = router;
/* router.post('/', (req, res, next) => {

  res.status(201).json({
    response: 'success',
    message: 'Main end-point reached',
  });

});

*/
