let mongoose = require('mongoose');
let express    = require('express');
let router   = express.Router();

let Product = require('../models/product');

router.get('/', (req, res, next) => {
  Product.find()
    .select('_id qty_available qty_backordered timestamp')
    .exec()
    .then(products => {
      let response = {
        response: 'success',
        count: products.length,
        products: products.map(product => {
          return {
            name: product._id,
            qty_available: product.qty_available,
            qty_backordered: product.qty_backordered,
            timestamp: product.timestamp,
            request: {
              type: 'GET',
              url: 'products/' + product._id
            }
          }
        })
      }
      if(products.length > 0) {
        res.status(200).json(response);
      } else  {
        res.status(404).json(  {
          response: 'not_found',
          message: 'No entires found'
        })
      }
    })
    .catch(err  =>  {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

router.post('/', (req, res, next) => {
  let product = new Product ({
    _id: req.body.product,
    qty_available:  req.body.quantity
  });

  product.save()
    .then(result => {
      console.log(result);
      res.status(201).json({
        response: 'success',
        message:  'Product succesfully created',
        date: result
      })
    }).catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

router.get('/:id', (req, res, next) => {
  let id = req.params.id;

  let product = Product.findById(id)
  .select('_id qty_available qty_backordered timestamp')
  .exec()
  .then(product => {
    if(product) {
      let response = {
        response: 'success',
        product: {
            name: product._id,
            qty_available: product.qty_available,
            qty_backordered: product.qty_backordered,
            timestamp: product.timestamp
          }
      }
      res.status(200).json(response);
    } else  {
      res.status(404).json(  {
        response: 'not_found',
        message: 'No entires found'
      })
    }
  })
  .catch(err  =>  {
    console.log(err);
    res.status(500).json({
      error: err
    });
  });
});

router.patch('/', async (req, res, next) => {
  console.log('Validating input');
  let products = req.body.Products
  if (Array.isArray(products)) {
    try {
      let errorList = [];
      let cursor = await Product
        .find({
          '_id': products.map( product => {
            return product.product
          })
        })
        .cursor();

        await cursor.eachAsync(async function( product ) {
          let item = products.find(i => product._id == i.product);
          console.log(item);

          let update = { qty_available: item.qty };
          await product.updateOne(update);
        })

        res.status(200).json({
          status: 'success',
          message: 'Quantities for given valid products have been updated'
        })
    } catch (err) {
      res.status(500).json({
        status: 'fail - failed',
        message: err
      });
    }
  } else {
    res.status(412).json({
      status: 'error',
      message: 'Body request does not contain an array of Products'
    })
  }


});

module.exports = router;
