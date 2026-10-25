const MASTER = "150612";
let users = JSON.parse(localStorage.getItem('users_pro')) || [
    {email:"admin@prospecta.com", senha:"admin123", adm:true}, 
    {email:"cliente@teste.com", senha:"1234", adm:false}
];

// --- NAVEGAÇÃO ---
function irLogin() { document.getElementById('vendas').style.display = 'none'; document.getElementById('login').style.display = 'block'; }
function irVendas() { document.getElementById('login').style.display = 'none'; document.getElementById('vendas').style.display = 'block'; }
function sair() { localStorage.removeItem('logado'); document.getElementById('app').style.display = 'none'; irVendas(); }

// --- LOGIN ---
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

// --- ADMIN ---
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

// --- BUSCADOR ---
let salvos = JSON.parse(localStorage.getItem('salvos_pro')) || [];
function buscar() {
    let c = document.getElementById('cidade').value;
    let s = document.getElementById('seg').value;
    let r = document.getElementById('res');
    if (!c) return alert("Digite uma cidade!");
    
    r.innerHTML = '<p class="msg-vazia">📍 Buscando cidade...</p>';
    
    fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(c) + '&format=json&limit=1')
    .then(res => res.json()).then(g => {
        if (g.length === 0) throw new Error("Cidade não encontrada");
        
        let tag = '';
        if (s === 'restaurant') tag = 'amenity=restaurant';
        else if (s === 'barber') tag = 'shop=hairdresser';
        else if (s === 'shop') tag = 'shop';
        else if (s === 'car_repair') tag = 'shop=car_repair';
        else if (s === 'cafe') tag = 'amenity=cafe';
        else if (s === 'bakery') tag = 'shop=bakery';
        else if (s === 'pharmacy') tag = 'amenity=pharmacy';
        else if (s === 'clinic') tag = 'amenity=clinic';

        r.innerHTML = '<p class="msg-vazia">🔍 Buscando negócios...</p>';
        return fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(`[out:json][timeout:15];(node[${tag}](around:3000,${g[0].lat},${g[0].lon});way[${tag}](around:3000,${g[0].lat},${g[0].lon}););out center 50;`) });
    }).then(res => res.json()).then(d => {
        if (!d.elements || d.elements.length === 0) { 
            r.innerHTML = '<p class="msg-vazia">Nada encontrado.</p>'; return; 
        }
        r.innerHTML = '';
        d.elements.filter(x => x.tags && x.tags.name).forEach(x => {
            let tem = x.tags.website || x.tags['contact:website'];
            let fone = x.tags.phone || x.tags['contact:phone'] || 'Não informado';
            let end = x.tags['addr:street'] || 'Endereço não detalhado';
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

// --- GERADOR PRO (AGORA COM TODAS AS SEÇÕES) ---
let htmlGerado = "";
function gerar() {
    let n = document.getElementById('g-nome').value || 'Sua Empresa';
    let t = document.getElementById('g-tel').value;
    let s = document.getElementById('g-slogan').value || 'Qualidade e confiança para você.';
    let r = document.getElementById('g-ramo').value;
    let c = document.getElementById('g-cor').value;
    
    let img = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
    if (r === 'Barbearia') img = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80';
    if (r === 'Restaurante') img = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80';
    if (r === 'Oficina') img = 'https://images.unsplash.com/photo-1613214150384-4f0d0c403a0f?auto=format&fit=crop&w=1200&q=80';
    if (r === 'Clínica') img = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80';
    
    htmlGerado = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${n} - ${r}</title>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Montserrat', sans-serif; }
                body { background: #f8fafc; color: #1e293b; }
                .hero { background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${img}'); background-size: cover; background-position: center; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: white; padding: 20px; }
                .hero h1 { font-size: 3rem; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
                .hero p { font-size: 1.2rem; margin-bottom: 30px; font-weight: 400; max-width: 600px; }
                .btn-whats { background: #25D366; color: white; padding: 18px 40px; border-radius: 50px; font-size: 1.2rem; font-weight: bold; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; transition: transform 0.3s; box-shadow: 0 10px 20px rgba(37, 211, 102, 0.4); }
                .btn-whats:hover { transform: translateY(-5px); }
                .section { padding: 80px 20px; max-width: 1000px; margin: 0 auto; text-align: center; }
                .section h2 { font-size: 2rem; margin-bottom: 40px; color: ${c}; font-weight: 900; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
                .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: transform 0.3s; border-top: 5px solid ${c}; }
                .card:hover { transform: translateY(-10px); }
                .card h3 { margin-bottom: 10px; color: #1e293b; }
                .card p { color: #64748b; line-height: 1.6; }
                .footer { background: #0f172a; color: #94a3b8; text-align: center; padding: 30px; font-size: 0.9rem; }
                .badge-pro { background: ${c}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; margin-bottom: 15px; display: inline-block; }
            </style>
        </head>
        <body>
            <header class="hero">
                <span class="badge-pro">${r.toUpperCase()} PROFISSIONAL</span>
                <h1>${n}</h1>
                <p>${s}</p>
                ${t ? `<a href="https://wa.me/55${t.replace(/\\D/g, '')}" class="btn-whats" target="_blank">📱 Agendar pelo WhatsApp</a>` : ''}
            </header>
            
            <section class="section">
                <h2>Por que escolher a ${n}?</h2>
                <div class="grid">
                    <div class="card"><h3>⭐ Qualidade Premium</h3><p>Utilizamos os melhores materiais e técnicas para garantir a sua satisfação total.</p></div>
                    <div class="card"><h3>⚡ Atendimento Rápido</h3><p>Seu tempo é valioso. Oferecemos um atendimento ágil e sem burocracia.</p></div>
                    <div class="card"><h3>💎 Preço Justo</h3><p>Acreditamos que qualidade não precisa ser cara. Confira nossos preços.</p></div>
                </div>
            </section>

            <section class="section" style="background: white;">
                <h2>O que nossos clientes dizem</h2>
                <div class="grid">
                    <div class="card" style="border-top: none; border-left: 5px solid ${c}; text-align: left;">
                        <p>"Simplesmente o melhor atendimento da cidade. Recomendo de olhos fechados!"</p>
                        <h4 style="margin-top: 15px; color: ${c};">- Carlos M.</h4>
                    </div>
                    <div class="card" style="border-top: none; border-left: 5px solid ${c}; text-align: left;">
                        <p>"Ambiente incrível e profissionais super capacitados. Voltarei com certeza."</p>
                        <h4 style="margin-top: 15px; color: ${c};">- Ana P.</h4>
                    </div>
                </div>
            </section>

            <footer class="footer">
                <p>&copy; ${new Date().getFullYear()} ${n}. Todos os direitos reservados.</p>
                <p style="margin-top: 10px; font-size: 0.8rem;">Site desenvolvido por <strong style="color: white;">[Seu Nome]</strong></p>
            </footer>
        </body>
        </html>
    `;
    
    let w = window.open(); w.document.write(htmlGerado); 
    document.getElementById('dl').style.display = 'block';
}

function baixar() {
    let b = new Blob([htmlGerado], { type: 'text/html' });
    let u = URL.createObjectURL(b);
    let a = document.createElement('a'); a.href = u; a.download = 'site-cliente.html'; a.click(); URL.revokeObjectURL(u); 
    alert("Site baixado com sucesso!");
}
