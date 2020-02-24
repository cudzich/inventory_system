let http       = require('http');
let mongoose   = require('mongoose');
let express    = require('express');
let bodyParser = require('body-parser');
let fs 			   = require('fs');
let dotenv     = require('dotenv');

//  Read in the .env configuration file
dotenv.config();

// Obtain port from environment variable or set defualt value.
const port = process.env.PORT || 80;

console.log('Establishing database database connection...');
mongoose.connect(
  process.env.MONGO_CONNECTION,
  { useUnifiedTopology: true, useNewUrlParser: true }
)

// Instantiate the web framework
var app = express();

app.set('is_inv_initialized', false);
app.set('is_inv_zero', false);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Bring in resources to handle route requests
const mainApi = require('./api/routes/main');
const ordersApi = require('./api/routes/orders');
const itemsApi = require('./api/routes/items');
const productsApi = require('./api/routes/products');

// Bring in resoures to instantiate middleware
const inventoryMiddleware =  require('./api/middleware/inventory');
const is_inv_initialized = inventoryMiddleware.is_inv_initialized;
const is_inv_zero = inventoryMiddleware.is_inv_zero;

// Register routes $ middleware with the application ...
app.use('/',  mainApi);
app.use('/products', productsApi);
app.use('/items', itemsApi);
app.use('/orders', [is_inv_initialized, is_inv_zero], ordersApi);

// Route not found (404)
app.use(function(req, res, next) {
  var message = 'Route: '+req.url+' Not found.';
  res.status(404).json({
    message: message
  });
});

// Obtain request from the server through a listener
// Express application qualifies as the reqest handler.
const server = http.createServer(app).listen(port, function(){
  console.log('Listening on port: ' + port);
});
