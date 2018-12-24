'use strict';
const router = require('express').Router();
const AV = require('leanengine');
const Comment = AV.Object.extend('Comment');

// Comment 列表
router.get('/', function (req, res, next) {
    if (req.currentUser) {
        let query = new AV.Query(Comment);
        query.descending('createdAt');
        query.limit(50);
        query.find().then(function (results) {
            res.render('comments', {
                title: process.env.SITE_NAME + '上的评论',
                domain: process.env.SITE_URL,
                comment_list: results
            });
        }, function (err) {
            if (err.code === 101) {
                res.render('comments', {
                    title: process.env.SITE_NAME + '上的评论',
                    domain: process.env.SITE_URL,
                    comment_list: []
                });
            } else {
                next(err);
            }
        }).catch(next);
    } else {
        res.redirect('/');
    }
});


router.get('/delete', function (req, res, next) {
    if (req.currentUser) {
        let query = new AV.Query(Comment);
        query.get(req.query.id).then(function (object) {
            object.destroy();
            res.redirect('/comments')
        }, function (err) {
        }).catch(next);
    } else {
        res.redirect('/');
    }
});

module.exports = router;
