# To do before merging with main
- [x] Link files to actual db(github)
- [x] Fix the wrong right_side organization + links
- [] Figure out which tags to include
- [x] Fix going backwards in the right side menu
- [x] Fix not being able to click on classes on the right side menu
- [x] Linking references in descriptions
- [x] Name + description moves when the backwards button is present
- [] Sizing - things look really small + placement of icons feels off (Maybe the circles on the icons on the right change my perception) + Lack of space in some cases?
- [x] Sizing of the complexity classes (such as BQPSPACE/qpoly)
- [] Merge with main

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
 - SQG, S2P
 - QSZK, PZK, Non-interactive versions
 - YP, YPP, YQP
 - NE(EEEEEE)
 - BH, QH

### Ideas:
- Allowing for other graphs to be created - for communication complexity, cryptographic assumptions or relational complexity classes.
- Public access?

### Better Description Page:
- Definition dropdown
- See also classes
- "Tags"
- Useful information