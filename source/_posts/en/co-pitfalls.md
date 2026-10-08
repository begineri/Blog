---
lang: en
title: "A Complete Record of All Pitfalls Encountered in Computer Science"
date: 2025-12-25 12:50:19
tags:
    - CO
---

## Pitfalls I’ve Run Into:

* *During summer break, aside from downloading a few software programs, I barely looked at the prep material, figuring I’d have plenty of time to go over it once school started. As a result, I managed to solve 0 problems in the pre-contest round, and just a couple of days before the P0 round, I rushed through Logisim.*

* *For P3, I tried building it from scratch on my own, without looking at past blog posts, and collaborated with Gemini. In the end, I didn’t finish it before the P3 submission deadline, so I ended up taking a week gap at that P3 week.*

* *I used to dismiss the recommended problems outside of class, doing nothing but submitting the code files without any preparation, foolishly hoping to solve the in-class problems on the spot and pass the exam solely on my own wits. As a result, I got stuck on P4 for two weeks. Finally, before my third attempt at P4, I thoroughly worked through the recommended problems, which allowed me to breeze through it in just one hour.*

* *...*


**Click here to go straight to the summary: [Summary](#总结)**

![结算](/images/计组全踩坑记录/image.png)


## Thoughts and Rants

### First Impressions
To be honest, I had almost no idea what this course—Computer Architecture—was about before I started studying it, and the summer prep material left me completely baffled.Looking at this software that hasn’t been maintained since 2013, this ancient webpage, and these incredibly clunky programming tools, I felt a deep sense of despair and doubt about my future studies: *Do I really have to learn using these things? Does anyone even use them anymore?*
I think that’s also why I didn’t do much studying over the summer.

It wasn’t until the semester actually started and I began taking computer lab classes that I realized I had to learn.
Many people complain that theory classes are useless, but I have to admit that Professor LXD’s Computer Organization course was actually very helpful to me. I still remember that when I first started, I knew almost nothing about finite-state machines, logic gates, or signals.His explanations in class were so clear and easy to understand that I had a “lightbulb moment,” and I began to grasp the basics of the course. (Though I found it a bit hard to follow the later material on caches and memory...)

### Midway
During P3 and the stages leading up to it, I almost always (well, let’s not say “almost”—it was all the time) learned by watching tutorials on my own and asking AI for help, because I thought it was more efficient, and also because I couldn’t really find anyone to discuss things with.When the AI couldn’t solve a problem, I’d start digging through materials from previous years. At the time, I still chose to watch tutorials on my own and try **to create things** myself; although it was a bit difficult, working with the AI wasn’t impossible.However, I discovered a major problem with this approach: it was **far too time-consuming**. To complete it, I had to sacrifice time each week that should have been devoted to other projects, and I couldn’t even finish by the Sunday deadline (which is how I fell behind on P3). I kept doing everything by hand all the way through P4.
It wasn't until P5... that I discovered [A Book to Help You Pass the Computer Science Lab][1]!
 
~~So I just started copying everything~~ So, the learning path from here on out is: read the course textbook + send both the textbook and the tutorials to Gemini at the same time + read the blog tutorials + piece together my own documentation and CPU code.


## About "Creativity"

*"Did I really learn anything this way?"*
I may have learned something, but I want to point out that my learning process here went through a transition **from trying to create on my own** to **reading reference solutions and replicating them**.Although both approaches resulted in completing the CPU assembly task, the methods were clearly different. The former was obviously more challenging, while the latter—aside from acquiring knowledge—did little to enhance my thinking; all I did was understand someone else’s ideas and then copy them.

On the one hand, I told myself, *“I probably won’t need this knowledge in the future, except for exams.”* So there’s nothing wrong with just coasting through it.
On the other hand, I still can’t help but feel regret, and I’d like to ask the people who designed this course how they view this phenomenon. Perhaps the current outcome is that our average score has reached a level that looks good on the surface, but from a personal perspective, the result is disastrous:
- For students who don’t want to learn but are forced by exam pressure to submit assignments that are half-copied and half-pieced together from previous students’ blogs—do you really think this helps them in any way other than wasting a little of their time?
- For students who want to learn, their time is limited. Lab sessions are often tightly scheduled, and the pressure from other courses is significant, so it’s very difficult to carve out time to fully immerse themselves in “original” design work.

Looking at it this way, **no one is benefiting.**

## On Exams and Collaboration

With a little simple reasoning, it becomes clear that cooperation is far more efficient than going it alone. Social progress is based on the division of labor. If everyone in ancient times had to hand-craft their own stone tools, hunt with their own tools, and gather fruit on their own, I believe everyone would have starved to death.

And what we’re doing now is grinding our own stones, hunting for our own food, and feeding ourselves.
I’m talking about the format **of these lab sessions**. In the computer lab, no talking to each other, no discussing problems, and no searching the internet. Run into a problem? Stuck on something you can’t figure out? Sorry, but you’ll either have to figure it out on your own or take that problem to the grave with you.

The problem is that issues aren’t resolved promptly (and some problems encountered during lab sessions were never resolved at all); we solved some problems, but others remained unresolved.

Just imagine: if students were allowed to interact with one another during lab sessions, how much more efficient would this course be? (This would even make up for the time lost due to the need for original work, as mentioned earlier.)
*“Why isn’t this data point passing?”*
*“Check the naming of your new signals, or their bit width, or something like that.”*
And just like that, the problem was solved. Instead of staring at the screen for an hour, trying to outsmart the compiler, and then suddenly realizing the answer.
**What’s the most important thing to learn in this course: the patience to carefully debug even the most complex code, or the ability to design a CPU from scratch? I think the answer to that question is obvious.**

## About Fitting
At first, I expected that my out-of-class studying and practice would be enough, and that the lab sessions would simply test my ability to think on my feet. With that expectation in mind, I solved one problem during my first P4 lab session and none during the second.Looking back now, I realize it was probably because I hadn’t connected certain signal names correctly, but I just couldn’t figure out what was wrong while I was in the lab, so I had to end the session in frustration.

After failing twice in a row, I finally discovered (I’d seen them before but hadn’t paid any attention) the past years’ problems, which I could submit and have evaluated. So, driven by a desire to figure out exactly why my code wasn’t passing the runtime tests, I set out to work on those problems.As expected, the first problem still wouldn’t pass even after I thought I’d fixed everything. So, with the help of AI and my own careful review, I finally found the issue and corrected it. This was a breakthrough—going from zero to one—so I immediately tracked down every problem that could be evaluated and worked through them all.

Actually, there are only a few common patterns to these problems, and the mistakes people tend to make are usually the same ones. With that in mind, I finished three problems in just one hour during my next lab session...
Looking back now, the process of getting the hang of this really boiled down to two things: first, understanding the general types of problems I might encounter, and second, identifying the range of mistakes I was likely to make. The second point solved the problem I had back then—when faced with errors, I didn’t know where to start, and I’d end up doubting my own reasoning rather than assuming it was just a minor typo in the code.

I’ve continued using this method since then, and I have to say it works really well—and it passed the P56 test (since it passed the P7 test, I didn’t bother with further fitting).

Key tool: [Script for scraping questions from the cscore website][2]

## Summary
1. **Old and difficult-to-use software**
2. **Working on my own rather than collaborating during lab sessions**
3. **Due to time constraints, I’ve limited myself to reading, understanding, and applying what I’ve learned, rather than engaging in original thinking and creation.**
4. **The Importance of Analyzing Past Exam Questions**

## I did learn a few things, though.

- It felt really good to learn about and understand data competition for the first time in class, and to grasp the concepts of D latches and D flip-flops. Before studying this, it was hard to imagine that such a “memory” device could be implemented using just a tiny delay on the rising edge—it’s pure hardware. Thinking about it from this perspective is actually quite interesting.
- When writing CPU code and solving problems, I often feel a sense of everything being interconnected—this is pure reason and logic.If you get the bit width wrong, reverse the logic, or set the conditions incorrectly, you won’t arrive at the correct conclusion (though this is partly thanks to the old ISE—after all, it doesn’t even flag errors when you use an undeclared signal or mismatched bit widths… You wouldn’t have this headache with a modern compiler).
- Anything else? I can't think of anything else.


 [1]: https://kamonto.github.io/Kamonto_blog/2025/10/14/%E4%B8%80%E6%9C%AC%E4%B9%A6%E6%95%99%E4%BD%A0%E9%80%9A%E5%85%B3%E8%AE%A1%E7%BB%84%E5%AE%9E%E9%AA%8C%EF%BC%88%E4%B8%8B%EF%BC%89/
 [2]: https://github.com/tsx8/buaa_tools/tree/main/cscore_problems

## Wrap-up:
![alt text](/images/计组全踩坑记录/end.png)

- 126.5 hours, equivalent to 8 hours per week
![alt text](/images/计组全踩坑记录/1.png)

- I couldn't get past Problem 5, so I asked the teaching assistant for help and finally solved it.
![alt text](/images/计组全踩坑记录/2.png)

- Obviously, I put it off until Sunday and only started learning once I felt the pressure of the deadline.
![alt text](/images/计组全踩坑记录/3.png)

- Posts are almost always published in the afternoon and evening.
![alt text](/images/计组全踩坑记录/4.png)
