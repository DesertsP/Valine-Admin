'use strict';
const akismet = require('akismet-api');
const akismetClient = akismet.client({
    key  : process.env.AKISMET_KEY,
    blog : process.env.SITE_URL
});

exports.checkSpam = (comment)=> {
    akismetClient.verifyKey(function(err, valid) {
        if (err) console.log('Akismet key 异常:', err.message);
        if (valid) {
            let ipAddr = comment.get('ip');
            console.log('评论者的IP是: ' + ipAddr);
            akismetClient.checkSpam({
                user_ip : ipAddr,
                user_agent : comment.get('ua'),
                referrer : process.env.SITE_URL + comment.get('url'),          // TODO(1) 这里有缺陷
                permalink : process.env.SITE_URL + comment.get('url'),  // TODO(2) 这里有缺陷
                comment_type : 'comment',
                comment_author : comment.get('nick'),
                comment_author_email : comment.get('mail'),
                comment_author_url : comment.get('link'),
                comment_content : comment.get('comment'),
                // is_test : true // Default value is false
            }, function(err, spam) {
                if (err) console.log ('垃圾检测出错！');
                if (spam) {
                    console.log('逮到一只垃圾，烧死它！用文火~');
                    comment.set('isSpam', true);
                    comment.save();
                    // comment.destroy();
                } else {
                    console.log('放行~完事！\n');
                }
            });
        }
        else console.log('Akismet key 异常!');
    });
};

exports.submitSpam = (comment)=> {
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
