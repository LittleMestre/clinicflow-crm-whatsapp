import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check, CheckCheck, CheckCircle2,
  ChevronDown, CircleAlert, ExternalLink, Filter, HeartPulse, Inbox, LayoutDashboard,
  LockKeyhole, LogOut, Menu, MessageCircle, MoreHorizontal, Plus, Search, Send, Settings2,
  ShieldCheck, Sparkles, TrendingUp, Users, Wallet, X
} from 'lucide-react';
import { api, post, patch, put, currency, clock, dateShort, initials, stages,
  type ChannelData, type Contact, type DashboardData, type Deal, type Message, type Stage, type Thread, type User } from './api';

type Page = 'dashboard' | 'contacts' | 'inbox' | 'pipeline' | 'settings';
const navItems = [
  { key: 'dashboard', title: 'Visão geral', icon: LayoutDashboard },
  { key: 'inbox', title: 'Caixa de entrada', icon: Inbox },
  { key: 'contacts', title: 'Contatos', icon: Users },
  { key: 'pipeline', title: 'Funil de vendas', icon: TrendingUp },
  { key: 'settings', title: 'Configurações', icon: Settings2 }
] as const;
const displayDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

function Avatar({ name, size = 'normal' }: { name: string; size?: 'normal'|'small'|'large' }) {
  const shades = ['violet', 'cyan', 'peach', 'mint', 'pink'];
  const color = shades[(name.charCodeAt(0) || 0) % shades.length];
  return <span className={`avatar avatar-${color} avatar-${size}`}>{initials(name)}</span>;
}
function Brand({ dark = false }: { dark?: boolean }) {
  return <div className={`brand ${dark ? 'brand-dark' : ''}`}><span className="brand-icon"><HeartPulse size={24} strokeWidth={2.6}/></span><span>clinic<span className="brand-accent">flow</span><small>RELATIONSHIP CLOUD</small></span></div>;
}
function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button' }: {children: ReactNode; onClick?: () => void; variant?: 'primary'|'secondary'|'ghost'; disabled?: boolean; type?: 'button'|'submit'}) {
  return <button type={type} className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Spinner() { return <span className="spinner"/>; }
function BlankState({ icon, title, text }: {icon: ReactNode; title: string; text: string}) {
  return <div className="blank"><div className="blank-icon">{icon}</div><strong>{title}</strong><p>{text}</p></div>;
}
function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [register, setRegister] = useState(false);
  const [organization, setOrganization] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await post(register ? '/auth/register' : '/auth/login', {email,password,...(register ? {organization,name} : {})}); onLogin(await api<User>('/auth/me')); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="login-layout">
    <section className="login-showcase">
      <Brand dark/>
      <div className="login-showcase-copy"><div className="overline-light"><Sparkles size={15}/> CRM QUE CONECTA</div>
        <h1>Atendimentos melhores.<br/><em>Relações mais fortes.</em></h1>
        <p>Gerencie contatos, oportunidades e conversas em um só lugar. Seu atendimento merece fluir.</p>
        <div className="login-metrics"><div><strong>360°</strong><span>Visão do cliente</span></div><div><strong>24/7</strong><span>Organização</span></div><div><strong>1 lugar</strong><span>Para sua equipe</span></div></div>
      </div>
      <div className="login-illustration"><div className="float-chat"><MessageCircle size={20}/><span>Olá! Como podemos ajudar?</span></div><div className="float-check"><CheckCircle2 size={16}/> Novo atendimento</div></div>
      <p className="showcase-foot">Uma demonstração de produto full stack • Projeto de portfólio</p>
    </section>
    <section className="login-form-side"><div className="login-card">
      <div className="eyebrow"><span className="green-dot"/> SEU WORKSPACE</div>
      <h2>{register ? 'Crie seu workspace' : 'Bem-vindo de volta'} <span className="wave">✳</span></h2>
      <p className="muted">{register ? 'Comece seu próprio espaço de relacionamento.' : 'Entre com suas credenciais para acessar a plataforma.'}</p>
      <form onSubmit={submit} className="stack-form">
        {register && <><label>Nome da organização<input required minLength={2} maxLength={100} value={organization} onChange={e=>setOrganization(e.target.value)} placeholder="Ex.: Clínica Bem-Estar"/></label><label>Seu nome<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Nome e sobrenome"/></label></>}
        <label>E-mail profissional<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com" /></label>
        <label>Senha {register && '(mínimo 10 caracteres)'}<input type="password" required minLength={register ? 10 : 1} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Digite sua senha"/></label>
        {error && <p className="form-error"><CircleAlert size={16}/>{error}</p>}
        <button className="btn btn-primary login-submit" disabled={busy}>{busy ? <Spinner/> : <>{register ? 'Criar workspace' : 'Entrar no ClinicFlow'} <ArrowRight size={17}/></>}</button>
      </form>
      <button className="auth-switch" onClick={()=>{setRegister(v=>!v);setError('')}}>{register?'Já tem um workspace? Faça login':'Não tem uma conta? Crie seu workspace'} <ArrowRight size={14}/></button>
      {!register && <div className="demo-access"><div><strong><Sparkles size={15}/> Testar demonstração</strong><span>Use dados fictícios para explorar o CRM.</span></div>
        <button onClick={()=>{setEmail('demo@clinicflow.local');setPassword('Demo@12345');}}>Usar conta demo <ArrowRight size={15}/></button></div>}
      <p className="login-fine"><LockKeyhole size={14}/> Acesso protegido por sessão segura</p>
    </div></section>
  </div>;
}

function ContactModal({ initial, close, saved }: {initial?: Contact; close:()=>void; saved:()=>Promise<void>}) {
  const [name,setName] = useState(initial?.name || '');
  const [phone,setPhone] = useState(initial?.phone || '');
  const [email,setEmail] = useState(initial?.email || '');
  const [tags,setTags] = useState(initial?.tags.join(', ') || '');
  const [optedIn,setOptedIn] = useState(initial?.opted_in || false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const submit = async (event:FormEvent) => {
    event.preventDefault();setBusy(true);setError('');
    try {
      const payload = {name,phone,email,tags:tags.split(',').map(x=>x.trim()).filter(Boolean),opted_in:optedIn};
      if (initial) await patch(`/contacts/${initial.id}`,payload); else await post('/contacts',payload);
      await saved();close();
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  };
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" role="dialog" aria-modal="true" aria-label="Contato" onMouseDown={e=>e.stopPropagation()}>
    <div className="modal-head"><div><span className="eyebrow">RELACIONAMENTO</span><h2>{initial?'Editar contato':'Novo contato'}</h2></div><button className="icon-button" onClick={close} aria-label="Fechar"><X size={19}/></button></div>
    <form onSubmit={submit} className="stack-form"><label>Nome completo<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Ana Martins"/></label>
      <label>WhatsApp (com DDI)<input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="5561999999999"/></label>
      <label>E-mail (opcional)<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ana@exemplo.com"/></label>
      <label>Etiquetas (separadas por vírgulas)<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="VIP, Avaliação"/></label>
      <label className="check-row"><input type="checkbox" checked={optedIn} onChange={e=>setOptedIn(e.target.checked)}/><span>Contato autorizou comunicações de atendimento pelo WhatsApp</span></label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><Button variant="secondary" onClick={close}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?<Spinner/>:<><Check size={17}/> Salvar contato</>}</Button></div>
    </form>
  </div></div>;
}
function DealModal({contacts, close, saved}:{contacts:Contact[];close:()=>void;saved:()=>Promise<void>}) {
  const [title,setTitle]=useState('');const [contact,setContact]=useState(contacts[0]?.id||'');const [value,setValue]=useState('');const [stage,setStage]=useState<Stage>('new');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{
    await post('/deals',{title,contact_id:contact,value_cents:Math.round(Number(value.replace(',','.'))*100),stage});await saved();close();
  }catch(err){setError((err as Error).message)}finally{setBusy(false)}};
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
    <div className="modal-head"><div><span className="eyebrow">PIPELINE</span><h2>Nova oportunidade</h2></div><button className="icon-button" onClick={close}><X size={19}/></button></div>
    <form className="stack-form" onSubmit={submit}><label>Título<input required minLength={2} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Pacote de 10 sessões"/></label>
      <label>Contato<select required value={contact} onChange={e=>setContact(e.target.value)}><option value="">Selecione o contato</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Valor estimado (R$)<input type="number" min="0" step="0.01" value={value} required onChange={e=>setValue(e.target.value)} placeholder="500.00"/></label>
      <label>Etapa<select value={stage} onChange={e=>setStage(e.target.value as Stage)}>{stages.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      {error&&<p className="form-error">{error}</p>}
      <div className="modal-actions"><Button variant="secondary" onClick={close}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?<Spinner/>:<><Plus size={17}/> Criar oportunidade</>}</Button></div>
    </form></div></div>;
}

export default function App() {
  const [me,setMe] = useState<User|null|undefined>(undefined);
  const [page,setPage] = useState<Page>('dashboard');
  const [menu,setMenu] = useState(false);
  const [contacts,setContacts] = useState<Contact[]>([]);
  const [deals,setDeals] = useState<Deal[]>([]);
  const [threads,setThreads] = useState<Thread[]>([]);
  const [dashboard,setDashboard] = useState<DashboardData|null>(null);
  const [channel,setChannel] = useState<ChannelData|null>(null);
  const [selected,setSelected] = useState<string|null>(null);
  const [messages,setMessages] = useState<Message[]>([]);
  const [contactModal,setContactModal] = useState<Contact|true|null>(null);
  const [dealModal,setDealModal] = useState(false);
  const [toast,setToast] = useState('');
  const [loading,setLoading] = useState(false);

  useEffect(()=>{api<User>('/auth/me').then(setMe).catch(()=>setMe(null))},[]);
  const refresh = useCallback(async()=>{
    setLoading(true);
    try {
      const [c,d,t,s,ch] = await Promise.all([api<Contact[]>('/contacts'),api<Deal[]>('/deals'),api<Thread[]>('/conversations'),api<DashboardData>('/dashboard'),api<ChannelData>('/settings/whatsapp')]);
      setContacts(c);setDeals(d);setThreads(t);setDashboard(s);setChannel(ch);
      setSelected(current=>current&&t.some(x=>x.id===current)?current:(t[0]?.id||null));
    }catch(err){setToast((err as Error).message);}finally{setLoading(false)}
  },[]);
  useEffect(()=>{if(me)void refresh()},[me,refresh]);
  useEffect(()=>{if(page==='inbox'&&selected){void api<Message[]>(`/conversations/${selected}/messages`).then(setMessages).catch(e=>setToast(e.message));}},[page,selected]);
  useEffect(()=>{if(!toast)return;const timer=window.setTimeout(()=>setToast(''),5500);return()=>window.clearTimeout(timer)},[toast]);
  const navigate=(next:Page)=>{setPage(next);setMenu(false)};
  const selectedThread=threads.find(t=>t.id===selected);
  const month=displayDate.charAt(0).toUpperCase()+displayDate.slice(1);
  const showSuccess=(value:string)=>setToast(value);

  if(me===undefined) return <div className="screen-loader"><Brand/><Spinner/><p>Preparando sua experiência...</p></div>;
  if(me===null) return <Login onLogin={setMe}/>;

  const logout=async()=>{await post('/auth/logout',{});setMe(null)};
  return <div className="app-shell">
    <div className={`mobile-shade ${menu?'mobile-shade-open':''}`} onClick={()=>setMenu(false)} />
    <aside className={`sidebar ${menu?'sidebar-open':''}`}>
      <div className="sidebar-logo"><Brand dark/><button className="mobile-close" onClick={()=>setMenu(false)}><X size={20}/></button></div>
      <div className="workspace-chip"><span className="workspace-icon"><HeartPulse size={18}/></span><span><strong>{me.organization_name}</strong><small>Workspace principal</small></span><ChevronDown size={15}/></div>
      <div className="sidebar-section-label">MENU PRINCIPAL</div>
      <nav className="side-nav">{navItems.map(item=><button key={item.key} className={`nav-link ${page===item.key?'nav-active':''}`} onClick={()=>navigate(item.key)}><item.icon size={19} strokeWidth={1.9}/><span>{item.title}</span>{item.key==='inbox'&&Number(dashboard?.unread)>0&&<span className="nav-counter">{dashboard?.unread}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-upgrade"><div className="upgrade-sparkle"><Sparkles size={19}/></div><strong>Seu CRM, do seu jeito.</strong><p>Organize o atendimento e ofereça uma experiência única.</p><span>Versão de demonstração <ArrowUpRight size={14}/></span></div>
      <button className="sidebar-user" onClick={logout}><Avatar name={me.name}/><span><strong>{me.name}</strong><small>Administrador</small></span><LogOut size={18}/></button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={()=>setMenu(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> <strong>{navItems.find(x=>x.key===page)?.title}</strong></div></div><div className="topbar-actions"><span className="today"><CalendarDays size={16}/>{month}</span><button className="header-icon" aria-label="Notificações" onClick={()=>navigate('inbox')}><Bell size={19}/>{Number(dashboard?.unread)>0&&<i/>}</button><Avatar name={me.name} size="small"/></div></header>
      <div className="page-content">
        {page==='dashboard'&&<>
          <div className="page-heading"><div><span className="eyebrow">VISÃO 360° DO SEU NEGÓCIO</span><h1>Bom ter você aqui, {me.name.split(' ')[0]} <span className="wave">✳</span></h1><p>Acompanhe seus resultados e cuide dos relacionamentos que importam.</p></div><Button onClick={()=>setContactModal(true)}><Plus size={17}/> Novo contato</Button></div>
          {me.demo_mode&&<div className="info-strip"><Sparkles size={18}/><span><strong>Ambiente demonstrativo:</strong> mensagens enviadas por aqui são simuladas e não chegam ao WhatsApp.</span><button onClick={()=>navigate('settings')}>Saiba mais <ArrowRight size={15}/></button></div>}
          <div className="stat-grid">
            <Stat icon={<Users size={21}/>} label="Total de contatos" value={dashboard?.contacts??'—'} detail="Base de relacionamento" iconClass="blue"/>
            <Stat icon={<TrendingUp size={21}/>} label="Negociações ativas" value={dashboard?.open_deals??'—'} detail="Em andamento" iconClass="purple"/>
            <Stat icon={<Wallet size={21}/>} label="Receita conquistada" value={currency(dashboard?.won_cents??0)} detail="Oportunidades ganhas" iconClass="green"/>
            <Stat icon={<MessageCircle size={21}/>} label="Não lidas" value={dashboard?.unread??'—'} detail="Precisam de atenção" iconClass="orange"/>
          </div>
          <div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">DESEMPENHO</span><h2>Novas oportunidades</h2></div><span className="mini-filter"><CalendarDays size={15}/> Últimos 6 meses</span></div>
            <p className="section-intro">Acompanhe a evolução das oportunidades criadas.</p>
            <div className="bar-chart">{(dashboard?.trend||[]).map((item,i)=>{const max=Math.max(1,...(dashboard?.trend||[]).map(x=>x.count));return <div className="bar-group" key={i}><span className="bar-count">{item.count}</span><div className="bar-track"><div className="bar-fill" style={{height:`${Math.max(8,item.count/max*100)}%`}}/></div><span className="bar-label">{item.month}</span></div>})}</div>
          </section><section className="panel recent-panel"><div className="panel-head"><div><span className="eyebrow">EM TEMPO REAL</span><h2>Atividades recentes</h2></div><button className="icon-button" onClick={refresh} title="Atualizar"><Activity size={18}/></button></div>
            <div className="recent-list">{(dashboard?.recent||[]).map(item=><div className="recent-item" key={item.id}><Avatar name={item.contact_name} size="small"/><div><strong>{item.contact_name}</strong><p>{item.body}</p></div><span>{dateShort(item.created_at)}</span></div>)}{!dashboard?.recent?.length&&<BlankState icon={<MessageCircle/>} title="Sem mensagens" text="As conversas aparecerão aqui."/>}</div>
            <button className="text-action" onClick={()=>navigate('inbox')}>Ir para mensagens <ArrowRight size={16}/></button>
          </section></div>
          <section className="panel pipeline-preview"><div className="panel-head"><div><span className="eyebrow">SEU FUNIL</span><h2>Oportunidades em andamento</h2></div><button className="text-action" onClick={()=>navigate('pipeline')}>Ver funil completo <ArrowUpRight size={16}/></button></div>
            <div className="pipeline-summary">{stages.slice(0,4).map(s=><div className="pipeline-preview-step" key={s.id}><span className="stage-dot" style={{background:s.color}}/><strong>{s.label}</strong><b>{dashboard?.stages.find(x=>x.stage===s.id)?.count||0}</b></div>)}</div>
          </section>
        </>}
        {page==='contacts'&&<ContactsPage contacts={contacts} openNew={()=>setContactModal(true)} openEdit={setContactModal} openInbox={id=>{setSelected(id);navigate('inbox')}}/>}
        {page==='pipeline'&&<PipelinePage deals={deals} contacts={contacts} openNew={()=>setDealModal(true)} updated={async(id,stage)=>{try{await patch(`/deals/${id}`,{stage});await refresh();showSuccess('Etapa atualizada com sucesso.')}catch(e){setToast((e as Error).message)}}}/>}
        {page==='inbox'&&<InboxPage threads={threads} selected={selected} select={setSelected} active={selectedThread} messages={messages} onSend={async(body)=>{if(!selected)return;try{const newMessage=await post<Message>(`/conversations/${selected}/messages`,{body});setMessages(m=>[...m,newMessage]);await refresh();showSuccess(newMessage.status==='simulated'?'Mensagem simulada (nenhum envio real).':'Mensagem enviada para a API da Meta.')}catch(e){setToast((e as Error).message);throw e}}} mock={me.demo_mode} openContacts={()=>navigate('contacts')}/>}
        {page==='settings'&&<SettingsPage channel={channel} me={me} refresh={refresh} alert={setToast}/>}
      </div>
    </main>
    {loading&&<span className="sync-dot" title="Sincronizando"/>}
    {toast&&<div className="toast" role="status"><CheckCircle2 size={17}/>{toast}<button onClick={()=>setToast('')}><X size={15}/></button></div>}
    {contactModal&&<ContactModal initial={contactModal===true?undefined:contactModal} close={()=>setContactModal(null)} saved={refresh}/>}
    {dealModal&&<DealModal contacts={contacts} close={()=>setDealModal(false)} saved={refresh}/>}
  </div>;
}

function Stat({icon,label,value,detail,iconClass}:{icon:ReactNode;label:string;value:string|number;detail:string;iconClass:string}) {
  return <div className="stat-card"><div className="stat-upper"><span className={`stat-icon ${iconClass}`}>{icon}</span><ArrowUpRight size={18} className="stat-arrow"/></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-detail"><span className="detail-indicator"/> {detail}</span></div>;
}
function ContactsPage({contacts,openNew,openEdit,openInbox}:{contacts:Contact[];openNew:()=>void;openEdit:(c:Contact)=>void;openInbox:(id:string)=>void}) {
  const [search,setSearch]=useState('');
  const filtered=useMemo(()=>contacts.filter(c=>`${c.name} ${c.phone} ${c.email} ${c.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())),[contacts,search]);
  return <><div className="page-heading"><div><span className="eyebrow">SUA BASE DE CLIENTES</span><h1>Contatos</h1><p>Relacionamentos organizados e informações sempre à mão.</p></div><Button onClick={openNew}><Plus size={17}/> Adicionar contato</Button></div>
    <section className="panel table-panel"><div className="table-toolbar"><div className="toolbar-title"><h2>Todos os contatos</h2><span className="count-pill">{filtered.length} registros</span></div><div className="toolbar-controls"><div className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar contato..." aria-label="Buscar contatos"/></div><span className="outline-control"><Filter size={17}/></span></div></div>
      <div className="table-overflow"><table><thead><tr><th>CONTATO</th><th>WHATSAPP</th><th>ETIQUETAS</th><th>CONSENTIMENTO</th><th>CRIADO EM</th><th/></tr></thead><tbody>
      {filtered.map(c=><tr key={c.id}><td><div className="person-cell"><Avatar name={c.name}/><div><strong>{c.name}</strong><span>{c.email||'Sem e-mail'}</span></div></div></td><td className="mono">+{c.phone}</td><td>{c.tags.slice(0,2).map(t=><span className="tag" key={t}>{t}</span>)}</td><td>{c.opted_in?<span className="status-pill positive"><Check size={13}/> Autorizado</span>:<span className="status-pill neutral">Pendente</span>}</td><td className="muted">{dateShort(c.created_at)}</td><td><div className="table-actions"><button title="Abrir conversa" onClick={()=>openInbox(c.id)}><MessageCircle size={17}/></button><button title="Editar" onClick={()=>openEdit(c)}><MoreHorizontal size={19}/></button></div></td></tr>)}
      </tbody></table></div>
      {!filtered.length&&<BlankState icon={<Users/>} title="Nenhum contato encontrado" text="Cadastre uma pessoa ou altere sua busca."/>}
      <div className="table-footer">Exibindo {filtered.length} de {contacts.length} contatos <span>Dados protegidos por organização <ShieldCheck size={15}/></span></div>
    </section></>;
}
function PipelinePage({deals,contacts,openNew,updated}:{deals:Deal[];contacts:Contact[];openNew:()=>void;updated:(id:string,stage:Stage)=>Promise<void>}) {
  const total=deals.filter(d=>!['lost','won'].includes(d.stage)).reduce((acc,d)=>acc+d.value_cents,0);
  return <><div className="page-heading"><div><span className="eyebrow">OPORTUNIDADES</span><h1>Funil de vendas</h1><p>Transforme potenciais clientes em relacionamentos duradouros.</p></div><Button onClick={openNew} disabled={!contacts.length}><Plus size={17}/> Nova oportunidade</Button></div>
    <div className="pipeline-topline"><span><strong>{deals.length}</strong> oportunidades no total</span><span><strong>{currency(total)}</strong> em negociação</span><span className="muted">Mova os cards alterando sua etapa <ArrowRight size={16}/></span></div>
    <div className="kanban-scroll"><div className="kanban-board">{stages.map(stage=>{const column=deals.filter(d=>d.stage===stage.id);return <section className="kanban-col" key={stage.id}>
      <div className="kanban-header"><span className="stage-dot" style={{background:stage.color}}/><strong>{stage.label}</strong><span>{column.length}</span></div>
      <div className="kanban-body">{column.map(d=><article className="deal-card" key={d.id}><div className="deal-top"><span className="deal-type">OPORTUNIDADE</span><MoreHorizontal size={17}/></div><h3>{d.title}</h3><div className="deal-customer"><Avatar name={d.contact_name} size="small"/>{d.contact_name}</div><div className="deal-bottom"><strong>{currency(d.value_cents)}</strong><select aria-label={`Mover ${d.title} para`} value={d.stage} onChange={e=>void updated(d.id,e.target.value as Stage)}>{stages.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div></article>)}
      {!column.length&&<div className="empty-stage">Nenhuma oportunidade aqui</div>}
      </div></section>})}</div></div>
    </>;
}
function InboxPage({threads,selected,select,active,messages,onSend,mock,openContacts}:{threads:Thread[];selected:string|null;select:(id:string)=>void;active:Thread|undefined;messages:Message[];onSend:(body:string)=>Promise<void>;mock:boolean;openContacts:()=>void}) {
  const [search,setSearch]=useState('');const [draft,setDraft]=useState('');const [sending,setSending]=useState(false);
  const filtered=threads.filter(x=>`${x.name} ${x.phone}`.toLowerCase().includes(search.toLowerCase()));
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!draft.trim()||!active)return;setSending(true);try{await onSend(draft);setDraft('')}catch{/* Parent reports the API error. */}finally{setSending(false)}};
  return <><div className="page-heading"><div><span className="eyebrow">CENTRAL DE CONVERSAS</span><h1>Caixa de entrada</h1><p>Todo contato merece uma ótima conversa.</p></div><span className={`mode-badge ${mock?'mock':''}`}><span className="green-dot"/>{mock?'Modo demonstração':'Integração ativa'}</span></div>
    <div className="inbox-layout panel"><div className="threads-pane"><div className="threads-head"><h2>Mensagens</h2><span className="count-pill">{threads.length}</span></div><div className="threads-search"><Search size={17}/><input placeholder="Buscar conversas..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="threads-list">{filtered.map(t=><button key={t.id} className={`thread ${selected===t.id?'thread-active':''}`} onClick={()=>select(t.id)}><Avatar name={t.name}/><div className="thread-info"><div><strong>{t.name}</strong><span>{t.last_at?clock(t.last_at):'Novo'}</span></div><p>{t.last_message}</p></div>{t.unread>0&&<b className="unread-bubble">{t.unread}</b>}</button>)}
        {!filtered.length&&<BlankState icon={<MessageCircle/>} title="Sem conversas" text="Novas mensagens recebidas aparecerão aqui."/>}</div>
    </div><div className="chat-pane">{active?<><div className="chat-head"><Avatar name={active.name}/><div><h2>{active.name}</h2><span>+{active.phone} · WhatsApp</span></div><div className="chat-head-right"><span className="chat-channel"><MessageCircle size={15}/> WhatsApp</span><MoreHorizontal size={20}/></div></div>
      <div className="chat-messages"><div className="chat-date-chip">Histórico recente</div>{messages.map(m=><div key={m.id} className={`bubble-wrap ${m.direction==='outbound'?'bubble-right':''}`}><div className={`message-bubble ${m.direction==='outbound'?'outbound':''}`}><p>{m.body}</p><small>{clock(m.created_at)} {m.status==='simulated'?<span>• simulado</span>:m.direction==='outbound'?<CheckCheck size={13}/>:null}</small></div></div>)}
      {!messages.length&&<BlankState icon={<MessageCircle/>} title="Conversa sem mensagens" text="Envie uma mensagem de demonstração para começar."/>}</div>
      <form className="chat-composer" onSubmit={submit}><div className="composer-box"><input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={4096} placeholder={active.opted_in?'Escreva sua mensagem...':'Consentimento pendente (edite o contato)'} disabled={!active.opted_in||sending}/><button disabled={!draft.trim()||sending||!active.opted_in} aria-label="Enviar mensagem"><Send size={18}/></button></div><span><ShieldCheck size={13}/>{mock?'Mensagens simuladas — nenhuma mensagem real é enviada.':'Mensagens reais sujeitas à janela de atendimento de 24 horas.'}</span></form>
    </>:<BlankState icon={<MessageCircle/>} title="Selecione uma conversa" text="Escolha alguém na lista para visualizar o histórico."/>}</div></div>
    <p className="under-note">Não encontrou uma conversa? <button onClick={openContacts}>Ver sua lista de contatos <ArrowRight size={14}/></button></p>
    </>;
}
function SettingsPage({channel,me,refresh,alert}:{channel:ChannelData|null;me:User;refresh:()=>Promise<void>;alert:(message:string)=>void}) {
  const [phoneId,setPhoneId]=useState('');const [displayNumber,setDisplayNumber]=useState('');const [token,setToken]=useState('');const [busy,setBusy]=useState(false);
  const save=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await put('/settings/whatsapp',{phone_number_id:phoneId,display_number:displayNumber,access_token:token});setToken('');await refresh();alert('Configuração salva com token criptografado.')}catch(err){alert((err as Error).message)}finally{setBusy(false)}};
  const disconnect=async()=>{if(!window.confirm('Desconectar a conta de WhatsApp desta organização?'))return;try{await api('/settings/whatsapp',{method:'DELETE'});await refresh();alert('WhatsApp desconectado.')}catch(e){alert((e as Error).message)}};
  return <><div className="page-heading"><div><span className="eyebrow">PERSONALIZE SEU ESPAÇO</span><h1>Configurações</h1><p>Gerencie suas integrações e preferências com segurança.</p></div></div>
    <div className="settings-grid"><section className="panel settings-panel"><div className="integration-header"><div className="whatsapp-logo"><MessageCircle size={26}/></div><div><h2>WhatsApp Business Cloud API</h2><p>Conecte seu número comercial oficial.</p></div><span className={`status-pill ${channel?.connected?'positive':'neutral'}`}>{channel?.connected?'Configurado':'Não conectado'}</span></div>
      <div className="mode-notice"><CircleAlert size={18}/><div><strong>Modo atual: {channel?.mode==='mock'?'Demonstração':'Envio real'}</strong><p>{channel?.mode==='mock'?'Nenhum envio chega aos contatos. Altere WHATSAPP_MODE=live no servidor depois da configuração.':'Mensagens podem ser enviadas para contatos autorizados. A Meta pode cobrar por mensagens.'}</p></div></div>
      {channel?.connected&&<div className="connected-box"><CheckCircle2 size={20}/><div><strong>Canal configurado</strong><p>ID: {channel.channel?.phone_number_id} {channel.channel?.display_number&&`· ${channel.channel.display_number}`}</p></div><button onClick={disconnect}>Desconectar</button></div>}
      {me.role==='admin'&&<form className="stack-form settings-form" onSubmit={save}><h3>{channel?.connected?'Atualizar credenciais':'Conectar WhatsApp'}</h3>
        <label>Phone Number ID<input required minLength={6} value={phoneId} onChange={e=>setPhoneId(e.target.value)} placeholder="ID numérico na Meta"/></label>
        <label>Número de exibição (opcional)<input value={displayNumber} onChange={e=>setDisplayNumber(e.target.value)} placeholder="+55 61 99999-9999"/></label>
        <label>Access Token da Meta<input required type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="Cole o token de acesso seguro"/></label>
        <p className="tiny-note"><LockKeyhole size={14}/> Token armazenado criptografado no servidor e nunca retornado para o navegador.</p>
        <Button type="submit" disabled={busy}>{busy?<Spinner/>:<><CheckCircle2 size={16}/> Salvar integração</>}</Button>
      </form>}
    </section><section className="settings-side"><div className="panel settings-card"><div className="settings-icon"><ShieldCheck size={21}/></div><h3>Segurança em primeiro lugar</h3><p>Dados isolados por organização, sessões protegidas e validação criptográfica de webhooks.</p></div>
      <div className="panel settings-card"><div className="settings-icon lavender"><MessageCircle size={21}/></div><h3>Como ativar de verdade?</h3><ol><li>Crie um app no Meta for Developers.</li><li>Configure o WhatsApp Business Cloud API.</li><li>Cadastre o número e o token ao lado.</li><li>Configure o webhook público HTTPS e o segredo do app no backend.</li></ol><a href="https://developers.facebook.com/docs/whatsapp/cloud-api/" target="_blank" rel="noreferrer">Documentação da Meta <ExternalLink size={14}/></a></div>
      <div className="panel settings-card"><div className="settings-icon sky"><Activity size={21}/></div><h3>Sobre o projeto</h3><p>ClinicFlow é um projeto demonstrativo de portfólio. Não é um software homologado para informações médicas sensíveis.</p></div></section></div>
  </>;
}
