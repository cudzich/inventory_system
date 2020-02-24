let mongoose = require('mongoose');
let express    = require('express');
let router   = express.Router();

let Order = require('../models/order');
let Item = require('../models/item');
let Product  = require('../models/product');

router.get('/', (req, res, next) => {
  var is_inv_zero = req.app.get('is_inv_zero');
  var is_inv_initialized = req.app.get('is_inv_initialized');


  Order.find()
    .select('_id header items timestamp')
    .exec()
    .then(orders =>  {
      if(orders.length > 0) {
        let response = {
          response: 'success',
          is_inv_zero: is_inv_zero,
          is_inv_initialized: is_inv_initialized,
          count_of_orders: orders.length,
          orders: orders.map(order => {
            return {
              id: order._id,
              header: order.header,
              items: order.items,
              timestamp: order.timestamp,
              request: {
                type: 'GET',
                url: 'orders/' + order._id
              }
            }
          })
        }
        res.status(200).json(response)
      } else {
        res.status(200).json( {
          response: 'success',
          message: 'No entires found'
        })
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
  });

router.get('/:id', (req, res, next) => {
  var is_inv_zero = req.app.get('is_inv_zero');
  var is_inv_initialized = req.app.get('is_inv_initialized');
  let order_id = req.params.id;

  // Verify database _id format
  if (order_id.match(/^[0-9a-fA-F]{24}$/)) {
    Order.findById(order_id)
      .select('_id header items timestamp')
      .exec()
      .then(order =>  {
        console.log(order);
        if(order) {
          let response = {
            response: 'success',
            is_inv_zero: is_inv_zero,
            is_inv_initialized: is_inv_initialized,
            order: {
                id: order._id,
                header: order.header,
                items: order.items,
                timestamp: order.timestamp,
              }
          }
          res.status(200).json(response)
        } else {
          res.status(404).json( {
            response: 'error',
            message: 'Order not found',
            params: req.params
          })
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  } else {
    res.status(412).json({
      status: 'error',
      message: '_id param is not in a valid format',
      params: req.params
    })
  }
});

router.post('/', async (req, res, next) => {
  let order = req.body;

  try {
    console.log('Validating Order');
    let errorList = [];
    let newOrder = new Order( {
      header: order.Header
    } )
    let error = newOrder.validateSync();
    if(error) {
      errorList.push(error);
    }

    let orderItems = [];

    console.log('Validating Order Items')
    order.Lines.forEach( line => {
      newItem = new Item( {
        product: line.Product,
        qty: line.Quantity,
        status: 'allocated'
      })

      let error = newItem.validateSync();
      if(error) {
        errorList.push(error);
      } else {
        newOrder.items.push(newItem);
      }
    })

    if(errorList.length > 0) {
      res.status(412).json({
        status: 'error',
        data: errorList
      })
      return
    }
    console.log('Updating Products');
    await updateProducts(newOrder.items).catch(error => console.error(error.stack));

    console.log('Saving Order');
    let savedOrder = await newOrder.save();

    console.log('Checking if inventory sold out');
    await is_inv_zero(req, res, savedOrder);

  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err
    });
  }
})

async function updateProducts( items ) {
  let cursor = await Product
    .find({
      '_id':  items.map( item => {
        return item.product
      })
    })
    .cursor();

    await cursor.eachAsync(async function( product ) {
      let item = items.find(i => product._id == i.product);
      if(product.qty_available >= item.qty){
        product.qty_available = product.qty_available - item.qty;
        item.status = 'allocated';
      } else {
        product.qty_backordered =  product.qty_backordered - item.qty;
        item.status = 'backordered';
      }

      response = await product.save();
    })
}

async function is_inv_zero(req, res, savedOrder) {

  try {
    const products = await Product.find( { qty_available: { $ne: 0 } } );
    if(products.length > 0) {
      console.log('Inventory is not sold out, sending response');
      res.status(200).json({
        status: 'success',
        message: 'order placed successfully',
        order: savedOrder
      })
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
    res.status(500).json({
      status: 'fail - failed',
      message: err
    });
  }

}

module.exports = router;
