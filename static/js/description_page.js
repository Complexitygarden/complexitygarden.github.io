import { updateURLWithConfig, decodeConfiguration } from './url_state.js';

let complexityClasses = [];
let allClasses = [];


const normalizeKey = k => (k || '').trim().replace(/\s+/g, '').toUpperCase();

function stripTags(html = '') {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}


function addClassById(classId)
{
  if (!classId) return;

  const id = String(classId).toLowerCase();

  //already selected
  if (complexityClasses.some(c => c.id === id)) return;

  const classToAdd = allClasses.find(c => c.id === id);
  if (!classToAdd) return;

  complexityClasses.push(classToAdd);

  try {
    updateURLWithConfig(complexityClasses.map(c => normalizeKey(c.id)));
  }
  catch
  {

  }

  updateSearchResults();
  filterAndRender();
}


function toCardShape(id, info = {}) {
  return {
    id: id.toLowerCase(),
    name: info.name || id,
    fullName: info.description || '',
    tags: info.tags || 'Complexity',
    // renderer wraps definition in html tags, pass plain text here
    definition: info.definition ? stripTags(info.definition) : 'No definition available.',
    applications: info.applications || [],
    see_also: info.see_also || info.see_also || []
  };
}


async function buildComplexityClasses() {
    const encoded = new URLSearchParams(location.search).get('config');
    const selected = encoded ? (decodeConfiguration(encoded) || []) : [];

    const url_classes = "https://raw.githubusercontent.com/Complexitygarden/dataset/refs/heads/main/decision_complexity_classes/classes.json"
    const response = await fetch(url_classes);
    const data = await response.json();

    
    const classMap = data.class_list || data;
    allClasses = Object.keys(classMap)
      .map(k => normalizeKey(k))
      .map(k => classMap[k] ? toCardShape(k, classMap[k]) : null)
      .filter(Boolean);

    const keys = selected.length ? selected : Object.keys(classMap);

    complexityClasses = keys
    .map(k => normalizeKey(k))
    .filter((k, i, arr) => arr.indexOf(k) === i) // dedupe
    .map(k => classMap[k] ? toCardShape(k, classMap[k]) : null)
    .filter(Boolean);

    //console.log("ALL CLASSES"+ allClasses);
    //console.log("CURRENT " + complexityClasses);
    //console.log(complexityClasses);
  

}


let currentSearch = '';
let currentCategory = 'all';

function initializeApp() {
    const categories = ['all', ...new Set(complexityClasses.map(c => c.category))];
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
      
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category === 'all' ? 'All Categories' : category;
        categoryFilter.appendChild(option);
    });

    searchInput.addEventListener('focus', (e) => {
      searchDropdown.style.display = 'block';
      updateSearchResults();
    })

        // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            searchDropdown.style.display = 'none';
        }
    });


    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        updateSearchResults();
    });

    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentCategory = e.target.value;
        filterAndRender();
    });

    updateSearchResults();
    filterAndRender();
}

function handleClassToggle(checkbox)
{
  console.log("Class toggle has happened");
  const classId = checkbox.value;
  const isChecked = checkbox.checked;

  if (isChecked)
  {
    //add the class

    //if the class we clicked on is not in our current selection
    if (!complexityClasses.find(c => c.id === classId))
    {

      //then we get the id to add from the big list of classes
      const classToAdd = allClasses.find(c => c.id === classId);
      {
        //this should aways run, just as a safety measure
        if (classToAdd)
        {
          complexityClasses.push(classToAdd);
        }
      }
    }
  }
  else 
  {
    //this is already in and we must remove in
    complexityClasses = complexityClasses.filter(c => c.id !== classId);  
  }

  filterAndRender();
}


function updateSearchResults() {
  const filtered = allClasses.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
    item.fullName.toLowerCase().includes(currentSearch.toLowerCase());
    return matchesSearch;
  });

  const selectedIds = new Set(complexityClasses.map(c => c.id));

  searchDropdown.innerHTML = filtered.map(item => 
    `
    <div class="search-result-item">
      <label>
        <input 
          type="checkbox"
          class="class-checkbox"
          value="${item.id}"
          ${selectedIds.has(item.id) ? 'checked' : ''}
        >
        <span>${item.name}</span>
      </label>
    </div>
    `
  ).join('');

  searchDropdown.querySelectorAll('.class-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => handleClassToggle(e.target));
  });
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

    //add clicks to see also

    document.querySelectorAll('.see-also-add').forEach(btn => {
      btn.addEventListener('click', (e) =>{
        e.preventDefault();
        e.stopPropagation();
        addClassById(btn.dataset.classId);
      })
    })
}

function createCard(complexityClass) {
  console.log(complexityClass);

  const definition = createAccordionItem('Definition', `<p>${complexityClass.definition}</p>`);

  const applications = complexityClass.applications.length === 0 ? '</>' : createAccordionItem('Applications', `<ul>${complexityClass.applications.map(app => `<li>${app}</li>`).join('')}</ul>`)

  const seeAlsoItems = (Array.isArray(complexityClass.see_also) ? complexityClass.see_also : [])
  .map(rel => {
    const relId = normalizeKey(rel).toLowerCase();
    const relClass = allClasses.find(c => c.id === relId);
    const label = relClass?.name || rel;

    return `
      <li>
        <button
          type="button"
          class="see-also-add see-also-btn"
          data-class-id="${relId}"
        >${label}</button>
      </li>
    `;
  })
  .join('');

  const seeAlso =
  seeAlsoItems.length > 0
    ? createAccordionItem('See Also', `<ul>${seeAlsoItems}</ul>`)
    : '';

  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">${complexityClass.name}</h2>
        <p class="card-subtitle">${complexityClass.fullName}</p>
        ${(Array.isArray(complexityClass.tags) ? complexityClass.tags : [complexityClass.tags])
          .filter(Boolean)
          .map(tag => `<span class="badge">${tag}</span>`)
          .join(' ')}
       
      </div>
      <div class="card-content">
        ${definition}
        ${applications}
        ${seeAlso}
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