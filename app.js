var config = require('./config')
var express = require('express')
var bodyParser = require('body-parser')
var multer = require('multer');
var request = require('request')
var qsLib = require('qs')
var _ = require('lodash')
var session = require('express-session')
var flash = require('connect-flash');
var yaqrcode = require('yaqrcode');

var authMiddleware = require('./middleware/auth')


var app = express();
app.set('views', './view')
app.set('view engine', 'ejs');


app.use('/static', express.static('./static'))
app.use(authMiddleware.userAuth)

app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
  secret: 'project-9',
}))
app.use(flash());

app.use(function (req, res, next) {
  res.locals.tabname = res.locals.tabname || '';
  next()
})

app.get('/', function (req, res) {
  res.render('index', {
    tabname: 'upload'
  })
})


app.post('/upload', multer().single('pic_file'), function (req, res) {
  var uploadUrl = config.api_backend + '/upload'
  var metaUrl = config.api_backend + '/meta'

  var picFile = req.file;

  request.post({
    url: uploadUrl,
    formData: {
      image: {
        value: picFile.buffer,
        options: {
          filename: req.body.pic_name || picFile.originalname,
          contentType: picFile.mimetype
        }
      }
    }
  }, function (err, response) {
    if (err) {
      return res.send(err)
    }

    var fileInfo = JSON.parse(response.body).fileInfo

    request.post({
      url: metaUrl,
      body: {
        id: fileInfo._id,
        meta: {
          labels: req.body.pic_labels.split(','),
          alt: req.body.pic_alt,
        }
      },
      json: true,
    }, function (err, response) {
      if (err) {
        return res.send(err)
      }
      res.send(response.body)
    })
  })
})

app.get('/showlist', function (req, res) {
  var listUrl = config.api_backend + '/list'

  var search = req.query.search;

  if (search) {
    listUrl = `${listUrl}?${qsLib.stringify({search: search})}`
  }

  request(listUrl, function (err, response) {
    var listInfo = JSON.parse(response.body);

    var labels = listInfo.list.map(function (picInfo) {
      var labels = picInfo.meta.labels;
      if (!labels) {
        return []
      }
      return labels;
    })

    labels = _.flatten(labels);
    labels = _.uniq(labels)
    
    res.render('list', {
      list: listInfo.list.reverse(),
      labels: labels,
      tabname: 'showlist',
      info: req.flash('info')
    })
  })
})

app.get('/showpic/:picid', function (req, res) {
  var listUrl = config.api_backend + '/list'

  request(listUrl, function (err, response) {
    var listInfo = JSON.parse(response.body);

    var picInfo = _.find(listInfo.list, {_id: req.params.picid})

    var picUrl = config.my_main_page + req.originalUrl

    var picUrlBase64 = yaqrcode(picInfo.url, {
      size: 200
    })

    res.render('pic_detail', {
      picInfo: picInfo,
      picUrlBase64: picUrlBase64,
    })
  })
})


app.post('/delpic', function (req, res) {
  var picid = req.body.picid;

  var delUrl = config.api_backend + '/delete'

  request.post({
    url: delUrl,
    json: true,
    body: {
      id: picid
    }
  }, function (err, response) {
    if (err) {
      return res.send(err);
    }

    req.flash('info', '删除成功！')

    res.redirect('/showlist')
  })
})

app.listen(config.web_app_port, function () {
  console.log(`${new Date}, app is listening at ${config.web_app_port}`)
});
