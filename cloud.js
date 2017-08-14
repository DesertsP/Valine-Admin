const AV = require('leanengine');
const mail = require('./utilities/send-mail');
const spam = require('./utilities/check-spam');

AV.Cloud.afterSave('Comment', function (request) {
    let currentComment = request.object;
    // 检查垃圾评论
    spam.checkSpam(currentComment);

    // 发送博主通知邮件
    mail.notice(currentComment);
    // AT评论通知
    let rid = currentComment.get('rid');
    if (!rid) {
        console.log('没有@任何人，结束!');
        return;
    }
    let query = new AV.Query('Comment');
    query.get(rid).then(function (parentComment) {
        mail.send(currentComment, parentComment);
    }, function (error) {
        console.warn('获取@对象失败！');
    });
});
