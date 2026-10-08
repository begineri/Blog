---
lang: en
title: "[Configuration Notes] Running WeChat in a Sandbox"
date: 2026-07-22 16:58:21
tags:
    - tools
---

WeChat is an indispensable part of my daily life and studies—I can’t do without it for sharing files or checking messages. However, installing it on my personal computer could potentially compromise my privacy.To strike a balance between security and convenience, I took advantage of a clean computer after reinstalling the operating system and** installed WeChat within Sandboxie-Plus**, thereby enabling normal use of WeChat while isolating my privacy.

Here is my installation log


## 1. Installing Sandboxie-Plus


1. Go to GitHub or the official website to download the latest version of Sandboxie-Plus: https://github.com/sandboxie-plus/sandboxie
2. If you're prompted to enter a license key during installation, just skip it.
3. Complete the installation and restart your computer.

## 2. Create a new sandbox for WeChat


### 2.1 Creating a Sandbox

1. Open Sandboxie-Plus, click "Sandbox" in the upper-left corner, then select "New Sandbox."
2. Name it WeChat, and select **Standard (Standard Isolation) for** the sandbox type.
![alt text](/images/沙盒/新建.png)

### 2.2 Configuring the Interface for Interacting with a Physical Hard Drive

You need to select a folder on your physical hard drive to store your WeChat chat history and files.

1. If you already have previous WeChat files on your computer: You can use `Everything` to search for `WeChat Files` (for WeChat version 3.x) or `xwechat_files` (for the newer 4.x version).
2. Create a new folder in a location of your choice on your computer (I chose `D:\Tencent\Wechat`). Then, if you have any previous files, simply copy and paste them into this folder, for example: `D:\Tencent\Wechat\WeChat Files`; if not, leave it empty.
3. Make a note of this folder path—it’ll come in handy later.


### 2.3 Setting Up Sandbox Rules

1. Right-click the sandbox you just created, then click **Sandbox Options** \-\> **Resource Access** \-\> Files
2. Click “Add File/Folder,” then set all files in the user directory on Drive C and all other unrelated drives to “Block” (I didn’t block the entire D: drive here because that might prevent WeChat from finding the D:\Tencent\Wechat folder I need; so I manually blocked all folders except this one individually).
Optional examples include
   * C:\\Users\\YourUsername\\Desktop\* (Desktop)
   * C:\Users\YourUsername\Documents\* (Documents)
   * C:\\Users\\Your Username\\Pictures\* (Pictures)
   * E:\\\* (Completely block access to other drives that aren't needed)
3. Add **"Full Access"** permissions to the accessible folder separately. Enter the following path: **D:\\Tencent\\Wechat** (Selecting "Open" here will prevent chat history from syncing.)

![alt text](/images/沙盒/选项.png)

## 3. Install WeChat in the sandbox

Once the rules are set, you can officially download WeChat:

1. Go to the official WeChat website to download the latest PC installer: https://weixin.qq.com/
2. **Right-click** the downloaded installer \-\> **Select "Run Sandboxed"** \-\> Select WeChat.
   - Note: The path where you open the installer must be outside the paths listed above; otherwise, it won’t open. You may want to create a new folder in the root directory of Drive C: and copy the installer there to open it.
3. In the WeChat installation window that pops up, there’s no need to change the installation path—just keep the default: C:\\Program Files\\Tencent\\WeChat.
    - Principle: It is actually installed securely within a virtualized C: drive created by the sandbox; if you switch to the real D: drive at this point, it defeats the purpose of isolating the program itself.
4. Set **the** correct **chat storage path**; here, set it to the path you just configured, as shown in the figure.
5. After that, just complete the installation and log in as usual.

![alt text](/images/沙盒/路径.png)


## 4. Everyday Use: Shortcuts and Icon Restoration

To make it as convenient to use as if it were installed on your local machine, you can configure:

1. Open the Sandboxie-Plus main interface, right-click WeChatBox \-\> **Sandbox Contents** \-\> Create **Shortcut**.
![alt text](/images/沙盒/快捷fangshi.png)

2. Generally speaking, you’ll find a WeChat.lnk file here. Just click it and save it to your desktop.
![alt text](/images/沙盒/2.png)

1. If this isn't displaying properly here, you can click *to browse the folder* and then create a new one.
   - Then change the target address to: `D:\DevTools\Sandboxie-Plus\SandMan.exe /box:WeChatBox "C:\Program Files\Tencent\Weixin\Weixin.exe"` (example)
   - Change the icon to `%SystemDrive%\Sandbox\WANG\WeChatBox\drive\C\Program Files\Tencent\Weixin\Weixin.exe` (click Browse, then type it in and press Enter)

Configuration is now complete, as shown in the figure:
![alt text](/images/沙盒/3.png)
![alt text](/images/沙盒/4.png)


## Summary

It’s now all set up. To start it daily, just click the icon on your desktop.

Chat logs and files generated during chats can be accessed directly from `D:\Tencent\Wechat\xwechat_files\wxid_qhxxxxxxx\msg\file` on Drive D.
