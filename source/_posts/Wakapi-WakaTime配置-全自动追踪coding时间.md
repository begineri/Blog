---
title: Wakapi & WakaTime配置：记录coding时间
subtitle: 全自动记录 coding 时间
date: 2026-04-10 12:27:15
tags:   
    - coding
---

## 背景
之前想找一个自动记录编程时间的工具，于是找到了WakaTime。

WakaTime 可以支持众多IDE，具体查看可访问：https://wakatime.com/plugins 

但 WakaTime 的很多内容都要额外付费，比如免费用户就只能查看近7天的coding时长，很不方便。

---
因此，使用Wakapi，将数据存储在本地，就是一个很好的选择了。
我之前一直用的是WakaTime，现在可以一键把数据导入，现在我的面板就是：
![alt text](/images/Wakapi/dash.png)

非常清晰，每个项目的具体时间都可以点进去查看，比如上学期的CO（可以看到P5代码和文档一共写了6h+，继续点击还可以查看更详细的信息）：
![alt text](/images/Wakapi/示意.png)

---

## 部署参考流程
以下是我的部署方案，更多信息可参考：
Wakapi on GitHub：[https://wakatime.com](https://github.com/muety/wakapi)
WakaTime：[https://wakatime.com](https://wakatime.com)

### 部署 Wakapi
我使用的是 Docker：
1. 用 Docker 一键部署后端

```bash
# Create a persistent volume
$ docker volume create wakapi-data

$ SALT="$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)"

# Run the container
$ docker run -d \
  --init \
  -p 3000:3000 \
  -e "WAKAPI_PASSWORD_SALT=$SALT" \
  -v wakapi-data:/data \
  --name wakapi \
  --restart unless-stopped \
  ghcr.io/muety/wakapi:latest
```

2. 打开本地的`http://localhost:3000/login`，注册一个账号，用于获取API。

3. 链接到IDE的数据
到这一步，其实跟随网页指引即可，可参考：
   - 如果之前已经在使用WakaTime，可直接导入数据（我的选择）：
     - 如图，在setting里直接粘贴自己 WakaTime 的api，点击`Import Data`即可导入历史数据。
     ![alt text](/images/Wakapi/导入.png)
     - 现在就可以正常使用了，我选择继续保留原WakaTime的配置，本机上仍然运行WakaTime，只在必要时同步（因为如果换成wakapi有未知bug无法解决）。
   - 或直接从头开始配置（可参考网站上步骤）：
       1. 在 https://wakatime.com/plugins 下载所需的IDE的插件并安装
       2. 修改`~/.wakatime.cfg`内容为()：
       ```
       [settings]
        api_url = https://wakapi.dev/api
        api_key = <put your api key here>
       ```
       3. 刷新，结束！

---

此后应该就可以自动记录数据了。
以下是原理示意图（gen by ai）：

![alt text](/images/Wakapi/deepseek_mermaid_20260410_efc909.png)