const AV = require('leanengine');
const mail = require('./utilities/send-mail');
const Comment = AV.Object.extend('Comment');
const request = require('request');
const spam = require('./utilities/check-spam');

async function sendNotification(currentComment, defaultIp) {
    // 发送博主通知邮件
    if (currentComment.get('mail') !== process.env.BLOGGER_EMAIL) {
        mail.notice(currentComment);
    }

    let ip = currentComment.get('ip') || defaultIp;
    console.log('IP: %s', ip);
    await spam.checkSpam(currentComment, ip);

    // AT评论通知
    let rid = currentComment.get('pid') || currentComment.get('rid');

    if (!rid) {
        console.log("这条评论没有 @ 任何人");
        return;
    } else if (currentComment.get('isSpam')) {
        console.log('评论未通过审核，通知邮件暂不发送');
        return;
    }

    let query = new AV.Query('Comment');
    let parentComment = await query.get(rid).catch(err => {
        return console.warn('获取@对象失败！');
    });
    if (parentComment.get('mail') && parentComment.get('mail') !== process.env.BLOGGER_EMAIL) {
        mail.send(currentComment, parentComment);
    } else {
        console.log('被@者匿名，不会发送通知');
    }
}

AV.Cloud.afterSave('Comment', function (req) {
    let currentComment = req.object;
    // 检查垃圾评论
    return sendNotification(currentComment, req.meta.remoteAddress);
});

AV.Cloud.define('resend_mails', function (req) {
    let query = new AV.Query(Comment);
    query.greaterThanOrEqualTo('createdAt', new Date(new Date().getTime() - 24 * 60 * 60 * 1000));
    query.notEqualTo('isNotified', true);
    // 如果你的评论量很大，可以适当调高数量限制，最高1000
    query.limit(200);
    return query.find().then(function (results) {
        new Promise((resolve, reject) => {
            count = results.length;
            for (var i = 0; i < results.length; i++) {
                sendNotification(results[i], req.meta.remoteAddress);
            }
            resolve(count);
        }).then((count) => {
            console.log(`昨日${count}条未成功发送的通知邮件处理完毕！`);
        }).catch(() => {

        });
    });
});

AV.Cloud.define('self_wake', function (req) {
    request(process.env.ADMIN_URL, function (error, response, body) {
        console.log('自唤醒任务执行成功，响应状态码为:', response && response.statusCode);
    });
});