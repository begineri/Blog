---
lang: en
title: "Flashing and Brick Recovery Logs"
date: 2026-02-16 16:03:52
tags:
    - flashing
---

> The Truth About Flashing ROMs:
> - No flashing ROMs at night
> - Back up your device before flashing the ROM

> ****FLASH AT YOUR OWN RISK****
****PLEASE READ ALL OF THIS BEFORE FLASHING****

# Background

- Device: OnePlus 13
- Experience: 0
- Tools: Computer, Internet, forums

# Motivation

My old phone was with me throughout my three years of high school and the first half of my college years. After three years of (relatively) heavy use, it ran out of storage space and its battery life became poor, so it was finally time for an upgrade.

My old phone was a Honor, which couldn’t install the Google framework, let alone be rooted. Back then, being young and naive, I had no choice but to put up with all sorts of ads I couldn’t delete, extremely low privacy, and terrible ad experiences.

Finally, I saw a content creator I really like recommend the OnePlus 13, and that’s *when* I *first* learned about the concept of flashing a ROM—it felt like a whole new world had opened up to me.

Skipping over the process of going from knowing absolutely nothing about terms like “flashing,” “BL,” “root,” and “ROM,” to buying a phone, to searching high and low for tutorials, I finally decided to start flashing my phone during the last week of the summer break in 2025, right before heading back to school.

# Action
As a leading choice for flashing today, OnePlus has a wealth of tutorials and an active forum. I ultimately decided to follow a tutorial on XDA to flash my device:

[[PJZ110][21 Jan] ColorOS to OxygenOS](https://xdaforums.com/t/pjz110-21-jan-coloros-to-oxygenos-glo-in-eu-16-0-3-501-na-16-0-1-304.4707431/)

## Ultimate Goal
To take full advantage of Google services and minimize the built-in ads on my phone, I chose to flash the OnePlus **Global** Edition ROM—the one mentioned in the title here: `from ColorOS to OxygenOS`.

## Steps
1. Backing Up System Files
2. Unlocking the Bootloader (BL)
![alt text](/images/刷机/image-1.png)
3. Flashing the Global Version (Flash)
![alt text](/images/刷机/image-2.png)
Gaining Root Access
![alt text](/images/刷机/image-3.png)
4. Installing modules, hiding environments, etc.
![alt text](/images/刷机/image-4.png)

## Installed Modules
- Fix Signal OnePlus 13: Dedicated to fixing signal issues
- Zygisk Next 
- Play Integrity Fix (Tricky Store): Passing Google's Security Verification
- Wi-Fi 7 Enabler: Unlocking the Wi-Fi 7 (6 GHz) Band
- LSPosed: Primarily for using LuckyTool, which is optimized specifically for OnePlus phones.
- Zygisk Assistant

## Final Results
After a day of tinkering, I successfully flashed the global version of the OS and am now happily using it.
Although there are some hardware compatibility issues—such as NFC not working in certain situations and location data for weather apps being erratic—I’m willing to put up with these trade-offs in exchange for a relatively clean system.
![alt text](/images/刷机/image-5.png)

---

# Brick Rescue

Of course, when you’re flashing a ROM for the first time, even if you expect everything to go smoothly, something’s bound to go wrong. Here are my two crashes and miraculous recoveries so far.

> Let’s keep this truth about flashing ROMs in mind once again:
> - No flashing ROMs at night
> - Back up your device before flashing the ROM

## The Consequences of Haphazardly Installing Modules
### How It All Began
After flashing my device for the first time and gaining root access, faced with such a wide variety of modules to choose from, I downloaded every one that looked interesting, one by one. Even though I installed them one at a time, problems still arose—and that’s when I made my first mistake: never flash your device at night.

Just before going to bed, I hurriedly installed a few modules, tapped through them briefly to test them out, and felt reassured enough to put my phone down and go to sleep. When I woke up, I found that my phone was turned off and showed that the battery was completely dead (it had been at over 40% the night before), and after plugging it in to charge, it got stuck in a reboot loop.
Looking back, the main cause was probably a **charging module** I installed that night (which just goes to show that you should be careful with battery-related modules). I’m not sure if there were any other contributing factors, but in any case, it won’t turn on now.

### The Process of Rescuing a Bricked Device
Here’s how I went about it:
- Since this is a module issue, I tried using a case to disable all KernelSU modules at startup: it failed, and I couldn't disable them.
- Unroot the device, and the module will naturally stop working: Specifically, I reflashed the stock init_boot partition, and the device did indeed boot up successfully in the end.
 
It looks simple, but it was actually the result of quite a bit of searching and trial and error. It seems natural and easy to understand now, but at the time, I spent a long time searching all over the web before I could confirm this method. I even went to customer service at one point, but just as I was about to demonstrate my reboot loop to them, my phone *miraculously* restarted right then and there(I hadn’t been able to do it before—even though I’d flashed `init_boot`, once I regained root access and flashed the patched `init_boot` partition back, the phone got stuck in a boot loop again).If I hadn’t succeeded here, I would have had to wipe all my data, but I don’t know what prerequisite was met at that moment—everything returned to normal, and the crisis was over.

## I was too confident, so I didn't back it up.
### Background
It’s been over half a year since I last updated to the global version, so it’s time for another update. I’m planning to upgrade from version 15.831 to 15.864.
I chose version 864 because it’s the latest version of OOS15. Any newer version would be OOS16, which was just released not long ago and represents a major version jump, so I decided to skip it.

Before updating, I saw that this tutorial on OTA updates looked so simple that I was in a hurry to update. As a result, I didn’t back up my data at all, nor did I turn off the local module; I just started the process right away. After executing:
1. Launch the local installation
2. Download the installation package from the REPO on your computer
3. Install on Your Phone
4. KSU Install to inactive slot (After OTA)
5. Select "Restart" in the software update section

Based entirely on the following tutorial:
![参考](/images/刷机/image.png)

After a series of issues, it won't turn on again.

### Brick Rescue
Current Status: This OnePlus model uses an A/B partition design with seamless updates. Currently, the new version is on the B partition, the old version is on the A partition, and the data partition is shared.

Compared to last time, I now have more experience—and Gemini’s constant assistance (and interference)—so I tried the following steps in order:

- Tried booting from partition a: Failed
- Restoring the original `init_boot` on both the A and B partitions: Failed
- Cancel merge update `snapshot-update cancel`: Failed
- Restored the stock vbmeta, boot, and other partitions: Things got even worse

It’s already past midnight (yes, yet another problem caused by flashing the ROM late at night). Faced with a phone stuck in an endless reboot loop and the data on it that I might never, ever see again, I’ve decided to go to sleep and tackle this with a clear head tomorrow morning... (See the next section for a detailed account of my thoughts.)
When I woke up this morning, I tried the following again:
- I started searching major forums (KuAn, XDA...), but didn't find much information.
- Desperate, I tried to find a professional to save my bricked phone: I asked everyone I could find on forums, QQ groups, and Xianyu, but only two people, after hearing my description, said there was a small chance *the data could still be recovered;* the rest all said the only option was to wipe the device and flash the firmware.
- *Struggling* with *lost data that wasn’t backed up*, I’m cautiously trying out the methods suggested by AI.
- Key Points and Turning Points: Using the previous full backup, I completely reinstalled the new system from scratch.
- Disable vbmeta validation as follows:
![alt text](/images/刷机/image-6.png)

And with that, it’s successfully booted up!
Even though I rooted it, the data is still intact, and the update was successful!

---

# Post-Flash Notes
## The Despair and Helplessness Faced with Data That May Be Lost Forever
The world of data, unlike the real world, is intangible and cannot be touched. So it’s possible that one second your photos and data are perfectly intact, and the next, you can no longer access them.To put it more positively, if the device hasn’t been completely formatted, your data still lies in that ocean of 0s and 1s—or, one might even say, within those transistors—though I’m simply unable to decipher it.

On that night when my phone wouldn’t turn on—and I faced the possibility of losing all the data on it—I thought about a lot of things.
Let me start by considering the worst-case scenario: What do I have on my phone that’s one-of-a-kind and would be lost forever if I formatted it?
- Photos: My photo album contains pictures from the past six months or so, including photos from trips with friends and classmates. The most precious ones are the many photos from my trip to Sri Lanka last month. I haven’t backed any of these up, and I’ve only sent a few of the Sri Lanka photos to friends; other than that, the photos are only on my phone.
If I can’t recover these photos, I’m prepared to console myself with the thought that it’s enough to have those wonderful memories stored in my mind...
- WeChat chat history: Although the records on my computer and phone are usually synchronized, there are a few instances where the messages on my computer are incomplete. However, this is still acceptable.
- Notes: Contains some notes
- Other system and desktop settings, etc...

In short, I was trying to imagine the worst-case scenario and prepare myself mentally. Even so, that night, I lay in bed tossing and turning, my mind a tangled mess. I wanted to die along with my data.

Faced with such precious yet fragile data, we are helpless in this situation.
Recovering that data in the end was the result of my last-ditch effort.

To be honest, both times I managed to fix things by sheer luck. Why doesn’t this approach work? Why does that one work?
I still haven’t figured out exactly what went wrong (feel free to discuss in the comments), but I tried this one that looked promising, then that one that seemed reliable, and after one step, it magically booted up—my data was back, and I was saved from the brink of disaster.

## The Same Old AI Issues
In 99% of cases, when AI encounters something it’s unsure about or simply doesn’t know, it will just make up an answer. If we blindly accept or carelessly copy and paste those instructions without critical thinking, we’re likely to make an already bad situation even worse—to the point where it becomes unsolvable.We fall into this trap time and time again, and it’s only after we’ve fallen in that we remind ourselves to be more cautious next time.

(Screenshot of despair) Cut your losses while you can
![alt text](/images/刷机/1.png)

There’s no denying that, in the end, we managed to preserve the data thanks to a solution that AI and I worked out together through trial and error. So it’s not that AI can’t provide the right answer—it’s that humans are needed to make the most critical **decisions and judgments**.

## Goal-Oriented Learning
I flash my phone’s firmware not because I’m particularly interested in the process or want to study the underlying principles (though, of course, as I’ve delved deeper, I’ve gradually discovered the fun in it), but purely for practical reasons: I want my new phone to have the Google framework, a clean international version of the OS, and the freedom to customize it however I like after flashing.

With this goal in mind, I started researching from scratch how to achieve it. As mentioned earlier, when I first downloaded KuAn, I had no idea what any of the terms meant. All I could do was bookmark a post and close the app—a one-step process—hoping to find a reliable guide I could follow exactly. At the same time, I checked out some educational articles and videos to brush up on the theory.Eventually, I found this tailor-made tutorial on XDA, and all that was left was to take action.

Of course, taking action requires **determination**, and with less than a week until school starts and the loss of the comforts of home just around the corner, these are great motivators.

Moreover, there’s often a gap between reality and what’s written in tutorials—you can’t simply replicate them step-for-step. While following a tutorial, I ran into countless problems and tried every possible solution: scouring forums, Googling, and asking AI. It was only through this process that I truly understood what I was doing at each step and gradually grasped the underlying principles—which taught me more than reading ten thousand tutorials ever could.

---
To be added: Glossary of terms related to flashing firmware
