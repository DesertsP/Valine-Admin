# Valine Admin



## 简介

此项目是一个对 [Valine](https://valine.js.org) 评论系统的拓展应用，可增强 `Valine` 的邮件通知功能。基于 Leancloud 的云引擎与云函数。可以提供邮件 `通知站长` 和 `@ 通知` 的功能，而且还支持自定义邮件通知模板。

<a href="/高级配置.md#邮件通知展示" target="_black">点击查看演示</a>


## 快速开始

首先需要确保 Valine 的基础功能是正常的，参考 [Valine Docs](https://valine.js.org)。

然后进入 [Leancloud](https://leancloud.cn/dashboard/applist.html#/apps) 对应的 Valine 应用中。

点击 `云引擎 -> 设置` 填写代码库并保存：`https://github.com/zhaojun1998/Valine-Admin`  

<img width="700" src="https://cdn.jun6.net/201804211508_545.png" />

切换到部署标签页，分支使用 master，点击部署即可：
<img width="700" src="https://cdn.jun6.net/201801112055_212.png" />
<img width="700" src="https://cdn.jun6.net/201804211336_271.png" />



## 配置项

此外，你需要设置云引擎的环境变量以提供必要的信息，点击云引擎的设置页，设置如下信息：

<img width="700" src="https://cdn.jun6.net/201806062257_798.png" />

**必选参数**

* `SITE_NAME` : 网站名称。
* `SITE_URL` : 网站地址, **最后不要加 `/` 。**
* `SMTP_USER` : SMTP 服务用户名，一般为邮箱地址。
* `SMTP_PASS` : SMTP 密码，一般为授权码，而不是邮箱的登陆密码，请自行查询对应邮件服务商的获取方式
* `SMTP_SERVICE` : 邮件服务提供商，支持 `QQ`、`163`、`126`、`Gmail`、`"Yahoo"`、`......`  ，全部支持请参考 : [Nodemailer Supported services](https://nodemailer.com/smtp/well-known/#supported-services)。 --- *如这里没有你使用的邮件提供商，请查看[自定义邮件服务器](/高级配置.md#自定义邮件服务器)*
* `SENDER_NAME` : 寄件人名称。

## 高级配置

[自定义邮件模板](/高级配置.md#自定义邮件模板)

[自定义收件邮箱](/高级配置.md#自定义收件邮箱)

[自定义邮件服务器](/高级配置.md#自定义邮件服务器)

[Web 评论管理](/高级配置.md#web-评论管理)

[Leancloud 休眠策略(必看)](/高级配置.md#leancloud-休眠策略)

[开发指南](/高级配置.md#开发)

## 更新历史

* 12.01 新增自助添加定时器方式。详见: [LeanCloud 自带定时器[推荐方式]](/高级配置.md#leancloud-自带定时器推荐)

* 7.30 修复 @ 邮件通知出错 bug (需 [Valine 1.3.0](https://valine.js.org/changelog.html#v1-3-0-2018-07-29) 支持)，优化发件逻辑，站长发的评论不再收到邮件通知。
* 7.7 兼容 `valine v1.2.0-beta ` 版本对 at 的更改 [点击查看](https://valine.js.org/changelog.html#v1-2-0-beta-2018-06-30)
* 7.1 修复 `Web` 后台登录安全 `bug`
* 6.14 添加自定义邮件服务器功能. [点击查看](/高级配置.md#自定义邮件服务器)

## 常见问题

### 为什么我收不到邮件？

* 请确认评论时留下的邮箱不是环境变量里的 `SMTP_USER` 或 `TO_EMAIL` 里的邮箱，原因详见 7.30 更新日志。
* 请确认修改环境变量后已重启容器。
* 对于 QQ / 网易 163 邮箱，请确认你输入的是 SMTP 的授权码，而不是登陆密码。[QQ邮箱获取授权码](https://service.mail.qq.com/cgi-bin/help?subtype=1&id=28&no=1001256)  [网易邮箱获取授权码](http://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4f8e49998b374173cfe9171305fa1ce630d7f67ac2cda80145a1742516)

### 为什么我刚开始测试的时候是正常的，但后面的邮件没有通知？

请确认已针对 `LeanCloud` 的**免费容器休眠策略**配置了定时器，详见：[LeanCloud 休眠策略](https://github.com/zhaojun1998/Valine-Admin/blob/master/%E9%AB%98%E7%BA%A7%E9%85%8D%E7%BD%AE.md#leancloud-休眠策略)。

### 如何重启容器？

<img width="500" src="https://cdn.jun6.net/201807081507_968.png"/>

> **注: 更新新版本与更改环境变量均需要重启容器后生效。**



**注：本项目修改于 panjunwen 的项目 : [Valine-Admin](https://github.com/panjunwen/Valine-Admin) (部分逻辑于功能不同，还请读者不要搞混配置项.)**
