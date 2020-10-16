'use strict';
const router = require('express').Router();
const AV = require('leanengine');
const mail = require('../utilities/send-mail');
const spam = require('../utilities/check-spam');

const Comment = AV.Object.extend('Comment');
const Notifications = AV.Object.extend('Notifications');

// Comment 列表
router.get('/', function (req, res, next) {

    updateCommentByNotifications(req);

    if (req.currentUser) {
        let query = new AV.Query(Comment);
        query.descending('createdAt');
        query.limit(50);
        query.find().then(function (results) {
            res.render('comments', {
                title: process.env.SITE_NAME + '上的评论',
                comment_list: results
            });
        }, function (err) {
            if (err.code === 101) {
                res.render('comments', {
                    title: process.env.SITE_NAME + '上的评论',
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

let updateCommentByNotifications = (req) => {
    //因为专门给定时任务用的发送邮件通知模块没有权限更新Comment表数据，所以发送日志单独存了一张Notifications表
    //用户登录后台这边是有权限的更新Comment了，这里就根据Notifications表发送记录把Comment的isNotified更新为true
    if (req.currentUser) {
        let commentQuery = new AV.Query(Comment);
        commentQuery.notEqualTo('isNotified', true);
        // 如果你的评论量很大，可以适当调高数量限制，最高1000
        commentQuery.limit(200);
        commentQuery.find().then(function (comments) {
            new Promise((resolve, reject)=>{
                let count = 0
                for (var i = 0; i < comments.length; i++ ) {
                      let queryNotifications = new AV.Query(Notifications);
                      let comment = comments[i];
                      queryNotifications.equalTo('commentId', comment.get('objectId'));
                      queryNotifications.find().then(function(notifications){
                      let countNotifications = notifications.length;
                      if (countNotifications > 0) {
                            comment.set('isNotified', true);
                            comment.save();
                            count++;
                      }
                  }).catch( (error) => {
                      console.error('查询发送邮件日志报错',error);
                  });
                };
                resolve(count);
            }).then((count)=>{
                console.log(`${count}条定时任务发送邮件记录更新至Comment！`);
            });
        }).catch((error)=>{
            console.error('查询Comment报错',error);
        });
    } else {
        res.redirect('/');
    };
};

router.get('/resend-email', function (req, res, next) {
    if (req.currentUser) {
    let query = new AV.Query(Comment);
    query.get(req.query.id).then(function (object) {
        query.get(object.get('rid')).then(function (parent) {
                mail.send(object, parent);
                res.redirect('/comments')
            }, function (err) {
            }
        ).catch(next);
    }, function (err) {
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

router.get('/not-spam', function (req, res, next) {
    if (req.currentUser) {
        let query = new AV.Query(Comment);
        query.get(req.query.id).then(function (object) {
            object.set('isSpam', false);
            object.set('ACL', {"*":{"read":true}} );
            object.save();
            spam.submitHam(object);
            res.redirect('/comments')
        }, function (err) {
        }).catch(next);
    } else {
        res.redirect('/');
    }
});
router.get('/mark-spam', function (req, res, next) {
    if (req.currentUser) {
        let query = new AV.Query(Comment);
        query.get(req.query.id).then(function (object) {
            object.set('isSpam', true);
            object.set('ACL', {"*":{"read":false}} );
            object.save();
            spam.submitSpam(object);
            res.redirect('/comments')
        }, function (err) {
        }).catch(next);
    } else {
        res.redirect('/');
    }
});

module.exports = router;
