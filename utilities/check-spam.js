'use strict';
const AV = require('leanengine');
const akismet = require('akismet-api');
const akismetClient = akismet.client({
    key  : process.env.AKISMET_KEY,
    blog : process.env.SITE_URL
});

exports.checkSpam = (comment, ip)=> {
    if (process.env.AKISMET_KEY === 'MANUAL_REVIEW') {
        console.log('已使用人工审核模式，评论审核后才会发表~');
        comment.setACL(new AV.ACL({"*":{"read":false}}));
        comment.set('isSpam', true);
        comment.save();
        return;
    }
    akismetClient.verifyKey(function(err, valid) {
        if (err) console.log('Akismet key 异常:', err.message);
        if (valid) {
            // TODO(1) 这里有缺陷
            comment.set('ip', ip);
            akismetClient.checkSpam({
                user_ip : ip,
                user_agent : comment.get('ua'),
                referrer : process.env.SITE_URL + comment.get('url'),
                permalink : process.env.SITE_URL + comment.get('url'),
                comment_type : 'comment',
                comment_author : comment.get('nick'),
                comment_author_email : comment.get('mail'),
                comment_author_url : comment.get('link'),
                comment_content : comment.get('comment'),
                // is_test : true // Default value is false
            }, function(err, spam) {
                if (err) console.log (`垃圾评论检测出错！${err}`);
                if (spam) {
                    console.log('逮到一只垃圾评论，烧死它！用文火~');
                    comment.set('isSpam', true);
                    comment.setACL(new AV.ACL({"*":{"read":false}}));
                    comment.save();
                    // comment.destroy();
                } else {
                    comment.set('isSpam', false);
                    comment.setACL(new AV.ACL({"*":{"read":true}}));
                    comment.save();
                    console.log('垃圾评论检测完成，放行~');
                }
            });
        }
        else console.log('Akismet key 异常!');
    });
};
exports.submitSpam = (comment)=> {
    if (process.env.AKISMET_KEY === 'MANUAL_REVIEW') {
        return;
    }
    akismetClient.verifyKey(function(err, valid) {
        if (err) console.log('Akismet key 异常:', err.message);
        if (valid) {
            let ipAddr = comment.get('ip');
            akismetClient.submitSpam({
                user_ip : ipAddr,
                user_agent : comment.get('ua'),
                referrer : process.env.SITE_URL + comment.get('url'),
                permalink : process.env.SITE_URL + comment.get('url'),
                comment_type : 'comment',
                comment_author : comment.get('nick'),
                comment_author_email : comment.get('mail'),
                comment_author_url : comment.get('link'),
                comment_content : comment.get('comment'),
                // is_test : true // Default value is false
            }, function(err) {
                if (!err) {
                    console.log('垃圾评论已经提交!');
                }
            });
        }
        else console.log('Akismet key 异常!');
    });
};
exports.submitHam = (comment)=> {
    if (process.env.AKISMET_KEY === 'MANUAL_REVIEW') {
        return;
    }
    akismetClient.verifyKey(function(err, valid) {
        if (err) console.log('Akismet key 异常:', err.message);
        if (valid) {
            let ipAddr = comment.get('ip');
            akismetClient.submitHam({
                user_ip : ipAddr,
                user_agent : comment.get('ua'),
                referrer : process.env.SITE_URL + comment.get('url'),
                permalink : process.env.SITE_URL + comment.get('url'),
                comment_type : 'comment',
                comment_author : comment.get('nick'),
                comment_author_email : comment.get('mail'),
                comment_author_url : comment.get('link'),
                comment_content : comment.get('comment'),
                // is_test : true // Default value is false
            }, function(err) {
                if (!err) {
                    console.log('评论已经标记为非垃圾!');
                }
            });
        }
        else console.log('Akismet key 异常!');
    });
};
