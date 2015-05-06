var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

// 需要引入 `leanengine-sdk` 模块，该模块扩展了 JS-SDK 中的 AV 对象，
// 增加了云代码的一些支持。
var AV = require('leanengine-sdk');

var APP_ID = process.env.LC_APP_ID;
var APP_KEY = process.env.LC_APP_KEY;
var MASTER_KEY = process.env.LC_APP_MASTER_KEY;
AV.initialize(APP_ID, APP_KEY, MASTER_KEY);

var todos = require('./routes/todos');
var cloudFunctions = require('./cloudFunctions');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 加载云代码方法
app.use(cloudFunctions);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);

app.get('/', function(req, res) {
  res.render('index', { currentTime: new Date() })
})

/**
 * 健康监测
 * LeanEngine 会根据 `/1.1/ping` 判断应用是否正常运行。
 * 如果返回状态码为 200 则认为正常。
 * 其他状态码或者超过 5 秒没有响应则认为应用运行异常。
 */
app.get('/1.1/ping', function(req, res) {
  // 可以在这里根据需要增加一些状态监测的逻辑，但检测耗时不要超过 5 秒。
  // 如果监测逻辑时异步的，则需要在回调内调用 res.send()
  res.send('pong');
});

app.use(function(err, req, res, next) {
  console.error(err.stack || err.message);
  res.status(500).send('Something broke!');
});

// 端口一定要从环境变量 `LC_APP_PORT` 中获取。
// 云代码运行时会分配端口并赋值到该变量。
var port = parseInt(process.env.LC_APP_PORT || 3000);
var server = app.listen(port, function () {
  console.log('Node app is running at localhost:', port);
});
