import { catalog, labels } from "./catalog.js";
import { apiBase } from "./config.js";

const view = document.querySelector("#view");
const feedback = document.querySelector("#feedback");
const navigation = document.querySelector("#navigation");
const editor = document.querySelector("#editor");
const groups = [["材料與廠商",["materials","in","out","vendors"]],["工地行政",["petty_cash","equipment","equipment_loans"]]];
const kinds = { material_id:"material", vendor_id:"vendor", equipment_id:"tool" };
const reference = { material:"materials", vendor:"vendors", tool:"equipment" };
const payments = ["未請款","對帳中","已結清"];
const day = () => new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Taipei"}).format(new Date());
let key = sessionStorage.getItem("civilsite-editor") || "";
let serial = 0;
let state = {};
const escape = value => String(value ?? "").replace(/[&<>"']/g, char =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
const pathFor = (section="", id="", action="") => "#/" + [section,id,action].filter(Boolean).join("/");
const readable = count => Number(count).toLocaleString("zh-TW",{maximumFractionDigits:3});
const currency = cents => "NT$ " + (Number(cents)/100).toLocaleString("zh-TW",{minimumFractionDigits:2,maximumFractionDigits:2});
const alert = (message, error=false) => {
  feedback.innerHTML = message ? '<div class="alert alert-' + (error?"danger":"success") + '">' + escape(message) + '</div>' : "";
};
async function api(endpoint, method="GET", data) {
  const headers = {};
  if (method !== "GET" && key) headers.Authorization = "Bearer " + key;
  if (data) headers["Content-Type"] = "application/json";
  const response = await fetch(apiBase + "/api/" + endpoint,{method,headers,body:data ? JSON.stringify(data) : undefined});
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "操作未成功。");
  return value;
}
function attributeLabel(module, column) {
  return module.fields.find(field=>field.key===column)?.label || labels[column] || column;
}
function link(label, href, className="") {
  return '<a class="' + className + '" href="' + href + '">' + escape(label) + '</a>';
}
function title(text, action="") {
  return '<div class="page-head"><h1>' + escape(text) + '</h1>' + action + '</div>';
}
function panel(text, content) {
  return '<section class="panel"><div class="panel-head"><h2>' + escape(text) + '</h2></div>' + content + '</section>';
}
function loanState(row) {
  return row.returned ? "已歸還" : row.due_day < day() ? "已逾期" : "借用中";
}
function textValue(row, column) {
  if (column==="loan_state") return loanState(row);
  if (column==="total") return currency((BigInt(row.qty)*BigInt(row.price)+500n)/1000n);
  if (["qty","balance","safety"].includes(column)) return readable(row[column]/1000) + (column==="qty" ? " "+row.unit : "");
  if (["amount","price"].includes(column)) return currency(row[column]);
  return row[column] || "—";
}
function display(row, column, section) {
  const value = textValue(row,column);
  if (column==="loan_state") {
    const colors = {"已逾期":"danger","借用中":"pending","已歸還":"success"};
    return '<span class="pill ' + colors[value] + '">' + value + '</span>';
  }
  if (column==="document" && section==="in") return link(value,pathFor(section,row.id));
  return escape(value);
}
function stockIndicator(row) {
  return row.balance < row.safety ? '<span class="pill danger">低庫存</span>' : '<span class="pill">正常</span>';
}
function rowActions(section,row) {
  const actions = [
    link("查看",pathFor(section,row.id)),
    key ? link("修改",pathFor(section,row.id,"edit")) : "",
    key && section==="equipment_loans" && !row.returned ? '<button class="text-button" data-action="return" data-id="'+row.id+'">歸還</button>' : "",
    key ? '<button class="text-button danger-text" data-action="delete" data-id="'+row.id+'">刪除</button>' : "",
  ];
  return actions.filter(Boolean).join(" ");
}
function table(section, rows, columns, withActions=true) {
  const module = catalog[section];
  const stateCell = section === "materials";
  const heading = columns.map(col=>"<th scope='col'>"+escape(attributeLabel(module,col))+"</th>").join("") +
    (stateCell ? "<th>狀態</th>" : "") + (withActions ? "<th>操作</th>" : "");
  const body = rows.map(row=>"<tr>"+columns.map(col=>"<td>"+display(row,col,section)+"</td>").join("")+
    (stateCell?"<td>"+stockIndicator(row)+"</td>":"")+(withActions?'<td class="actions">'+rowActions(section,row)+"</td>":"")+"</tr>").join("");
  const empty="<tr><td class='empty' colspan='"+(columns.length+Number(stateCell)+Number(withActions))+"'>沒有符合條件的資料。</td></tr>";
  return '<div class="table-responsive"><table class="table"><thead><tr>'+heading+"</tr></thead><tbody>"+(body||empty)+"</tbody></table></div>";
}
function nav(section) {
  navigation.innerHTML = link("工地總覽",pathFor(),section ? "" : "active") + groups.map(([label,list])=>
    '<details class="nav-group" open><summary>'+label+'</summary><div class="nav-items">'+list.map(item=>
      link(catalog[item].title,pathFor(item),item===section?"active":"")).join("")+"</div></details>").join("");
  navigation.querySelector("a.active")?.setAttribute("aria-current","page");
  document.body.classList.toggle("administration",groups[1][1].includes(section));
}
document.querySelector("#nav-toggle").onclick = event => {
  event.currentTarget.setAttribute("aria-expanded",String(navigation.classList.toggle("is-open")));
};
function editorControl() {
  editor.innerHTML = key
    ? '<button type="button" class="btn btn-outline-secondary" id="leave">結束編輯</button>'
    : '<form id="unlock" class="filter-actions"><input type="password" name="key" aria-label="編輯金鑰" autocomplete="off" placeholder="編輯金鑰" required><button class="btn btn-outline-secondary">啟用編輯</button></form>';
  editor.querySelector("#leave")?.addEventListener("click",()=>{key="";sessionStorage.removeItem("civilsite-editor");render();});
  editor.querySelector("#unlock")?.addEventListener("submit",async event=>{
    event.preventDefault();
    key = new FormData(event.currentTarget).get("key").trim();
    try { await api("editor","POST"); sessionStorage.setItem("civilsite-editor",key); alert("已啟用編輯。"); render(); }
    catch(error) {key="";alert(error.message,true);}
  });
}
async function dashboard() {
  const [stock,vendors,cash,loans,recent] = await Promise.all(["materials","vendors","petty_cash","equipment_loans","in"].map(section=>api(section)));
  const cards = [
    ["材料品項",stock.length+" 項","materials",""],
    ["低庫存材料",stock.filter(row=>row.balance<row.safety).length+" 項","materials","warning-metric"],
    ["協力廠商",vendors.length+" 家","vendors","vendor-metric"],
    ["本月零用金",currency(cash.filter(row=>row.day.startsWith(day().slice(0,7))).reduce((total,row)=>total+row.amount,0)),"petty_cash","cash-metric"],
    ["逾期未歸還",loans.filter(row=>loanState(row)==="已逾期").length+" 筆","equipment_loans","overdue-metric"],
  ];
  const stats = cards.map(([label,value,section,css])=>'<a class="'+css+'" href="'+pathFor(section)+'"><span>'+label+'</span><strong class="amount">'+escape(value)+"</strong></a>").join("");
  return title("工地總覽",key?link("登錄進貨",pathFor("in","new"),"btn btn-primary"):"") + '<div class="metrics">'+stats+"</div>"+
    panel("材料庫存",table("materials",stock.slice(0,8),["name","spec","balance","safety","unit"],false))+
    panel("近期進貨",table("in",recent.slice(0,5),["day","document","material","vendor","total","payment"],false));
}
function selectOptions(items, value, empty) {
  return '<option value="">'+escape(empty)+'</option>'+items.map(([id,label]) =>
    '<option value="'+escape(id)+'"'+(String(id)===String(value)?" selected":"")+'>'+escape(label)+'</option>').join("");
}
async function choices(kind) {
  return (await api(reference[kind])).map(record=>[record.id, record.name +
    (kind==="material" && record.spec ? "・"+record.spec : kind==="tool" ? "・"+record.code : "")]);
}
async function filterOptions(module, rows) {
  const filters = module.filters;
  return Object.fromEntries(await Promise.all(filters.map(async k=>{
    if (kinds[k]) return [k,await choices(kinds[k])];
    if (k==="payment") return [k,payments.map(x=>[x,x])];
    if (k==="loan_state") return [k,["借用中","已逾期","已歸還"].map(x=>[x,x])];
    return [k,[...new Set(rows.map(row=>row[k]).filter(value=>value!=null))].sort().map(x=>[x,x])];
  })));
}
function passes(row,module,values) {
  const search=String(values.q||"").trim().toLowerCase();
  if (search && !module.search.some(k=>String(row[k]??"").toLowerCase().includes(search))) return false;
  return module.filters.every(k=>{
    const value=values[k];
    if (!value) return true;
    if (k==="month") return row.day.startsWith(value);
    if (k==="from_day") return row.day >= value;
    if (k==="to_day") return row.day <= value;
    if (k==="loan_state") return loanState(row)===value;
    return String(row[k])===value;
  });
}
function results(section,rows) {
  let total="";
  if (section==="petty_cash") total="｜支出合計 "+currency(rows.reduce((sum,row)=>sum+row.amount,0));
  if (section==="materials") total="｜低庫存 "+rows.filter(row=>row.balance<row.safety).length+" 項";
  return panel("查詢結果（"+rows.length+" 筆）"+total,table(section,rows,catalog[section].columns));
}
async function listing(section) {
  const module=catalog[section];
  const rows=await api(section);
  const options=await filterOptions(module,rows);
  const controls=module.filters.map(k=>{
    const type = {month:"month",from_day:"date",to_day:"date"}[k];
    return "<label>"+escape(labels[k])+(type?'<input class="form-control" type="'+type+'" name="'+k+'">':
      '<select class="form-select" name="'+k+'">'+selectOptions(options[k],"","全部")+"</select>")+"</label>";
  }).join("");
  const action = key ? link(section==="equipment_loans"?"登錄借出":"新增"+module.singular,pathFor(section,"new"),"btn btn-primary") : "";
  return { rows, html:title(module.title,action)+'<form id="query" class="panel filters"><label>關鍵字<input class="form-control" type="search" name="q"></label>'+
    controls+'<div class="filter-actions"><button class="btn btn-primary">查詢</button><button class="btn btn-outline-secondary" type="reset">清除</button></div></form><div id="results">'+results(section,rows)+"</div>" };
}
async function detail(section,id) {
  const module=catalog[section], row=await api(section+"/"+id);
  let fields=module.fields.map(field=>[field.label,
    {material_id:"material",vendor_id:"vendor",equipment_id:"tool",status:"state"}[field.key]||field.key]);
  if(section==="in") fields.push(["金額","total"]);
  if(section==="materials") fields.push(["現有庫存","balance"]);
  if(section==="equipment_loans") fields.push(["借還狀態","loan_state"]);
  const blocks=fields.map(([label,col])=>{
    const warning=section==="materials" && col==="balance" ? " "+escape(row.unit)+" "+stockIndicator(row) : "";
    return "<div><dt>"+escape(label)+"</dt><dd>"+display(row,col,section)+warning+"</dd></div>";
  }).join("");
  let related="";
  if(section==="vendors") {
    const records=(await api("in")).filter(record=>record.vendor_id===row.id);
    related=panel("關聯進貨單據",table("in",records,["day","document","material","total","payment"],false));
  }
  return link("返回"+module.title,pathFor(section),"back")+title(module.singular+"明細")+
    '<section class="panel detail"><dl>'+blocks+'</dl><div class="detail-actions">'+rowActions(section,row)+'</div></section>'+related;
}
async function recordForm(section,id) {
  const module=catalog[section], creating=id==="new";
  const record=creating?{}:await api(section+"/"+id);
  const fields=module.fields.filter(f=>!creating||section!=="equipment_loans"||f.key!=="returned");
  const controls=await Promise.all(fields.map(async field=>{
    const { key:name,label,kind,required }=field;
    let value=record[name]??(["day","start_day"].includes(name)?day():"");
    if (record[name]!=null && kind==="quantity") value=record[name]/1000;
    if (record[name]!=null && kind==="money") value=record[name]/100;
    const attrs=' name="'+name+'" id="field-'+name+'"'+(required?" required":"");
    let input;
    if (reference[kind]||kind==="select") {
      const entries=kind==="select"?field.choices.map(option=>[option,option]):await choices(kind);
      input='<select class="form-select"'+attrs+'>'+selectOptions(entries,value,"請選擇")+"</select>";
    } else if(kind==="textarea") input='<textarea class="form-control" rows="4" maxlength="2000"'+attrs+'>'+escape(value)+'</textarea>';
    else {
      const type={quantity:"number",money:"number",tax:"text"}[kind]||kind;
      const rules=kind==="quantity"?' step="0.001" min="'+(name==="qty"?"0.001":"0")+'"':
        kind==="money"?' step="0.01" min="'+(name==="amount"?"0.01":"0")+'"':kind==="tax"?' pattern="[0-9]{8}"':"";
      input='<input class="form-control" type="'+type+'"'+attrs+rules+' value="'+escape(value)+'">';
    }
    return '<div'+(kind==="textarea"?' class="wide"':'')+'><label class="form-label" for="field-'+name+'">'+escape(label)+'</label>'+input+'</div>';
  }));
  return link("返回"+module.title,pathFor(section),"back")+title((creating?"新增":"修改")+module.singular)+
    '<form id="record" class="panel entry"><div class="form-grid">'+controls.join("")+
    '</div><div class="detail-actions"><button class="btn btn-primary">儲存</button>'+link("取消",pathFor(section),"btn btn-outline-secondary")+'</div></form>';
}
async function render() {
  const current=++serial;
  const [section="",id,action]=(location.hash||"#/").slice(2).split("/");
  state={section,id};
  nav(section);
  editorControl();
  view.textContent="載入中…";
  try {
    let html, rows;
    if(!section) html=await dashboard();
    else if(!catalog[section]) throw new Error("找不到此功能。");
    else if(id==="new"||action==="edit") {
      if(!key) throw new Error("請先輸入編輯金鑰。");
      html=await recordForm(section,id);
    } else if(id) html=await detail(section,id);
    else ({html,rows}=await listing(section));
    if(current!==serial) return;
    state.rows=rows;
    view.innerHTML=html;
  } catch(error) {
    if(current===serial) {view.textContent="";alert(error.message,true);}
  }
}
view.addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.target;
  const values=Object.fromEntries(new FormData(form));
  const {section,id,rows}=state;
  if(form.id==="query") {
    view.querySelector("#results").innerHTML=results(section,rows.filter(row=>passes(row,catalog[section],values)));
  } else if(form.id==="record") {
    const button=form.querySelector("button");
    button.disabled=true;
    try {
      const saved=await api(section+(id==="new"?"":"/"+id),id==="new"?"POST":"PUT",values);
      alert("已儲存。");location.hash=pathFor(section,saved.id);
    } catch(error) {alert(error.message,true);button.disabled=false;}
  }
});
view.addEventListener("reset",event=>{
  if(event.target.id==="query") view.querySelector("#results").innerHTML=results(state.section,state.rows);
});
view.addEventListener("click",async event=>{
  const button=event.target.closest("[data-action]");
  if(!button) return;
  const {action,id}=button.dataset, section=state.section;
  if(action==="delete"&&!confirm("確定要刪除這筆資料？")) return;
  button.disabled=true;
  try {
    await api(section+"/"+id+(action==="return"?"/return":""),action==="return"?"POST":"DELETE");
    alert(action==="return"?"機具已歸還。":"已刪除。");
    if(action==="delete"&&state.id) location.hash=pathFor(section);
    else render();
  } catch(error) {alert(error.message,true);button.disabled=false;}
});
window.addEventListener("hashchange",()=>{
  navigation.classList.remove("is-open");
  document.querySelector("#nav-toggle").setAttribute("aria-expanded","false");
  render();
});
render();
