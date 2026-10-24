const MASTER = "150612";
let users = JSON.parse(localStorage.getItem('users_pro')) || [
    {email:"admin@prospecta.com", senha:"admin123", adm:true}, 
    {email:"cliente@teste.com", senha:"1234", adm:false}
];

function irLogin() { document.getElementById('vendas').style.display = 'none'; document.getElementById('login').style.display = 'block'; }
function irVendas() { document.getElementById('login').style.display = 'none'; document.getElementById('vendas').style.display = 'block'; }
function sair() { localStorage.removeItem('logado'); document.getElementById('app').style.display = 'none'; irVendas(); }

function entrar() {
    let email = document.getElementById('l-email').value;
    let senha = document.getElementById('l-senha').value;
    let cod = document.getElementById('l-cod').value;
    let u = users.find(x => x.email === email && x.senha === senha);
    
    if (u) {
        if (cod === MASTER) u.adm = true;
        else if (u.email === "admin@prospecta.com") { alert("Código Admin incorreto."); return; }
        localStorage.setItem('logado', JSON.stringify(u));
        app(u);
    } else {
        alert("E-mail ou senha incorretos!");
    }
}

function app(u) {
    document.getElementById('vendas').style.display = 'none'; 
    document.getElementById('login').style.display = 'none'; 
    document.getElementById('app').style.display = 'block';
    document.getElementById('t-a').style.display = (u && u.adm) ? 'block' : 'none';
}

window.onload = function() {
    let l = JSON.parse(localStorage.getItem('logado'));
    if (l) app(l); else document.getElementById('vendas').style.display = 'block';
    att(); listaUsers();
};

function aba(a) {
    document.getElementById('v-b').style.display = a === 'b' ? 'block' : 'none';
    document.getElementById('v-g').style.display = a === 'g' ? 'block' : 'none';
    document.getElementById('v-a').style.display = a === 'a' ? 'block' : 'none';
    document.getElementById('t-b').className = a === 'b' ? 'tab on' : 'tab';
    document.getElementById('t-g').className = a === 'g' ? 'tab on' : 'tab';
    document.getElementById('t-a').className = a === 'a' ? 'tab on' : 'tab';
}

// ADMIN
function addUser() {
    let e = document.getElementById('a-email').value;
    let s = document.getElementById('a-senha').value;
    if (!e || !s) return alert("Preencha tudo!");
    if (users.some(x => x.email === e)) return alert("E-mail já existe!");
    users.push({email: e, senha: s, adm: false}); 
    localStorage.setItem('users_pro', JSON.stringify(users));
    listaUsers(); alert("Adicionado!");
}
function removerUser(email) { 
    if(confirm("Remover?")) { 
        users = users.filter(x => x.email !== email); 
        localStorage.setItem('users_pro', JSON.stringify(users)); 
        listaUsers(); 
    } 
}
function listaUsers() {
    let l = document.getElementById('users'); if (!l) return;
    l.innerHTML = users.map(u => `<div class="adm-card"><div><strong>${u.email}</strong><br>Senha: ${u.senha}</div>${!u.adm ? `<button class="btn-remover" onclick="removerUser('${u.email}')">Remover</button>` : ''}</div>`).join('');
}

// BUSCADOR
let salvos = JSON.parse(localStorage.getItem('salvos_pro')) || [];
function buscar() {
    let c = document.getElementById('cidade').value;
    let s = document.getElementById('seg').value;
    let r = document.getElementById('res');
    if (!c) return alert("Digite uma cidade!");
    
    r.innerHTML = '<p class="msg-vazia">📍 Buscando...</p>';
    
    fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(c) + '&format=json&limit=1')
    .then(res => res.json()).then(g => {
        if (g.length === 0) throw new Error("Cidade não encontrada");
        let tag = s === 'restaurant' ? 'amenity=restaurant' : 'shop=hairdresser';
        r.innerHTML = '<p class="msg-vazia">🔍 Buscando...</p>';
        return fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(`[out:json][timeout:15];(node[${tag}](around:3000,${g[0].lat},${g[0].lon});way[${tag}](around:3000,${g[0].lat},${g[0].lon}););out center 50;`) });
    }).then(res => res.json()).then(d => {
        if (!d.elements || d.elements.length === 0) { 
            r.innerHTML = '<p class="msg-vazia">Nada encontrado.</p>'; return; 
        }
        r.innerHTML = '';
        d.elements.filter(x => x.tags && x.tags.name).forEach(x => {
            let tem = x.tags.website || x.tags['contact:website'];
            let fone = x.tags.phone || x.tags['contact:phone'] || 'Não informado';
            let end = x.tags['addr:street'] || 'Não detalhado';
            let div = document.createElement('div'); div.className = 'card';
            div.innerHTML = `<h4>${x.tags.name}</h4><p>📍 ${end}</p><p>📞 ${fone}</p><span class="badge ${tem ? 'com' : 'sem'}">${tem ? '✅ Site' : '🔥 Sem site'}</span><br><button class="btn-s" onclick='salvar(${JSON.stringify(JSON.stringify(x.tags))})'>💾 Salvar</button><a href="https://www.google.com/search?q=${encodeURIComponent(x.tags.name + ' ' + end)}" target="_blank" class="btn-g">🌐 Google</a>`;
            r.appendChild(div);
        });
    }).catch(e => { r.innerHTML = `<p style="color:red; text-align:center;">❌ ${e.message}</p>`; });
}

function salvar(t) {
    let x = JSON.parse(t);
    if (salvos.some(s => s.nome === x.name)) return alert("Já salvo!");
    salvos.push({ id: Date.now(), nome: x.name, status: 'Novo' }); 
    localStorage.setItem('salvos_pro', JSON.stringify(salvos)); 
    att(); alert("Salvo!");
}
function att() {
    document.getElementById('s1').innerText = salvos.length;
    document.getElementById('s2').innerText = salvos.filter(s => s.status !== 'Novo').length;
    document.getElementById('s3').innerText = salvos.filter(s => s.status === 'Fechado').length;
    let a = document.getElementById('salvos'), l = document.getElementById('lista');
    if (salvos.length > 0) { 
        a.style.display = 'block'; 
        l.innerHTML = salvos.map(s => `<div class="card"><h4>${s.nome}</h4><select onchange="mudar(${s.id}, this.value)" style="padding:5px;"><option value="Novo" ${s.status === 'Novo' ? 'selected' : ''}>Novo</option><option value="Proposta" ${s.status === 'Proposta' ? 'selected' : ''}>Proposta</option><option value="Fechado" ${s.status === 'Fechado' ? 'selected' : ''}>Fechado</option></select><button class="btn-s" style="background:#ef4444;" onclick="excluir(${s.id})">X</button></div>`).join(''); 
    } else a.style.display = 'none';
}
function mudar(id, s) { let x = salvos.find(v => v.id === id); if (x) { x.status = s; localStorage.setItem('salvos_pro', JSON.stringify(salvos)); att(); } }
function excluir(id) { if(confirm("Apagar?")) { salvos = salvos.filter(v => v.id !== id); localStorage.setItem('salvos_pro', JSON.stringify(salvos)); att(); } }
function limpar() { if(confirm("Apagar tudo?")) { salvos = []; localStorage.removeItem('salvos_pro'); att(); } }

// GERADOR
let htmlGerado = "";
function gerar() {
    let n = document.getElementById('g-nome').value || 'Empresa';
    let t = document.getElementById('g-tel').value;
    let s = document.getElementById('g-slogan').value || 'Qualidade.';
    let r = document.getElementById('g-ramo').value;
    let c = document.getElementById('g-cor').value;
    let img = r === 'Barbearia' ? 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80' : 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80';
    
    htmlGerado = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${n}</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif;}.hero{background:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)),url('${img}');background-size:cover;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;text-align:center;padding:20px;}.hero h1{font-size:3rem;text-transform:uppercase;}.hero p{font-size:1.2rem;margin-bottom:30px;}.btn{background:#25D366;color:white;padding:15px 30px;border-radius:50px;font-weight:bold;text-decoration:none;}</style></head><body><header class="hero"><h1>${n}</h1><p>${s}</p>${t ? `<a href="https://wa.me/55${t.replace(/\\D/g, '')}" class="btn" target="_blank">Agendar no WhatsApp</a>` : ''}</header></body></html>`;
    
    let w = window.open(); w.document.write(htmlGerado); 
    document.getElementById('dl').style.display = 'block';
}

function baixar() {
    let b = new Blob([htmlGerado], { type: 'text/html' });
    let u = URL.createObjectURL(b);
    let a = document.createElement('a'); a.href = u; a.download = 'site.html'; a.click(); URL.revokeObjectURL(u); 
    alert("Baixado!");
}
