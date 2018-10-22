'use strict';
const router = require('express').Router();
const AV = require('leanengine');
const User = AV.Object.extend('_User');

// Comment 列表
router.get('/', function (req, res, next) {
    if (req.currentUser) {
        res.redirect('/comments');
    } else {
        let adminMail = process.env.BLOGGER_EMAIL || process.env.SMTP_USER;
        let q = new AV.Query(User);
        q.equalTo('email', adminMail);
        q.find().then(function (results) {
            if (results.length > 0) {
                res.redirect('/');
            }
            else {
                res.render('sign-up', {
                    email: adminMail
                });
            }
        });
    }
});

router.post('/', function (req, res, next) {
    let adminMail = process.env.BLOGGER_EMAIL || process.env.SMTP_USER;
    let q = new AV.Query(User);
    q.equalTo('email', adminMail);
    q.find().then(function (results) {
        if (results.length > 0) {
            res.redirect('/');
        }
        else {
            let user = new AV.User();
            user.setUsername(req.body.username);
            user.setPassword(req.body.password);
            user.setEmail(req.body.email);
            user.signUp().then(function (loginedUser) {
            }, (function (error) {
            }));
            res.redirect('/');
        }
    });
});

module.exports = router;
