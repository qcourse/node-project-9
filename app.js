var config = require('./config')
var express = require('express')
var bodyParser = require('body-parser')
var multer = require('multer');
var request = require('request')

var authMiddleware = require('./middleware/auth')


var app = express();
app.set('views', './view')
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}))

app.use('/static', express.static('./static'))
app.use(authMiddleware.userAuth)

app.get('/', function (req, res) {
  res.render('index')
})

app.post('/upload', multer().single('pic_file'), function (req, res) {
  var uploadUrl = config.api_backend + '/upload'

  var picFile = req.file;

  request.post({
    url: uploadUrl,
    formData: {
      image: {
        value: picFile.buffer,
        options: {
          filename: picFile.originalname,
          contentType: picFile.mimetype
        }
      }
    }
  }, function (err, response) {
    if (err) {
      return res.send(err)
    }
    res.redirect('/')
  })


})

app.listen(config.web_app_port, function () {
  console.log(`${new Date}, app is listening at ${config.web_app_port}`)
});
