---
title: buaa26-OS-lab1-总结
date: 2026-04-15 23:23:00
tags:
    - OS
---

## 基本概念
在为了完成本次实验，需要先熟悉以下概念：

#### QEMU 模拟器
操作系统运行在硬件上，而为了较好的管理计算机系统的硬件资源，需要使用操作系统。
QEMU 提供了实验中的硬件环境，如CPU，负责运行我们最终经过[交叉编译](#交叉编译)得到的可执行文件。

---

#### 交叉编译
在实验中有两个环境
- 平台 A (宿主机/Host)：学校提供的跳板机，我们在这里敲代码、运行 make 命令。
- 平台 B (目标机/Target)：正在开发的 MOS 内核要运行的环境。在实验中，这是一个由 QEMU 模拟出来的硬件环境，其 CPU 架构是 MIPS。

为了在 A 上编译能让 B 运行的程序，我们需要使用**交叉编译工具链**，如在 [Makefile](#Makefile) 里的 `mips-linux-gnu-gcc`，可以将 C 代码翻译成 MIPS 架构的底层二进制指令。

---

#### Makefile
顶层的 Makefile 规定了各个子目录中的源文件，是如何一步步被组装成最终的系统镜像 mos.elf 的。

``` c
all: $(mos_elf)     # “最终目标”
$(mos_elf): $(modules) # 调用链接器 $(LD) 链接所有目标文件
    $(LD) $(LDFLAGS) -o $(mos_elf) -N -T $(link_script) $(objects)

$(modules): # 进入各个子目录进行 make
    $(MAKE) --directory=$@
```

关键理解点：
1. `all`：`make`的默认起点
2. `$(modules)`：在`lib`、`init`、`kern` 等子目录中分别编译，顶层只负责统一调用[链接器 `$(LD)` 和链接脚本 `kernel.lds` ](#链接器与链接脚本)将它们组装成 `mos.elf`
3. `include.mk`：此文件里配置了交叉编译环境，顶层Makefile里通过`include include.mk` 就可将`gcc` 或 `ld`等工具配好。

---

#### ELF文件
ELF是一种文件格式。
`.c` 文件经过编译器（gcc）编译，生成了目标文件 (.o)，属于 ELF 的可重定位文件。
![alt text](/images/lab1/1.png)

一个ELF文件可以从两种视角来看：
- 节头表 (Section Header Table)：这是给链接器看的。它把程序按照“代码（.text）”、“数据（.data）”等细分的“节”来组织，方便链接器拼接 。
- 段头表 (Program Header Table)：这是给操作系统加载器（即实验中的 QEMU）看的。它把属性相同的节打包成更大的“段（Segment）”，记录了这段数据应该被加载到虚拟内存的哪个地址（`VirtAddr`），需要多大的内存空间（`MemSiz`），以及读写权限。
- `readelf` 工具可以方便地解析出 ELF 文件的内容。

ELF文件在代码可以以结构体的形式被访问：
``` c
// binary 是指向那堆 01 内存块空间首地址的指针
Elf32_Ehdr *elf_header = (Elf32_Ehdr *)binary; 

// 直接通过结构体字段读取，编译器会自动计算所有底层的字节偏移，我们可以访问到并修改内存块中的数据
unsigned int entry_address = elf_header->e_entry;
```

---

#### 链接器与链接脚本
##### 链接器 (Linker)
编译器（gcc）负责把每一个 `.c` 文件变成独立的 `.o` 目标文件。链接器的任务则是把这些零散的 `.o` 文件组合成一个完整、可运行的可执行文件（如 `mos.elf`）。
 
链接器要完成以下几项工作：
- Merging Sections：将所有输入文件中的代码段（`.text`）合并在一起，数据段（`.data`）合并在一起，其他段也同样操作。
- 重定位 (Relocation)：为每一行代码、每一个变量分配绝对内存地址，以供 CPU 访问。
- Symbol Resolution：链接器负责找到被调用函数的精确地址，并把调用指令指向那里。如在 `main.c` 里调用了 `fibo.c` 里的函数。

##### 链接脚本 (Linker Script)
链接脚本是一个纯文本文件（`kernel.lds` ），它负责指挥链接器该如何内存。

```lds
ENTRY(_start)

SECTIONS
{
	. = 0x80020000;
	.text : { *(.text) }
	.data : { *(.data) }

	bss_start = .;
	.bss  : { *(.bss) }

	bss_end = .;
	. = 0x80400000;
	end = . ;
}
```

如以上代码，脚本进行了以下规定：
- 通过定位计数器（`.`），强制规定内核的 `.text` 必须从哪里开始。
- 规定内存中必须先放 `.text`，再放 `.data`，最后放 `.bss`。
- 处理 CPU 的对齐要求
- 指定系统通电后的第一条指令入口（`_start`）

---
#### MIPS 内存布局
对于 32 位处理器，**虚拟地址空间**的大小为 4 GB。
在 MIPS 体系结构中，虚拟地址空间会被划分为 4 个大区域：
![alt text](/images/lab1/2.png)
- `kuseg` (0x00000000 - 0x7FFFFFFF)：2GB，用户态，必须通过 MMU 才能访问物理空间
- `kseg0` (0x80000000 - 0x9FFFFFFF)：512MB，内核态，最高位清零，通过 cache
- `kseg1` (0xA0000000 - 0xBFFFFFFF)：512MB，内核态，高三位清零，不通过 cache（访问外设用）
- `kseg2` (0xC0000000 - 0xFFFFFFFF)：1 GB，内核态，通过 MMU 访存，通过 cache

其中涉及到：
- MMU（Memory Management Unit）：内存管理单元，查TLB/查页目录，实现VPN->PA
- Cache：高速缓存，CPU 旁边的 SRAM，用于通过地址得到数据

---

## 内容梳理
<!-- 本次 lab 的内容在于操作系统的启动这一过程，后面对prinkfk函数的编写多和C语言基础有关，不在这里赘述。 -->

### 从零开始搭建内核
根据前面提到的 Makefile，在执行make后到搭建出MOS内核，经过了这几步：
1. 执行 `make` 命令后，顶层 Makefile 开始依次进入 `lib`、`init`、`kern` 等子目录，调用各自的子 Makefile，把所有的 C 代码（`.c`）和汇编代码分别编译为对应的可重定位目标文件（`.o`）。
2. 链接器（`ld`）按照链接脚本（`kernel.lds`），将所有目标文件（`.o`）进行段（Section）聚合与符号解析。并将 `_start` 符号注册为 ELF 头部的程序入口点，最终得到完整的内核二进制镜像 `mos.elf`。


### 操作系统的启动
> pull oneself up by one’s bootstraps

面对一片空白的内存，复杂的操作系统如何启动？在真实的裸机上，硬件刚通电时需要有一小段基础代码（Bootloader）去把庞大的操作系统从硬盘拉进内存，而在我们的实验中，QEMU 自带了引导功能，可以直接识别并加载我们编译好的 ELF 格式内核，于是我们就不用考虑复杂的启动引导阶段。

于是，仿真器（QEMU）加载内核后，首先跳转至 `_start` 汇编入口：
``` 
.text
EXPORT(_start)
.set at
.set reorder
	/* clear .bss segment */
	la      v0, bss_start
	la      v1, bss_end
clear_bss_loop:
	beq     v0, v1, clear_bss_done
	sb      zero, 0(v0)
	addiu   v0, v0, 1
	j       clear_bss_loop

clear_bss_done:
	/* disable interrupts */
	mtc0    zero, CP0_STATUS

	/* set up the kernel stack */
	li 		sp, 0x80400000
	/* jump to mips_init */
	j mips_init
```
这里做了如下准备：
1. 遍历 `.bss` 节的虚拟地址区间（由 `bss_start` 到 `bss_end`），将未初始化全局/静态变量内存置零。
2. 中断屏蔽： `mtc0 zero, CP0_STATUS` 屏蔽外部中断，确保后续引导逻辑不被打断。
3. 搭建栈帧：栈指针寄存器（`sp`）<- 内核栈顶地址（`KSTACKTOP`），提供必要的函数调用栈与局部变量存储空间。
4. 通过`j mips_init` ，程序计数器（PC）指向 C 语言定义的初始化主函数。至此，内核的底层引导阶段完成，系统控制权交给内核的 C 语言部分。

到此，lab1 的工作就完成了。

---
## 实验体会
本次实验整体难度较低，包括上机的题目里也给了足够的提示，非常友好。（差点忘了比较字符串相等的函数，即strcmp，而底下刚好有提示）

上机过程除了新主电脑问题很多以外，做题的过程还是很顺利的，按照题目的提示一步一步编写就可以了。

久违地编写C语言有一种亲切的感觉，包括变长数组的使用，指针的赋值与传递，回调函数的使用。

通过编写源码，确实加深我对于理论知识的理解，尤其是对于ELF文件结构、链接脚本以及MIPS架构的理解有了更深入的认识。

---
附录：`include/mmu.h` 中内核的内存布局图）：

``` c
/*
 o     4G ----------->  +----------------------------+------------0x100000000
 o                      |       ...                  |  kseg2
 o      KSEG2    -----> +----------------------------+------------0xc000 0000
 o                      |          Devices           |  kseg1
 o      KSEG1    -----> +----------------------------+------------0xa000 0000
 o                      |      Invalid Memory        |   /|\
 o                      +----------------------------+----|-------Physical Memory Max
 o                      |       ...                  |  kseg0
 o      KSTACKTOP-----> +----------------------------+----|-------0x8040 0000-------end
 o                      |       Kernel Stack         |    | KSTKSIZE            /|\
 o                      +----------------------------+----|------                |
 o                      |       Kernel Text          |    |                    PDMAP
 o      KERNBASE -----> +----------------------------+----|-------0x8002 0000    |
 o                      |      Exception Entry       |   \|/                    \|/
 o      ULIM     -----> +----------------------------+------------0x8000 0000-------
 o                      |         User VPT           |     PDMAP                /|\
 o      UVPT     -----> +----------------------------+------------0x7fc0 0000    |
 o                      |           pages            |     PDMAP                 |
 o      UPAGES   -----> +----------------------------+------------0x7f80 0000    |
 o                      |           envs             |     PDMAP                 |
 o  UTOP,UENVS   -----> +----------------------------+------------0x7f40 0000    |
 o  UXSTACKTOP -/       |     user exception stack   |     PTMAP                 |
 o                      +----------------------------+------------0x7f3f f000    |
 o                      |                            |     PTMAP                 |
 o      USTACKTOP ----> +----------------------------+------------0x7f3f e000    |
 o                      |     normal user stack      |     PTMAP                 |
 o                      +----------------------------+------------0x7f3f d000    |
 a                      |                            |                           |
 a                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~                           |
 a                      .                            .                           |
 a                      .                            .                         kuseg
 a                      .                            .                           |
 a                      |~~~~~~~~~~~~~~~~~~~~~~~~~~~~|                           |
 a                      |                            |                           |
 o       UTEXT   -----> +----------------------------+------------0x0040 0000    |
 o                      |      reserved for COW      |     PTMAP                 |
 o       UCOW    -----> +----------------------------+------------0x003f f000    |
 o                      |   reversed for temporary   |     PTMAP                 |
 o       UTEMP   -----> +----------------------------+------------0x003f e000    |
 o                      |       invalid memory       |                          \|/
 a     0 ------------>  +----------------------------+ ----------------------------
 o
*/
```

其中 KERNBASE 是内核镜像的起始虚拟地址。