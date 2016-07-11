var basicAuth = require('basic-auth')
var config = require('../config')


exports.userAuth = function (req, res, next) {
  var credentials = basicAuth(req)

  if (!credentials ||
    !config.account.hasOwnProperty(credentials.name) ||
    config.account[credentials.name] !== credentials.pass
  ) {
    res.status(401)
    res.set('WWW-Authenticate', 'Basic realm="example"')
    res.send('Access denied')
    return
  }

  next()
}
