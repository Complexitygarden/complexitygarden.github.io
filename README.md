# Complexity Garden
This repository contains the code for the complexity garden - a tool whose goal to clearly visualize computational complexity classes.

### How to run locally
1. python -m http.server 8000
2. Open http://localhost:8000/index.html

### How to add classes/theorems
1. Classes may be added in the classes.json file. You must provide the identifier, a name and some information.
2. Theorems may be added in the theorems.json file. You must define what type of theorem it is and which classes it applies to.

### Classes to add:
 - Quantum Circuit Classes
 - SQG, S2P, L2P
 - QSZK, PZK, Non-interactive versions
 - YP, YPP, YQP
 - E, NE
 - BH, QH
 - Binary Decision Diagram Classes (OBDD)
 - NP\cap coNP
 - LOGCFL, UP, US, FewP, SL

### Ideas:
- Allowing for other graphs to be created - for communication complexity, cryptographic assumptions or relational complexity classes.
- Public access?

### Better Description Page:
- Definition dropdown
- See also classes
- "Tags"
- Useful information