const AV = require('leanengine');
const mail = require('./utilities/send-mail');

AV.Cloud.afterSave('Comment', function (request) {
    let currentComment = request.object;

    // 发送博主通知邮件
    mail.notice(currentComment);
    // AT评论通知
    // 获取评论内容
    var comm = currentComment.get('comment');
    // 从评论内容中提取出a标签的href属性值
    var h = comm.match(/<a.*?href?\s*=\s*[\'|\"]+?(.*?)[\'|\"]+?/i);
    if (!h) {
        console.log('没有@任何人，结束!');
        return;
    }
    // 替换掉#号，即为rid。
    let rid = h[1].replace(/#/,"");
    // 将rid存入数据库，以供管理页面使用。
    currentComment.set('rid', rid);
    let query = new AV.Query('Comment');
    query.get(rid).then(function (parentComment) {
        mail.send(currentComment, parentComment);
    }, function (error) {
        console.warn('获取@对象失败！');
    });
});
