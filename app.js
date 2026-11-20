const $ = (id) => document.getElementById(id);
const storeKey = "vayro_demo_v1";
const defaultState = { trips: [], commission: 15, radius: 5, driver: {name:"", car:"", online:false} };
let state;
try { state = {...defaultState, ...JSON.parse(localStorage.getItem(storeKey) || "{}")}; }
catch { state = {...defaultState}; }
const rates = {
  economy:{base:0.8, km:0.18, minute:0.025, multiplier:1},
  business:{base:1.4, km:0.27, minute:0.035, multiplier:1.15},
  vip:{base:2.2, km:0.36, minute:0.045, multiplier:1.35},
  family:{base:1.5, km:0.29, minute:0.04, multiplier:1.2},
  luxury:{base:3.0, km:0.5, minute:0.06, multiplier:1.6}
};
const vehicleNames={economy:"اقتصادي",business:"رجال أعمال",vip:"VIP",family:"عائلي — 7 ركاب",luxury:"سيارات فاخرة"};
function save(){localStorage.setItem(storeKey,JSON.stringify(state));}
function currency(){return $("country").value==="BH"?"BHD":"JOD";}
function estimate(){
  const r=rates[$("vehicle").value], km=Math.max(0,Number($("distance").value)||0), mins=Math.max(0,Number($("duration").value)||0);
  const amount=(r.base+km*r.km+mins*r.minute)*r.multiplier;
  const rounded=Math.ceil(amount*1000)/1000;
  $("price").innerHTML=`${rounded.toFixed(3)} <small>${currency()}</small>`;
  $("price-note").textContent=`${km} كم · ${mins} دقيقة · ${vehicleNames[$("vehicle").value]}`;
  return rounded;
}
["country","vehicle","distance","duration"].forEach(id=>$(id).addEventListener("input",estimate));
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b===btn));
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===btn.dataset.view));
  render();
}));
$("booking-form").addEventListener("submit",e=>{
  e.preventDefault();
  const trip={id:Date.now(),pickup:$("pickup").value.trim(),destination:$("destination").value.trim(),country:$("country").value,currency:currency(),vehicle:$("vehicle").value,amount:estimate(),payment:$("payment").value,status:"طلب جديد",created:new Date().toISOString()};
  state.trips.unshift(trip);save();$("booking-result").classList.remove("hidden");
  $("booking-result").textContent=`تم تسجيل طلب تجريبي رقم ${String(trip.id).slice(-6)}. هذه نسخة عرض محلية؛ لم يتم إرسال سائق فعلي أو تحصيل أي مبلغ.`;
  render();
});
$("online-toggle").addEventListener("change",e=>{state.driver.online=e.target.checked;save();render();});
$("save-driver").addEventListener("click",()=>{state.driver.name=$("driver-name").value.trim();state.driver.car=$("car-number").value.trim();save();render();alert("تم حفظ بيانات السائق على هذا الجهاز.");});
$("save-settings").addEventListener("click",()=>{state.commission=Math.min(100,Math.max(0,Number($("commission").value)||0));state.radius=Math.max(1,Number($("radius").value)||5);save();render();alert("تم حفظ الإعدادات التجريبية.");});
function money(n,c){return `${Number(n).toFixed(3)} ${c}`;}
function tripRow(t){return `<div class="trip"><div><b>${escapeHtml(t.pickup)} ← ${escapeHtml(t.destination)}</b><div class="muted">${vehicleNames[t.vehicle]} · ${t.payment==="cash"?"نقداً":"إلكتروني"} · ${t.status}</div></div><strong>${money(t.amount,t.currency)}</strong></div>`;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){
  $("driver-name").value=state.driver.name||"";$("car-number").value=state.driver.car||"";
  $("online-toggle").checked=!!state.driver.online;
  $("driver-status").textContent=state.driver.online?"متصل — يستقبل الطلبات":"غير متصل";
  $("driver-status").className=`status ${state.driver.online?"online":"offline"}`;
  const list=state.trips.length?state.trips.map(tripRow).join(""):"لا توجد رحلات بعد.";
  $("customer-trips").innerHTML=list;$("admin-trips").innerHTML=list;
  $("driver-requests").innerHTML=state.trips.length?state.trips.filter(t=>t.status==="طلب جديد").map(t=>`<div class="trip"><div><b>${escapeHtml(t.pickup)} ← ${escapeHtml(t.destination)}</b><div class="muted">${vehicleNames[t.vehicle]} · ${money(t.amount,t.currency)}</div></div><button class="secondary accept" data-id="${t.id}">قبول</button></div>`).join(""):"لا توجد طلبات جديدة حالياً.";
  document.querySelectorAll(".accept").forEach(b=>b.addEventListener("click",()=>{const t=state.trips.find(x=>x.id===Number(b.dataset.id));if(t){t.status="قبلها السائق";save();render();}}));
  const total=state.trips.reduce((s,t)=>s+t.amount,0);
  $("stat-trips").textContent=state.trips.length;$("stat-revenue").textContent=total.toFixed(3);
  $("stat-commission").textContent=(total*state.commission/100).toFixed(3);
  $("commission").value=state.commission;$("radius").value=state.radius;
}
$("year").textContent=new Date().getFullYear();estimate();render();
