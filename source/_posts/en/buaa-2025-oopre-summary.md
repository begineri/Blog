---
lang: en
title: "buaa-2025 Fall - OOPre Course Summary"
date: 2025-11-05 19:25:29
tags:
  - OOP
  - java
---


## Brief description of the iterative assignment:
### Assignment Task Framework
- Adventurer
- Items (Bottle, Equipment)
- Spell
- Bag (Backpack System)
- UseItem (Potions and Spells)
- Fight (Combat System and Adventurer Attributes)
- Money System
- Employer, Employee (Employment Relationships and Assistance)

---

### Tasks to be completed

1.  `add adventurer`: Add an adventurer to be managed (Newly added adventurers do not carry any potion bottles or equipment, and have an initial stamina of 500, an initial attack power of 1, an initial defense of 0, an initial mana of 10, and 50 gold coins).
2.  `add bottle`: Add a potion bottle to a certain adventurer
3.  `add equipment`: Adding a piece of equipment to an adventurer
4.  `learn spell`: Teaching a Spell to an Adventurer
5.  `remove item`: Deleting an item from an adventurer
6.  `take item`: The adventurer attempts to carry an item he owns
7.  `use`: The adventurer uses an available item on a target
8.  `buy item`: The adventurer goes to the store to purchase item
9.  `fight`: An Adventurer Fights a Battle
10. `add relation`: Add an employment relationship
11. `remove relation`: Deleting an Employment Relationship
12. `load relation`: Import a set of employment relationships

---

### Final architecture design, adjustments, and considerations 😸
![Overview](/images/Diagram.png "The overall design architecture is shown in the figure")

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

#### 1. Implementation of the `CommandUtil` Interface
``` java
public interface CommandUtil {
    void execute();
}
```

![CommandUtil](/images/CommandUtil.png)
Using the **Command Pattern**, each command implements the `(Implementation)` CommandUtil interface, encapsulating each “operation” into an independent object to achieve **decoupling** and **encapsulation**, making it easy to extend.

With Class `CommandFactory`, you can call it directly within Class `Main`:
``` java
CommandUtil command = CommandFactory.createCommand(input, adventureList);
if (command != null) {
    command.execute();
}
```

Code examples of specific interface implementations:
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

#### 2.`Item` Inheritance from Abstract Classes

![Item](/images/Item.png)

After analysis, it was found that the items possessed by adventurers (equipment, potions, spells) can be abstracted into a unified Class `Item` for easier centralized management. Therefore, the following **inheritance hierarchy** can be designed:

 * **Top-level abstraction (Root): `Item`**

      * Define the common **characteristics** of all “items.” For example, the `id` and `use` methods.

  * **Top-level categories (Branches): `Equipment`, `Spell`, `Bottle`**

      * These three classes extend ``Item``.
      * They are **abstract classes** themselves, used to define the common characteristics of their respective categories.

  * **Specific implementations (Leaves): `HpBottle`, `Sword`, `AttackSpell`, etc.**

      * These **concrete classes** inherit from their respective “base classes” and can actually be instantiated (`new`).
  
---

#### 3.`Adventurer` Class and Feature Implementation

##### State Management
* **Stores core attributes:** Contains all of the adventurer’s base attributes, such as `id`, `hitPoint`, `atk`, `def`, `mana`, and `money`.
* **Death Handling:** Contains `isDead()` checks. `deductHitPoint()` method that automatically calls the method responsible for handling post-death relationships when HP reaches zero.
* **Calculate Total Value:** `calculateAllMoney()`. This method is used to calculate the “total value” (gold coins + item value) dropped when an adventurer dies.

##### Inventory Management
* **Distinguishing Between Ownership, Carrying, and Equipment:**
    * `items` (HashMap): All items **owned by** the adventurer.
    * `usables` (HashMap) / `usablesQueue` (Queue): Potions **carried** by the adventurer; the queue is used to implement the replacement logic for “up to 10 bottles.”
    * `armour` / `weapon` (Equipment): The armor and weapons **currently equipped** by the adventurer.
* **Spell Management:** `spells` (HashMap) stores all learned spells.


``` java
    // Items owned (including bottles and weapons)
    private final HashMap<String, Item> items = new HashMap<>();

    // Items in the bag (bottles)
    private final HashMap<String, Item> usables = new HashMap<>();

    // Learned spells
    private final HashMap<String, Spell> spells = new HashMap<>();

    // List of carried bottles
    private final Queue<String> usablesQueue = new LinkedList<>();
```

* **Decoupling from the Factory:** Methods `addBottle`, `addEquipment`, `learnSpell`, and `buyItem` do not create objects directly; instead, they call method `Factory` to create them, thereby separating creation from management.

```java
    // Simple factory
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

##### Action Execution and Polymorphism
* **`fight(targets)`:** Encapsulated the combat logic.
* **`useItem(target)`:** Encapsulates the logic for using items and spells. It delegates execution to the object’s own methods `Item`, `checkUse()`, and `useSuccessfully()`, thereby implementing polymorphism.
* **`takeItem(itemId)` / `removeItem(itemId)`:** Methods `equip()` and `unequip()` are both delegated to object `Item`; class `Adventurer` is not concerned with the logic of specific equipment and is only responsible for making the calls.

##### Implementing an Employment Relationship
* Implement both **the Employee and Employer interfaces**:
    * As `Employer`: It has methods `hire()` and `fire()`, and maintains a **list of children**.
    * As `Employee`: It has a **direct superior**.
* **Relationship Graph Traversal:** Provides the `getAllEmployers()`  and `getAllEmployees()`  methods.
* **Definition of an ally:** `getAllAllies()`-iteration.
* **Rule check:** Methods `checkContainsEmployer()` and `checkIsNotAlly()`.

``` java
public class Adventurer implements Employee, Employer {
    // Direct superior
    private Employer employer;

    // List of directly hired adventurers
    private final HashMap<String, Employee> hired = new HashMap<>();

    // ...
}
```

##### Assistance System (Observer Pattern)
* **Subject:**
    1.  When `Adventurer``takeDamage()` is called and the reduced HP meets the conditions for issuing a rescue,
    2.  Call `notifyEmployees()` to “send a notification.”
* **Observer:**
    1.  In ``notifyEmployees()``, iterate through all child objects (observers) and call their ``aidEmployer()`` method.
    2.  **The observer** reviews the assistance logic and attempts to assist the supervisor (Employer).
  
```java
    @Override
    // Notify employees
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

## Thoughts on Using JUnit


 `import org.junit.Test;`

`import static org.junit.Assert.*;`

|Methods|Introduction|
|---------------------------------------|----------------------------------|
| `assertEquals(expected, actual)`       |Checking if two values are equal|
| `assertTrue(condition)`                |Check if the condition is true|
| `assertFalse(condition)`                |Check whether the condition is false|
| `assertNotNull(object)`                |Check if it is not empty|
| `assertNull(object)`                   |Check if it is empty|
| `assertNotSame(expected, actual)`      |Check whether two related objects point to the same object|
| `assertSame(expected, actual)`          |Checking whether two related objects point to the same object|
| `assertArrayEquals(expectedArray, resultArray)` |Checking if two arrays are equal|


Based on my experience using JUnit in the OOPro course, I’ve found that:
 - **What JUnit can do**: detect logical issues within methods caused by oversight. By ensuring a coverage rate of `Run with Coverage`, you can test nearly all the code you write, making it easy to spot even minor errors in your code when constructing and testing test cases.
 - **What JUnit Can’t Do**: Detect Certain Logical Flaws.Since I’ve been writing all my JUnit tests myself at this stage, if I didn’t consider a particular scenario while writing the code, I naturally wouldn’t construct such a test case when writing the JUnit tests. Consequently, I couldn’t detect errors in the program, which led to new, undetected bugs appearing in subsequent assignments. To find these bugs, I had to reexamine the program’s logic.

---

## My Experience Learning OOPre


> The transition from **Procedure-Oriented Programming (POP)*** to **Object-Oriented Programming *(*OOP*)***.



- **POP**: **Process**- or function-oriented, emphasizing the execution flow and steps of a program.
- **OOP**: A programming paradigm in which things are broken down into individual **objects**, which then divide tasks and collaborate with one another.
  - **Encapsulation `Encapsulation`**: Hide internal implementation details and expose only the necessary interfaces.
  - **Inheritance `Inheritance`**: A subclass inherits the properties and methods of its parent class to achieve code reuse.
  - **Polymorphism `Polymorphism`**: A single interface can be implemented by different objects to exhibit different behaviors.
  - **Abstraction `Abstraction`**: Extract common characteristics and define abstract classes or interfaces.

  - Through these mechanisms, OOP languages offer a high degree of flexibility, maintainability, and scalability when dealing with similar types of problems, providing us with new approaches to problem-solving.
- After completing the OOPre course, we gained a basic understanding of the most critical concepts in object-oriented languages, laying the groundwork for the main course ahead.
- At the same time, introducing the concept of `CheckStyle` can help students develop good coding practices right from the start.

---

## Course Recommendations

#### 1. The lecture was too brief.
- The material covered in class accounts for only 40% of the knowledge needed to complete assignments and design programs. To complete assignments and design a relatively optimal program structure, students need to study a significant amount of supplementary material outside of class.Some of this material is derived from the in-class PowerPoint presentations (often, the presentations and lectures merely list concepts and touch on them superficially, which is insufficient for students to write the code required for their assignments), while other material is not covered in the presentations at all.
- If there is limited time for instruction during class, I recommend that the course team provide more optional reference materials for out-of-class assignments. For example, regarding the Command Pattern, they could provide concrete examples of its implementation in real-world projects (such as design concepts or code examples) to help students gain a concrete understanding of it, rather than just a few lines of text on a PowerPoint slide.

#### 2. The Gradual Introduction of Engineering Architecture Concepts
- I recommend incorporating a bit of architectural thinking into each assignment, rather than just briefly mentioning it at the end, so that students can adjust and improve their frameworks in a timely manner—rather than letting them become increasingly cluttered, which severely impacts readability and makes it difficult to add new features later on.
- It also introduces the concept of package management, which makes it easier to manage multiple classes within a project.

- I suggest the course team provide an introduction to some of IDEA’s features (such as keyboard shortcuts, quick methods, etc.).

# ＞﹏＜ 




