# Basic Class

A Class serves as a template for creating objects with predefined properties
and methods.

```
class Player(name):
    name = name
    hp = 100

    fn greet():
        return "Hi, I am " + this.name

    fn take_damage(amount):
        this.hp = this.hp - amount

p1 = new Player("Alice")
p2 = new Player("Bob")

out(p1.name)           // "Alice"
out(p2.name)           // "Bob"

p1.name = "Charlie"
out(p1.name)           // "Charlie"
out(p2.name)           // "Bob"

out(p1.greet())        // "Hi, I am Charlie"
out(p2.greet())        // "Hi, I am Bob"

p1.take_damage(10)
out(p1.hp)             // 90
out(p2.hp)             // 100
```

## PASS

- Alice
- Bob
- Charlie
- Bob
- Hi, I am Charlie
- Hi, I am Bob
- 90
- 100

---

# Classes as Data Containers with Parameter Promotion

Classes can be used as simple data containers without methods.

```
class Point(this.x, this.y)

p = new Point(3, 4)
out(p.x)
out(p.y)
```

## PASS

- 3
- 4

---

# Method invocation

Methods defined within a class can be invoked on its instances using the dot notation.

```
class Counter:
    count = 0

    fn increment:
        this.count = this.get_count() + 1

    fn get_count:
        return this.count

c = new Counter()
c.increment()
c.increment()

out(c.count)
```

## PASS
 
- 2

---


# The Factory Pattern (Returning Instances)

Verifies that `new` works as a return value and bubbles up correctly.

```
class Item(name):
    name = name

fn create_potion():
    return new Item("Health Potion")

fn create_sword():
    return new Item("Iron Sword")

inventory = [create_potion(), create_sword()]

out(inventory[0].name)
out(inventory[1].name)
```

## PASS

- Health Potion
- Iron Sword

---

# Nested Objects (Composition)

Verifies that an instance can hold another instance, and property chains work (`a.b.c`).

```
class Engine(hp):
    hp = hp

class Car(model, engine):
    model: model
    engine: engine // Storing the Engine instance

v8 = new Engine(300)
mustang = new Car("Mustang", v8)

out(mustang.model)
out(mustang.engine.hp) 
```

## PASS

- Mustang
- 300

---

# Temporary Instances (Method Chaining)

Verifies that you don't need to store an instance in a variable to use it. The stack should clean itself up after the temporary object is used.

```
class Calculator(n):
    n = n
    
    fn add(x):
        return this.n + x

// Instantiate and immediately call a method
result = new Calculator(10).add(5)

out(result)
```

## PASS

- 15

---

# Pass-by-Reference

Verifies that passing a `new` instance to a function passes a *reference*, not a copy. The function should be able to mutate the caller's object.

```
class Box(value):
    val = value

fn open_box(b):
    b.val = "Empty"

my_box = new Box("Treasure")
out(my_box.val)

open_box(my_box)
out(my_box.val) // Should be changed
```

## PASS

- Treasure
- Empty

---

# Recursion with New

Verifies that `new` is safe to use inside recursive calls (stack frame depth safety).

```
class Node(val, next):
    val = val
    next = next

fn build_chain(n):
    if n == 0:
        return 0 // End of chain (using 0 or null)
    
    // Create current node, pointing to the next one
    return new Node(n, build_chain(n - 1))

head = build_chain(3)

out(head.val)           // 3
out(head.next.val)      // 2
out(head.next.next.val) // 1
```

## PASS

- 3
- 2
- 1

---

# Instantiation inside Array Comprehensions

Verifies that `new` works inside loops and expressions.

```
class Point(x, y):
    x = x
    y = y

// Create a diagonal line of points: (0,0), (1,1), (2,2)
points = [new Point(i, i) for i in 0..3]

out(points[0].x)
out(points[1].y)
out(points[2].x)
```

## PASS

- 0
- 1
- 2

---

# Constructors

A constructor method (`init`) is a special function that is automatically
called when a new instance of a class is created. It is typically used to
initialize the properties of the instance or perform some validation or setup
tasks.

```
class Rectangle:
    width = 0
    height = 0

    fn init(w, h):
        this.width = w
        this.height = h

    fn area():
        return this.width * this.height

rect = new Rectangle(5, 10)
out(rect.width)    // 5
out(rect.height)   // 10
out(rect.area())   // 50
```

## PASS

- 5
- 10
- 50

---

# Hybrid Constructors

Lux supports both primary constructors (defined in the class declaration)
and secondary constructors (defined as `init` methods). This test verifies
that both types of constructors can coexist and function correctly.

When defining parameters, you have to _choose_ where you want to use them
between primary and secondary constructors. In this test, we use the primary
constructor to set the initial value of `radius`, and the secondary constructor
to modify it further.

```
class Circle(radius):
    radius = radius

    fn init():
        // Double the radius in the init method
        this.radius = this.radius * 2

    fn area():
        return 3.14 * this.radius * this.radius

circle = new Circle(5)
out(circle.radius)  // 10
out(circle.area())  // 314.0
```

## PASS

- 10
- 314

---

# Invalid parameter declaration

This test verifies that declaring parameters in both the primary constructor
and the `init` method results in a compilation error.

```
class InvalidCircle(radius):
    radius = radius

    fn init(diameter):
        this.radius = diameter * 2
        
circle = new InvalidCircle(5)
```

## FAIL

```
Class 'InvalidCircle' has an ambiguous constructor definition.

It defines parameters in the class header (1) AND in the 'init' method (1).
Please use only one style:
  1. Header params: class InvalidCircle(...) + fn init()
  2. Init params:   class InvalidCircle + fn init(...)
```

# Classes from other Modules

This test verifies that classes can be defined in one module and imported
into another module for use.

```
import "Math"

vec3 = new Math.Vector3(3, 4, 0)
out(vec3.magnitude())  // 5.0
out(vec3.p.x)          // 3
```

## Module: Math

```
class PrivateVector3(x, y, z):
    x = x
    y = y
    z = z

public class Vector3(x, y, z):
    x = x
    y = y
    z = z
    p = 0

    fn init():
        this.p = new PrivateVector3(this.x, this.y, this.z)

    fn magnitude():
        return (this.x * this.x + this.y * this.y + this.z * this.z) ^ 0.5
```

## PASS

- 5
- 3

---

# Self-referential Classes

This test verifies that a class can reference itself within its own definition.

```
class Node(value, next):
    value = value
    next = next  // Can be another Node or null

node3 = new Node(3, null)
node2 = new Node(2, node3)
node1 = new Node(1, node2)

out(node1.value)               // 1
out(node1.next.value)          // 2
out(node1.next.next.value)     // 3
```

## PASS

- 1
- 2
- 3

---

# Class Inheritance

Classes can inherit from other classes using the `extends` keyword
followed by another class's name. This allows the child class to
reuse and extend the functionality of the parent class.

```
class Entity(name):
    name = name
    fn move():
        out(this.name + " moved.")

// Inherits from Entity
class Player(name, level) extends Entity(name):
    level = level
    
    // Overrides nothing, just adds new state
    fn attack():
        out("Attacking level " + this.level)

p = new Player("Hero", 99)

p.attack() // "Attacking level 99"
p.move()   // "Hero moved." (Inherited!)
```

## PASS

- Attacking level 99
- Hero moved.

---

# Mixed Inheritance Constructors

This test verifies that a child class can call the parent class's
constructor when both classes have different constructor types.

```
class Animal:
    species = ""

    fn init(species):
        this.species = species
        out("An animal of species " + this.species + " has been created.")
        
class Dog(name) extends Animal("Dog"):
    name = name
    
b = new Dog("Buddy")
out(b.name) // "Buddy"
```

## PASS

- An animal of species Dog has been created.
- Buddy

---

# Mixed Inheritance Constructors Reversed

This test verifies that a child class can call the parent class's
constructor when both classes have different constructor types, with the
child using a primary constructor and the parent using a secondary constructor.

```
class Vehicle(type):
    type = type

    fn init():
        out("A vehicle of type " + this.type + " has been created.")

class Car(model) extends Vehicle("Car"):
    model = model

c = new Car("Sedan")
out(c.model) // "Sedan"
```

## PASS

- A vehicle of type Car has been created.
- Sedan

---

# Inheritance with Method Overriding

This test verifies that a child class can override methods defined in
the parent class.

```
class Shape:
    fn area():
        return 0

class Square(side) extends Shape:
    side = side

    fn area():
        return this.side * this.side

sq = new Square(4)
out(sq.area()) // 16
```

## PASS

- 16

---

# Overriding a Method and invoking the Parent Method

This test verifies that a child class can override a method from the
parent class and still invoke the parent method using `parent`.

```
class Animal:
    fn speak():
        out("The animal makes a sound")

class Dog extends Animal:
    fn speak():
        parent.speak() // Calls Animal.speak()
        out("The dog barks!")

d = new Dog()
d.speak()
```

## PASS

- The animal makes a sound
- The dog barks!

---

# Deeply nested method overrides with parent invocations

This test verifies that method overriding and parent method invocations
work correctly in a multi-level inheritance hierarchy.

```
class A:
    fn identify():
        out("I am A")

class B extends A:
    fn identify():
        parent.identify()
        out("I am B")

class C extends B:
    fn identify():
        parent.identify()
        out("I am C")

c = new C()
c.identify()
```

## PASS

- I am A
- I am B
- I am C

---

# Invoking Host Classes

A host class is a class that lives in the host environment (javascript).
These fixture tests have access to a class called "FixturePoint" defined in the
test runner environment.

```
point = new FixturePoint(10, 20)

out(point.x)          // 10
out(point.y)          // 20

// Invoke methods & pass by reference
otherPoint = new FixturePoint(13, 24)
out(point.distanceTo(otherPoint)) // 5.0

// Mutate
point.x = 30
out(point.x)          // 30
```

## PASS

- 10
- 20
- 5
- 30

---

# Extending Host Classes

This test verifies that Lux classes can extend host environment (javascript)
classes and override their methods.

```
class MyPoint(x, y) extends FixturePoint(x, y):
    fn distanceTo(other):
        // Override to always return 42
        return 42

p1 = new MyPoint(0, 0)
p2 = new MyPoint(3, 4)

out(p1.distanceTo(p2)) // 42
```

## PASS

- 42

---

# Calling Parent Host Class Methods

This test verifies that a Lux class extending a host environment (javascript)
class can invoke the parent class's methods using `parent`.

```
class MyPoint(x, y) extends FixturePoint(x, y):
    fn distanceTo(other):
        // Call the parent method
        return parent.distanceTo(other) + 10

p1 = new MyPoint(0, 0)
p2 = new MyPoint(3, 4)

out(p1.distanceTo(p2)) // 15.0
```

## PASS

- 15

---

# Deeply Nested Class Inheritance

This test verifies that multi-level class inheritance works correctly,
including property access and method overriding.

```
class LivingBeing(age):
    age = age

    fn breathe():
        out("Breathing")

class Animal(age) extends LivingBeing(age):
    fn eat():
        out("Eating")

class Dog(age) extends Animal(age):
    fn bark():
        out("Barking")
        out("Age: " + this.age)

d = new Dog(8)
d.breathe() // Inherited from LivingBeing
d.eat()     // Inherited from Animal
d.bark()    // Defined in Dog
```

## PASS

- Breathing
- Eating
- Barking
- Age: 8

---

# Instance Type Checking

This test verifies that the `is` operator correctly checks the type of an instance
against its class and parent classes.

```
class Node(this.value)
class Animal(this.name)
class Dog(name) extends Animal(name)

d = new Dog("Buddy")
n = new Node(42)

out(d is Dog)          // true
out(d is Animal)       // true
out(d is Node)         // false
out(n is Node)         // true
out(n is Animal)       // false
```

## PASS

- true
- true
- false
- true
- false

---

# Instance Type Checking with Host Classes

This test verifies that the `is` operator correctly checks the type of an instance
against host environment (javascript) classes.

```
class MyPoint(x, y) extends FixturePoint(x, y)
p = new MyPoint(1, 2)

out(p is MyPoint)         // true
out(p is FixturePoint)    // true
```

## PASS

- true
- true

---
