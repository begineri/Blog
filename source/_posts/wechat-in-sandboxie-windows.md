---
title: 【配置记录】在沙盒中运行微信
date: 2026-07-22 16:58:21
tags:
    - tools
---

微信是我当前生活学习不可或缺的软件，传文件、看消息都缺少不了它，但同时如果将它安装在个人电脑上，可能会导致侵犯隐私。为了平衡安全性与便利性，我趁着重装完系统的干净电脑，采取了**将微信 WeChat 安装在沙盒 Sandboxie-Plus 中**的方法，实现了微信的正常使用与隐私隔离。

以下是我的安装记录


## 1. 安装 Sandboxie-Plus


1. 前往 GitHub 或官网下载最新的 Sandboxie-Plus: https://github.com/sandboxie-plus/sandboxie
2. 安装过程中如显示需要输入许可证,跳过即可
3. 完成安装并重启电脑

## 2. 为微信新建沙盒


### 2.1 创建沙盒

1. 打开 Sandboxie-Plus，点击左上角 沙箱 \-\> 新建沙箱。  
2. 命名为 WeChat，沙箱类型选择 **Standard (标准隔离)**。
![alt text](/images/沙盒/新建.png)

### 2.2 真实物理硬盘交互入口设置

需要在物理硬盘中,选择一个文件夹存放微信的聊天记录和文件.

1. 如果电脑上已经有之前的微信文件: 可以使用 `Everything` 搜索 `WeChat Files` (针对3.x的微信版本) 或 `xwechat_files` (针对较新4.x的版本)
2. 在电脑上自己选定位置(我选择的是 `D:\Tencent\Wechat`)新建文件夹,然后如有之前文件,直接复制粘贴到此文件夹中即可,如: `D:\Tencent\Wechat\WeChat Files`; 如果没有就空着
3. 记住这个文件夹地址, 后续有用


### 2.3 设置沙盒规则

1. 右键刚才新建的沙盒,点击 **沙盒选项** \-\> **资源访问** \-\> **文件**
2. 点击“添加文件/文件夹”, 将C盘用户目录下的文件, 其他无关的盘全部设置为禁止 (这里没有把D盘全部禁止是因为可能会导致进入微信后找不到我们要的D:\Tencent\Wechat文件夹,所以我手动把除了这个文件夹之外的所有文件夹都单独禁止了)
可选如
   * C:\\Users\\你的用户名\\Desktop\* (桌面)  
   * C:\\Users\\你的用户名\\Documents\* (文档)  
   * C:\\Users\\你的用户名\\Pictures\* (图片)  
   * E:\\\* (彻底封锁其他不需要访问的盘)  
3. 为可访问文件夹单独添加 **"完全开放"** 权限, 路径填写：**D:\\Tencent\\Wechat** (这里选择"开放"会导致聊天记录不能同步)

![alt text](/images/沙盒/选项.png)

## 3. 在沙盒中安装微信

规则定好后，就可以正式下载微信了: 

1. 去微信官网下载最新的 PC 版安装包: https://weixin.qq.com/
2. 在下载好的安装包上 **右键** \-\> **在沙盘中运行 (Run Sandboxed)** \-\> 选择 WeChat。  
   - 注意, 此时打开安装包的路径要在上面排除的路径之外, 否则无法打开, 可以考虑在C盘根目录下新建文件夹,将安装包复制到此处打开.
3. 在弹出的微信安装界面中，不用修改安装路径, 保持默认的 C:\\Program Files\\Tencent\\WeChat 即可
    - 原理：它实际上会被安全地安装进沙盒虚拟出来的 C 盘里，如果此时改到真实的 D 盘，就失去隔离程序本体的意义了。
4. 设置正确的**聊天存储路径**, 此处设置为刚才配置好的路径, 如图.
5. 之后正常完成安装、登陆即可

![alt text](/images/沙盒/路径.png)


## 4. 日常使用：快捷方式与图标恢复

为了像安装在本机上一样方便使用, 可以配置:

1. 打开 Sandboxie-Plus 主界面，右键 WeChatBox \-\> **沙箱内容** \-\> **创建快捷方式**。 
![alt text](/images/沙盒/快捷fangshi.png)

2. 一般来说, 可以在这里看见微信.lnk, 点击它,然后保存在本机桌面上即可
![alt text](/images/沙盒/2.png)

1. 如果这里没有正常显示, 可以点击*浏览文件夹*,然后随便新建一个
   - 然后修改目标地址为: `D:\DevTools\Sandboxie-Plus\SandMan.exe /box:WeChatBox "C:\Program Files\Tencent\Weixin\Weixin.exe"` (示例)
   - 更改图标为 `%SystemDrive%\Sandbox\WANG\WeChatBox\drive\C\Program Files\Tencent\Weixin\Weixin.exe` (点击浏览, 然后输入并回车)

即可配置成功,如图 :
![alt text](/images/沙盒/3.png)
![alt text](/images/沙盒/4.png)


## 总结

至此已经配好, 日常启动点击桌面上的图标即可.

同时聊天记录以及聊天中产生的文件, 可以直接从D盘的 `D:\Tencent\Wechat\xwechat_files\wxid_qhxxxxxxx\msg\file` 访问.