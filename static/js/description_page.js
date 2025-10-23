
import { updateURLWithConfig, decodeConfiguration } from './url_state.js';

let complexityClasses = [];


const normalizeKey = k => (k || '').trim().replace(/\s+/g, '').toUpperCase();

function stripTags(html = '') {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}


function toCardShape(id, info = {}) {
  return {
    id: id.toLowerCase(),
    name: info.name || id,
    fullName: info.description || '',
    category: info.category || 'Complexity',
    // renderer wraps definition in html tags, so pass plain text here
    definition: info.information ? stripTags(info.information) : 'No description available.',
    examples: info.examples || [],
    applications: info.applications || [],
    keyRelationships: info.keyRelationships || info.relations || []
  };
}


async function buildComplexityClasses() {
    const encoded = new URLSearchParams(location.search).get('config');
    const selected = encoded ? (decodeConfiguration(encoded) || []) : [];

    const response = await fetch('../classes.json');
    const data = await response.json();
    
    const classMap = data.class_list || data;

    const keys = selected.length ? selected : Object.keys(classMap);

    complexityClasses = keys
    .map(k => normalizeKey(k))
    .filter((k, i, arr) => arr.indexOf(k) === i) // dedupe
    .map(k => classMap[k] ? toCardShape(k, classMap[k]) : null)
    .filter(Boolean);

}


const complexityClasses2 = [
      {
        id: "p",
        name: "P",
        fullName: "Polynomial Time",
        category: "Time Complexity",
        definition: "The class of decision problems that can be solved by a deterministic Turing machine in polynomial time. These are problems considered efficiently solvable.",
        examples: ["Sorting algorithms", "Shortest path (Dijkstra's algorithm)", "Linear programming"],
        applications: ["Database queries", "Network routing", "Optimization in various domains"],
        keyRelationships: ["P ⊆ NP", "P ⊆ PSPACE", "P ⊆ BQP"]
      },
      {
        id: "np",
        name: "NP",
        fullName: "Nondeterministic Polynomial Time",
        category: "Time Complexity",
        definition: "The class of decision problems for which a 'yes' answer can be verified in polynomial time by a deterministic Turing machine, or equivalently, solved in polynomial time by a nondeterministic Turing machine.",
        examples: ["Boolean satisfiability (SAT)", "Traveling salesman decision problem", "Graph coloring"],
        applications: ["Cryptography", "Scheduling problems", "Resource allocation"],
        keyRelationships: ["P ⊆ NP", "NP ⊆ PSPACE", "NP ⊆ EXPTIME"]
      },
      {
        id: "pspace",
        name: "PSPACE",
        fullName: "Polynomial Space",
        category: "Space Complexity",
        definition: "The class of decision problems that can be solved by a Turing machine using polynomial space. Time is not constrained, only memory usage.",
        examples: ["Quantified Boolean formula (QBF)", "Many two-player games", "Regular expression equivalence"],
        applications: ["Game theory", "Formal verification", "Planning problems"],
        keyRelationships: ["NP ⊆ PSPACE", "PSPACE ⊆ EXPTIME", "PSPACE = NPSPACE (Savitch's theorem)"]
      },
      {
        id: "bqp",
        name: "BQP",
        fullName: "Bounded-Error Quantum Polynomial Time",
        category: "Quantum Complexity",
        definition: "The class of decision problems solvable by a quantum computer in polynomial time with an error probability of at most 1/3 for all instances.",
        examples: ["Integer factorization (Shor's algorithm)", "Discrete logarithm", "Simulation of quantum systems"],
        applications: ["Cryptanalysis", "Quantum simulation", "Optimization problems"],
        keyRelationships: ["P ⊆ BQP", "BQP ⊆ PSPACE", "Relationship with NP is unknown"]
      },
      {
        id: "exptime",
        name: "EXPTIME",
        fullName: "Exponential Time",
        category: "Time Complexity",
        definition: "The class of decision problems solvable by a deterministic Turing machine in exponential time, i.e., in O(2^p(n)) time where p(n) is a polynomial function of n.",
        examples: ["Generalized chess on n×n board", "Certain protocol verification problems", "Some model checking problems"],
        applications: ["Theoretical computer science", "Formal methods", "Complexity theory research"],
        keyRelationships: ["P ⊊ EXPTIME (proven)", "NP ⊆ EXPTIME", "PSPACE ⊆ EXPTIME"]
      },
      {
        id: "np-complete",
        name: "NP-Complete",
        fullName: "NP-Complete",
        category: "Time Complexity",
        definition: "A problem is NP-complete if it is in NP and every problem in NP can be reduced to it in polynomial time. These are the 'hardest' problems in NP.",
        examples: ["Boolean satisfiability (SAT)", "Vertex cover", "Hamiltonian path", "Subset sum"],
        applications: ["Scheduling", "Resource allocation", "Circuit design", "Bioinformatics"],
        keyRelationships: ["NP-Complete ⊆ NP", "If any NP-Complete problem is in P, then P = NP", "All NP-Complete problems are polynomial-time reducible to each other"]
      },
      {
        id: "l",
        name: "L",
        fullName: "Logarithmic Space",
        category: "Space Complexity",
        definition: "The class of decision problems decidable by a deterministic Turing machine using logarithmic space. The input tape is read-only and doesn't count toward space usage.",
        examples: ["Path existence in directed graphs", "Undirected graph connectivity (USTCON)", "Palindrome recognition"],
        applications: ["Memory-constrained computation", "Streaming algorithms", "Small-space data structures"],
        keyRelationships: ["L ⊆ NL", "L ⊆ P", "L ⊆ PSPACE"]
      },
      {
        id: "nl",
        name: "NL",
        fullName: "Nondeterministic Logarithmic Space",
        category: "Space Complexity",
        definition: "The class of decision problems decidable by a nondeterministic Turing machine using logarithmic space.",
        examples: ["Reachability in directed graphs", "2-SAT", "Strongly connected components"],
        applications: ["Graph algorithms", "Database query optimization", "Network analysis"],
        keyRelationships: ["L ⊆ NL", "NL ⊆ P", "NL = coNL (Immerman-Szelepcsényi theorem)"]
      }
    ];

let currentSearch = '';
let currentCategory = 'all';

function initializeApp() {
    const categories = ['all', ...new Set(complexityClasses.map(c => c.category))];
    const categoryFilter = document.getElementById('categoryFilter');
      
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category === 'all' ? 'All Categories' : category;
        categoryFilter.appendChild(option);
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        filterAndRender();
    });

    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentCategory = e.target.value;
        filterAndRender();
    });

    filterAndRender();
}

function filterAndRender() {
    const filtered = complexityClasses.filter(item => {
        const matchesSearch = 
            item.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            item.fullName.toLowerCase().includes(currentSearch.toLowerCase()) ||
            item.definition.toLowerCase().includes(currentSearch.toLowerCase());
        
        const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
        
        return matchesSearch && matchesCategory;
    });

    renderClasses(filtered);
}

function renderClasses(classes) {
  const grid = document.getElementById('classesGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');

    resultsCount.textContent = `Showing ${classes.length} complexity ${classes.length === 1 ? 'class' : 'classes'}`;

    if (classes.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = classes.map(c => createCard(c)).join('');

    // Add event listeners to accordion triggers
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', toggleAccordion);
    });
}

function createCard(complexityClass) {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">${complexityClass.name}</h2>
        <p class="card-subtitle">${complexityClass.fullName}</p>
        <span class="badge">${complexityClass.category}</span>
      </div>
      <div class="card-content">
        ${createAccordionItem('Definition', `<p>${complexityClass.definition}</p>`)}
        ${createAccordionItem('Examples', `<ul>${complexityClass.examples.map(ex => `<li>${ex}</li>`).join('')}</ul>`)}
        ${createAccordionItem('Applications', `<ul>${complexityClass.applications.map(app => `<li>${app}</li>`).join('')}</ul>`)}
        ${createAccordionItem('Key Relationships', `<ul>${complexityClass.keyRelationships.map(rel => `<li>${rel}</li>`).join('')}</ul>`)}
      </div>
    </div>
  `;
}

function createAccordionItem(title, content) {
    return `
        <div class="accordion-item">
            <button class="accordion-trigger">
                ${title}
                <svg class="accordion-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="accordion-content">
                <div class="accordion-content-inner">
                    ${content}
                </div>
            </div>
        </div>
      `;
    }

function toggleAccordion(e) {
    const trigger = e.currentTarget;
    const content = trigger.nextElementSibling;
    const isActive = trigger.classList.contains('active');

    if (isActive) {
        trigger.classList.remove('active');
        content.style.maxHeight = null;
    } else {
        trigger.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
    }
}

function clearFilters() {
    currentSearch = '';
    currentCategory = 'all';
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    filterAndRender();
}


// Wrap your current initialize flow so data is ready first
async function init() {
  await buildComplexityClasses();
  initializeApp();      // your existing function below stays the same
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}