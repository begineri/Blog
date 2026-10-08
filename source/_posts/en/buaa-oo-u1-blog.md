---
lang: en
title: "buaa26-OO-u1"
date: 2026-03-27 18:01:31
tags:
  - OOP
  - java
---

This post is a summary of the iterative assignments from Unit 1 of the 2026 Object-Oriented Programming course.

## Table of Contents:

- [Program Structure](#program-structure)
- [Experiences in Architecture Design](#experiences-in-architecture-design)
- [Design Patterns Used](#design-patterns)
- [Analyzing Bugs in My Own Programs](#analyzing-bugs-in-my-own-programs)
- [Using Large Language Models](#using-large-language-models)
- [Future Directions](#future-directions)
- [Thinking Questions](#thinking-questions)

---

<span id="program-structure"></span>
## Program Structure
The following data is analyzed from the code in the final iteration. The entire project consists of 20 core business classes, with a total of approximately 1,080 lines of business code, including 126 methods.

Complete class diagram for hw3:
![alt text](/images/oou1/com.drawio.png)

### Analysis of Basic Program Structure Metrics
![alt text](/images/oou1/image-2.png)

1. Total Lines of Code per Class (Class LOC)
   - The two largest classes in terms of code size are the global syntax tree construction factory `Parser` (184 lines) and the low-level algebraic operations `Poly` (180 lines); naturally, these two handle the most intensive logic scheduling and computational tasks in the system.
   - The code size of the vast majority of AST node classes (such as `ConFactor` and `FunctionFactor`) is strictly limited to between 20 and 40 lines. They sit between parsing and evaluation, existing solely as pure data structures, and are lightweight.
    
2. Number of Methods (NOM) and Number of Fields (NOF)
   - The class with the most methods has `Poly` (17), followed by the class with `Parser` (12).
   - AST nodes typically have only 1 or 2 basic properties

3. Method Lines of Code (Method LOC)
   - In the whole project, there are 126 methods, with an average of just 8.16 lines of code per method.
   - The longest method, ``Mono.toString()``, is 47 lines long, while the core logic for differentiation (the ``derive`` method for various node types) typically ranges from 2 to 5 lines.

4. Controlling the Number of Branches (cyclomatic complexity v(G))
   - The average cyclomatic complexity (v(G)) for the entire project is only 1.93.
   - Extremely low cyclomatic complexity is a direct benefit of the polymorphism (dynamic dispatch) mechanism. This architecture completely eliminates the verbose `if-else / switch`-type checks found in traditional procedural programming, delegating common operations to their respective subclasses and achieving true O(1) logical addressing.

---

### Classic OO Metrics (Cohesion and Coupling Analysis)
![alt text](/images/oou1/image-1.png)
1. Coupling Between Object Classes (CBO)
   - The top three classes with the highest system coupling are, in order, `Expr` (CBO=18), `Parser` (CBO=15), and `Poly` (CBO=14).
   - Meanwhile, the CBO for the underlying atomic nodes (such as `PowerFactor` and `ConFactor`) is extremely low (typically between 2 and 4).

2. Class Cohesion (LCOM - Lack of Cohesion of Methods)
   - Across the entire project, the highest LCOM value is only 4, and the vast majority of classes remain between 0 and 3.
   - `Poly`-class LCOM is as low as 1.0; it is a highly cohesive module with internal methods that share core state extensively and have extremely focused responsibilities.

---

### Analysis Based on Class Diagrams
Overall Approach: **`Input`** **→ `Parser` → `toPoly` → `toString`**

`Input`: Input Handling and Preprocessing
`Parser`: Parsing a String into Instances of Different Classes
`toPoly`: Convert all nodes on the AST to `Poly` to facilitate merging, simplification, and output.
`toString`: Unified recursive output for mono and poly classes.

- Pros:
  1. The "Dumb AST, Smart Engine" Layered Architecture**:
The AST remains completely pure during the parsing and differentiation phases; all computations are deferred and concentrated in the underlying ``Poly``. This unidirectional dependency ensures extremely low coupling between classes.
  2. Implementation of Polymorphism:
Through a dynamic dispatch mechanism, the verbose `switch/if-else`-type checks commonly found in procedural programming have been completely eliminated. The differentiation logic has been seamlessly delegated to the respective Factor subclasses, resulting in excellent code extensibility and readability.
  3. Immutability and Avoiding Thread Safety Issues:
For low-level polynomial operations (such as `mulP`) and substitution operations (`substitute`), the system extensively uses deep copies and the creation of new objects to return results. This eliminates the risk of data corruption caused by reference passing and ensures absolute robustness during higher-order differentiation and complex nested substitutions.

- Cons:
  1. Memory Overhead Caused by HashMap:
To achieve $O(1)$ performance for merging like terms, the underlying code instantiates a large number of `MonoKey` and `Mono` objects. When handling extremely nested power-of-n test cases (such as the expansion of `expP(8)` to very high powers), this generates a large number of short-lived objects, placing significant memory pressure on the JVM’s garbage collection (GC).In the future, I may consider introducing **the Flyweight Pattern** to cache certain monomial characteristics.
  2. Extensibility Limitations of the Interpreter Pattern:
The current architecture hard-codes the `derive` and `toPoly` methods directly into each AST node class. If future requirements increase (for example, if support for integration operations is needed), it will be necessary to open the source code of each class to make modifications, which to some extent violates the “Open-Closed Principle (OCP).”
In subsequent refactoring, **the Visitor Pattern** can be introduced. The AST can be completely reduced to a pure data structure, and operations such as “derivative calculation” and “simplification” can be abstracted into independent Visitor classes, thereby achieving complete decoupling of data and algorithms.

---

<span id="experiences-in-architecture-design"></span>
## Experiences in Architecture Design
This assignment went through three iterations, and during that process, the architecture
### The Iteration Process
* hw1
The program entry point is as follows:
``` java
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();

        Lexer lexer = new Lexer(input);
        Parser parser = new Parser(lexer);

        Expr expr = parser.parseExpr();
        System.out.println(expr.toPoly().toString());
    }
}
```
As can be seen, the overall approach based on **the Recursive Descent algorithm** was established from the very beginning, and the basic abstract syntax tree (AST) for `Expr -> Term -> Factor` was constructed.`Lexer-Parser`
At this point, I only need to handle simple polynomial merging and simplification.

* hw2
With the introduction of nested parentheses (expression factors) and exponential functions (`exp`), simple AST traversal is insufficient to handle extremely complex algebraic expansions.
To handle the merging and output of the final expressions, I ultimately separated the computation responsibilities from the AST and abstracted out the underlying algebraic engine—`Poly` (polynomials) and `Mono` (monomials). By implementing `HashMap<MonoKey, BigInteger>`, I transformed complex algebraic merging into $O(1)$ hash table aggregation.
At the same time, architectural decoupling was achieved: the parsing, expansion (function substitution, selective evaluation), merging, and output (simplification, formatting) of expressions were designed as relatively independent modules, which helps reduce the system’s complexity and makes the code easier to maintain and debug.

* hw3
This assignment incorporates custom recursive function calls and nested differentiation operators (`dx`). During the input processing phase, the string representing the function definition is parsed into an AST, allowing for direct substitution of tree nodes when calling the function, which improves efficiency.
To expand recursive functions, I use the concept of memoization. By caching the results of previously computed `f{i}` (for real arguments), I can effectively avoid redundant calculations and improve program performance.

--- 

#### Analysis of Custom Iteration Scenarios and Scalability

Suppose the next time I need to introduce trigonometric functions (sin, cos) and support nested complex expressions and chain rule differentiation within them.

Here are the scalability solutions for the current design:

1. AST-level extensions:
   * Added the `SinFactor` and `CosFactor` classes and implemented `Factor` interfaces.
   * Contains an internal `Factor inner` property (used to store nested expressions).
2. Logic of Differentiation by Polymorphism:
Implementing Method `derive()` within `SinFactor`: Go directly to `return new Term(CosFactor(inner), inner.derive())`—this fits perfectly with the existing chain rule for differentiation. The existing iteration-based differentiation logic in `Expr` and `Term` does not need to be modified.
3. Parsing-layer handling:
In the`Parser.parseFactor()`-branch, simply add support for recognizing the strings "sin" and "cos" and instantiate the corresponding Factors.
4. Underlying Engine (No Refactoring Required):
   * If trigonometric functions do not need to be expanded or simplified, they can simply be wrapped in `Poly` and `MonoKey` and treated as immutable features. The same applies to existing addition and multiplication merging engines.

Thanks to the high autonomy of AST nodes and the polymorphic dispatch mechanism, this architecture demonstrates exceptional horizontal scalability when iterating to accommodate “new mathematical rules.”

---
<span id="design-patterns"></span>
### Design Patterns Used
1. **Composite Pattern**
Throughout the entire AST structure, whether dealing with standalone objects (such as the variable $x$ or the constant $5$) or containers containing complex sub-objects (such as the expression $x + 5$), they must all be handled in a completely consistent manner.
By using Interface `Factor`, when Object `Term` calls Method `derive()` on the List `Factor` it holds, it does not need to concern itself with whether `Factor` is a simple variable or a complex, deeply nested function. It simply trusts and relies on the interface.

2. **Static Factory Method**
Methods `public static Expr zero()` and `public static Expr of(Factor... factors)`, written in the ``Expr`` class, provide clear and semantically meaningful names for the object creation process.In future development, if you decide that method ``Expr.zero()`` should no longer create a new object via ``new Expr()`` every time, but instead return a cached, immutable singleton object, you can easily implement this change without modifying any existing code that calls this method.

3. **Singleton Pattern**
Since there is only one function template in the entire program, I implement the singleton pattern for it:
```java
public class FuncDefinition {
    public static final FuncDefinition INSTANCE = new FuncDefinition();
    private String definition;
    private Expr exprDefinition;

    private FuncDefinition() {}

    public static FuncDefinition getInstance() {
        return INSTANCE;
    }

    public Expr getExprDefinition() {
        return exprDefinition;
    }

    public void setDefinition(String definition) {
        // Turn the incoming string into an expression tree
        this.definition = definition;
        this.exprDefinition = parseExpr();
    }
}

```

#### Suggestions for improvement and additions (provided by AI):
**Visitor Pattern**
The current architecture uses **the Interpreter pattern**. Each node knows how to evaluate or differentiate itself (for example, the `PowerFactor` class has its own `derive()` and `toPoly()` methods).
This design has a fatal flaw: *what if you want to add a new operation?* Suppose you want to add a `printToXML()` method, a `calculateIntegral()` method, or a `formatToLaTeX()` method. You would have to open the `Expr`, `Term`, `ConstantFactor`, and `VarFactor` class files one by one and add the method to *each* class. Under this model, the mathematical operation logic is no longer embedded within each node; instead, the nodes are only responsible for “accepting” a “visitor”:

```java
// The Node just says "Welcome, Visitor! Here I am."
public class PowerFactor implements Factor {
    public void accept(ASTVisitor visitor) {
        visitor.visitPowerFactor(this); // Passes itself to the visitor
    }
}

// The Visitor contains ALL the logic for a specific action
public class DerivativeVisitor implements ASTVisitor {
    public void visitPowerFactor(PowerFactor p) {
        // The logic for n * x^(n-1) lives here now!
    }
    public void visitConstantFactor(ConstantFactor c) {
        // Return 0
    }
}
```

---

<span id="analyzing-bugs-in-my-own-programs"></span>
## Analyzing Bugs in My Own Programs

![alt text](/images/oou1/image-3.png)

There’s not much to write about this section, since I achieved **zero bugs** in all three rounds of mandatory and peer testing—thanks in part to the principle emphasized by Professor RWG:
> **Don’t sacrifice correctness for performance**

In the second and third iterations, I first ensured the correctness of polynomial merging without focusing on extracting and simplifying coefficients inside `exp` expressions. As a result, my optimization score may not be very high, but this was indeed the method I used to ensure the program was bug-free.

At the same time, to avoid bugs, I assign the value `final` to properties in the program that I do not want to change, perform deep copying when assigning values to elements, and pay special attention to potential issues that may arise when removing elements from containers, in order to prevent unexpected problems.

Long lines of code and high cyclomatic complexity are also contributing factors to bugs; by reducing the complexity of these methods, you can significantly lower the likelihood of bugs occurring.

Actually, there’s one more thing I want to vent about HW3: I didn’t do much final length optimization for this assignment, which caused me to end up in Room B during the peer review (full marks for correctness but low performance scores). Everyone in Room B was in the same situation, so hacking didn’t really get us anywhere. In contrast, in Room A, people were able to hack out a lot of points because of their optimization efforts.This resulted in Room A having both high strong-test scores and high hack scores—doesn’t this encourage everyone to sacrifice correctness for performance?

### An analysis of the strategies I use when finding bugs in other people’s code
* Main focus: Building a test machine that is efficient and capable of detecting a small number of bugs; effectiveness depends on the quality of the test machine.
* Constructing extreme test cases: effective, but difficult to create.
* Review the other party’s code (white-box testing) and construct test cases targeting design flaws.

### Analysis of the optimizations I’ve made

1. $O(1)$ Merging of Like Terms Based on Hashing and Canonicalization
In polynomial multiplication and higher-order expansions (such as `(x+1)^8`), if I use the traditional two-layer, `List`-pass method to compare like terms, the time complexity will reach a catastrophic $O(N^2)$.
By extracting the immutable mathematical characteristics of monomials (the exponent of x, the exponent of y, and the contents of nested expressions), encapsulate them into Class `MonoKey`, and override methods `equals` and `hashCode`.
Implemented fast coefficient merging using `HashMap<MonoKey, BigInteger>`.

2. Fast Differentiation and Polynomial Transformation Based on Polymorphism
All classes inherit from `interface AstNode<T>` to ensure consistency in logic.
```java
public interface AstNode<T> extends
   PolyConvertible,
   Substitutable<T>,
   Instantiatable<T>,
   Derivable {
}
```

3. The correctness of this architecture is guaranteed by **absolute immutability** and **deep copying**.When performing operations such as `Poly.mulP` (polynomial multiplication) or `expP` (exponentiation), each calculation returns `new` brand-new `Poly` and `Mono` objects. Although this comes at the cost of some memory, it completely eliminates the various risks associated with pass-by-reference.


----

<span id="using-large-language-models"></span>
## Using Large Language Models
### Code Generation Usage
* Percentage of AI-generated code: 0%
* ——All the code in my assignments was written by me. Although AI is very powerful, it’s only by writing every line of code myself that I can truly master the skill of coding.

### Practical Applications and Insights on Large Language Models
Although I don’t have large language models generate code directly, they actually play a significant role in my coding process:

Unlike when I was learning C, where I started with every single syntax rule and every detail, in the OO course I were immediately faced with problem statements of over a thousand characters and hundreds of lines of code to write. This meant that I had to teach myself all the Java syntax and the details of implementing these tasks.

There are many ways to teach yourself: reading JDK documentation, checking out online resources like Runoob (菜鸟教程), taking online courses, or simply asking an AI.It’s easy to imagine that in the past, when people were learning Java, they would scour various documentation and tutorials (I did the same when I was learning C last year), but such searches were often time-consuming and lacked depth. Today, AI can essentially replace that entire process.
For example, if I want to learn about *the singleton pattern*, I can simply ask the AI, and it will provide different ways to implement it. Furthermore, you can ask it which one is best suited for my specific task, or what the underlying principles of the singleton pattern are.
Compared to copying and pasting a chunk of code from some webpage—code you don’t even fully understand—and then tinkering with it, the advantages of this approach are obvious: **it’s specific, targeted, and in-depth**.

Aside from theoretical guidance—which you can probably find online—the most valuable thing AI offers is engineering insights and code optimization strategies that go beyond my own understanding.Now, instead of having to read through an entire copy of *The Art of Computer Programming* myself, I can simply send my ideas to the AI and ask, “Assuming you’re a senior Java engineer, what suggestions do you have for this code?” I can then receive effective feedback that helps me improve my skills and expand my understanding.


### Evaluation of Large Language Models
The quality of a large language model’s responses depends on the prompt provided by the user. To use AI as a learning aid, it’s clearly not advisable to have it generate code directly (especially since the code it generates often contains many issues); instead, it should either guide you or offer suggestions.
So I started the conversation with this prompt:
> You are now a senior Java engineer here to guide me through writing the code. Always remember: you must not provide the code solution unless I ask for it. Your role is simply to help me complete the task, answer my questions, and think through the problem alongside me—you must never reveal the answer to me before I arrive at it myself.
> Please don’t point out any potential bugs—let me discover them on my own.
> Do not provide any information beyond what I have asked for.

It worked pretty well at first, but as the context grew, the LLM would sometimes just write out the entire code.

All in all, using AI has definitely improved my Java skills, cultivated my object-oriented mindset, and given me a deeper understanding of some underlying principles (by asking LLMs questions whenever I needed to). I also believe that I’ll learn more by using AI technology than I would without it—the key is using it correctly.

---
<span id="future-directions"></span>
## Future Directions
How do you think I could modify the lessons in Unit 1 to help everyone learn the material more effectively?

You could provide more tutorials or tips on the design patterns or specific syntax used in the assignments. The WeChat Official Account article from the first iteration was very helpful for my design, so I hope there will be similar guidance for each assignment.

---

<span id="thinking-questions"></span>
## Thinking Questions
1. How do you check if input meets the requirements? This includes spaces, consecutive symbols, and more.

   1. Blocking Invalid Combinations
The Lexer in the test machine must be very sensitive to whitespace characters.
      * **Spaces within numbers**: When reading a number, if it is immediately followed by a space, the lexer must recognize the subsequent number as a new token. For example, `12 34` would be parsed as `[NUM(12), NUM(34)]`.
      * **Consecutive Character Aggregation**: For `+++` or `---`, the lexer can output them as consecutive single-character tokens, which are then passed to the parser for evaluation.
      * **Legal-character whitelist**: Any character not in the set `[0-9x\+\-\*\(\)\s\^sincosp]` (such as full-width spaces or tab variants) is immediately intercepted during the lexical phase.
      * **Length assertion**: After removing all whitespace characters, check whether the string length exceeds the specified limit.

   2. **Formal Syntax Layer (Parser): Intercepting Invalid Structures**
      * **Recursive Descent Assertion**: Use the recursive descent algorithm to construct a “virtual validation tree.” If the `12 34` from earlier is passed to the parser, and the parser reads a second `NUM` where it expects to read an operator, it immediately throws a SyntaxError (WF).

2. How can you accurately calculate the cost of a valid input?

   1. Implemented as-is. Uses Parser to parse the input string into an AST without performing any mathematical simplifications.
   2. Calculate the cost from the bottom up.

---


> **This post is also published at**: [https://blog.csdn.net/Gooden_job/article/details/159551046](https://blog.csdn.net/Gooden_job/article/details/159551046)
