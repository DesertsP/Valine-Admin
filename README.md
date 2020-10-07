Valine Admin 是 [Valine 评论系统](https://deserts.io/diy-a-comment-system/)的扩展和增强，主要实现评论邮件通知、评论管理、垃圾评论过滤等功能。支持完全自定义的邮件通知模板。基于Akismet API实现准确的垃圾评论过滤。此外，使用云函数等技术解决了免费版云引擎休眠问题，支持云引擎自动唤醒，漏发邮件自动补发。兼容云淡风轻及Deserts维护的多版本Valine。

> NOTE: **该项目基于LeanCloud云引擎示例代码实现，您可以自由地复制和修改。包含了一些 trick 实现资源的最大化利用 ，但请勿滥用免费资源。引用本说明文档及Deserts博客上的相关文章务必注明来源。**

[评论在线演示及相关功能测试](https://panjunwen.github.io/Valine/)

配置以[博客最新版](https://deserts.io/valine-admin-document/)为准。

## 相关项目

评论框前端：[Valine on Github](https://github.com/DesertsP/Valine)

[Disqus2LeanCloud数据迁移](https://github.com/DesertsP/disqus2valine/)



## 云引擎"一键"部署

进入评论系统数据库所在的LeanCloud应用。进入「云引擎-设置」，设置环境变量以及云引擎域名。**以下参数需要正确设置。云引擎域名（ADMIN_URL参数）用于评论后台管理，如[](https://deserts-io.avosapps.us/) 。


变量 | 示例 | 说明
--- | ------ | ---------
SITE_NAME | Deserts | [必填]博客名称
SITE_URL  | https://panjunwen.com | [必填]首页地址 
**SMTP_SERVICE** | QQ | [新版支持]邮件服务提供商，支持 QQ、163、126、Gmail 以及 [更多](https://nodemailer.com/smtp/well-known/#supported-services) 
SMTP_USER | xxxxxx@qq.com | [必填]SMTP登录用户
SMTP_PASS | ccxxxxxxxxch | [必填]SMTP登录密码（QQ邮箱需要获取独立密码） 
SENDER_NAME | Deserts | [必填]发件人 
SENDER_EMAIL | xxxxxx@qq.com | [必填]发件邮箱
ADMIN_URL | https://xxx.leanapp.cn/ | [建议]Web主机二级域名（云引擎域名），用于自动唤醒 
BLOGGER_EMAIL | xxxxx@gmail.com | [可选]博主通知收件地址，默认使用SENDER_EMAIL
AKISMET_KEY | xxxxxxxx | [可选]Akismet Key 用于垃圾评论检测，设为MANUAL_REVIEW开启人工审核，留空不使用反垃圾

![](assets/imgs/envs.png)

切换到「云引擎-部署」，部署模式选择「部署项目-Git部署」，分支「master」，手动部署目标环境为「生产环境」在[Leancloud](https://leancloud.cn/dashboard/#/apps)云引擎设置界面，填写代码库并保存：https://github.com/DesertsP/Valine-Admin.git，即可一键部署。

![deploy3](assets/imgs/deploy4.png)

## 评论管理

首先需要设置管理员信息。访问管理员注册页面`https://云引擎域名/sign-up`，注册管理员登录信息，如：[https://deserts-io.avosapps.us/sign-up](https://deserts-io.avosapps.us/sign-up) 

![signup](assets/imgs/signup2.png)


- 注：使用原版Valine如果遇到注册页面不显示直接跳转至登录页的情况，请手动删除_User表中的全部数据。
## 定时任务设置

关于自动休眠的官方说法：[点击查看](https://leancloud.cn/docs/leanengine_plan.html#hash633315134)。目前实现了两种云函数定时任务来解决云引擎休眠的问题：

- 自动唤醒，定时访问Web APP二级域名防止云引擎休眠；
- 每天定时检查过去24小时内漏发的邮件通知。

进入「云引擎-定时任务」，创建两个定时任务。

![](assets/imgs/cron4.png)


选择self-wake云函数，Cron表达式为`0 */30 0-16 * * ?`，表示每天早0点到晚16点每隔30分钟访问云引擎。

选择resend-mails云函数，Cron表达式为`0 0 0 * * ?`，表示每天0点检查过去24小时内漏发的通知邮件并补发。

- [关于国际版时区的问题](https://github.com/DesertsP/Valine-Admin/issues/63#issuecomment-533784574)：国际版使用UTC-0时间，注意与国内时间对应。

**至此，Valine Admin 已经可以正常工作，以下是可选配置。**

------------------

## 更多设置

#### 邮件通知模板

邮件通知模板在云引擎环境变量中设定，可自定义通知邮件标题及内容模板。

环境变量 | 示例 | 说明
--- | ------ | ------
MAIL_SUBJECT | ${PARENT_NICK}，您在${SITE_NAME}上的评论收到了回复 | [可选]@通知邮件主题（标题）模板
MAIL_TEMPLATE | 见下文 | [可选]@通知邮件内容模板
MAIL_SUBJECT_ADMIN | ${SITE_NAME}上有新评论了 | [可选]博主邮件通知主题模板
MAIL_TEMPLATE_ADMIN | 见下文 | [可选]博主邮件通知内容模板


邮件通知包含两种，分别是被@通知和博主通知，这两种模板都可以完全自定义。默认使用经典的蓝色风格模板（样式来源未知）。

默认被@通知邮件内容模板如下：

```html
<div style="border-top:2px solid #12ADDB;box-shadow:0 1px 3px #AAAAAA;line-height:180%;padding:0 15px 12px;margin:50px auto;font-size:12px;"><h2 style="border-bottom:1px solid #DDD;font-size:14px;font-weight:normal;padding:13px 0 10px 8px;">您在<a style="text-decoration:none;color: #12ADDB;" href="${SITE_URL}" target="_blank">            ${SITE_NAME}</a>上的评论有了新的回复</h2> ${PARENT_NICK} 同学，您曾发表评论：<div style="padding:0 12px 0 12px;margin-top:18px"><div style="background-color: #f5f5f5;padding: 10px 15px;margin:18px 0;word-wrap:break-word;">            ${PARENT_COMMENT}</div><p><strong>${NICK}</strong>回复说：</p><div style="background-color: #f5f5f5;padding: 10px 15px;margin:18px 0;word-wrap:break-word;"> ${COMMENT}</div><p>您可以点击<a style="text-decoration:none; color:#12addb" href="${POST_URL}" target="_blank">查看回复的完整內容</a>，欢迎再次光临<a style="text-decoration:none; color:#12addb" href="${SITE_URL}" target="_blank">${SITE_NAME}</a>。<br></p></div></div>
```

效果如下图：

![mail-blue-template](assets/imgs/wei-ming-ming.png)

@通知模板中的可用变量如下（注，这是邮件模板变量，是指嵌入到HTML邮件模板中的变量，请勿与云引擎环境变量混淆）：

模板变量 | 说明
----|----
SITE_NAME | 博客名称
SITE_URL | 博客首页地址
POST_URL | 文章地址（完整路径）
PARENT_NICK | 收件人昵称（被@者，父级评论人）
PARENT_COMMENT | 父级评论内容
NICK | 新评论者昵称
COMMENT | 新评论内容


默认博主通知邮件内容模板如下：

```html
<div style="border-top:2px solid #12ADDB;box-shadow:0 1px 3px #AAAAAA;line-height:180%;padding:0 15px 12px;margin:50px auto;font-size:12px;"><h2 style="border-bottom:1px solid #DDD;font-size:14px;font-weight:normal;padding:13px 0 10px 8px;">您在<a style="text-decoration:none;color: #12ADDB;" href="${SITE_URL}" target="_blank">${SITE_NAME}</a>上的文章有了新的评论</h2><p><strong>${NICK}</strong>回复说：</p><div style="background-color: #f5f5f5;padding: 10px 15px;margin:18px 0;word-wrap:break-word;"> ${COMMENT}</div><p>您可以点击<a style="text-decoration:none; color:#12addb" href="${POST_URL}" target="_blank">查看回复的完整內容</a><br></p></div></div>
```

博主通知邮件模板中的可用变量与@通知中的基本一致，**```PARENT_NICK``` 和 ```PARENT_COMMENT``` 变量不再可用。**


这里还提供一个彩虹风格的@通知邮件模板代码：

```html
<div style="border-radius: 10px 10px 10px 10px;font-size:13px;    color: #555555;width: 666px;font-family:'Century Gothic','Trebuchet MS','Hiragino Sans GB',微软雅黑,'Microsoft Yahei',Tahoma,Helvetica,Arial,'SimSun',sans-serif;margin:50px auto;border:1px solid #eee;max-width:100%;background: #ffffff repeating-linear-gradient(-45deg,#fff,#fff 1.125rem,transparent 1.125rem,transparent 2.25rem);box-shadow: 0 1px 5px rgba(0, 0, 0, 0.15);"><div style="width:100%;background:#49BDAD;color:#ffffff;border-radius: 10px 10px 0 0;background-image: -moz-linear-gradient(0deg, rgb(67, 198, 184), rgb(255, 209, 244));background-image: -webkit-linear-gradient(0deg, rgb(67, 198, 184), rgb(255, 209, 244));height: 66px;"><p style="font-size:15px;word-break:break-all;padding: 23px 32px;margin:0;background-color: hsla(0,0%,100%,.4);border-radius: 10px 10px 0 0;">您在<a style="text-decoration:none;color: #ffffff;" href="${SITE_URL}"> ${SITE_NAME}</a>上的留言有新回复啦！</p></div><div style="margin:40px auto;width:90%"><p>${PARENT_NICK} 同学，您曾在文章上发表评论：</p><div style="background: #fafafa repeating-linear-gradient(-45deg,#fff,#fff 1.125rem,transparent 1.125rem,transparent 2.25rem);box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);margin:20px 0px;padding:15px;border-radius:5px;font-size:14px;color:#555555;">${PARENT_COMMENT}</div><p>${NICK} 给您的回复如下：</p><div style="background: #fafafa repeating-linear-gradient(-45deg,#fff,#fff 1.125rem,transparent 1.125rem,transparent 2.25rem);box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);margin:20px 0px;padding:15px;border-radius:5px;font-size:14px;color:#555555;">${COMMENT}</div><p>您可以点击<a style="text-decoration:none; color:#12addb" href="${POST_URL}#comments">查看回复的完整內容</a>，欢迎再次光临<a style="text-decoration:none; color:#12addb"                href="${SITE_URL}"> ${SITE_NAME}</a>。</p><style type="text/css">a:link{text-decoration:none}a:visited{text-decoration:none}a:hover{text-decoration:none}a:active{text-decoration:none}</style></div></div>
```

效果如图：

![彩虹模板](assets/imgs/rainbow-theme.png)


#### 垃圾评论检测

> Akismet (Automattic Kismet)是应用广泛的一个垃圾留言过滤系统，其作者是大名鼎鼎的WordPress 创始人 Matt Mullenweg，Akismet也是WordPress默认安装的插件，其使用非常广泛，设计目标便是帮助博客网站来过滤留言Spam。有了Akismet之后，基本上不用担心垃圾留言的烦恼了。
> 启用Akismet后，当博客再收到留言会自动将其提交到Akismet并与Akismet上的黑名单进行比对，如果名列该黑名单中，则该条留言会被标记为垃圾评论且不会发布。

如果还没有Akismet Key，你可以去 [AKISMET FOR DEVELOPERS 免费申请一个](https://akismet.com/development/)；
**当AKISMET_KEY设为MANUAL_REVIEW时，开启人工审核模式；**
如果你不需要反垃圾评论，Akismet Key 环境变量可以忽略。

**为了实现较为精准的垃圾评论识别，采集的判据除了评论内容、邮件地址和网站地址外，还包括评论者的IP地址、浏览器信息等，但仅在云引擎后台使用这些数据，确保隐私和安全。**

**如果使用了本站最新的Valine和Valine Admin，并设置了Akismet Key，可以有效地拦截垃圾评论。被标为垃圾的评论可以在管理页面取消标注。**

环境变量 | 示例 | 说明
--- | ------ | ------
AKISMET_KEY | xxxxxxxxxxxx | [可选]Akismet Key 用于垃圾评论检测

#### 手动配置邮件服务器

- 自定义邮件服务器地址和端口信息，删除SMTP_SERVICE环境变量，新增以下变量：

变量 | 示例 | 说明
----|------|------
SMTP_HOST | smtp.qq.com | [可选]SMTP_SERVICE留空时，自定义SMTP服务器地址 
SMTP_PORT | 465 | [可选]SMTP_SERVICE留空时，自定义SMTP端口
SMTP_SECURE | true | [可选]使用TLS 


### Troubleshooting

- 部署失败，请在评论中附图，或去Github发起Issue
- 邮件发送失败，确保环境变量都没问题后，重启云引擎
    ![重启云引擎](assets/imgs/reboot.png)
- 博主通知模板中不要出现`PARENT*`相关参数（请勿混用模板）
- 点击邮件中的链接跳转至相应评论，这一细节实现需要在Web前端添加一点额外的代码：
``` javascript
<script>
    if(window.location.hash){
        var checkExist = setInterval(function() {
           if ($(window.location.hash).length) {
              $('html, body').animate({scrollTop: $(window.location.hash).offset().top-90}, 1000);
              clearInterval(checkExist);
           }
        }, 100);
    }
</script>
```



------------------

## 开发者文档

**以下内容仅用于 LeanEngine 开发，普通用户无需理会**

首先确认本机已经安装 [Node.js](http://nodejs.org/) 运行环境和 [LeanCloud 命令行工具](https://leancloud.cn/docs/leanengine_cli.html)，然后执行下列指令：

```
$ git clone https://github.com/DesertsP/Valine-Admin.git
$ cd Valine-Admin
```

安装依赖：

```
npm install
```

登录并关联应用：

```
lean login
lean switch
```

启动项目：

```
lean up
```

之后你就可以在 [localhost:3000](http://localhost:3000) 访问到你的应用了。

部署到预备环境（若无预备环境则直接部署到生产环境）：
```
lean deploy
```

## License

[MIT License](https://github.com/panjunwen/LeanComment/blob/master/LICENSE)
