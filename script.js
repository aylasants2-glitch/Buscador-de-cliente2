const MASTER = "150612";
let users = JSON.parse(localStorage.getItem('users_pro')) || [{email:"admin@prospecta.com", senha:"admin123", adm:true}, {email:"cliente@teste.com", senha:"1234", adm:false}];

function irLogin() { document.getElementById('vendas').style.display = 'none'; document.getElementById('login').style.display = 'block'; }
function irVendas() { document.getElementById('login').style.display = 'none'; document.getElementById('vendas').style.display = 'block'; }
function sair() { localStorage.removeItem('logado'); document.getElementById('app').style.display = 'none'; irVendas(); }
function entrar() { let email = document.getElementById('l-email').value, senha = document.getElementById('l-senha').value, cod = document.getElementById('l-cod').value; let u = users.find(x => x.email === email && x.senha === senha); if (u) { if (cod === MASTER) u.adm = true; else if (u.email === "admin@prospecta.com") { alert("Código incorreto."); return; } localStorage.setItem('logado', JSON.stringify(u)); app(u); } else alert("E-mail ou senha incorretos!"); }
function app(u) { document.getElementById('vendas').style.display = 'none'; document.getElementById('login').style.display = 'none'; document.getElementById('app').style.display = 'block'; document.getElementById('t-a').style.display = (u && u.adm) ? 'block' : 'none'; }
window.onload = function() { let l = JSON.parse(localStorage.getItem('logado')); if (l) app(l); else document.getElementById('vendas').style.display = 'block'; att(); listaUsers(); };
function aba(a) { document.getElementById('v-b').style.display = a === 'b' ? 'block' : 'none'; document.getElementById('v-g').style.display = a === 'g' ? 'block' : 'none'; document.getElementById('v-a').style.display = a === 'a' ? 'block' : 'none'; document.getElementById('t-b').className = a === 'b' ? 'tab on' : 'tab'; document.getElementById('t-g').className = a === 'g' ? 'tab on' : 'tab'; document.getElementById('t-a').className = a === 'a' ? 'tab on' : 'tab'; }
function addUser() { let e = document.getElementById('a-email').value, s = document.getElementById('a-senha').value; if (!e || !s) return alert("Preencha tudo!"); if (users.some(x => x.email === e)) return alert("E-mail já existe!"); users.push({email: e, senha: s, adm: false}); localStorage.setItem('users_pro', JSON.stringify(users)); listaUsers(); alert("Adicionado!"); }
function removerUser(email) { if(confirm("Remover?")) { users = users.filter(x => x.email !== email); localStorage.setItem('users_pro', JSON.stringify(users)); listaUsers(); } }
function listaUsers() { let l = document.getElementById('users'); if (!l) return; l.innerHTML = users.map(u => `<div class="adm-card"><div><strong>${u.email}</strong><br>Senha: ${u.senha}</div>${!u.adm ? `<button class="btn-remover" onclick="removerUser('${u.email}')">Remover</button>` : ''}</div>`).join(''); }

let salvos = JSON.parse(localStorage.getItem('salvos_pro')) || [];

function buscar() {
    let c = document.getElementById('cidade').value, s = document.getElementById('seg').value, r = document.getElementById('res');
    if (!c) return alert("Digite uma cidade!");
    r.innerHTML = '<p class="msg-vazia">📍 Buscando...</p>';
    
    fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(c) + '&format=json&limit=1').then(res => res.json()).then(g => {
        if (g.length === 0) throw new Error("Cidade não encontrada");
        let tag = s === 'restaurant' ? 'amenity=restaurant' : s === 'barber' ? 'shop=hairdresser' : s === 'shop' ? 'shop' : 'shop';
        r.innerHTML = '<p class="msg-vazia">🔍 Buscando...</p>';
        return fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(`[out:json][timeout:15];(node[${tag}](around:3000,${g[0].lat},${g[0].lon});way[${tag}](around:3000,${g[0].lat},${g[0].lon}););out center 50;`) });
    }).then(res => res.json()).then(d => {
        if (!d.elements || d.elements.length === 0) { r.innerHTML = '<p class="msg-vazia">Nada encontrado.</p>'; return; }
        r.innerHTML = '';
        d.elements.filter(x => x.tags && x.tags.name).forEach(x => {
            let tem = x.tags.website || x.tags['contact:website'], fone = x.tags.phone || x.tags['contact:phone'] || '', end = x.tags['addr:street'] || 'Não detalhado';
            let div = document.createElement('div'); div.className = 'card';
            div.innerHTML = `<h4>${x.tags.name}</h4><p>📍 ${end}</p><p>📞 ${fone || 'Não informado'}</p><span class="badge ${tem ? 'com' : 'sem'}">${tem ? '✅ Site' : '🔥 Sem site'}</span><br><button class="btn-s" onclick='salvar(${JSON.stringify(JSON.stringify(x.tags))})'>💾 Salvar</button><a href="https://www.google.com/search?q=${encodeURIComponent(x.tags.name + ' ' + end)}" target="_blank" class="btn-g">🌐 Google</a>`;
            r.appendChild(div);
        });
    }).catch(e => { r.innerHTML = `<p style="color:red; text-align:center;">❌ ${e.message}</p>`; });
}

function salvar(t) { 
    let x = JSON.parse(t); 
    if (salvos.some(s => s.nome === x.name)) return alert("Já salvo!"); 
    
    // SALVA O NOME, TELEFONE (SE TIVER) E STATUS
    let fone = x.phone || x['contact:phone'] || '';
    salvos.push({ id: Date.now(), nome: x.name, fone: fone, status: 'Novo' }); 
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
        l.innerHTML = salvos.map(s => {
            // SE TIVER TELEFONE, CRIA O BOTÃO DO WHATSAPP COM A MENSAGEM PRONTA
            let btnZap = '';
            if (s.fone) {
                let numLimpo = s.fone.replace(/\D/g, '');
                // Mensagem pronta para o cliente
                let msg = encodeURIComponent(`Olá! Vi que a ${s.nome} ainda não tem um site. Meu nome é [Seu Nome] e eu crio sites profissionais com botão de agendamento no WhatsApp. Posso te mandar um exemplo de como ficaria o site da sua empresa?`);
                btnZap = `<a href="https://wa.me/55${numLimpo}?text=${msg}" target="_blank" style="background:#25D366; color:white; padding:8px 12px; border-radius:6px; text-decoration:none; font-size:0.8rem; font-weight:bold; display:inline-block; margin-top:5px;">📱 Enviar Proposta</a>`;
            }
            
            return `<div class="card">
                <h4>${s.nome}</h4>
                <select onchange="mudar(${s.id}, this.value)" style="padding:5px; margin-bottom:5px;">
                    <option value="Novo" ${s.status === 'Novo' ? 'selected' : ''}>Novo</option>
                    <option value="Proposta" ${s.status === 'Proposta' ? 'selected' : ''}>Proposta Enviada</option>
                    <option value="Fechado" ${s.status === 'Fechado' ? 'selected' : ''}>Fechado</option>
                </select>
                ${btnZap}
                <button class="btn-s" style="background:#ef4444; margin-left:5px;" onclick="excluir(${s.id})">X</button>
            </div>`;
        }).join(''); 
    } else a.style.display = 'none';
}

function mudar(id, s) { let x = salvos.find(v => v.id === id); if (x) { x.status = s; localStorage.setItem('salvos_pro', JSON.stringify(salvos)); att(); } }
function excluir(id) { if(confirm("Apagar?")) { salvos = salvos.filter(v => v.id !== id); localStorage.setItem('salvos_pro', JSON.stringify(salvos)); att(); } }
function limpar() { if(confirm("Apagar tudo?")) { salvos = []; localStorage.removeItem('salvos_pro'); att(); } }

let htmlGerado = "";
function gerar() {
    let n = document.getElementById('g-nome').value || 'Empresa', t = document.getElementById('g-tel').value, s = document.getElementById('g-slogan').value || 'Qualidade.', r = document.getElementById('g-ramo').value, c = document.getElementById('g-cor').value;
    let p1 = document.getElementById('p1').value, p1v = document.getElementById('p1v').value, p2 = document.getElementById('p2').value, p2v = document.getElementById('p2v').value, p3 = document.getElementById('p3').value, p3v = document.getElementById('p3v').value;
    let f1 = document.getElementById('f1').value || (r === 'Barbearia' ? 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80' : 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80');
    let f2 = document.getElementById('f2').value || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', f3 = document.getElementById('f3').value || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80';
    htmlGerado = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${n}</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Montserrat',sans-serif;}body{background:#f4f4f4;color:#1a1a1a;}.hero{background:linear-gradient(rgba(0,0,0,0.8),rgba(0,0,0,0.8)),url('${f1}');background-size:cover;background-position:center;height:90vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:white;padding:20px;}.hero h1{font-size:2.5rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;}.hero p{font-size:1.2rem;margin-bottom:30px;color:#ddd;}.btn-w{background:${c};color:white;padding:15px 40px;border-radius:50px;font-weight:bold;text-decoration:none;font-size:1.1rem;box-shadow:0 4px 15px rgba(0,0,0,0.3);}.sec{padding:60px 20px;text-align:center;}.sec h2{font-size:2rem;margin-bottom:10px;color:#1a1a1a;}.sec p.sub{color:#666;margin-bottom:40px;}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;max-width:800px;margin:0 auto;}.card-p{background:white;padding:25px;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,0.05);border-top:5px solid ${c};}.card-p h3{font-size:1.2rem;margin-bottom:5px;}.card-p .price{font-size:1.5rem;font-weight:900;color:${c};}.galeria{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:800px;margin:0 auto;}.galeria img{width:100%;border-radius:8px;object-fit:cover;height:200px;}.foot{background:#1a1a1a;color:#999;text-align:center;padding:30px;font-size:0.9rem;}.btn-float{position:fixed;bottom:20px;right:20px;background:#25D366;color:white;padding:15px 25px;border-radius:50px;font-weight:bold;text-decoration:none;box-shadow:0 4px 15px rgba(37,211,102,0.4);display:flex;align-items:center;gap:10px;}</style></head><body><header class="hero"><h1>${n}</h1><p>${s}</p><a href="https://wa.me/55${t.replace(/\\D/g, '')}" class="btn-w" target="_blank">Agendar Horário</a></header><section class="sec"><h2>Tabela de Preços</h2><p class="sub">Serviços avulsos para manter o visual em dia.</p><div class="grid"><div class="card-p"><h3>${p1}</h3><div class="price">${p1v}</div></div><div class="card-p"><h3>${p2}</h3><div class="price">${p2v}</div></div><div class="card-p"><h3>${p3}</h3><div class="price">${p3v}</div></div></div></section><section class="sec" style="background:#fff;"><h2>Galeria</h2><p class="sub">Confira alguns dos nossos trabalhos.</p><div class="galeria"><img src="${f2}"><img src="${f3}"></div></section><footer class="foot"><p>&copy; ${new Date().getFullYear()} ${n}. Todos os direitos reservados.</p><p>Site criado por [Seu Nome]</p></footer><a href="https://wa.me/55${t.replace(/\\D/g, '')}" class="btn-float" target="_blank">📱 WhatsApp</a></body></html>`;
    let w = window.open(); w.document.write(htmlGerado); document.getElementById('dl').style.display = 'block';
}

function baixar() { let b = new Blob([htmlGerado], { type: 'text/html' }); let u = URL.createObjectURL(b); let a = document.createElement('a'); a.href = u; a.download = 'site-cliente.html'; a.click(); URL.revokeObjectURL(u); alert("Baixado!"); }
