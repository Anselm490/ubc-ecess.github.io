// Illustrative PUBLIC-ONLY data. Never put private budgets, identities or tokens in frontend code.
const sample = {
  summary: {budget: 50000,spent: 19250,committed: 6250},
  portfolios: [
    {name:'Events',budget:18000,spent:7500},
    {name:'Academic',budget:12000,spent:4200},
    {name:'Social',budget:10000,spent:3900},
    {name:'Operations',budget:10000,spent:3650}
  ],
  events:[{name:'Welcome Event',portfolio:'Events',status:'Finalized',spent:1750},{name:'Technical Workshop',portfolio:'Academic',status:'Finalized',spent:800}],
  reports:[]
};
const money = n => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n);
const content=document.getElementById('content');
function item(label,detail){const row=document.createElement('div');row.className='item';const name=document.createElement('strong');name.textContent=label;const info=document.createElement('span');info.className='muted';info.textContent=detail;row.append(name,info);return row}
function panel(title){const box=document.createElement('section');box.className='card panel';const heading=document.createElement('h2');heading.textContent=title;box.append(heading);return box}
function overview(){const s=sample.summary;const grid=document.createElement('div');grid.className='grid';for(const [label,value] of [['Published budget',s.budget],['Spent',s.spent],['Committed',s.committed],['Remaining',s.budget-s.spent-s.committed]]){const box=document.createElement('div');box.className='card';const a=document.createElement('div');a.className='label';a.textContent=label;const b=document.createElement('div');b.className='amount';b.textContent=money(value);box.append(a,b);grid.append(box)}content.append(grid);const box=panel('Budget utilization');const track=document.createElement('div');track.className='track';const fill=document.createElement('div');fill.className='fill';fill.style.width=`${Math.min(100,s.spent/s.budget*100)}%`;track.append(fill);box.append(track,item('Spent proportion',`${Math.round(s.spent/s.budget*100)}%`));content.append(box)}
function render(view){content.replaceChildren();if(view==='overview'){overview();return}if(view==='portfolios'){const box=panel('Published portfolio summaries');sample.portfolios.forEach(p=>box.append(item(p.name,`${money(p.spent)} spent / ${money(p.budget)} allocated`)));content.append(box);return}if(view==='events'){const box=panel('Published event summaries');sample.events.filter(e=>e.status==='Finalized').forEach(e=>box.append(item(e.name,`${e.portfolio} · ${money(e.spent)}`)));content.append(box);return}const box=panel('Published reports');const msg=document.createElement('p');msg.className='empty';msg.textContent='No approved reports have been published in this prototype.';box.append(msg);content.append(box)}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));render(button.dataset.view)}));render('overview');
