var router = require('express').Router();
var AV = require('leanengine');

router.get('/', function(req, res, next) {
    var from = new Date(req.query.from);
    if (req.query.from && from.getYear() > 2000) {
    } else {
        from = new Date();
        from.setHours(from.getHours() - 48); // default to 48 hours ago
    }
    var to = new Date(req.query.to);
    if (req.query.to && to.getYear() > from.getYear()) {
    } else {
        to = new Date();
    }

    from.setHours(from.getHours() - 48); // 48 hours ago
    AV.Query.doCloudQuery(
        "SELECT type, description, start, delta \
         FROM EchoTime \
         WHERE start > date(?) AND start < date(?) ORDER BY start",
        [from.toISOString(), to.toISOString()],
        {
            success: function(result) {
                var rows = [];
                for (var i=0; i < result.results.length; i++) {
                    var echo = result.results[i];
                    rows[i] = {
                        type: echo.get('type'),
                        description: echo.get('description'),
                        start: echo.get('start'),
                        delta: echo.get('delta'),
                        createdAt: echo.getCreatedAt(),
                    };
                }
                res.json(rows);
            }, error: function(err) {
                console.log(err);
                next(err);
            }});
});

module.exports = router;
