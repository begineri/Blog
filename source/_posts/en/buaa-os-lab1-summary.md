---
lang: en
title: "buaa26-OS-lab1-Summary"
date: 2026-04-15 23:23:00
tags:
    - OS
---

## Basic Concepts
To complete this experiment, you’ll first need to familiarize yourself with the following concepts:

#### QEMU Emulator
Operating systems run on hardware, and to better manage the hardware resources of a computer system, an operating system is required.
QEMU provides a simulated hardware environment—such as a CPU—that runs the executable files we ultimately [cross-compile](#cross-compilation).

---

<span id="cross-compilation"></span>
#### Cross-Compilation
There are two environments in the experiment
- Platform A (Host): A jump server provided by the school; this is where we write code and run `make` commands.
- Platform B (Target): The environment in which the MOS kernel currently under development is to run. In this experiment, this is a hardware environment emulated by QEMU, with a MIPS CPU architecture.

To compile a program on A that runs on B, we need to use **a cross-compilation toolchain**—such as the ``mips-linux-gnu-gcc`` tool in the [Makefile](#Makefile)—which translates C code into low-level binary instructions for the MIPS architecture.

---

#### Makefile
The top-level Makefile specifies how the source files in each subdirectory are assembled, step by step, into the final system image, `mos.elf`.

``` c
all: $(mos_elf)     # the final target
$(mos_elf): $(modules) # Call the linker $(LD) to link all object files
    $(LD) $(LDFLAGS) -o $(mos_elf) -N -T $(link_script) $(objects)

$(modules): # Run make in each subdirectory
    $(MAKE) --directory=$@
```

Key takeaways:
1. `all`:`make`—The Default Starting Point
2. `$(modules)`: Compile separately in the `lib`, `init`, and `kern` subdirectories; the top-level directory is only responsible for uniformly calling [the linker `$(LD)` and the link script `kernel.lds`](#linkers-and-link-scripts) to assemble them into `mos.elf`
3. `include.mk`: This file configures a cross-compilation environment; by running `include include.mk` in the top-level Makefile, you can set up tools such as `gcc` or `ld`.

---

#### ELF files
ELF is a file format.
`.c` The file was compiled by the compiler (gcc), generating an object file (.o), which is a relocatable file in the ELF format.
![alt text](/images/lab1/1.png)

An ELF file can be viewed from two perspectives:
- Section Header Table: This is for the linker. It organizes the program into “sections”—such as “code (.text)” and “data (.data)”—to facilitate the linker’s assembly of the program.
- Program Header Table: This is intended for the operating system loader (in this experiment, QEMU). It groups sections with the same attributes into larger “segments,” recording the address in virtual memory where the segment should be loaded (`VirtAddr`), the amount of memory space required (`MemSiz`), and the read and write permissions.
- `readelf`. Tools can easily parse the contents of ELF files.

ELF files can be accessed in code as structures:
``` c
// binary points to the start of that block of raw bytes
Elf32_Ehdr *elf_header = (Elf32_Ehdr *)binary; 

// Read through the struct fields; the compiler computes the byte offsets, so the data in the block can be accessed and modified
unsigned int entry_address = elf_header->e_entry;
```

---

<span id="linkers-and-link-scripts"></span>
#### Linkers and Link Scripts
##### Linker
The compiler (gcc) is responsible for converting each `.c` source file into a separate `.o` object file. The linker’s task is to combine these scattered `.o` files into a complete, executable file (such as `mos.elf`).
 
The linker is responsible for the following tasks:
- Merging Sections: Merge all code segments (`.text`) from the input files together, merge all data segments (`.data`) together, and do the same for the other segments.
- Relocation: Assigning an absolute memory address to every line of code and every variable so that the CPU can access them.
- Symbol Resolution: The linker is responsible for finding the exact address of the called function and directing the call instruction to that location. For example, when `main.c` calls a function in `fibo.c`.

##### Linker Script
A linker script is a plain text file (`kernel.lds`) that instructs the linker on how to organize memory.

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

As shown in the code above, the script defines the following:
- Using the location counter (`.`), the kernel's `.text` is forced to start at a specific address.
- The rules state that memory must first contain a `.text`, then a `.data`, and finally a `.bss`.
- Handling CPU Alignment Requirements
- Specifies the entry point for the first instruction after the system powers on (`_start`)

---
#### MIPS Memory Layout
For 32-bit processors, **the virtual address space** is 4 GB.
In the MIPS architecture, the virtual address space is divided into four major regions:
![alt text](/images/lab1/2.png)
- `kuseg` (0x00000000 - 0x7FFFFFFF): 2 GB, user mode; physical memory must be accessed via the MMU
- `kseg0` (0x80000000 - 0x9FFFFFFF): 512 MB, kernel mode, most significant bit set to zero, via cache
- `kseg1` (0xA0000000 - 0xBFFFFFFF): 512 MB, kernel mode, top three bits cleared, bypasses the cache (used for accessing peripherals)
- `kseg2` (0xC0000000 - 0xFFFFFFFF): 1 GB, kernel mode, memory access via MMU, via cache

Topics covered include:
- MMU (Memory Management Unit): A unit that manages memory, looks up the TLB and page directory, and maps virtual addresses (VPN) to physical addresses (PA).
- Cache: A type of SRAM located next to the CPU, used to retrieve data based on an address.

---

## Content Overview
<!-- This lab focuses on the operating system boot process; the subsequent section on writing the prinkfk function primarily covers basic C programming concepts and will not be elaborated on here. -->

### Building a Kernel from Scratch
Based on the Makefile mentioned earlier, the following steps were taken from running `make` to building the MOS kernel:
1. After executing command `make`, the top-level Makefile begins to traverse the subdirectories `lib`, `init`, and `kern` in sequence, invoking their respective sub-Makefiles to compile all C code (`.c`) and assembly code into the corresponding relocatable object files (`.o`).
2. The linker (`ld`) follows the linker script (`kernel.lds`) to perform section aggregation and symbol resolution on all object files (`.o`). It then registers symbol `_start` as the program entry point in the ELF header, ultimately producing the complete kernel binary image `mos.elf`.


### Operating System Boot Process
> pull oneself up by one’s bootstraps

Faced with a blank memory, how does a complex operating system boot up?On actual bare-metal hardware, when the power is first turned on, a small piece of basic code (the bootloader) is needed to load the massive operating system from the hard drive into memory. In our experiment, however, QEMU comes with built-in boot functionality that can directly recognize and load the ELF-format kernel we’ve compiled,so we don’t have to worry about the complex boot process.

So, after the emulator (QEMU) loads the kernel, it first jumps to the assembly entry point at `_start`:
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
The following preparations are made here:
1. Iterate through the virtual address range of Section `.bss` (from `bss_start` to `bss_end`) and set the memory of uninitialized global/static variables to zero.
2. Interrupt Masking: `mtc0 zero, CP0_STATUS` Masks external interrupts to ensure that subsequent boot logic is not interrupted.
3. Building the stack: Stack pointer register (`sp`) <- kernel stack top address (`KSTACKTOP`), providing the necessary space for the function call stack and local variables.
4. Via `j mips_init`, the program counter (PC) points to the initialization main function defined in C. At this point, the kernel’s low-level boot phase is complete, and system control is handed over to the C portion of the kernel.

And with that, the work on Lab 1 is complete.

---
## Experiment Reflections
This experiment was generally fairly easy, and even the hands-on exercises provided plenty of hints—it was very user-friendly. (I almost forgot about the function for comparing string equality—strcmp—but there happened to be a hint right below it.)

Aside from the many issues with my new main computer during the lab session, the process of solving the problems went quite smoothly—I just had to follow the instructions step by step.

It feels good to be writing C again after such a long time—including working with variable-length arrays, assigning and passing pointers, and using callback functions.

Writing source code has truly deepened my understanding of theoretical concepts, particularly giving me a more in-depth understanding of the ELF file structure, linker scripts, and the MIPS architecture.

---
Appendix: kernel memory layout diagram in `include/mmu.h`):

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

Here, KERNBASE is the starting virtual address of the kernel image.
