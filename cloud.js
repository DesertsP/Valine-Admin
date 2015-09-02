var AV = require('leanengine');

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function(request, response) {
  response.success('Hello world!');
});

var EchoTime = AV.Object.extend("EchoTime");

AV.Cloud.define('createObjectTimer', function(request, response) {
    var echo = new EchoTime();
    echo.set('type', 'createObject');
    echo.set('description', 'POST classes/EchoTime');
    echo.set('start', new Date());
    echo.save(null, {
        success: function(echo) {
            echo.set('end', new Date());
            echo.set('delta', echo.get('end') - echo.get('start'));
            echo.save();
            response.success(echo);
        },
        error: function(echo, err) {
            response.error(err);
        }});
});

AV.Cloud.define('fileOpsTimer', function(request, response) {
    // create a file: POST files/{filename}
    var file   = new AV.File('hello.txt', new Buffer("Hello world!"));

    var startSave = new Date();
    file.save().then(function(f) {
        var end  = new Date();
        var echo = new EchoTime();
        echo.save({
            type: 'createFile',
            description: 'POST files/{filename}',
            start: startSave,
            end: end,
            delta: end - startSave,
        });

        var startDelete = new Date();
        f.destroy().then(function() {
            var end  = new Date();
            var echo = new EchoTime();
            echo.save({
                type: 'deleteFile',
                description: 'DELETE files/{filename}',
                start: startDelete,
                end: end,
                delta: end - startDelete,
            });
            response.success(echo);
        }, function(err) {
            response.error(err);
        });

    }, function(err) {
        response.error(err);
    });
});

AV.Cloud.define('runFunctionTimer', function(request, response) {
    var start = new Date();
    AV.Cloud.run('hello', {}, {
        success: function(result) {
            var end  = new Date();
            var echo = new EchoTime();
            echo.save({
                type: 'runFunction',
                description: 'POST functions/hello',
                start: start,
                end: end,
                delta: end - start,
            });
            response.success(echo);
        },
        error: function(error) {
            response.error(error);
        }
    });
});

module.exports = AV.Cloud;
