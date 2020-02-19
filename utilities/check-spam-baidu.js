'use strict';
const AV = require('leanengine');
const baidu = require('baidu-aip-sdk').contentCensor;
const APPID = process.env.BAIDU_APPID,
    AK = process.env.BAIDU_APIKEY,
    SK = process.env.BAIDU_SECRET;
const baiduClient = new baidu(APPID, AK, SK);

// 评论审核
exports.checkSpam = (comment, ip) => {
    if (!APPID || APPID === 'MANUAL_REVIEW') {
        console.log('未启用或已使用人工审核模式，评论审核后才会发表~');
        comment.setACL(new AV.ACL({
            "*": {
                "read": false
            }
        }));
        comment.set('isSpam', true);
        comment.save();
        return;
    }
    if (!AK || !SK) return console.log('Baidu Key 配置异常:');

    comment.set('ip', ip);
    return baiduClient.textCensorUserDefined(comment.get('comment')).then(data => {
        console.log('<textCensorUserDefined>: ' + JSON.stringify(data));
        if (data.error_code != undefined || !data.conclusionType || data.conclusionType == 4) {
            return console.log(`垃圾评论检测出错!`)
        }
        if (data.conclusionType != 1) {
            console.log('逮到一只垃圾评论，烧死它！用文火~');
            comment.set('isSpam', true);
            comment.setACL(new AV.ACL({
                "*": {
                    "read": false
                }
            }));
            comment.save();
            // comment.destroy();
        } else {
            comment.set('isSpam', false);
            comment.setACL(new AV.ACL({
                "*": {
                    "read": true
                }
            }));
            comment.save();
            console.log('垃圾评论检测完成，放行~');
        }
    }, err => {
        if (err) console.log(`垃圾评论检测出错！${err}`);
    });
};

// 提交黑名单
exports.submitSpam = (comment) => {
    if (!APPID || APPID === 'MANUAL_REVIEW') return;
    if (!AK || !SK) return console.log('Baidu Key 配置异常:');
    console.log('请自行前往百度后台配置黑名单：https://ai.baidu.com/censoring');
    //TODO：将黑名单写入LeanCloud便于后续导出整理
}

// 提交白名单
exports.submitHam = (comment) => {
    if (!APPID || APPID === 'MANUAL_REVIEW') return;
    if (!AK || !SK) return console.log('Baidu Key 配置异常:');
    console.log('请自行前往百度后台配置白名单：https://ai.baidu.com/censoring');
    //TODO：将白名单写入LeanCloud便于后续导出整理
};