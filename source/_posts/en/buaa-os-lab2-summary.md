---
lang: en
title: "buaa26-OS-lab2-Summary"
date: 2026-04-16 22:21:04
tags:
    - OS
---

## lab2 Highlights

Actually, Lab 2 is divided into three parts.
### 1. Physical Memory
Just keep the following points in mind:

1. When the operating system starts up: it determines the size of physical memory, then creates a massive array (pages), divides the physical memory into 4KB chunks, and allocates a `struct Page` to each chunk.
2. Physical Memory Paging: 4 KB per page
3. Free Memory Pool: Build a free list pool so that, during peak load, you don’t have to go through the hassle of allocating memory from the main memory every time—instead, you can simply retrieve a block from the head of the free list you’ve built. When freeing the memory, you can similarly just reinsert the block back into the head of the list.
4. Double-linked list: It achieves O(1) complexity for insertion, deletion, modification, and lookup, making it convenient and efficient. The key to understanding it is the secondary pointer: it always points to the arrow pointing back at you (which makes it easier to directly modify the content pointed to by the previous node).

``` c
struct Page {
    struct {
        struct Page *le_next;  
        struct Page **le_prev;  
    } pp_link; 

    u_short pp_ref;
};
```

### 2. Virtual Memory Management
1. Virtual address: PDX (high 10 bits) + PTX (middle 10 bits) + Offset (low 12 bits).
2. Virtual Address <--> Physical Address: Whether through the CPU’s time-consuming memory access or the TLB, this diagram clearly illustrates the conversion relationship between these addresses:
![alt text](/images/lab2/地址转换.png)
3. pgdir_walk / page_insert / Self-mapping: See the analysis of challenges below for details.

### 3. TLB Flushing and Refilling
1. Purpose of the TLB: To speed up CPU memory access
2. TLB Refill: `do_tlb_refill`, write TLB
3. TLB Invalidation: When a page table entry is modified, `tlb_invalidate → tlb_out`
4. Always ensure absolute consistency between the CPU cache (i.e., TLB) and memory.

---

## Analysis of Challenges:
That description sounds simple enough, but in reality, even by relying on reading PowerPoint slides, textbooks, watching online courses, and even asking AI, I still encountered significant difficulties in understanding the material during my studies.Ultimately, I believe the main reasons were the obscure translations and the completely incomprehensible phrasing in the PowerPoint slides and textbooks: they were not at all intuitive, offered no explanation of “why this is needed” or “why it’s structured this way,” and simply presented all the concepts right from the start, leaving students to figure out the reading comprehension on their own.


Take an example from a guidebook—it starts right off with a long, complex sentence:
> “int pgdir_walk(Pde *pgdir, u_long va, int create, Pte **ppte). This function stores a pointer to the second-level page table entry containing the virtual address va in the second-level page table structure corresponding to the first-level page table base address pgdir at the location pointed to by ppte.”

That single sentence touches on countless concepts:
1. Level 1 Page Table: Page Directory (which might as well be called the "Page Table"—a table), refers to the table that stores all page tables.
2. Level-1 page table base address: i.e., the parameter `pgdir`, which is the starting address of the large page directory table
3. Two-level page table structure: This refers to the structure consisting of a first-level page table and a second-level page table (duh).
4. Virtual Address (VA): Key point—the data we pass in is used to perform lookups through it.
5. Second-Level Page Table: Page Table—the location where all page table entries are actually stored
6. Pointer to a secondary page table entry: a pointer to a page table
7. In the space pointed to by ppte: What is ppte? It is a pointer that points to the secondary page table found as described above, and returns it as the result.

To put it simply, the `pgdir_walk` function works as follows: Given a virtual address `va`, the CPU traverses the `pgdir` downward until it finds the page table that contains the physical page corresponding to `va`, and then returns a pointer to that page table so that we can modify it.

---
Similarly, for `page_insert`:
> “int page_insert(Pde *pgdir, u_int asid, struct Page *pp, u_long va, u_int perm), which maps the virtual address va in the second-level page table corresponding to the base address pgdir of the first-level page table to the physical page associated with the page control block pp, and sets the page table entry permissions to perm.”

Key Concepts:
1. Page control block (pp): A pointer to a structure, `struct Page *`, which directly corresponds to a physical page
2. Page table entry permissions: Specify whether the page table entry (PP) corresponding to this memory region is “read-only,” “read-write,” or “kernel-visible only.”
3. This uses page2pa: converting a page pointer to a physical address

In other words: Given a VA and a page table, locate the corresponding page table, then fill in the page table entry (using the VA, PP, and perm).

---
Regarding `page_lookup`:
> “struct Page *page_lookup(Pde *pgdir, u_long va, Pte **ppte), which returns the page control block for the physical page mapped by the virtual address va in the second-level page table corresponding to the base address pgdir of the first-level page table, and sets the location pointed to by ppte to the address of the corresponding second-level page table entry.”

Breakdown:
1. In a two-level page table structure, the page control block of the physical page to which the virtual address (va) is mapped: va -> struct Page*, which is returned as the return value, returning the physical block corresponding to va.
2. Set the space pointed to by `ppte` to the address of the corresponding secondary page table entry: *ppte = the page table entry address found by `pgdir_walk(va)`

To summarize, this function uses `va` to return the physical block corresponding to the current page table entry, while also returning the page table entry containing this data so it can be modified.

---

Just like in math, many people find certain concepts to seem difficult at first glance, but in reality, it’s simply because they’re unfamiliar with the underlying components of those concepts, which prevents them from grasping the concept as a whole. Therefore, as demonstrated in the process above, when you break down a complex concept, you’ll discover it consists of countless smaller components—and only after understanding those components can you truly grasp the whole.

When I first encountered the concept **of self-mapping** during this lab session, I sat staring at the PowerPoint slides, racking my brain but completely lost. Even the AI couldn’t explain it clearly to me—one moment it was talking about physical addresses, the next it was switching to virtual addresses. Why? What is it? There were no answers at all, just densely packed text and incomprehensible diagrams on the slides.That afternoon, as I struggled desperately to understand it, I thought this was a mysterious and profound concept.

When I finally read through the C code, I realized it was nothing more than a few techniques for accessing and assigning values to pointers:
Let’s make a change to this image that appears in the manual:
![alt text](/images/lab2/image-1.png)

Four 32-bit headers with different formats are pointing back and forth. When I first saw this, I thought multiple addresses were being accessed here. In reality, this is simply a process of obtaining a pointer (address) and dereferencing the pointer (data), but this diagram fails to distinguish between the two.

In short, the process is as follows (va → page table entry, i.e., the pgdir_walk process):
1. (pgdir | va[31:22] | 00) -> PDX* type, assuming it is named a
2. Dereference a (*a) → Obtain the base address of the PTB (this is a physical address; it must be converted to a virtual address so the CPU can access it)
3. PTBbase | va[21:12] | 00 -> PTB* type, assuming it is named b
4. b is the page table entry we’re ultimately looking for; returning it allows us to add to or modify the page table entry later.

This is what the diagram illustrates, and the so-called “self-mapping” provides a convenience for the CPU: the CPU only uses this process to locate data, but this method can only find page table entries.To enable direct modification of page tables and even the page table directory (pgdir), the CPU employs a clever mechanism: it inserts the page table directory itself as one of the many page tables. This way, when accessing it, the following can be used: pgdir[a] → pgdir, and padir[b] → a specific page table (rather than a page table entry).

Through the same process, the CPU can access and modify the entire page table.

The “why” and “how” here, as well as the guides and PowerPoint presentations, aren’t explicitly explained—readers will just have to figure it out for themselves.

---

## Experiment Reflections

In future experiments, keep the following points in mind:
1. Start studying early—don’t wait until two days before the lab session to begin;
2. More importantly, make sure you have a solid grasp of the theoretical knowledge—that is, the content of the lecture slides;
3. More importantly, when you just can’t seem to wrap your head around the theory, take a look at the code—it’s actually easier to understand that way.

# Original Content Note
All content in this post is original.
