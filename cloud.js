const AV = require('leanengine');
const mail = require('./utilities/send-mail');
const Comment = AV.Object.extend('Comment');
const request = require('request');

function sendNotification(currentComment) {
    // 发送博主通知邮件
    if (currentComment.get('mail') != process.env.BLOGGER_EMAIL){
        mail.notice(currentComment);
    }
    
    // AT评论通知
    // 获取评论内容
    var comm = currentComment.get('comment');
    // 从评论内容中提取出a标签的href属性值
    var h = comm.match(/<a.*?href?\s*=\s*[\'|\"]+?(.*?)[\'|\"]+?/i);
    if (!h) {
        console.log('没有@任何人，结束!');
        return;
    }
    // 替换掉#号，即为rid
    let rid = h[1].replace(/#/,"");
    // 将rid存入数据库，以供管理页面使用。
    currentComment.set('rid', rid);
    let query = new AV.Query('Comment');
    query.get(rid).then(function (parentComment) {
        if (parentComment.get('mail') != process.env.BLOGGER_EMAIL){
            mail.send(currentComment, parentComment);
        }
    }, function (error) {
        console.warn('获取@对象失败！');
    });
}

AV.Cloud.afterSave('Comment', function (request) {
    let currentComment = request.object;
    sendNotification(currentComment);
});

AV.Cloud.define('resend-mails', function(request) {
    let query = new AV.Query(Comment);
    query.greaterThanOrEqualTo('createdAt', new Date(new Date().getTime() - 24*60*60*1000));
    query.notEqualTo('isNotified', true);
    // 如果你的评论量很大，可以适当调高数量限制，最高1000
    query.limit(200);
    return query.find().then(function(results) {
        new Promise((resolve, reject)=>{
            count = results.length;
            for (var i = 0; i < results.length; i++ ) {
                sendNotification(results[i]);
            }
            resolve(count);
        }).then((count)=>{
            console.log(`昨日${count}条未成功发送的通知邮件处理完毕！`);
        }).catch(()=>{

        });
    });
  });

AV.Cloud.define('self-wake', function(req) {
    request(process.env.ADMIN_URL, function (error, response, body) {
        console.log('自唤醒任务执行成功，响应状态码为:', response && response.statusCode);
      });
})

