// Enhanced class data with examples, applications, and relationships
const enhancedClassData = {
    "PSPACE": {
        examples: [
            "Quantified Boolean Formula (QBF)",
            "Geography game",
            "Regular expression equivalence", 
            "Linear space reachability"
        ],
        applications: [
            "Game theory and two-player games",
            "Model checking and verification",
            "Planning problems in AI",
            "Database query evaluation"
        ],
        keyRelationships: [
            "P ⊆ NP ⊆ PSPACE (polynomial hierarchy)",
            "PSPACE = NPSPACE (Savitch's theorem)",
            "PSPACE ⊆ EXPTIME (space-time relationships)"
        ],
        relatedClasses: [
            { name: "P", relationship: "Subset - P ⊆ PSPACE", direction: "subset" },
            { name: "NP", relationship: "Subset - NP ⊆ PSPACE", direction: "subset" },
            { name: "BQP", relationship: "Subset - BQP ⊆ PSPACE", direction: "subset" },
            { name: "EXPTIME", relationship: "Superset - PSPACE ⊆ EXPTIME", direction: "superset" }
        ],
        references: [
            { title: "Computational Complexity - Arora & Barak" },
            { title: "Savitch's Theorem proof" },
            { title: "PSPACE-Complete Problems" }
        ]
    },
    "P": {
        examples: [
            "Sorting algorithms",
            "Graph connectivity",
            "Linear programming",
            "Primality testing (AKS)"
        ],
        applications: [
            "Efficient algorithms design",
            "Database query optimization",
            "Network routing protocols",
            "Cryptographic primitives"
        ],
        keyRelationships: [
            "P ⊆ NP (fundamental question)",
            "P ⊆ BQP ⊆ PSPACE",
            "P = co-P (closed under complement)"
        ],
        relatedClasses: [
            { name: "NP", relationship: "Subset - P ⊆ NP", direction: "subset" },
            { name: "BQP", relationship: "Subset - P ⊆ BQP", direction: "subset" },
            { name: "PSPACE", relationship: "Subset - P ⊆ PSPACE", direction: "subset" },
            { name: "L", relationship: "Superset - L ⊆ P", direction: "superset" }
        ],
        references: [
            { title: "Introduction to Algorithms - CLRS" },
            { title: "P vs NP Problem" },
            { title: "Efficient Algorithms" }
        ]
    },
    "NP": {
        examples: [
            "Boolean Satisfiability (SAT)",
            "Traveling Salesman Problem",
            "Graph Coloring",
            "Subset Sum"
        ],
        applications: [
            "Optimization problems",
            "Resource allocation",
            "Scheduling problems",
            "Cryptographic security"
        ],
        keyRelationships: [
            "P ⊆ NP (major open question)",
            "NP ⊆ PSPACE",
            "NP = co-NP? (open question)"
        ],
        relatedClasses: [
            { name: "P", relationship: "Superset - P ⊆ NP", direction: "superset" },
            { name: "PSPACE", relationship: "Subset - NP ⊆ PSPACE", direction: "subset" }
        ],
        references: [
            { title: "Cook's Theorem" },
            { title: "Karp's 21 NP-complete problems" },
            { title: "The P versus NP Problem" }
        ]
    },
    "BQP": {
        examples: [
            "Integer factorization (Shor's algorithm)",
            "Discrete logarithm",
            "Quantum simulation",
            "Unstructured search (Grover)"
        ],
        applications: [
            "Quantum cryptography",
            "Drug discovery simulation",
            "Financial modeling",
            "Machine learning optimization"
        ],
        keyRelationships: [
            "P ⊆ BQP ⊆ PSPACE",
            "BQP vs NP (unknown relationship)",
            "BQP ⊆ PP (oracle separation known)"
        ],
        relatedClasses: [
            { name: "P", relationship: "Superset - P ⊆ BQP", direction: "superset" },
            { name: "PSPACE", relationship: "Subset - BQP ⊆ PSPACE", direction: "subset" },
            { name: "NP", relationship: "Unknown relationship", direction: "unknown" }
        ],
        references: [
            { title: "Quantum Computation and Quantum Information" },
            { title: "Shor's Algorithm" },
            { title: "Quantum Complexity Theory" }
        ]
    }
};

// Function to get enhanced data for a class
function getEnhancedClassData(className) {
    console.log("getEnhancedClassData called for:", className);
    console.log("Available enhanced data:", Object.keys(enhancedClassData));
    
    const data = enhancedClassData[className];
    if (data) {
        console.log("Found enhanced data for", className, ":", data);
        return data;
    } else {
        console.log("No enhanced data found for", className, ", using default");
        return {
            examples: [],
            applications: [],
            keyRelationships: [],
            relatedClasses: [],
            references: []
        };
    }
}

// Test that the data loaded
console.log("Enhanced class data loaded successfully. Available classes:", Object.keys(enhancedClassData));