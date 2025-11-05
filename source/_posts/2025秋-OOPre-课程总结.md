---
title: 2025秋 OOPre 课程总结
date: 2025-11-05 19:25:29
tags:
  - OOP
  - java
---


## 迭代作业简单描述：
### 作业任务框架
- 冒险者 (Adventurer)
- 物品 (Bottle, Equipment)
- 法术 (Spell)
- 背包系统 (Bag)
- 对于物品（药水和法术）的使用 (UseItem)
- 战斗系统与冒险者属性 (Fight)
- 金钱系统 (Money)
- 雇佣关系与援助 (Employer, Employee)

---

### 需要实现的操作

1.  `add adventurer`： 加入一个需要管理的冒险者（新加入的冒险者不携带任何药水瓶和装备，并且初始体力为 500，初始攻击力为 1，初始防御力为 0，初始魔力值为 10，初始金币数量为 50）
2.  `add bottle`： 给某个冒险者增加一个药水瓶
3.  `add equipment`： 给某个冒险者增加一个装备
4.  `learn spell`： 给某个冒险者学习一个法术
5.  `remove item`： 删除某个冒险者的某个物品
6.  `take item`： 冒险者尝试携带他拥有的某个物品
7.  `use`： 冒险者对一个目标使用某个可用物品
8.  `buy item`： 冒险者去商店进行一次购买操作
9.  `fight`： 冒险者进行一次战斗
10. `add relation`： 增加一条雇佣关系
11. `remove relation`： 删除一条雇佣关系
12. `load relation`： 导入一组雇佣关系

---

### 最终的架构设计、调整以及考虑 🤔🤤😆
![总体](/images/Diagram.png "总体的设计架构如图")

```
\SRC
├─commands
│      AddAdventurer.java
│      AddBottle.java
│      AddEquipment.java
│      AddRelation.java
│      BuyItem.java
│      CommandUtil.java
│      Fight.java
│      LearnSpell.java
│      LoadRelationship.java
│      RemoveItem.java
│      RemoveRelation.java
│      TakeItem.java
│      Use.java
├─game
│  │  Adventurer.java
│  │  CommandFactory.java
│  │  Factory.java
│  │  Main.java
│  └─interfaces
│          Employee.java
│          Employer.java
├─items
│  │  Bottle.java
│  │  Equipment.java
│  │  Item.java
│  │  Spell.java
│  ├─bottles
│  │      AtkBottle.java
│  │      DefBottle.java
│  │      HpBottle.java
│  │      ManaBottle.java
│  ├─equipments
│  │      Armour.java
│  │      Magicbook.java
│  │      Sword.java
│  │      Weapon.java
│  └─spells
│          AttackSpell.java
│          HealSpell.java
└─parser
        AdventureHireManager.java
        Lexer.java
        Parser.java
```

---

#### 1. `CommandUtil` 接口的实现
``` java
public interface CommandUtil {
    void execute();
}
```

![CommandUtil](/images/CommandUtil.png)
采用**命令模式**，通过为每一个指令实现 `(Implementation)` CommandUtil 接口 ，将每一个“操作”封装成一个独立的对象，实现**解耦 (Decoupling)** 和 **封装 (Encapsulation)**，易于扩展。

配合`CommandFactory`类，可以直接在`Main`内调用：
``` java
CommandUtil command = CommandFactory.createCommand(input, adventureList);
if (command != null) {
    command.execute();
}
```

具体接口实现的代码示例：
``` java
import game.Adventurer;

public class LearnSpell implements CommandUtil {
    private final Adventurer adventure;
    private final String speId;
    private final String type;
    private final int manaCost;
    private final int power;

    public LearnSpell(Adventurer adventure, String speId, String type, int manaCost, int power) {
        this.adventure = adventure;
        this.speId = speId;
        this.type = type;
        this.manaCost = manaCost;
        this.power = power;
    }

    @Override
    public void execute() {
        adventure.learnSpell(speId, type, manaCost, power);
    }
}
```

---

#### 2. `Item` 抽象类的继承

![Item](/images/Item.png)

经过分析，发现冒险者所拥有的物品（装备、药水、法术）可以抽象为统一的类 `Item`，便于进行统一的管理，于是可以设计如下**继承层次结构**：

 * **顶层抽象 (Root): `Item`**

      * 定义所有“物品”的**共同特征**。如， `id` 和 `use` 方法。

  * **第一层分类 (Branches): `Equipment`, `Spell`, `Bottle`**

      * 这三个类继承 (extends) 了 `Item`。
      * 它们自身也是**抽象类**，用来定义各自类别的共同特征。

  * **具体实现 (Leaves): `HpBottle`, `Sword`, `AttackSpell` 等**

      * 继承了各自的“父类”，是可以实际创建（`new`）的**具体类**。
  
---

#### 3. `Adventurer` 类与功能具体实现

##### 状态管理 (State Management)
* **存储核心属性：** 持有冒险者的所有基础属性，如 `id`, `hitPoint`, `atk`, `def`, `mana` 和 `money`。
* **管理死亡：** 包含 `isDead()` 检查。`deductHitPoint()` 方法在HP归零时，自动调用处理死亡后关系的方法。
* **计算总价值：** `calculateAllMoney()` 方法用于计算冒险者死亡时掉落的“总价值”（金币 + 物品价值）。

##### 物品与库存管理 (Inventory Management)
* **区分所有权、携带和装备：**
    * `items` (HashMap): 冒险者**拥有**的所有物品。
    * `usables` (HashMap) / `usablesQueue` (Queue): 冒险者**携带**的药水物品，队列用于实现“最多10瓶”的替换逻辑。
    * `armour` / `weapon` (Equipment): 冒险者**当前装备**的护甲和武器。
* **管理法术：** `spells` (HashMap) 存储所有已学会的法术。


``` java
    // 拥有的物品（包括瓶子和武器）
    private final HashMap<String, Item> items = new HashMap<>();

    // 包里的物品（瓶子）
    private final HashMap<String, Item> usables = new HashMap<>();

    // 学会的 Spell
    private final HashMap<String, Spell> spells = new HashMap<>();

    // 携带的瓶子列表
    private final Queue<String> usablesQueue = new LinkedList<>();
```

* **与工厂解耦：** `addBottle`, `addEquipment`, `learnSpell`, `buyItem` 等方法不直接创建对象，而是调用 `Factory` 来创建，实现了创建与管理的分离。

```java
    // 简单工厂模式
    public static Equipment createEquipment(String type, String equId, int ce) {
        Equipment newEquipment;
        switch (type) {
            case "Armour":
                newEquipment = new Armour(equId, ce);
                break;
            case "Sword":
                newEquipment = new Sword(equId, ce);
                break;
            case "Magicbook":
                newEquipment = new Magicbook(equId, ce);
                break;
            default:
                newEquipment = null;
        }

        return newEquipment;
    }
```

##### 动作执行与多态 (Action Execution & Polymorphism)
* **`fight(targets)`：** 封装了战斗逻辑。
* **`useItem(target)`：** 封装了使用物品/法术的逻辑。它委托给 `Item` 对象自身的 `checkUse()` 和 `useSuccessfully()` 方法来执行，实现了多态。
* **`takeItem(itemId)` / `removeItem(itemId)`：** 同样委托给 `Item` 对象的 `equip()` 和 `unequip()` 方法，`Adventurer` 类不关心具体装备的逻辑，只负责调用。

##### 雇佣关系的实现
* 同时实现 **Employee 和 Employer 接口**：
    * 作为 `Employer`：它有 `hire()` 和 `fire()` 方法，并维护一个**下级列表**。
    * 作为 `Employee`：它有其**直接上级**。
* **关系图遍历：** 提供 `getAllEmployers()`  和 `getAllEmployees()`  方法。
* **盟友定义：** `getAllAllies()` 遍历。
* **规则检查：** `checkContainsEmployer()` 和 `checkIsNotAlly()` 方法。

``` java
public class Adventurer implements Employee, Employer {
    // 直接的上级
    private Employer employer;

    // 直接雇佣的冒险者列表
    private final HashMap<String, Employee> hired = new HashMap<>();

    // ...
}
```

##### 援助系统 (观察者模式)
* **被观察者 (Subject)：**
    1.  当 `Adventurer` `takeDamage()` 被调用且减少的HP满足发出救援的前提时
    2.  调用 `notifyEmployees()` 来“发出通知”。
* **观察者 (Observer)：**
    1.  在 `notifyEmployees()` 中，遍历所有下级（观察者）并调用他们的 `aidEmployer()` 方法。
    2.  **观察者**检查援助逻辑，对上级 (Employer) 尝试援助。
  
```java
    @Override
    // 通知雇佣者
    public void notifyEmployees() {
        ArrayList<Employee> allEmployees = getAllEmployees();
        
        int sucAdiAdvNum = 0;
        for (Employee employee : allEmployees) {
            if (employee.aidEmployer(this)) {
                sucAdiAdvNum++;
            }
        }
    }
```

![Adventurer](/images/Adventurer.png)

---

## 使用JUnit的心得体会 😮🫠😸


 `import org.junit.Test;`

`import static org.junit.Assert.*;`

| 方法                                    | 介绍                             |
|---------------------------------------|----------------------------------|
| `assertEquals(expected, actual)`       | 检查两个值是否相等               |
| `assertTrue(condition)`                | 检查条件是否为真                 |
| `assertFalse(condition)`                | 检查条件是否为假                 |
| `assertNotNull(object)`                | 检查是否不为空                   |
| `assertNull(object)`                   | 检查是否为空                     |
| `assertNotSame(expected, actual)`      | 检查两个相关对象是否不指向同一个对象 |
| `assertSame(expected, actual)`          | 检查两个相关对象是否指向同一个对象 |
| `assertArrayEquals(expectedArray, resultArray)` | 检查两个数组是否相等           |


根据我在OOPro课程中使用JUnit的经验，我发现：
 - **JUnit可以做到的**：检查方法内由于欠缺考虑出现的逻辑问题。通过保证覆盖率 `Run with Coverage` 可以测试到几乎所有你编写出的代码，因此在构造与测试样例的时候，可以很方便发现代码中细小的错误。
 - **JUnit不可以做到的**：发现某些欠缺的逻辑。鉴于现阶段的JUnit测试都是由我自己编写的，如果某种情况我在写代码的时候就没有考虑到，编写JUnit测试时自然也不会构造这样的例子，也就无法测试出程序的错误，这也导致了后面几次作业在强侧出现新的没有发现的Bug，为了找出这个Bug需要重新审视程序的逻辑。

---

## OOPre学习体验


> 从 **面向过程编程 POP *(Procedure Oriented Programming)*** 到 **面向对象编程 OOP *(Object Oriented Programming)*** 的转变。



- **POP**：以**过程**或**函数**为中心，强调程序的执行流程和步骤。
- **OOP**：将事物分解成为一个个**对象**，然后由对象之间分工与合作的编程范式。
  - **封装 `Encapsulation`**：隐藏内部实现细节，仅暴露必要接口。
  - **继承 `Inheritance`**：子类继承父类的属性和方法，实现代码复用。
  - **多态 `Polymorphism`**：同一接口可由不同对象实现不同行为。
  - **抽象 `Abstraction`**：提取共性，定义抽象类或接口。

  - 通过这些机制，使得OOP语言在处理一类相似的问题时有高度的灵活性、可维护性和扩展性，为我们解决问题提供了新的思路。
- 经过OOPre课程的学习，我们初步了解了这些在面向对象语言中最为关键的思想，为后面的正课做了准备。
- 同时`CheckStyle` 的引入，可以从一开始就培养同学们编写代码的规范性。

---

## 课程建议

#### 1. 课上讲解过于简略
- 课上讲解的内容，只包含完成作业与设计程序 40% 的知识，为了完成作业且设计出较为理想的程序结构，学生需要课下学习大量额外的补充内容。这些内容有些是课上ppt的衍生（很多时候，ppt和课堂上对于一个概念只是列出概念并浅尝辄止，这不足以让学生写出作业代码），还有些是ppt没有提到的内容。
- 如果课上讲解时间有限，建议课程组为课下的作业准备更多可选的参考学习资料。比如对于命令模式，可以给出它在工程时的具体实现（给出设计思路或代码示例），以便同学对它有一个具体的认识，而不只是ppt上的几行文字。

#### 2. 工程架构的思想的逐渐引入
- 建议将工程架构的思想在每一次作业中融入一点，而不是在最后简单一提，以便同学们及时调整改进自己的框架，而不是越堆越乱，严重影响可读性和后续增加功能的难度。
- 同时可以介绍引入包管理的思想，便于对项目多个类进行管理。

- 建议课程组给一些IDEA功能的介绍（比如快捷键、快捷方法等）

# ＞﹏＜ 




