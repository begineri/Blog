---
lang: en
title: "buaa26-OO-u2"
date: 2026-04-27 17:21:26
tags:
  - OOP
  - java
---
# 2026 Object-Oriented Programming Unit 2 Blog Assignment — Summary of the Multithreaded Elevator System

## I. Summary and Analysis of Synchronization Block Configuration and Lock Selection in the Three Assignments

### 1. The Evolution of Lock Mechanisms Across Three Iterations
- **Fifth Assignment (Basic Elevator):**
  - **Lock Selection:** Concurrent access to shared objects `GlobalQueue` (global queue) and `receiveBuffer` (local allocation queues for each elevator) is primarily controlled by the `synchronized` keyword.
  - **Synchronization block setup:** Apply locks directly outside methods such as `offer` (put in a request), `pop` (take out a request), and `setEnd` (end flag). The scheduler thread and elevator thread execute step `wait()` when the queue is empty, and step `notifyAll()` when a new request arrives or the process terminates.
- **Sixth Assignment (Add "Reset/Maintain"):**
  - **Lock Selection:** Added a `synchronized` lock for queue `sysActionQueue` in the elevator’s internal system. A maintenance request requires revoking the elevator’s current operational status and “returning” passengers who have not yet arrived to queue `GlobalQueue`.
  - **Synchronization Block Configuration:** In the return logic, the current elevator’s internal waiting list is locked first, followed by locking `GlobalQueue` to perform reverse `offer` and wake-up operations. To avoid **deadlocks**, the locking order is strictly defined (always requesting upper-level resources from lower levels, and first processing internal tasks before releasing them to the global pool), ensuring that locks of different categories do not create circular waits.
- **Assignment 7 (Dual-Cabin Modification and Recycling):**
  - **Lock Selection:** Introduced `ReentrantLock`. Since the dual cabins A and B in the same hoistway cannot collide at the Transfer Floor, I assigned a single anti-collision lock `sharedTransferLock` to both elevators `ElevatorContext`.
  - **Synchronization Block Settings:** This lock is not a data read/write lock, but rather a pure “physical space mutual exclusion lock.” The elevator is set to `lock.lock()` before entering the transfer level, and to `lock.unlock()` after it has completely left the level and `lock.isHeldByCurrentThread()` is guaranteed.

### 2. The Relationship Between Statements and Synchronization Blocks in Locks
- **Minimizing Critical Sections:** I consistently isolate computation-intensive or blocking operations from synchronization blocks. For example, calculating the weights for each elevator’s scheduling (`calCost()`) does not require locking; all `Thread.sleep()` simulation behaviors are executed entirely outside the synchronization block, preventing a situation where the entire elevator scheduling system becomes paralyzed due to a single elevator going into sleep mode.
- **Atomic variable assistance:** To avoid frequent locking of the elevator, I used `AtomicInteger` to track the elevator’s current load (`asyncTotalTasks` and `asyncCurrentWeight`). The scheduler can read this value without a lock, which significantly alleviates the bottleneck caused by global lock contention.

---

## II. Evolution of Concurrency Architectures and Scheduler Design

In this iteration, I experimented with “free competition” and “centralized scheduling” as elevator scheduling strategies.

### 1. Overall Concurrency Architecture Design: From Free Competition to Centralized Scheduling
- **The Producer-Consumer Model and Free Competition (Sixth Assignment):**
The system was originally a typical multi-consumer order-grabbing model. `InputHandler`, as the sole data source, places passenger requests into `GlobalQueue`, which acts as a buffer tray. The system has no central dispatcher; the six elevators run in parallel as independent threads. Internally, `TaskAcquirer` actively “snatches orders” from the pool. This leaderless scheduling greatly reduces the risk of scheduling deadlocks. Combined with lifecycle management, the system safely terminates when `InputHandler` finishes reading and the system’s singleton global counter reaches `RequestCounter.getInstance().getCount() == 0`.
- **Central Dispatcher Pattern (used in the seventh assignment):**
With the introduction of dual-cabins and complex recycle commands, simply rushing to accept orders blindly is no longer sufficient to achieve global optimality or coordinate the allocation between the two vehicles. Therefore, a single `DispatchThread` scheduler has been introduced. It serves as a pivotal hub that “bridges the gap”:
  - **With the global queue:** after `InputHandler` delivers a request, it wakes the suspended scheduler.
  - **Regarding the elevator:** The dispatcher precisely locks onto the target elevator’s `receiveBuffer` and distributes the request, implicitly waking up the selected elevator that is on standby.
  - **System Changes:** When a power outage for maintenance or a conversion to a dual-car system occurs, the elevator thread clears out the passengers and returns them to `GlobalQueue`, thereby reawakening the dispatcher to perform reallocation.

### 2. Implementation and Optimization of Scheduling Strategies
To balance **time performance (operating speed and wait time)** **and power consumption (energy used during movement and door opening/closing)**, my core scheduling strategy is as follows:
- **Basic LOOK Strategy:** The elevator picks up all requests traveling in the same direction along its route until there are no more requests at the front, at which point it reverses direction. This maximizes the use of a single trip and reduces the number of door openings (thereby lowering power consumption).
- **Quantum Elevator Strategy:** Use the magical quantum elevator strategy to maximize time efficiency.
- **Dynamic Allocation Considering Multidimensional Metrics**
  - **Distance and Direction Weight `directionAndDistanceCost`:** Set the cost for passengers traveling in the same direction as the elevator and located in front of it to a minimum (same route); impose a high penalty on requests that require the elevator to turn around. This strategy effectively reduces unnecessary back-and-forth trips and saves electricity.
  - **Load Balancing `queueLenCost` and Overload Prevention `weightCost`:** When assigning passengers, factor in the number of people already on each elevator and apply load penalty calculations. If assigning a passenger to a particular elevator would cause it to reach full capacity and prevent further boarding, it returns a very large cost and either forcibly rejects the passenger or reassigns them. This avoids the high latency caused by queuing, increases throughput, and improves average wait time.
  - **Regarding dual-cabin elevators:** Evaluate requests that can be served directly versus those requiring a transfer via dual-cabin elevators (taking into account the characteristics of cross-floor zones), and prioritize completing the trip via a coordinated A/B relay whenever possible.

---

## III. Balancing Functional and Performance Design, and Scalability

Over the course of three consecutive iterations, the system’s functionality continued to expand. If all operations were combined into a single class, it would inevitably lead to difficulty in scaling and poor performance. To achieve high cohesion and low coupling, I performed a thorough decoupling of services.

### 1. Designing Scalable Architectures and the Single Responsibility Principle (SRP)
Traditional approaches tend to cram hundreds of lines of code into a single ``ElevatorThread.run()`` block, but by breaking down the elevator’s internal logic to the utmost detail, I’ve implemented the Single Responsibility Principle (SRP), ensuring thread safety and providing tremendous scalability:
- **Low-level state machine container (ElevatorContext):** Acts as a lightweight context and information aggregator, centrally storing the current floor, direction, load, passenger list, order queue, and system event queue, completely eliminating the need to pass parameters back and forth between methods.
- **Action Decision (Strategy):** Focuses on implementing the classic LOOK algorithm. It does not concern itself with how the elevator moves; it simply reads the input read-only constraint interface `ElevatorInfo` and returns a specific action enumeration (`MOVE`, `OPEN`, `WAIT`, `REVERSE`).
- **Main Request Acquirer (TaskAcquirer):** When the elevator is idle, it is specifically responsible for waiting on the queue with `wait()`; when awakened, it schedules the task to take the lead (in conjunction with order priority calculations that incorporate a distance penalty mechanism).
- **Mechanical Microservices Layer (Service):**
  - `MovementService` Primarily responsible for high-precision elevator movement simulation, it provides an innovative “quantum wait” (`quantumWait`) mechanism that can block and intercept sudden interrupt commands (such as maintenance) or pickups along the route within an extremely short time slice.
  - `DoorTransferService` Specifically responsible for traffic redirection. Implemented strict validation logic for “capacity + same-direction” traffic routing and a flawless rollback distribution mechanism in the event of a forced interruption `kickAllPassengers()`.
  - `SystemActionHandler` (including maintenance and recycling scheduling) perfectly encapsulates the processes responsible for handling unexpected maintenance situations, including operational continuity and settlement, thereby achieving system-level isolation and handover.

### 2. UML Class Diagram Architecture Design
![alt text](/images/oou2/1.png)

### 3. UML Sequence Diagram
After the main thread loads the various components, the flow of data from input to distribution to the elevator core loop is as follows:
![alt text](/images/oou2/2.png)

---

## IV. Bug Analysis in Self-Testing and Peer Testing, and Multithreading Debugging Methods

### 1. Analysis of Bugs Encountered During Self-Testing and Peer Testing
Here are some real bugs I’ve discovered during these recent iterations and hacks.

- **1: CPU timeout caused by interrupt polling and infinite loop verification**
  - **Scenario:** During a test involving maintenance requests, the program kept looping, resulting in excessive CPU time.
  - **The class where the problem lies has** `MovementService.tryMoveOneFloor()` **methods**.
  - **Root cause:** This was actually due to a minor oversight on my part at the time: `quantumWait` was interrupted immediately. I had originally set the interruption detection condition to `interruptedTime > 0`. In this situation, if the value reached `interruptedTime = 0`, the system would not recognize that the elevator had encountered an interruption; instead, it would immediately return to the beginning of the polling cycle. It would then detect that it needed to MOVE and return 0 again, causing the CPU to enter a polling loop.
  - **Solution:** Simply change the condition to `interruptedTime != -1`. As long as the return value is not equal to -1, it means the move was interrupted and has successfully transitioned to the maintenance-interrupted state.
  - This reminds me to thoroughly check the logic whenever I design even the smallest decision-making process.

- **2: During maintenance, all arriving passengers were blindly ejected, causing them to be repeatedly accepted (sixth assignment).**
  - **Scenario:** When maintenance triggers the forced ejection of passengers, the elevator repeatedly jumps up and down between floors without stopping.
  - **Classes and methods involved:**`DoorTransferService.kickAllPassengers()`.
  - **Root cause:** Originally, to clear the cabin, all passengers were discarded, thrown back into `GlobalQueue`, and the current floor was appended as `fromFloor`. However, the code failed to verify whether the elevator actually stopped at the destination! For example, if a passenger originally headed to F5 is forcibly ejected during maintenance at F5, this generates a local passenger entry request with both the origin and destination as F5. When this request is picked up by another recipient, the calculated product is 0, causing the strategy to keep returning `REVERSE` and resulting in an infinite loop!
  - **Solution:** Added a final destination check! As long as the floor where the passenger was left behind during maintenance happens to be their destination, they are safely disembarked on the spot, and "`OUT`" is printed.

- **3: Joint Deadlock Caused by Two Elevator Cabins Yielding and Forced Movement at the Transfer Level (Seventh Assignment)**
  - **Scenario:** Handling complex command inputs involving a large number of random passengers, plus `UPDATE` (dual-cabin conversion) and `RECYCLE` (retrieval of a specific cabin)(For example, when one of the two cabins in a dual-cabin elevator is at transfer floor F2 and the other needs to travel to F2 for retrieval), the system freezes completely and does not output any results, resulting in a TLE during the final evaluation.
  - **Root causes and issues:**
    1. **`Strategy.java` Logical deadlock:** When Car A, at the transfer level, defaults to returning `WAIT`, and Car B receives a `RECYCLE` command requiring it to cross the transfer level, a permanent logical stalemate is formed (because the anti-collision logic prevents Car B from entering, and Car A is stuck and cannot exit).
    2. **Physical lock not properly released:** Encountered a forced interruption of sleep at `interrupt()` and called `moveToTargetAndClearPassengers`; due to the lack of rigor in handling this thrown interruption, the system terminated the code block prematurely, causing the elevator not only to leave the transfer level with `ReentrantLock` still unreleased but also preventing `lock.unlock()` from being executed. Subsequently, all other operations related to the two cabins that attempted to acquire this lock were permanently blocked.
  - **Solution:**
    - `Strategy` Added monitoring of attached car status; if it is detected to be in the retrieval state at a transfer station, an empty car holding the lock will proactively stop waiting and yield.
    - During the handling of a forced state reset, the protection scope is strictly determined; as long as `lock != null && lock.isHeldByCurrentThread()` is explicitly guaranteed, `lock.unlock()` is immediately and safely executed within a finally block or similar structure, ensuring that the mutual exclusion lock for the collision-free space is returned with absolute safety.

### 2. Methods for Debugging Multithreading
To address concurrent errors arising from multidimensional uncertainty, I have summarized the following solutions:
- Using the data feeder provided by the discussion forum
- Debugging by printing
- AI-assisted debugging at the code or test case level

---

## V. Understanding and Summary of Thread Safety and Layered Design

1. **A Profound Shift in Thread Safety**
   - I now understand that while adding a `synchronized` to every place in this lock can prevent issues, it also leads to performance degradation.
   - **State isolation and encapsulation**: The scheduler cannot access the specific elevator object; it can only access read-only `AtomicInteger` load figures. Similarly, individual elevators have no access to the state of other elevators. This approach—which involves fully decentralized, isolated shared variables—is the key to ensuring high concurrency is both safe and highly performant.

2. **Understanding Hierarchical Design**
   - **The shift from a procedural approach to a separation of “state machines, strategies, and services”:** When faced with complex requirements such as maintenance, expansion, retrofitting, and even coordinated operations involving multiple vehicles, the division of responsibilities among objects is extremely helpful.
   - I broke the system down into **a low-level state machine (Context)**, **a behavior and decision-making layer (Strategy)**, and **a mechanical implementation layer (Service)**. When the seventh assignment brought same-route passenger returns, or a new dual cabin had to be added, I didn’t have to change a single line of code in my main dispatch architecture or the elevator’s main thread—I simply incorporated a new ``UpdateHandler`` handling mechanism into the existing “microservices.” This is the best proof that well-designed layer boundaries pay off in terms of future maintenance.

## VI. Specific Insights on Using Large Language Models
To be honest, communicating with large language models can be pretty exhausting.

For the sixth assignment, since I had to design **the elevator assignment and** **dispatch logic** myself, I read through blogs from previous years to maximize performance as much as possible. Ultimately, I made a bold decision: I removed the intermediate `DispatchThread` entirely and let the elevators compete freely.
The reason I did this is that I saw comments from previous years saying, “Free Competition isn’t much worse in performance than Shadow Elevator, but it’s much easier to implement,” so I tweaked and refined the code to implement a model combining Free Competition and Shadow Elevator.

Getting back to using large language models, I feel like the time I spent writing code for this assignment was almost equal to the time I spent conversing with the model. Through those conversations, my thoughts gradually became clearer.
And the result? I wrote from Sunday until the Tuesday deadline, and ended up in the “orz” room.

Actually, when it came to fixing the bugs, I spent half the day trying to fix them myself without success; when I submitted the code, I just ended up turning some errors into different ones. In the end, I sent both the guide and my code to the AI. After thinking for a few hundred seconds, it pinpointed the issues and fixed the code. When I submitted that version, it showed that over a dozen bugs had been fixed at once.

Unfortunately, because I got too few points right in strong testing, I still don’t know how the performance of my free-competition strategy compares to other methods.

If my approach before the sixth assignment was still “old-school vibe coding”—chatting with the AI in a dialog box and doing a bit of copy-and-paste with code—then the seventh assignment—after I had stopped doubting the AI’s capabilities—marked the start of using AI-native IDE tools like Cursor, which really do boost efficiency.

--- 
Here is a summary of the issues I encountered:
1. AI is indeed very powerful; the best results came from the Gemini Pro model, accessed directly within Google AI Studio, fixed the code that had landed me in Room O in just one go. The same was true for the seventh assignment: when I sent it the guide and my existing code, along with a guiding prompt, after a few iterations—each lasting a few hundred seconds—it was able to complete the assignment almost perfectly.
1. Model performance is, of course, tied to the subscription price, and quota limits also affect the time it takes me to complete my assignments.
Specifically, to complete the seventh iteration assignment,I needed about two and a half days’ worth of quota for the Gemini Pro model available to Pro members (that is, it took me two and a half days to complete the seventh assignment, because I found that the code generated by models other than Gemini Pro still didn’t meet my standards). So, after spending 2–3 hours each day on conversations and coding, the rest of the time was spent waiting for the quota to replenish.
1. The effort I put in was vastly disproportionate to the results I got. As mentioned above, for the sixth assignment, I tried to design and write most of the code myself, and I decided on the design approach on my own after consulting with the AI. So I started on Saturday night and kept coding until the Tuesday deadline, using up all ten of my free submission attempts, and ultimately ended up in the "O" room. My time didn’t translate into a high score. Perhaps I learned a few things, but just like a paramecium choosing sugar water, I ultimately chose grades over knowledge. For the seventh assignment, I let the AI handle all decision-making and code writing, which earned me a decent performance score while requiring comparatively little effort.
Yes, no one would ever say this—something everyone obviously knows deep down: classes are meant for students to gain knowledge. But no one voices what they truly think: actually, more than knowledge, it’s this grade—a higher grade than others—that I really care about and have always been striving for. Maybe we aren’t even aware of this thought, but we’ve already been acting on it.
1. The time allotted for completing assignments on my own is simply not enough. Assignments are assigned on Thursday evening, right after we’ve just finished—or are still in the middle of—the previous peer testing, so I obviously can’t start working on them then. Friday is another day packed with classes, and in the evening there are seminars and lab sessions I have to attend—so it’s impossible to make any progress on the assignments that day either. There are two days on the weekend (after all, isn’t the whole point of having a two-day weekend to carve out a little extra time to rest amid a busy academic schedule?), but now that we have this OO assignment—due Tuesday night—if I do the math, Monday and Tuesday are theoretically class days. So, to ensure the assignment gets done, I’ll naturally have to use up the entire weekend to work on it.
Of course, I decided to take a day off and start writing on Sunday. The time I’d have available would be Sunday through Tuesday—at the cost of skipping classes, which I’d have to make up later. So, while it seems like I have three days, after subtracting the time required for other classes, the actual time available for coding is estimated to be less than two days. After trying it out, I found that this time was completely insufficient for me to write code that could pass strong testing. To finish before the deadline, I had no choice but to use AI to write the code.


Summary: I believe it’s possible to write code that satisfies me entirely on my own, without relying on AI—but I need enough time to do so. The current course schedule is too tight for me, and the restrictions on assessments and grades are too strict, forcing me to frequently use AI to generate and modify code in order to meet the course requirements. That’s the reality of the situation.

---
Come to think of it, I told a friend earlier, “We really have so many OO assignments right now; it’s going to take me more than two days to finish them.”
At the time, I didn’t realize what was causing me to take two days to finish this assignment. Was it a lack of time? No, that wasn’t it—it was because the daily AI quota is limited. If there were no limits on the AI Pro quota, it wouldn’t have been impossible to finish it in a single day.

---

