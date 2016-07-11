var config = require('./config')
var express = require('express')
var authMiddleware = require('./middleware/auth')


var app = express();

app.use(authMiddleware.userAuth)

app.get('/', function (req, res) {
  res.send('hello world')
})

app.listen(config.web_app_port, function () {
  console.log(`${new Date}, app is listening at ${config.web_app_port}`)
});
