---
lang: en
title: "buaa26-CO-P3-Design Document-Logisim"
date: 2025-11-10 22:02:51
tags:
  - CO
---
# Design of a Single-Cycle MIPS Processor
> The content of this post is original and is provided for reference only; please do not copy it verbatim.

## 1. Single-Cycle Data Path Design

### Reference image
![Design Path](/images/设计通路.png "Reference image")
### Final Design
![Final Design](/images/all.png "all")
### Top-level output port
![Final Design](/images/output.png "output")

---

### 1.1 Combinational Components

#### 1.1.1 ALU (Arithmetic Logic Unit)

  - in:
    - SrcA, SrcB
    - ALUCtrl [3:0]
    - Shift: 5-bit shift amount
    - FlowJudge: whether to check for overflow
  - out:
    - Equal(zero)
    - Result
    - Overflow

* **Port Definitions**

|Signal Name|Direction|Bit width|Description|
| :-------- | :---: | :---: | :------------------------- |
| `SrcA`    |   I   |  32   |32-bit Operand A|
| `SrcB`    |   I   |  32   |32-bit Operand B|
| `ALUCtrl` |   I   |   4   |4-bit operation control signal|
| `Shift`   |   I   |   5   |5-bit shift amount (`shamt`)|
| `Result`  |   O   |  32   |Calculation Results|
| `Zero`    |   O   |   1   |1-bit zero flag `Equal(zero)`|

  * **Functional Definition**

|Number|Feature Name|Feature Description|
| :---: | :----------- | :----------------------------------------------------------------------------------------------- |
|   1   |Computational Choices|Based on the 4-bit `ALUCtrl` signal, select the operation to be performed (see the table below).|
|   2   |Arithmetic and Logical Operations|Perform the selected 32-bit operations on `SrcA`, `SrcB`, and `Shift`, and output the result to port `Result`.|
|   3   |Zero flag|Check whether the 32-bit output on Port `Result` **is equal to** `0x00000000`. If so, Port `Zero` outputs 1; otherwise, it outputs 0.|

**Detailed logic for `ALUCtrl` (Feature 1):**

  * `0000`: `Result = SrcA + SrcB` (Addition)
  * `0001`: `Result = SrcA - SrcB` (Subtraction)
  * `0010`: `Result = SrcA & SrcB` (bitwise AND)
  * `0011`: `Result = SrcA | SrcB` (bitwise OR)
  * `0100`: `Result = (SrcA < SrcB) ? 1 : 0` (signed `slt`)
  * `0101`: `Result = SrcB << Shift` (Logical Shift Left)

![ALU](/images/ALU.png)


---

#### 1.1.2 GRF (General-Purpose Register Set, also known as a register file)

- Read
    in: RA1 RA2
    out: RD1=RF[RA1] ,   RD2=RF[RA2]
- Writing
    in: WA, WD, clk
    | RegWrite |     out      |
    | :------: | :----------: |
    |    1     | RF[WA] -> WD |
    |    0     |None|


* **Port Definitions**

|Signal Name|Direction|Bit width|Description|
| :---------- | :---: | :---: | :-------------------- |
| `ReadAddr1` |   I   |   5   |Read address `RA1` from port 1|
| `ReadAddr2` |   I   |   5   |Read the address at port 2: `RA2`|
| `WriteAddr` |   I   |   5   |write-port address `WA`|
| `WriteData` |   I   |  32   |32 bits of data to be written  `WD`|
| `RegWrite`  |   I   |   1   |write enable|
| `clk`       |   I   |   1   |Clock Signal|
| `reset`     |   I   |   1   |Asynchronous Reset Signal|
| `ReadData1` |   O   |  32   | `RF[RA1]`             |
| `ReadData2` |   O   |  32   | `RF[RA2]`             |

  * **Functional Definition**

|Number|Feature Name|Feature Description|
| :---: | :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1   |Concurrent Asynchronous Read <br> (Concurrent Read)|Read 32-bit data asynchronously (i.e., immediately) from addresses specified as `ReadAddr1` and `ReadAddr2`, and output it to ports `ReadData1` and `ReadData2`, respectively. (i.e., `RD1=RF[RA1]`, `RD2=RF[RA2]`)|
|   2   |<br> (Synchronous Write)|When `RegWrite = 1`, on the rising edge of the `clk` signal, write the 32-bit data from port `WriteData` to the register specified by `WriteAddr`. (That is, `RF[WA] = WD`)|
|   3   |`$zero` Register Logic|The corresponding `ReadData` port **must** output `0x00000000`. <br> `Reg0` must never be modified.|
|   4   |Asynchronous Reset|                                                                                                                                                          |

![寄存器堆内部结构](/images/寄存器堆内部结构.png)

![GRF](/images/GRF.png)

---

#### 1.1.3 DM (Data Memory)
- MemRead RE
  - Read
    in: A
    out: RD = DM[A]
- MemWrite WE
  - Writing
  - clk
    in: A, WD
    out: DM[A] = WD

 * **Port Definitions**

|Signal Name|Direction|Bit width|Description|
| :---------- | :---: | :---: | :----------------------------------- |
| `Address`   |   I   |  32   |32-bit **byte address** (from `ALUResult`)|
| `WriteData` |   I   |  32   |32 bits of data to be written (`WA`)|
| `MemRead`   |   I   |   1   |Reading Enable Signals (`RE`)|
| `MemWrite`  |   I   |   1   |Writing Enable Signals (`WE`)|
| `clk`       |   I   |   1   |Clock signal (used for synchronous writing)|
| `reset`     |   I   |   1   |Asynchronous Reset Signal (Used to Clear RAM)|
| `ReadData`  |   O   |  32   |32-bit data read (outputted to `MemtoReg MUX`)|

  * **Functional Definition**

|Number|Feature Name|Feature Description|
| :---: | :---------------------------- | :----------------------------------------------------------------------------------------------------------------- |
|   1   |Address Mapping <br>|Convert the input 32-bit byte address `Address` into **the** 12-bit word **address** required by internal `RAM` by extracting `[13:2]` bit.|
|   2   |Memory Read <br> (Memory Read)|When `MemRead = 1`, read 32 bits of data asynchronously from the converted word address and output it from port `ReadData`. (i.e., `RD = DM[A]`)|
|   3   |Memory Write <br>|When `MemWrite = 1`, on the rising edge of the `clk` signal, write the 32-bit data from port `WriteData` to the converted word address. (i.e., `DM[A] = WD`)|
|   4   |Asynchronous Reset|When `reset = 1`, asynchronously clear every `RAM` cell to zero.|

![DM](/images/DM.png)

---
#### 1.1.4 nPC — Finite-State Machine:
- PC (Program Counter) --- State Transition ---> nPC
  - PC Registers — State Storage Module
    - en, reset, clk    
  - NPC Module — State Transition Circuit
  - Pc += 4
  - in: 
    - pc
    - IsB --> Offset(32) << 2 + pc
    - JUMP --> In_26(26) << 2 + pc[31:28]
    - JR --> Ra
  
  - out: 
    - Next_PC
    - PC+4

* **Port Definitions**

|Signal Name|Direction|Bit width|Description|
| :----------- | :---: | :---: | :------------------------------------------------------------- |
| `PC_in`  |   I   |  32   |The Value of `PC` (from Module `IFU`)|
| `Offset_Ext` |   I   |  32   |32-bit **Signed-Extended** Immediate (from the ``EXT`` module)|
| `imm26`      |   I   |  26   |26-bit jump immediate (from the `Splitter_Unit` module)|
| `Ra`         |   I   |  32   |`rs` Register Values (`ReadData1` of `GRF`)|
| `IsB`        |   I   |   1   |**Branch enable** signal. (`Main_Control[Branch]` **AND** `ALU[Zero]`)|
| `JUMP`       |   I   |   1   |**`j` Jump Enable** Signal (from `Main_Control_Unit`)|
| `JR`         |   I   |   1   |**`jr` Jump Enable** Signal (from `ALU_Control_Unit`)|
| `Next_PC`    |   O   |  32   |**The address of the next instruction**, as calculated (sent to the `Next_PC` port of `IFU`)|
| `PC_plus_4`  |   O   |  32   |The Value of `PC + 4` (from Module `IFU`)|


  * **Functional Definition**

|Number|Feature Name|Feature Description|
| :---: | :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
|   1   |Branch Target Calculation <br>|Compute the destination address of instruction `beq`: <br>`Branch_Target = PC_plus_4 + (Offset_Ext << 2)`.|
|   2   |Jump Target Calculation <br>|Compute the destination address of instruction `j`: <br>`Jump_Target = { PC_plus_4[31:28] , (imm26 << 2) }`.|
|   3   |PC Priority Selection <br> (Next PC Selection)|Using a 4-to-1 MUX (multiplexer), select one of the four possible next addresses as output `Next_PC` based on the priority of the `JR`, `JUMP`, and `IsB` signals.|

**Detailed logic behind PC priority selection (Feature 3):**

  * **`JR` = 1:** `Next_PC = Ra` (Highest Priority)
  * **`JR` = 0, `JUMP` = 1:** `Next_PC = Jump_Target`
  * **`JR` = 0, `JUMP` = 0, `IsB` = 1:** `Next_PC = Branch_Target`
  * **`JR` = 0, `JUMP` = 0, `IsB` = 0:** `Next_PC = PC_plus_4` (executed in default order)

![nPC](/images/nPC.png)

---

#### 1.1.5 IFU (Instruction Fetch Unit)

##### IM (Instruction Memory)

  * **Port Definitions**

|Signal Name|Direction|Bit width|Description|
| :----- | :---: | :---: | :----------------------------------------- |
| `A`    |   I   |  32   |32-bit **byte address** (`PC` from module `IFU`)|
| `RD`   |   O   |  32   |A 32-bit **instruction code** read from memory|

  * **Functional Definition**

|Number|Feature Name|Feature Description|
| :---: | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
|   1   |Address Mapping <br>|Convert the input 32-bit byte address `A` into **a** 12-bit **word address** by subtracting the starting address offset of `0x3000` and shifting it two bits to the right (i.e., extracting `[13:2]` bits).|
|   2   |Instruction Read <br>|Using the converted 12-bit word address, asynchronously read a 32-bit instruction from internal `ROM` (read-only memory) and output it from port `RD`.|

![IMm](/images/IMm.png)

##### IFU (Instruction Fetch Unit)

  * **Port Definitions**

|Signal Name|Direction|Bit width|Description|
| :-------- | :---: | :---: | :----------------------------------------------------- |
| `Next_PC` |   I   |  32   |The PC value to be loaded in the next clock cycle (from module `NPC`)|
| `clk`     |   I   |   1   |System Clock Signal|
| `reset`   |   I   |   1   |System Asynchronous Reset Signal|
| `stop`    |   I   |   1   |Clock Enable signal (active-low, used to pause the PC)|
| `PC`      |   O   |  32   |Address values stored in the **current** PC register (set to `IM` and `NPC`)|
| `Instr`   |   O   |  32   |`PC`: Corresponding **current instruction** (from Module `IM`)|                |

  * **Functional Definition**

|Number|Feature Name|Feature Description|
| :---: | :------------------------------ | :------------------------------------------------------------------------------------------------------------------ |
|   1   |PC Update <br> (PC Update)|When the rising edge of `clk` occurs and the signal for `stop` is 0 (invalid), load the value of `Next_PC` into the PC register.|
|   2   |PC Reset <br> (PC Reset)|When signal `reset` is set to 1, the value of the PC register is asynchronously forced to the start address `0x00003000`.|
|   3   |Instruction Fetch <br>|Output the current value of register `PC` to port `PC`, send it to internal module `IM` to retrieve the corresponding 32-bit instruction, and output it from port `Instr`.|
|   4   |PC+4 Calculation <br> (PC+4 Calculation)|Compute the result of adding 4 to the current value of register `PC` in parallel, and output it from port `PC_plus_4`.|

![IFU](/images/IFU.png)

---


#### 1.1.6 EXT (Extension Module)

Sign-extend the 16-bit immediate to 32 bits. To improve extensibility, the ``OPExt`` interface has been added here.

  * **Port Definitions**

|Signal Name|Direction|Bit width|Description|
| :------ | :--- | :--- | :-------------------------------------------------------- |
| Imm\_16 | I    | 16   |16-bit immediate number input signal|
| OPExt   | I    | 1    |Sign Extension Signal <br> 0: Unsigned extension (0 extension) <br> 1: Signed extension|
| Imm\_32 | O    | 32   |32-bit immediate output signal|

  * **Functional Definition**

|Number|Feature Name|Feature Description|
| :--- | :------- | :----------------------- |
| 1    |Sign Extension|Sign extension of a 16-bit immediate number|

![EXT](/images/EXT.png)

---

#### 1.1.7 SPLI (Instruction Separator Module)

  * **Port Definitions**

|Signal Name|Direction|Bit width|Description|
| :------- | :---: | :---: | :------------------------------------------------------------- |
| `Instr`  |   I   |  32   |A complete 32-bit instruction from the IFU (Instruction Fetch Unit)|
| `Opcode` |   O   |   6   |Opcode (`[31:26]`), sent to `Main Control Unit`|
| `rs`     |   O   |   5   |Source register 1 (`[25:21]`), sent to `GRF[RA1]` and `NPC[Ra]`|
| `rt`     |   O   |   5   |Source register 2 / Destination (`[20:16]`), sent to `GRF[RA2]` and `RegDst MUX`|
| `rd`     |   O   |   5   |Target register (`[15:11]`), sent to `RegDst MUX`|
| `shamt`  |   O   |   5   |Shift amount (`[10:6]`), sent to `ALU[Shamt]`|
| `funct`  |   O   |   6   |Function code (`[5:0]`), sent to `ALU Control Unit`|
| `imm16`  |   O   |  16   |16-bit immediate value (`[15:0]`), sent to `EXT` and `LUI Shifter`|
| `imm26`  |   O   |  26   |26-bit jump address (`[25:0]`), forwarded to `NPC`|

  * **Functional Definition**

|Number|Feature Name|Feature Description|
| :---: | :--------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1   |Instruction Field Separation <br>|Input a 32-bit `Instruction` and, following the MIPS instruction format, split it in parallel into `Op`, `rs`, `rt`, `rd`, `shamt`, `funct`, `imm16`, and `imm26`—a total of 8 fields—and output them from the corresponding ports.|

![SPLI](/images/SPLI.png)

---

### Instruction Format

#### R-type Instruction Format

![R型指令格式](/images/R型指令格式.png)

##### `add,sub,and,or rd, rs, rt`
|Operations|  Op   |  Rs   |  Rt   |  Rd   | Shamt | Func  |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
|Bit width|   6   |   5   |   5   |   5   |   5   |   6   |

#### LW&SW Instruction Format
![LW&SW指令格式](/images/LW&SW指令格式.png)

##### `lw,sw rt, rs, imm16`
|Operations|  Op   |  Rs   |  Rt   |  imm  |
| :---: | :---: | :---: | :---: | :---: |
|Bit width|   6   |   5   |   5   |  16   |

#### Branch Instruction Format
![分支指令格式](/images/分支指令格式.png)

##### `beq rs,  rt,  imm16`
|Operations|  Op   |  Rs   |  Rt   |  imm  |
| :---: | :---: | :---: | :---: | :---: |
|Bit width|   6   |   5   |   5   |  16   |

#### Jump Instruction Format
![跳转指令格式](/images/跳转指令格式.png)
##### `j add26 `
|Operations|  Op   | JAdd  |
| :---: | :---: | :---: |
|Bit width|   6   |  26   |

---

## 2. Single-Cycle Controller Design
![单周期控制器设计](/images/单周期控制器设计.png)


### 2.1 Control Signals Required for a Single-Cycle Path
#### 2.1.1 ALU Control (ALUCtrl): 4 bits

|Input| ALUCtrl |Computations|
| :--- | :-----: | :------: |
| A, B |  0000   | `A & B`  |
| A, B |  0001   | `A \| B` |
| A, B |  0010   | `A + B`  |
| A, B |  0110   | `A - B`  |

#### 2.1.2 Eight control signals:
|Control Signals|          0          |              1              |
| :------: | :-----------------: | :-------------------------: |
|  RegDst  |register file write address: Rt|register file write address: Rd|
| RegWrite |None|register write: **`Reg[WA] = WD`**|
|  ALUSrc  |     ALU-B：RD2      |     ALU-B：imm Signext      |
|  PCSrc   |     PC = (PC+4)     |PC = NAdd (beq destination address)|
|  PCJump  |PC = MUX output|PC = J-instruction destination address|
| MemRead  |None|DM Reading (Output)|
| MemWrite |None|DM write (input)|
| MemtoReg |Reg write <-- ALU|Reg <-- DM|
|  Branch  |None|For the `beq` instruction|

----
### 2.2 Controller Design
![controler](/images/controler.png)

#### 2.2.1 Main Control Unit

##### 2.1 Design Approach


1.  **`MemtoReg` (2 bits):**
    * `00`: `ALUResult` (for R-type, `ori`)
    * `01`: `DM[ReadData]` (for `lw`)
    * `10`: `LUI_Value` (for `lui`)
2.  **`ExtOp` (1 bit):** Used to control the extension unit.
    * `0`: Zero Extension (for `ori`)
    * `1`: Sign Extension (for `lw`, `sw`, `beq`)
3.  **`Jump` (1 bit):** (`PCJump` in the figure) used for the `j` instruction.
4.  **`JR` Signal:** Moved to `ALU Control Unit`.

##### 2.2 Port Definitions

* **Inputs:**
    * `Opcode[5:0]`: The `[31:26]`-bit (opcode) from the instruction.
* **Outputs:**
    * `RegDst[0]`: (1: R-type writes `rd`, 0: I-type writes `rt`)
    * `ALUSrc[0]`: (1: immediate, 0: `GRF[ReadData2]`)
    * `MemtoReg[1:0]`: (2 bits) (Choosing a data source to write back to GRF)
    * `RegWrite[0]`: (1: Allows writing to GRF)
    * `MemRead[0]`: (1: Allows reading DMs)
    * `MemWrite[0]`: (1: allows writing to the DM)
    * `Branch[0]`: (1: `beq` instruction)
    * `Jump[0]`: (1: `j` instruction)
    * `ExtOp[0]`: (1: sign extension, 0: zero extension)
    * `ALUOp[2:0]`: (3 bits) (Sent to `ALU Control Unit`)

##### 2.3 Truth Tables

|Instructions| `Opcode` | `RegDst` | `ALUSrc` | `MemtoReg` | `RegWrite` | `MemRead` | `MemWrite` | `Branch` | `Jump` | `ExtOp` | **`ALUOp[2:0]`** |
| :---------: | :------: | :------: | :------: | :--------: | :--------: | :-------: | :--------: | :------: | :----: | :-----: | :--------------: |
| **`R-type`** | `000000` |    1     |    0     |    `00`    |     1      |     0     |     0      |    0     |   0    |    X    |    **`100`**     |
| **`lw`**   | `100011` |    0     |    1     |    `01`    |     1      |     1     |     0      |    0     |   0    |    1    |    **`000`**     |
| **`sw`**   | `101011` |    X     |    1     |    `XX`    |     0      |     0     |     1      |    0     |   0    |    1    |    **`000`**     |
| **`beq`**  | `000100` |    X     |    0     |    `XX`    |     0      |     0     |     0      |    1     |   0    |    1    |    **`001`**     |
| **`ori`**  | `001101` |    0     |    1     |    `00`    |     1      |     0     |     0      |    0     |   0    |    0    |    **`010`**     |
| **`lui`**  | `001111` |    0     |    X     |    `10`    |     1      |     0     |     0      |    0     |   0    |    X    |      `XXX`       |
| **`addi`** |  `001000`  |    0     |1     |   `00`     |     1      | 0          |    0     |    0     |    0     |     1      |    **`000`**      |
| **`j`**    | `000010` |    X     |    X     |    `XX`    |     0      |     0     |     0      |    0     |   1    |    X    |      `XXX`       |


**`ALUOp`-coded:**
* `000`: `lw`/`sw` (Main controller requires **ADD**)
* `001`: `beq` (Master controller requests **SUB**)
* `010`: `ori` (Master Controller Requires **OR**)
* `011`: (Reserved, e.g., for `andi`)
* `100`: **R-type** (The main controller says, “I don’t know. Please check Code `funct`.”)
* `101`: (Reserved, e.g., for `xori`)
* `110`: (Reserved, e.g., for `addi`)
* `111`: (Reserved)

**Explanation of `nop` (0x00000000):**
`nop`: The instruction's `Opcode` is `000000`, and `Funct` is `000000`.
1.  `Main Control` would consider it an **R-type**.
2.  `ALU Control` is treated as **`sll`**.
3.  It ultimately executes `sll $zero, $zero, 0`.
4.  The controller will attempt to write the result `0` to register `$zero`.

---

#### Additional Notes on Top-Level Logic

* **The final `RegWrite` signal:** The `jr` instruction should not write to a register. Therefore, the final `RegWrite_Enable` signal connected to the GRF should be:
    * `RegWrite_Enable` = `Main_Control[RegWrite]` **AND** ( **NOT** `ALU_Control[JR]` )
  

![主控单元逻辑实现](/images/主控单元逻辑实现.png)

![MCU](/images/MCU.png)

---

####  2.2.2 ALU Control Unit

##### 1.2 Port Definitions

* **Inputs:**
    * `ALUOp[2:0]`: A 3-bit opcode from the Main Control Unit.
    * `Func[5:0]`: The `[5:0]`-bit (function code) from the instruction.
* **Outputs:**
    * `ALUCtrl[3:0]`: The 4-bit final operation code sent to the ALU (I previously defined `0000` = ADD, `0001` = SUB, `0010` = AND, `0011` = OR, `0100` = SLT, and `0101` = SLL).
    * `JR[0]`: **(New output)** Used for the `jr` instruction. This signal is 1 when `ALUOp=100` and `Func=001000` are true.

##### 1.3 Truth Tables

|`ALUOp[2:0]` (Input)|`Func[5:0]` (Input)|Notes (Instructions)|**`ALUCtrl[3:0]` (Output)**|**`JR[0]` (Output)**|
| :-----------------: | :----------------: | :--------------: | :-----------------------: | :----------------: |
|        `000`        |X (any)|   `lw` / `sw`    |     **`0000`** (ADD)      |       **0**        |
|        `001`        |X (any)|      `beq`       |     **`0001`** (SUB)      |       **0**        |
|        `010`        |X (any)|      `ori`       |      **`0011`** (OR)      |       **0**        |
|        `011`        |X (any)|(Reserved)|     X (e.g., `0000`)      |       **0**        |
|      **`100`**      |      `100000`      |      `add`       |     **`0000`** (ADD)      |       **0**        |
|      **`100`**      |      `100010`      |      `sub`       |     **`0001`** (SUB)      |       **0**        |
|      **`100`**      |      `100100`      |      `and`       |     **`0010`** (AND)      |       **0**        |
|      **`100`**      |      `101010`      |      `slt`       |     **`0100`** (SLT)      |       **0**        |
|      **`100`**      |      `000000`      |`sll` (or `nop`)|     **`0101`** (SLL)      |       **0**        |
|      **`100`**      |      `001000`      |     **`jr`**     |     X (e.g., `0000`)      |       **1**        |
|       (other)       |      (other)       |   (Undefined)    |     X (e.g., `0000`)      |       **0**        |

![ACU](/images/ACU.png)

---

After-Class Summary:
I managed to solve two problems for P3, so I guess I passed. During the first week, I didn’t estimate the time needed to complete the tasks properly, so I didn’t finish by Sunday and ended up falling a week behind schedule.
So that earned me Monday off from the lab test, and it still took more than a day and a half to finish the final version.
But the final version didn’t even pass the weak test. Skipping over the lengthy debugging phase, I eventually asked a teaching assistant for help and discovered that the cause of the bug was actually **an extra ROM**!!
After converting this ROM into logic elements, it passed the test.
The reason there can’t be any extra ROMs is that during testing, the system uses regular expressions to match the ROMs and then reads the data from them, so adding a ROM would cause the test to fail.

---

Thinking Questions
1. Currently, in my modules, IM uses ROM, DM uses RAM, and GRF uses registers. Is this approach reasonable? Please provide an analysis, and if you have any suggestions for improvement, please include them as well.
A: That makes sense. ROM is read-only memory, so it can be used to store instructions; RAM is both readable and writable, so it meets the DM’s read-write requirements; GRF is a register file, which requires high read-write speeds, so it is suitable for implementation using registers.
2. In fact, to implement the NOP (no-op) instruction, we don’t need to add it to the control signal truth table. Why? Please explain your reasoning.
A: The NOP instruction has the code 0x00000000, which is equivalent to `sll $0, $0, 0`. This shifts the value in the $0 register 0 bits to the left and writes it back to the $0 register. Since the value of $0 is always 0, it remains unchanged; therefore, executing this instruction has no effect. Even if the CPU does not support the SLL instruction, the NOP instruction will not perform any operations on any circuit components and will have no effect on the circuit.


