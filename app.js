'use strict';

var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AV = require('leanengine');

// 加载云函数定义，你可以将云函数拆分到多个文件方便管理，但需要在主文件中加载它们
require('./cloud');

var app = express();

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
app.use(AV.Cloud.HttpsRedirect());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(AV.Cloud.CookieSession({ secret: 'my secret', maxAge: 3600000, fetchUser: true }));

app.get('/', function(req, res) {
    if (req.currentUser) {
        res.redirect('/comments');
    } else {
        res.render('index');
    }
});

// 可以将一类的路由单独保存在一个文件中
app.use('/comments', require('./routes/comments'));

// 处理登录请求（可能来自登录界面中的表单）
app.post('/login', function(req, res) {
    if (req.body.username == process.env.SMTP_USER 
        || req.body.username == process.env.TO_EMAIL) {

      AV.User.logIn(req.body.username, req.body.password).then(function(user) {
        res.saveCurrentUser(user); // 保存当前用户到 Cookie
        res.redirect('/comments'); // 跳转到个人资料页面
      }, function(error) {
          //登录失败，跳转到登录页面
          res.redirect('/');
      });

    } else {
      res.redirect('/');
    }
    
});

// 登出账号
app.get('/logout', function(req, res) {
    req.currentUser.logOut();
    res.clearCurrentUser(); // 从 Cookie 中删除用户
    res.redirect('/');
});

app.use(function(req, res, next) {
    // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
    if (!res.headersSent) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    }
});
// error handlers
app.use(function(err, req, res, next) {
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  if (req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {};
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

app.locals.dateFormat = function (date) {
    var vDay = padWithZeros(date.getDate(), 2);
    var vMonth = padWithZeros(date.getMonth() + 1, 2);
    var vYear = padWithZeros(date.getFullYear(), 2);
    var vHour = padWithZeros(date.getHours(), 2);
    var vMinute = padWithZeros(date.getMinutes(), 2);
    var vSecond = padWithZeros(date.getSeconds(), 2);
    // return `${vYear}-${vMonth}-${vDay}`;
    return `${vYear}-${vMonth}-${vDay} ${vHour}:${vMinute}:${vSecond}`;
};

const padWithZeros = (vNumber, width) => {
    var numAsString = vNumber.toString();
    while (numAsString.length < width) {
        numAsString = '0' + numAsString;
    }
    return numAsString;
};

module.exports = app;
