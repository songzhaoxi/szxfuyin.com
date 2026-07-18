// ===== 福音传播爱 - 管理后台JS =====
const A=''; let D={categories:[],banners:[],videos:[],speakers:[]}, pi=1, ps=15;

function $(id){return document.getElementById(id)}
function msg(s){const t=$('toast');t.textContent=s;t.style.display='block';setTimeout(()=>t.style.display='none',2500);}

async function api(path,opts){
  try{
    const r=await fetch(A+'/api'+path,{headers:{'Content-Type':'application/json'},...opts});
    return await r.json();
  }catch(e){msg('网络错误: '+e.message);return null}
}

async function loadData(){
  const r=await api('/data');
  if(r&&r.success){D=r.data;renderAll()}
}
function renderAll(){renderStats();renderCatChart();lv();rc();rs();rb();}
function st(id){
  document.querySelectorAll('.tc').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.sidebar nav a').forEach(e=>e.classList.remove('active'));
  document.getElementById('t'+id).classList.add('active');
  document.querySelectorAll('.sidebar nav a')[id].classList.add('active');
  const titles=['📊 总览','🎬 视频管理','📂 分类管理','🎤 讲员管理','🖼️ Banner管理','📥 批量导入'];
  $('pt').textContent=titles[id];
}

function renderStats(){
  const vs=D.videos||[], cs=D.categories||[], ss=D.speakers||[];
  $('sc').innerHTML=`
    <div class="stat-card"><div class="num">${vs.length}</div><div class="label">🎬 视频总数</div></div>
    <div class="stat-card"><div class="num">${cs.length}</div><div class="label">📂 分类数</div></div>
    <div class="stat-card"><div class="num">${ss.length}</div><div class="label">🎤 讲员数</div></div>
    <div class="stat-card"><div class="num">${(D.banners||[]).length}</div><div class="label">🖼️ Banner数</div></div>`;
}

function renderCatChart(){
  const stats={};
  D.categories.forEach(c=>stats[c.id]=0);
  D.videos.forEach(v=>{if(stats[v.c]!==undefined)stats[v.c]++});
  let h='<div style="display:flex;flex-wrap:wrap;gap:8px;">';
  D.categories.forEach(c=>{
    const n=stats[c.id]||0;
    const p=D.videos.length?Math.round(n/D.videos.length*100):0;
    h+=`<div style="flex:1;min-width:100px;background:#fdf3e0;border-radius:6px;padding:10px;">
      <div style="font-size:11px;color:#6b5a4a;">${c.icon||'📁'} ${c.name}</div>
      <div style="font-size:18px;font-weight:700;color:#3d1f05;">${n}</div>
      <div style="height:4px;background:#e8d5b0;border-radius:2px;margin-top:4px;">
        <div style="height:100%;background:#c8973a;border-radius:2px;width:${p}%;"></div>
      </div>
    </div>`;
  });
  h+='</div>';
  $('cc').innerHTML=h;
}

// ===== 视频管理 =====
function lv(pg){
  if(pg!==undefined)pi=pg;
  const cat=$('cf').value, q=$('si').value;
  let url=`/videos?page=${pi}&limit=${ps}`;
  if(cat!=='all')url+=`&category=${cat}`;
  if(q)url+=`&search=${encodeURIComponent(q)}`;
  api(url).then(r=>{
    if(!r||!r.success)return;
    const vs=r.data, pg=r.pagination;
    let h='';
    vs.forEach(v=>{
      h+=`<tr><td>${v.id}</td>
        <td><strong>${v.t}</strong></td>
        <td>${D.categories.find(c=>c.id===v.c)?.name||v.c}</td>
        <td>${v.dur||'-'}</td>
        <td>${v.v||'-'}</td>
        <td>
          <button class="btn-e" onclick="oe(${v.id})">✏️</button>
          <button class="btn-d" onclick="dv(${v.id})">🗑️</button>
        </td></tr>`;
    });
    $('vt').innerHTML=h||'<tr><td colspan="6" style="text-align:center;color:#8a7a6a;">暂无视频</td></tr>';
    // 分页
    let ph='';
    if(pg.page>1)ph+=`<button onclick="lv(${pg.page-1})">◀</button>`;
    ph+=`<span>${pg.page}/${pg.totalPages||1}</span>`;
    if(pg.hasMore)ph+=`<button onclick="lv(${pg.page+1})">▶</button>`;
    $('vp').innerHTML=ph;
  });
  // 更新分类筛选
  const sel=$('cf');
  if(sel.options.length<=1){
    D.categories.forEach(c=>{
      const o=document.createElement('option');
      o.value=c.id;o.textContent=c.name;
      sel.appendChild(o);
    });
  }
}

function oa(){$('mt').textContent='添加视频';$('fe').value='';$('f0').value='';$('f2').value='';$('f3').value='';$('f4').value='';$('f5').value='';$('f6').value='';$('f7').value='';
  const sel=$('f1');sel.innerHTML='';
  D.categories.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;sel.appendChild(o)});
  $('m0').classList.add('show');
}
function oe(id){
  const v=D.videos.find(x=>x.id===id);if(!v)return;
  $('mt').textContent='编辑视频';$('fe').value=id;
  $('f0').value=v.t;$('f2').value=v.ytid||'';$('f3').value=v.bvid||'';$('f4').value=v.desc||'';$('f5').value=v.v||'';$('f6').value=v.dur||'';$('f7').value=(v.tags||[]).join(',');
  const sel=$('f1');sel.innerHTML='';
  D.categories.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;if(c.id===v.c)o.selected=true;sel.appendChild(o)});
  $('m0').classList.add('show');
}
async function sv(){
  const id=$('fe').value;
  const body={t:$('f0').value,c:$('f1').value,ytid:$('f2').value,bvid:$('f3').value,desc:$('f4').value,v:$('f5').value,dur:$('f6').value,tags:$('f7').value.split(',').filter(x=>x.trim())};
  if(!body.t||!body.c){msg('标题和分类必填');return;}
  const r=id?await api('/videos/'+id,{method:'PUT',body:JSON.stringify(body)}):await api('/videos',{method:'POST',body:JSON.stringify(body)});
  if(r&&r.success){msg(id?'更新成功':'添加成功');cm('m0');loadData();}else msg(r?.message||'失败');
}
async function dv(id){
  if(!confirm('确定删除该视频？'))return;
  const r=await api('/videos/'+id,{method:'DELETE'});
  if(r&&r.success){msg('删除成功');loadData();}
}

// ===== 分类管理 =====
function rc(){
  let h='';
  D.categories.forEach(c=>{
    const n=(D.videos||[]).filter(v=>v.c===c.id).length;
    h+=`<tr><td>${c.id}</td><td>${c.icon||''} ${c.name}</td><td>${c.icon||'-'}</td><td>${c.desc||'-'}</td>
      <td>${n}</td>
      <td><button class="btn-d" onclick="dc('${c.id}')">🗑️</button></td></tr>`;
  });
  $('ct').innerHTML=h||'<tr><td colspan="6" style="text-align:center;">暂无分类</td></tr>';
}
function oac(){$('c0').value='';$('c1').value='';$('c2').value='';$('c3').value='';$('m1').classList.add('show');}
async function sc(){
  const body={id:$('c0').value,name:$('c1').value,icon:$('c2').value,desc:$('c3').value};
  if(!body.id||!body.name){msg('ID和名称必填');return;}
  D.categories.push(body);
  const ok=await api('/data',{method:'PUT',body:JSON.stringify(D)});
  if(ok){msg('添加成功');cm('m1');loadData();}
}
async function dc(id){if(!confirm('删除分类？'))return;D.categories=D.categories.filter(c=>c.id!==id);await api('/data',{method:'PUT',body:JSON.stringify(D)});msg('已删除');loadData();}

// ===== 讲员管理 =====
function rs(){
  $('st').innerHTML=(D.speakers||[]).map(s=>
    `<tr><td>${s.name}</td><td>${s.title||'-'}</td><td>${s.desc||'-'}</td>
      <td><button class="btn-d" onclick="ds('${s.name}')">🗑️</button></td></tr>`
  ).join('')||'<tr><td colspan="4" style="text-align:center;">暂无讲员</td></tr>';
}
function oas(){$('s0').value='';$('s1').value='';$('s2').value='';$('m2').classList.add('show');}
async function ss(){
  D.speakers.push({name:$('s0').value,title:$('s1').value,desc:$('s2').value});
  await api('/data',{method:'PUT',body:JSON.stringify(D)});msg('添加成功');cm('m2');loadData();
}
async function ds(n){if(!confirm('删除？'))return;D.speakers=D.speakers.filter(s=>s.name!==n);await api('/data',{method:'PUT',body:JSON.stringify(D)});msg('已删除');loadData();}

// ===== Banner管理 =====
function rb(){
  $('bt').innerHTML=(D.banners||[]).map((b,i)=>
    `<tr><td>${b.t}</td><td>${b.s||'-'}</td><td>${b.ytid}</td>
      <td><button class="btn-d" onclick="db(${i})">🗑️</button></td></tr>`
  ).join('')||'<tr><td colspan="4" style="text-align:center;">暂无Banner</td></tr>';
}
function oab(){$('b0').value='';$('b1').value='';$('b2').value='';$('m3').classList.add('show');}
async function sb(){
  D.banners.push({t:$('b0').value,s:$('b1').value,ytid:$('b2').value});
  await api('/data',{method:'PUT',body:JSON.stringify(D)});msg('添加成功');cm('m3');loadData();
}
async function db(i){if(!confirm('删除？'))return;D.banners.splice(i,1);await api('/data',{method:'PUT',body:JSON.stringify(D)});msg('已删除');loadData();}

async function bi(){
  try{
    const arr=JSON.parse($('ij').value);
    if(!Array.isArray(arr)||!arr.length){$('ir').textContent='❌ 请输入有效的JSON数组';return;}
    // 先添加到本地
    let maxId=D.videos.reduce((m,v)=>Math.max(m,v.id||0),0);
    arr.forEach(v=>{if(v.t&&v.c){maxId++;D.videos.push({...v,id:maxId})}});
    // 保存
    const r=await api('/videos/batch',{method:'POST',body:JSON.stringify({videos:arr})});
    if(r&&r.success){$('ir').innerHTML=`✅ 成功导入 ${r.count||arr.length} 个视频！`;loadData();}else msg('导入失败');
  }catch(e){$('ir').textContent='❌ JSON解析错误: '+e.message;}
}

function cm(id){document.getElementById(id).classList.remove('show');}

// 添加数据更新API（用于直接保存全部数据）
async function saveAllData(){
  const r=await api('/data',{method:'PUT',body:JSON.stringify(D)});
  return r&&r.success;
}

// 初始化
loadData();
