// PHASE 2 DEMO: synthetic data only. No actual ECESS amounts, names, or private records.
// The shapes below mirror Master Budget (portfolio allocations) and Expenses
// (separate Portfolio, Event, Purchase, Amount fields).
let demoBudget = [
  {portfolio:'Administration',allocated:7000},
  {portfolio:'Academic',allocated:6000},
  {portfolio:'Student Life',allocated:6500},
  {portfolio:'External',allocated:8500}
];
let demoExpenses = [
  {id:'DEMO-001',portfolio:'Administration',event:'Lounge',purchase:'Room supplies',amount:240},
  {id:'DEMO-002',portfolio:'Administration',event:'Lounge',purchase:'Equipment',amount:460},
  {id:'DEMO-003',portfolio:'Academic',event:'Workshop',purchase:'Materials',amount:375},
  {id:'DEMO-004',portfolio:'Academic',event:'Workshop',purchase:'Refreshments',amount:125},
  {id:'DEMO-005',portfolio:'Student Life',event:'Welcome Event',purchase:'Venue booking',amount:1200},
  {id:'DEMO-006',portfolio:'Student Life',event:'Welcome Event',purchase:'Decorations',amount:300},
  {id:'DEMO-007',portfolio:'External',event:'Industry Mixer',purchase:'Catering',amount:950},
  {id:'DEMO-008',portfolio:'External',event:'Industry Mixer',purchase:'Printing',amount:150}
];
const money = n => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(n);
const content = document.getElementById('content');
const sum = rows => rows.reduce((total,row)=>total+row.amount,0);
let portfolios = [];
let totalBudget = 0;
let totalSpent = 0;
function recalculate(){portfolios=demoBudget.map(p=>({...p,spent:sum(demoExpenses.filter(e=>e.portfolio===p.portfolio))}));totalBudget=portfolios.reduce((a,p)=>a+p.allocated,0);totalSpent=sum(demoExpenses)}
recalculate();
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
function panel(title){const x=el('section','card panel');x.append(el('h2','',title));return x}
function row(label,detail){const x=el('div','item');x.append(el('strong','',label),el('span','muted',detail));return x}
function cards(entries){const g=el('div','grid');for(const [label,value] of entries){const c=el('div','card');c.append(el('div','label',label),el('div','amount',money(value)));g.append(c)}content.append(g)}
function overview(){cards([['Allocated budget',totalBudget],['Recorded expenses',totalSpent],['Remaining budget',totalBudget-totalSpent],['Events with expenses',new Set(demoExpenses.map(e=>e.portfolio+'|'+e.event)).size]]);
  // The last metric is a count, not a currency amount.
  const last=content.querySelector('.grid .card:last-child .amount');last.textContent=String(new Set(demoExpenses.map(e=>e.portfolio+'|'+e.event)).size);
  const box=panel('How the numbers connect');box.append(row('Master Budget → Allocated',money(totalBudget)),row('Expenses → Recorded spending',money(totalSpent)),row('Calculated → Remaining',money(totalBudget-totalSpent)));box.append(el('p','muted','Demo calculation: remaining = allocated − recorded expenses. Commitments and revenue are not included in this preview.'));content.append(box);
  const p=panel('Portfolio breakdown');portfolios.forEach(x=>p.append(row(x.portfolio,`${money(x.spent)} spent · ${money(x.allocated-x.spent)} remaining`)));content.append(p)}
function portfolioView(){const p=panel('Select a portfolio');const selector=el('select','finance-select');selector.setAttribute('aria-label','Portfolio');demoBudget.forEach(x=>{const o=el('option','',x.portfolio);o.value=x.portfolio;selector.append(o)});p.append(selector);const detail=el('div');p.append(detail);function update(){detail.replaceChildren();const x=portfolios.find(y=>y.portfolio===selector.value);detail.append(row('Allocated budget',money(x.allocated)),row('Recorded expenses',money(x.spent)),row('Remaining budget',money(x.allocated-x.spent)));const events=[...new Set(demoExpenses.filter(e=>e.portfolio===x.portfolio).map(e=>e.event))];for(const name of events){const items=demoExpenses.filter(e=>e.portfolio===x.portfolio&&e.event===name);detail.append(row(name,`${items.length} transactions · ${money(sum(items))}`))}}selector.addEventListener('change',update);update();content.append(p)}
function eventView(){const p=panel('Event expenses (demo)');const groups=new Map();for(const x of demoExpenses){const k=x.portfolio+' / '+x.event;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}for(const [key,items] of groups){const section=el('details','event-detail');const summary=el('summary','',`${key} — ${money(sum(items))}`);section.append(summary);items.forEach(e=>section.append(row(e.purchase,`${e.id} · ${money(e.amount)}`)));p.append(section)}content.append(p)}
function reports(){const p=panel('Published reports');p.append(el('p','muted','No approved public reports are connected. This preview uses synthetic data only.'));content.append(p)}
function render(view){content.replaceChildren();({overview,portfolios:portfolioView,events:eventView,reports}[view]||overview)()}
let activeView='overview';
const refreshButton=document.getElementById('refresh-data');
const syncStatus=document.getElementById('sync-status');
// Leave blank for synthetic local demo. Only use an Apps Script endpoint that returns
// approved, non-sensitive public data. Never paste a private sheet URL or API key here.
const DATA_ENDPOINT = "https://script.google.com/macros/s/AKfycbybwljYPkbWXv6HnSfSeSjsizsNMKleDfrHzlitms_COKcSWRYo_oWcnpfXq_OFjZ-uGw/exec";
function validatePayload(payload){
  if(!payload||payload.visibility!=='public-demo'||!Array.isArray(payload.budgets)||!Array.isArray(payload.expenses))throw new Error('Unexpected or unapproved data format');
  if(payload.budgets.length>500||payload.expenses.length>10000)throw new Error('Dataset exceeds preview limits');
  const budgets=payload.budgets.map(p=>{if(typeof p.portfolio!=='string'||!p.portfolio.trim()||!Number.isFinite(p.allocated)||p.allocated<0)throw new Error('Invalid budget');return {portfolio:p.portfolio,allocated:p.allocated}});
  const expenses=payload.expenses.map(e=>{if(!['id','portfolio','event','purchase'].every(k=>typeof e[k]==='string')||!Number.isFinite(e.amount)||e.amount<0)throw new Error('Invalid expense');return {id:e.id,portfolio:e.portfolio,event:e.event,purchase:e.purchase,amount:e.amount}});
  return {budgets,expenses};
}
async function refreshData(){
  if(!DATA_ENDPOINT){syncStatus.textContent='Local fictional data · No endpoint configured';return}
  refreshButton.disabled=true;syncStatus.textContent='Updating…';
  try{
    const url=new URL(DATA_ENDPOINT);url.searchParams.set('cacheBust',String(Date.now()));
    const response=await fetch(url.toString(),{cache:'no-store',redirect:'follow'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const payload=validatePayload(await response.json());
    demoBudget=payload.budgets;demoExpenses=payload.expenses;recalculate();render(activeView);
    syncStatus.textContent='Last updated: '+new Date().toLocaleString('en-CA');
  }catch(error){console.error('Finance data refresh failed:',error);syncStatus.textContent='Update failed · Showing last successfully loaded data';}
  finally{refreshButton.disabled=false}
}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{activeView=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));render(activeView)}));
refreshButton.addEventListener('click',refreshData);
render(activeView);
refreshData();
