import {useEffect,useState} from 'react'
import {createClient} from '@supabase/supabase-js'
import {SUPABASE_URL,SUPABASE_KEY,WHATSAPP} from './config'
const sb=createClient(SUPABASE_URL,SUPABASE_KEY)
const money=(l:any)=>l.price_on_request||!l.price?'Precio a consultar':'Bs '+Number(l.price).toLocaleString('es-BO')
const wa=(t:string)=>`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`
const useHash=()=>{const [h,s]=useState(location.hash.slice(1)||'/');useEffect(()=>{const f=()=>{s(location.hash.slice(1)||'/');scrollTo(0,0)};addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);return h}
const FIELDS:any={ganado:['Raza','Sexo','Edad','Cantidad','Peso aproximado','Procedencia','Estado sanitario'],
equinos:['Raza','Sexo','Edad','Color','Altura','Registro','Padre','Madre','Aptitud','Estado sanitario'],
propiedades:['Superficie (ha)','Acceso','Agua','Energía eléctrica','Vivienda','Corrales','Potreros','Documentación']}
const STATES=['borrador','pendiente','cambios','aprobada','rechazada','reservada','vendida','archivada']
const PUB=['aprobada','reservada','vendida']
const DEPS=['Santa Cruz','Beni','Pando','Cochabamba','La Paz','Chuquisaca','Tarija','Oruro','Potosí']

function Card({l}:any){const ph=(l.listing_media||[]).filter((x:any)=>x.kind=='foto');const m=ph.find((x:any)=>x.is_main)||ph[0]
return <a className="card" href={'#/oferta/'+l.id}>{m?<img src={m.url} alt={l.title}/>:<div className="noimg"/>}<div>
{l.verified&&<span className="ver">✓ Verificada por Oriente Agro</span>}<h3>{l.title}</h3><div>{l.location}</div><div className="price">{money(l)}</div>{l.status!='aprobada'&&<b>{l.status.toUpperCase()}</b>}</div></a>}

function Home({cats}:any){const [f,setF]=useState<any[]>([]);const [q,setQ]=useState('')
useEffect(()=>{sb.from('listings').select('*,listing_media(*)').eq('featured',true).in('status',PUB).limit(6).then(r=>setF(r.data||[]))},[])
return <><div className="hero"><h1>ORIENTE AGRO SHOPING</h1><p>Ganado · Equinos · Propiedades Agropecuarias</p>
<div className="search"><input placeholder="¿Qué estás buscando?" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn alt" onClick={()=>location.hash='/catalogo?q='+encodeURIComponent(q)}>Buscar</button></div>
<a className="btn" href="#/catalogo">Ver ofertas</a> <a className="btn line" href="#/publicar">Publicar una oferta</a></div>
<div className="wrap"><div className="cats">{cats.map((c:any)=><a key={c.id} className="cat" href={'#/catalogo?cat='+c.slug}>{c.name}</a>)}</div>
<h2 style={{margin:'36px 0 16px'}}>Ofertas destacadas</h2><div className="grid">{f.map(l=><Card key={l.id} l={l}/>)}</div>{!f.length&&<p>Pronto verás aquí las mejores oportunidades.</p>}
<div className="note" style={{marginTop:36,textAlign:'center'}}><h3>¿Quieres vender?</h3><p>Envía tu oferta. La revisamos y te contactamos por WhatsApp.</p><a className="btn" href="#/publicar">Publicar una oferta</a></div></div></>}

function Catalog({cats,params}:any){const [rows,setRows]=useState<any[]>([]);const [cat,setCat]=useState(params.get('cat')||'');const [q,setQ]=useState(params.get('q')||'');const [dep,setDep]=useState('');const [sub,setSub]=useState('')
const c=cats.find((x:any)=>x.slug==cat)
useEffect(()=>{let r=sb.from('listings').select('*,listing_media(*)').in('status',PUB).order('featured',{ascending:false}).order('created_at',{ascending:false})
if(c)r=r.eq('category_id',c.id);if(sub)r=r.eq('subcategory_id',sub);if(dep)r=r.eq('department',dep);if(q)r=r.or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
r.then(x=>setRows(x.data||[]))},[cat,q,dep,sub,cats.length])
return <div className="wrap"><h2>Ofertas</h2><div className="two" style={{margin:'12px 0'}}>
<select value={cat} onChange={e=>{setCat(e.target.value);setSub('')}}><option value="">Todas las categorías</option>{cats.map((x:any)=><option key={x.id} value={x.slug}>{x.name}</option>)}</select>
<select value={sub} onChange={e=>setSub(e.target.value)}><option value="">Todas las subcategorías</option>{(c?.subcategories||[]).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
<select value={dep} onChange={e=>setDep(e.target.value)}><option value="">Todos los departamentos</option>{DEPS.map(d=><option key={d}>{d}</option>)}</select>
<input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)}/></div>
<div className="grid">{rows.map(l=><Card key={l.id} l={l}/>)}</div>{!rows.length&&<p>No hay ofertas con esos filtros.</p>}</div>}

function Detail({id}:any){const [l,setL]=useState<any>(null)
useEffect(()=>{sb.from('listings').select('*,listing_media(*)').eq('id',id).single().then(r=>setL(r.data))},[id])
if(!l)return <div className="wrap">Cargando...</div>
const ph=l.listing_media.filter((m:any)=>m.kind=='foto'),vd=l.listing_media.filter((m:any)=>m.kind=='video'),main=ph.find((m:any)=>m.is_main)||ph[0]
return <div className="wrap">{l.verified&&<span className="ver">✓ PUBLICACIÓN VERIFICADA POR ORIENTE AGRO</span>}<h1>{l.title}</h1>
{main&&<img className="main" src={main.url}/>}<div className="gal" style={{margin:'8px 0'}}>{ph.map((m:any)=><img key={m.id} src={m.url}/>)}{vd.map((m:any)=><video key={m.id} src={m.url} controls/>)}</div>
<p className="price">{money(l)}</p><p>{l.location}{l.department?', '+l.department:''}</p><p>{l.description}</p>
<table><tbody>{Object.entries(l.details||{}).filter(([,v]:any)=>v).map(([k,v]:any)=><tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
<p className="note">La verificación indica que Oriente Agro revisó la oferta y habló con el vendedor. No es garantía sobre la operación, la propiedad o el estado del animal.</p>
<a className="btn" href={wa(`Hola, estoy interesado en "${l.title}" publicado en Oriente Agro SHOPING. Quisiera recibir más información.`)} target="_blank">Consultar por WhatsApp</a> <a className="btn alt" href={'#/interes?l='+l.id}>Dejar mis datos</a></div>}

function Publish({cats}:any){const [cid,setCid]=useState('');const [f,setF]=useState<any>({});const [d,setD]=useState<any>({});const [photos,setP]=useState<File[]>([]);const [video,setV]=useState<File|null>(null);const [msg,setM]=useState('');const [busy,setB]=useState(false)
const c=cats.find((x:any)=>x.id==cid);const set=(k:string,v:any)=>setF({...f,[k]:v})
const pickVideo=(file?:File)=>{if(!file)return setV(null);const v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>{if(v.duration>20.5||file.size>40e6){setM('El video debe durar máximo 20 segundos (y pesar menos de 40 MB).');setV(null)}else{setM('');setV(file)}};v.src=URL.createObjectURL(file)}
async function send(){if(!c||!f.title||!f.seller_name||!f.seller_phone)return setM('Completa categoría, título, tu nombre y tu WhatsApp.');if(!photos.length)return setM('Agrega al menos una foto.')
setB(true);setM('');const id=crypto.randomUUID()
const a=await sb.from('listings').insert({id,category_id:c.id,subcategory_id:f.subcategory_id||null,title:f.title,description:f.description,price:f.price_on_request?null:(f.price||null),price_on_request:!!f.price_on_request,location:f.location,department:f.department,details:d,status:'pendiente'})
if(a.error){setB(false);return setM('Error: '+a.error.message)}
await sb.from('seller_contacts').insert({listing_id:id,name:f.seller_name,phone:f.seller_phone})
const files=[...photos.map(x=>({x,k:'foto'})),...(video?[{x:video,k:'video'}]:[])]
for(let i=0;i<files.length;i++){const {x,k}=files[i];const p=`${id}/${i}-${Date.now()}.${x.name.split('.').pop()}`;const u=await sb.storage.from('listings').upload(p,x)
if(!u.error)await sb.from('listing_media').insert({listing_id:id,kind:k,url:sb.storage.from('listings').getPublicUrl(p).data.publicUrl,is_main:i==0})}
setB(false);setM('ok')}
if(msg=='ok')return <div className="wrap"><h2>¡Oferta enviada!</h2><p>Oriente Agro la revisará y te contactará por WhatsApp.</p><a className="btn" href="#/">Volver al inicio</a></div>
return <div className="wrap" style={{maxWidth:700}}><h2>Publicar una oferta</h2><p>No necesitas cuenta. Tu oferta se publica después de ser revisada.</p>
<label>Categoría</label><select value={cid} onChange={e=>{setCid(e.target.value);setD({})}}><option value="">Elige...</option>{cats.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
{c&&<><label>Subcategoría</label><select onChange={e=>set('subcategory_id',e.target.value)}><option value="">Elige...</option>{c.subcategories.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
<label>Título</label><input onChange={e=>set('title',e.target.value)}/>
<div className="two">{(FIELDS[c.slug]||[]).map((k:string)=><div key={k}><label>{k}</label><input onChange={e=>setD({...d,[k]:e.target.value})}/></div>)}</div>
<div className="two"><div><label>Precio (Bs)</label><input type="number" disabled={f.price_on_request} onChange={e=>set('price',e.target.value)}/></div><div><label>&nbsp;</label><label><input type="checkbox" style={{width:'auto'}} onChange={e=>set('price_on_request',e.target.checked)}/> Precio a consultar</label></div>
<div><label>Ubicación</label><input onChange={e=>set('location',e.target.value)}/></div><div><label>Departamento</label><select onChange={e=>set('department',e.target.value)}><option value="">Elige...</option>{DEPS.map(x=><option key={x}>{x}</option>)}</select></div></div>
<label>Descripción</label><textarea rows={4} onChange={e=>set('description',e.target.value)}/>
<label>Fotos (la primera será la principal)</label><input type="file" accept="image/*" multiple onChange={e=>setP(Array.from(e.target.files||[]))}/>
<label>Video (opcional, máximo 20 segundos)</label><input type="file" accept="video/*" onChange={e=>pickVideo(e.target.files?.[0])}/>
<div className="two"><div><label>Tu nombre</label><input onChange={e=>set('seller_name',e.target.value)}/></div><div><label>Tu WhatsApp</label><input onChange={e=>set('seller_phone',e.target.value)}/></div></div>
{msg&&<p style={{color:'#9b2c2c'}}>{msg}</p>}<br/><button className="btn" disabled={busy} onClick={send}>{busy?'Enviando...':'Enviar oferta'}</button></>}</div>}

function Interest({cats,params}:any){const [f,setF]=useState<any>({});const [ok,setOk]=useState(false);const [err,setE]=useState('')
async function send(){if(!f.name||!f.phone)return setE('Escribe tu nombre y WhatsApp.');const r=await sb.from('leads').insert({...f,listing_id:params.get('l')||null,budget:f.budget||null,category_id:f.category_id||null});r.error?setE(r.error.message):setOk(true)}
if(ok)return <div className="wrap"><h2>¡Gracias!</h2><p>Oriente Agro te contactará pronto.</p></div>
const s=(k:string)=>(e:any)=>setF({...f,[k]:e.target.value})
return <div className="wrap" style={{maxWidth:600}}><h2>Quiero comprar</h2><label>Nombre</label><input onChange={s('name')}/><label>WhatsApp</label><input onChange={s('phone')}/>
<div className="two"><div><label>Ciudad</label><input onChange={s('city')}/></div><div><label>Departamento</label><select onChange={s('department')}><option value="">Elige...</option>{DEPS.map(x=><option key={x}>{x}</option>)}</select></div></div>
<label>¿Qué buscas?</label><input onChange={s('looking_for')}/><label>Categoría</label><select onChange={s('category_id')}><option value="">Elige...</option>{cats.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
<label>Presupuesto aproximado (Bs)</label><input type="number" onChange={s('budget')}/><label>Mensaje</label><textarea rows={3} onChange={s('message')}/>{err&&<p style={{color:'#9b2c2c'}}>{err}</p>}<br/><button className="btn" onClick={send}>Enviar mis datos</button></div>}

function Login({go}:any){const [e,setE]=useState('');const [p,setP]=useState('');const [m,setM]=useState('')
return <div className="wrap" style={{maxWidth:380}}><h2>Ingreso del equipo</h2><label>Correo</label><input value={e} onChange={x=>setE(x.target.value)}/><label>Contraseña</label><input type="password" value={p} onChange={x=>setP(x.target.value)}/>
{m&&<p style={{color:'#9b2c2c'}}>{m}</p>}<br/><button className="btn" onClick={async()=>{const r=await sb.auth.signInWithPassword({email:e,password:p});r.error?setM('Correo o contraseña incorrectos'):go()}}>Entrar</button></div>}

function Admin({me,out}:any){const [tab,setTab]=useState('ofertas');const [rows,setR]=useState<any[]>([]);const [st,setSt]=useState('pendiente');const [leads,setL]=useState<any[]>([]);const [users,setU]=useState<any[]>([]);const [nu,setNu]=useState<any>({role:'staff'});const [m,setM]=useState('')
const adm=me.role=='admin'
const load=()=>{sb.from('listings').select('*,seller_contacts(name,phone),listing_media(url,kind)').eq('status',st).order('created_at',{ascending:false}).then(r=>setR(r.data||[]))
sb.from('leads').select('*,listings(title)').order('created_at',{ascending:false}).then(r=>setL(r.data||[]));if(adm)sb.from('profiles').select('*').then(r=>setU(r.data||[]))}
useEffect(load,[st,tab])
const upd=async(id:string,v:any)=>{await sb.from('listings').update(v).eq('id',id);load()}
async function setStatus(l:any,s:string){const v:any={status:s};if(s=='vendida'){const p=prompt('Precio final de venta (Bs):');const c=prompt('Comisión de Oriente Agro (Bs):');v.sold_price=p?Number(p):null;v.commission=c?Number(c):null}
if(s=='aprobada')v.verified=true;if(s=='cambios'||s=='rechazada'){const n=prompt('Nota interna:');if(n)v.admin_notes=n};upd(l.id,v)}
async function createUser(){const c2=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false}});const r=await c2.auth.signUp({email:nu.email,password:nu.password,options:{data:{name:nu.name}}})
if(r.error||!r.data.user)return setM(r.error?.message||'No se pudo crear');await sb.from('profiles').update({role:nu.role,name:nu.name}).eq('id',r.data.user.id);setM('Usuario creado.');load()}
return <div className="wrap"><div className="tabs">{['ofertas','leads',...(adm?['usuarios']:[])].map(t=><button key={t} className={'btn '+(tab==t?'on':'')} onClick={()=>setTab(t)}>{t}</button>)}<button className="btn red" onClick={out}>Salir</button></div>
{tab=='ofertas'&&<><select value={st} onChange={e=>setSt(e.target.value)}>{STATES.map(s=><option key={s}>{s}</option>)}</select><br/><br/>
<table><tbody>{rows.map(l=>{const sc=Array.isArray(l.seller_contacts)?l.seller_contacts[0]:l.seller_contacts;return <tr key={l.id}><td><a href={'#/oferta/'+l.id}><b>{l.title}</b></a><br/>{money(l)} · {l.location}<br/>{(l.listing_media||[]).length} archivos{l.status=='vendida'&&<><br/>Vendida Bs {l.sold_price} · Comisión Bs {l.commission}</>}</td>
<td>{sc?.name}<br/>{sc?.phone&&<a href={`https://wa.me/${sc.phone.replace(/\D/g,'')}?text=${encodeURIComponent('Hola, te escribimos de Oriente Agro SHOPING por tu oferta: '+l.title)}`} target="_blank">WhatsApp vendedor</a>}</td>
<td><select value={l.status} onChange={e=>setStatus(l,e.target.value)}>{STATES.map(s=><option key={s}>{s}</option>)}</select><br/><label><input type="checkbox" style={{width:'auto'}} checked={l.featured} onChange={e=>upd(l.id,{featured:e.target.checked})}/> Destacada</label>
{adm&&<button className="btn red sm" onClick={async()=>{if(confirm('¿Eliminar?')){await sb.from('listings').delete().eq('id',l.id);load()}}}>Eliminar</button>}</td></tr>})}</tbody></table>{!rows.length&&<p>Sin ofertas en este estado.</p>}</>}
{tab=='leads'&&<table><tbody>{leads.map(l=><tr key={l.id}><td><b>{l.name}</b><br/><a href={`https://wa.me/${l.phone.replace(/\D/g,'')}`} target="_blank">{l.phone}</a><br/>{l.city} {l.department}</td><td>{l.looking_for}<br/>{l.budget&&'Bs '+l.budget}<br/>{l.message}<br/>{l.listings?.title}</td>
<td><select value={l.status} onChange={async e=>{await sb.from('leads').update({status:e.target.value}).eq('id',l.id);load()}}>{['nuevo','contactado','negociacion','cerrado','no_interesado'].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>}
{tab=='usuarios'&&adm&&<><h3>Crear usuario</h3><div className="two"><input placeholder="Nombre" onChange={e=>setNu({...nu,name:e.target.value})}/><input placeholder="Correo" onChange={e=>setNu({...nu,email:e.target.value})}/><input placeholder="Contraseña (mín. 6)" type="password" onChange={e=>setNu({...nu,password:e.target.value})}/>
<select onChange={e=>setNu({...nu,role:e.target.value})}><option value="staff">Empleado</option><option value="admin">Administrador</option></select></div><br/><button className="btn" onClick={createUser}>Crear usuario</button> {m}
<table><tbody>{users.map(u=><tr key={u.id}><td>{u.name}<br/>{u.email}</td><td><select value={u.role} onChange={async e=>{await sb.from('profiles').update({role:e.target.value}).eq('id',u.id);load()}}>{['admin','staff','sin_acceso'].map(r=><option key={r}>{r}</option>)}</select></td></tr>)}</tbody></table></>}</div>}

export default function App(){const h=useHash();const [path,qs]=h.split('?');const params=new URLSearchParams(qs||'');const [cats,setC]=useState<any[]>([]);const [me,setMe]=useState<any>(null)
const who=async()=>{const {data}=await sb.auth.getUser();if(!data.user)return setMe(null);const r=await sb.from('profiles').select('*').eq('id',data.user.id).single();setMe(r.data)}
useEffect(()=>{sb.from('categories').select('*,subcategories(*)').order('position').then(r=>setC(r.data||[]));who()},[])
const out=async()=>{await sb.auth.signOut();setMe(null);location.hash='/'}
let page:any;if(path.startsWith('/oferta/'))page=<Detail id={path.split('/')[2]}/>;else if(path=='/catalogo')page=<Catalog key={h} cats={cats} params={params}/>;else if(path=='/publicar')page=<Publish cats={cats}/>;else if(path=='/interes')page=<Interest cats={cats} params={params}/>
else if(path=='/login')page=<Login go={async()=>{await who();location.hash='/admin'}}/>;else if(path=='/admin')page=me&&me.role!='sin_acceso'?<Admin me={me} out={out}/>:<div className="wrap">Inicia sesión con una cuenta autorizada. <a href="#/login">Ingresar</a></div>;else page=<Home cats={cats}/>
return <><header><a className="logo" href="#/">ORIENTE <span>AGRO</span> SHOPING</a><nav><a href="#/catalogo">Ofertas</a><a href="#/publicar">Vender</a><a href="#/interes">Quiero comprar</a><a href={me?'#/admin':'#/login'}>{me?'Panel':'Ingresar'}</a></nav></header>{page}
<a className="wa" href={wa('Hola, quisiera información sobre Oriente Agro SHOPING.')} target="_blank">WhatsApp</a></>