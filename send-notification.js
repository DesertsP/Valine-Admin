'use strict';
const nodemailer = require('nodemailer');
const AV = require('leanengine');
const Comment = AV.Object.extend('Comment');
const Notifications = AV.Object.extend('Notifications');
const request = require('request');
const spam = require('./utilities/check-spam');

let config = {
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
}

if (process.env.SMTP_SERVICE != null) {
    config.service = process.env.SMTP_SERVICE;
} else {
    config.host = process.env.SMTP_HOST;
    config.port = parseInt(process.env.SMTP_PORT);
    config.secure = process.env.SMTP_SECURE === "false" ? false : true;
}

const transporter = nodemailer.createTransport(config);

AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY
});

transporter.verify(function(error, success) {
    if (error) {
        console.log('SMTP邮箱配置异常：', error);
    }
    if (success) {
        console.log("SMTP邮箱配置正常！");
        resendMail();
    }
});

let resendMail = () => {
    let query = new AV.Query(Comment);
    query.greaterThanOrEqualTo('createdAt', new Date(new Date().getTime() - 24*60*60*1000));
    query.notEqualTo('isNotified', true);
    // 如果你的评论量很大，可以适当调高数量限制，最高1000
    query.limit(200);
    return query.find().then(function(results) {
        new Promise((resolve, reject)=>{
            let count = 0
            for (var i = 0; i < results.length; i++ ) {
              let queryNotifications = new AV.Query(Notifications);
              let comment = results[i];
              queryNotifications.equalTo('commentId', comment.get('objectId'));
              queryNotifications.find().then(function(rst){
                let countNotifications = rst.length;
                if (countNotifications < 1 ) {
                  sendNotification(comment, '');
                  count++;
                }
              }).catch(()=>{
                  console.log('查询发送邮件日志失败。');
              });
            };
            resolve(count);
        }).then((count)=>{
            console.log(`${count}条未成功发送的通知邮件处理完毕！`);
        }).catch(()=>{

        });
    });
};

function sendNotification(currentComment, defaultIp) {
    // 发送博主通知邮件
    if (currentComment.get('mail') !== process.env.BLOGGER_EMAIL) {
        notice(currentComment);
    }

    // let ip = currentComment.get('ip') || defaultIp;
    // console.log('IP: %s', ip);
    // spam.checkSpam(currentComment, ip);

    // AT评论通知
    let rid =currentComment.get('pid') || currentComment.get('rid');

    if (!rid) {
        console.log("这条评论没有 @ 任何人");
        return;
    } else if (currentComment.get('isSpam')) {
        console.log('评论未通过审核，通知邮件暂不发送');
        return;
    }

    let query = new AV.Query('Comment');
    query.get(rid).then(function (parentComment) {
        if (parentComment.get('mail') && parentComment.get('mail') !== process.env.BLOGGER_EMAIL) {
            send(currentComment, parentComment);
        } else {
            console.log('被@者匿名，不会发送通知');
        }
        
    }, function (error) {
        console.warn('获取@对象失败！');
    });
};

let notice = (comment) => {
    let SITE_NAME = process.env.SITE_NAME;
    let NICK = comment.get('nick');
    let COMMENT = comment.get('comment');
    let POST_URL = process.env.SITE_URL + comment.get('url') + '#' + comment.get('objectId');
    let SITE_URL = process.env.SITE_URL;

    let _template = process.env.MAIL_TEMPLATE_ADMIN || '<div style="border-top:2px solid #12ADDB;box-shadow:0 1px 3px #AAAAAA;line-height:180%;padding:0 15px 12px;margin:50px auto;font-size:12px;"><h2 style="border-bottom:1px solid #DDD;font-size:14px;font-weight:normal;padding:13px 0 10px 8px;">        您在<a style="text-decoration:none;color: #12ADDB;" href="${SITE_URL}" target="_blank">${SITE_NAME}</a>上的文章有了新的评论</h2><p><strong>${NICK}</strong>回复说：</p><div style="background-color: #f5f5f5;padding: 10px 15px;margin:18px 0;word-wrap:break-word;">            ${COMMENT}</div><p>您可以点击<a style="text-decoration:none; color:#12addb" href="${POST_URL}" target="_blank">查看回复的完整內容</a><br></p></div></div>';
    let _subject = process.env.MAIL_SUBJECT_ADMIN || '${SITE_NAME}上有新评论了';
    let emailSubject = eval('`' + _subject + '`');
    let emailContent = eval('`' + _template + '`');

    let mailOptions = {
        from: '"' + process.env.SENDER_NAME + '" <' + process.env.SENDER_EMAIL + '>',
        to: process.env.BLOGGER_EMAIL || process.env.SENDER_EMAIL,
        subject: emailSubject,
        html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('博主通知邮件成功发送: %s', info.response);
        
        let notifications = new Notifications() //将该类实例化
        notifications.set('mail',comment.get('mail')) //存入收件人邮箱
        notifications.set('notificationType','comment notice') //存入收件人地址
        notifications.set('commentId',comment.get('objectId')) //回复评论的objectID
        //然后将该数据存入云端，并设置回调函数
        notifications.save().then(function(todo){
            console.log("发送邮件日志记录成功。日志记录ID：",todo.id);
        } , function(error){
            console.log("发送邮件日志记录失败。");
        });
    });
}

let send = (currentComment, parentComment)=> {
    let PARENT_NICK = parentComment.get('nick');
    let SITE_NAME = process.env.SITE_NAME;
    let NICK = currentComment.get('nick');
    let COMMENT = currentComment.get('comment');
    let PARENT_COMMENT = parentComment.get('comment');
    let POST_URL = process.env.SITE_URL + currentComment.get('url') + '#' + currentComment.get('objectId');
    let SITE_URL = process.env.SITE_URL;

    let _subject = process.env.MAIL_SUBJECT || '${PARENT_NICK}，您在『${SITE_NAME}』上的评论收到了回复';
    let _template = process.env.MAIL_TEMPLATE || '<div style="border-top:2px solid #12ADDB;box-shadow:0 1px 3px #AAAAAA;line-height:180%;padding:0 15px 12px;margin:50px auto;font-size:12px;"><h2 style="border-bottom:1px solid #DDD;font-size:14px;font-weight:normal;padding:13px 0 10px 8px;">        您在<a style="text-decoration:none;color: #12ADDB;" href="${SITE_URL}" target="_blank">            ${SITE_NAME}</a>上的评论有了新的回复</h2>    ${PARENT_NICK} 同学，您曾发表评论：<div style="padding:0 12px 0 12px;margin-top:18px"><div style="background-color: #f5f5f5;padding: 10px 15px;margin:18px 0;word-wrap:break-word;">            ${PARENT_COMMENT}</div><p><strong>${NICK}</strong>回复说：</p><div style="background-color: #f5f5f5;padding: 10px 15px;margin:18px 0;word-wrap:break-word;">            ${COMMENT}</div><p>您可以点击<a style="text-decoration:none; color:#12addb" href="${POST_URL}" target="_blank">查看回复的完整內容</a>，欢迎再次光临<a style="text-decoration:none; color:#12addb" href="${SITE_URL}" target="_blank">${SITE_NAME}</a>。<br></p></div></div>';
    let emailSubject = eval('`' + _subject + '`');
    let emailContent = eval('`' + _template + '`');

    let mailOptions = {
        from: '"' + process.env.SENDER_NAME + '" <' + process.env.SENDER_EMAIL + '>', // sender address
        to: parentComment.get('mail'),
        subject: emailSubject,
        html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('AT通知邮件成功发送: %s', info.response);
        
        //将发送邮件记录到数据库Notifications
        let notifications = new Notifications();
        notifications.set('mail',currentComment.get('mail'));
        notifications.set('notificationType','reply notice');
        notifications.set('commentId',currentComment.get('objectId'));
        //然后将该数据存入云端，并设置回调函数
        notifications.save().then(function(todo){
            console.log("发送邮件日志记录成功。",todo.id);
        } , function(error){
            console.log("发送邮件日志记录失败。");
        });

    });
};