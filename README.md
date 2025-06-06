# Complexity Garden
This repository contains the code for the complexity garden - a tool whose goal to clearly visualize computational complexity classes.

### How to run locally
1. python -m http.server 8000
2. Open http://localhost:8000/index.html

### How to add classes/theorems
1. Classes may be added in the classes.json file. You must provide the identifier, a name and some information.
2. Theorems may be added in the theorems.json file. You must define what type of theorem it is and which classes it applies to.

### Classes to add:
 - BQL
 - Quantum Circuit Classes
 - Catalytic Computation
 - NQP, coNQP, coC_{=}P

### Ideas:
- Allowing for other graphs to be created - for communication complexity, cryptographic assumptions or relational complexity classes.
- Public access?