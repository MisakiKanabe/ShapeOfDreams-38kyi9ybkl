// ===== Tab Switching =====
const tabLinks = document.querySelectorAll('.navbar-links a');
const tabContents = document.querySelectorAll('.tab-content');

tabLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    tabLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const tabId = link.dataset.tab;
    tabContents.forEach(tc => tc.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
  });
});

// ===== Unity-style Rich Text Helper =====
function unityToHtml(text, spriteMap={}) {
  if (!text) return '';
  let html = text.replace(/<color=(.*?)>(.*?)<\/color>/g, '<span style="color:$1">$2</span>');
  html = html.replace(/<sprite=(\d+)>/g, (_, i) => {
    const file = spriteMap[i];
    return file ? `<img class="sprite-image" src="!Sprites/${file}" alt="Sprite ${i}">` : '';
  });
  html = html.replace(/\n/g, '<br>');
  return html;
}

// ===== Generic Table Initialization =====
function initTable(tabId, jsonPath, columns, rarityMap=null, isAchievement=false, spriteMap={}) {
  const table = document.querySelector(`#data-table-${tabId}`);
  const tbody = table.querySelector('tbody');
  const searchInput = document.getElementById(`searchInput${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  const filterGroup = document.getElementById(`filter${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  let allData = [];
  let sortKey = columns.find(c => c.sortable)?.key || null;
  let sortDir = 'asc';

  // Render Table
  function render(data) {
    tbody.innerHTML = '';
    data.forEach(item => {
      const row = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');

        // IMAGE
        if(col.key==='image'){
          const img = document.createElement('img');
          if(isAchievement){
            img.src = `!Images/${item.imageUnlocked}`;
          } else {
            img.src = `!Images/${item.image}`;
          }
          img.alt = item.name || '';
          img.classList.add('essence-image');
          td.appendChild(img);

        // RARITY
        } else if(col.key==='rarity'){
          const span = document.createElement('span');
          span.textContent = item[col.key];
          span.classList.add(`rarity-${item[col.key]}`);
          span.style.textAlign = 'center';
          td.appendChild(span);

        // DESCRIPTION / ACHIEVEMENT DESCRIPTION
        } else if(col.key==='description' || col.key==='achievementDescription'){
          td.innerHTML = unityToHtml(item[col.key], spriteMap);

        // DEFAULT TEXT
        } else {
          td.innerHTML = item[col.key] || '';
        }

        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  }

  // Filter & Sort
  function filterSort() {
    let filtered = Array.isArray(allData) ? allData.slice() : Object.values(allData);

    // Search
    const term = searchInput.value.toLowerCase();
    filtered = filtered.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(term))
    );

    // Rarity filter
    if(rarityMap && filterGroup){
      const selected = Array.from(filterGroup.querySelectorAll('input[type="checkbox"]:checked')).map(i=>i.value);
      if(selected.length>0){
        filtered = filtered.filter(i=>selected.includes(i.rarity));
      }
    }

    // Sorting
    if(sortKey){
      filtered.sort((a,b)=>{
        let cmp = 0;
        if(sortKey==='rarity' && rarityMap){
          cmp = rarityMap[a.rarity]-rarityMap[b.rarity];
        } else {
          cmp = (a[sortKey]||'').localeCompare(b[sortKey]||'');
        }
        return sortDir==='asc'?cmp:-cmp;
      });
    }

    render(filtered);
  }

  // Header click sorting
  table.querySelectorAll('th[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if(sortKey===key) sortDir = sortDir==='asc'?'desc':'asc';
      else { sortKey = key; sortDir='asc'; }
      table.querySelectorAll('th[data-sort]').forEach(h=>h.classList.remove('asc','desc'));
      th.classList.add(sortDir);
      filterSort();
    });
  });

  // Search input
  searchInput.addEventListener('input', filterSort);

  // Rarity checkboxes
  if(filterGroup){
    filterGroup.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
      cb.addEventListener('change', filterSort);
    });
  }

  // Fetch JSON
  fetch(jsonPath)
    .then(res=>res.json())
    .then(data=>{
      allData = Array.isArray(data)?data:Object.values(data);
      filterSort();
    })
    .catch(err=>console.error('Error fetching', jsonPath, err));
}

// ===== Rarity Order =====
const rarityOrder = { Common:1, Rare:2, Epic:3, Legendary:4, Unique:5 ,Character: 6};

// ===== Initialize Tables =====
initTable('essences','./en-US/essences.json',[
  {key:'image'}, {key:'name',sortable:true}, {key:'description'}, {key:'achievementDescription'}, {key:'rarity',sortable:true}
], rarityOrder);

initTable('memories','./en-US/memories.json',[
  {key:'image'}, {key:'name',sortable:true}, {key:'description'}, {key:'achievementDescription'}, {key:'rarity',sortable:true}
], rarityOrder);

initTable('achievements','./en-US/achievements.json',[
  {key:'image'}, {key:'name',sortable:true}, {key:'description'}
], null, true);
