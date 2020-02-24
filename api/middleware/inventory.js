let Product = require('../models/product');
let Order = require('../models/order');

let is_inv_initialized = async (req, res, next) => {

  try {
    const products = await Product.find( { qty_available: null } );
    if(products.length > 0) {
      req.app.set('is_inv_initialized', false);
      res.status(200).json({
        response: 'error',
        is_inv_initialized: false,
        products: products
      });
    } else  {
      req.app.set('is_inv_initialized', true);
      next()
    }
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }

}

let is_inv_zero = async (req, res, next) => {

  try {
    const products = await Product.find( { qty_available: { $ne: 0 } } );
    if(products.length > 0) {
      req.app.set('is_inv_zero', false);
      next();
    } else  {
      // Here we reply with all orders and line items [ordered, alloc, backord]
      console.log('Inventory is sold out, retrieving all order details')
      req.app.set('is_inv_zero', true);
      let orders = await Order.find();
      let products = await Product.find();

      let formatted_results = [];
      orders.forEach(function (order) {
        let requested = [];
        let allocated = [];
        let backordered = [];
        console.log(order);
        products.forEach(function (product) {
          console.log(order.items);
          let item = order.items.find(i => product._id == i.product);
          if (typeof item === 'undefined') {
            requested.push(0);
            allocated.push(0);
            backordered.push(0);
          } else {
            requested.push((item.qty || 0));
            allocated.push((item.status == 'allocated' ? item.qty : 0));
            backordered.push((item.status == 'backordered' ? item.qty : 0));
          }
        });

        let result = {
          Header: order.header,
          id: order._id,
          Lines: {
            requested: requested,
            allocated: allocated,
            backordered: backordered
          }
        };
        formatted_results.push(result);
      });

      res.status(200).json(  {
        response: 'success',
        is_inv_zero: true,
        message: 'Inventory is sold out',
        order_count: products.length,
        orders: formatted_results
      })
    }
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }

}

module.exports = { is_inv_initialized, is_inv_zero, };
