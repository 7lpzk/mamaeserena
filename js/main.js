/* =========================================================
   Mamãe Serena — comportamento do site
   1. Configuração e dados (edite aqui: nomes, horários, contatos)
   2. Menu e navegação
   3. Equipe e programação das palestras
   4. Agendamento em 6 etapas (horários ocupados de verdade)
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     1. CONFIGURAÇÃO E DADOS
     --------------------------------------------------------- */
  const CONFIG = {
    // true = mostra avisos de "conteúdo demonstrativo" (perfis, depoimentos, agenda).
    // Ao lançar o site de verdade, troque para false.
    demo: true,
    // Exige CPF válido (dígitos verificadores). Deixe true, pois é o comportamento real.
    validarCPF: true,
    whatsapp: '5511987654321',
    endereco: 'Rua das Acácias, 456, Jardim Belval, Barueri/SP',
    diasAntecedenciaMinima: 1,   // só agenda a partir de amanhã
    janelaDias: 90,              // até quantos dias à frente
    storageKey: 'mamae-serena.agendamentos.v1',
  };

  const HORARIOS_CONSULTA = ['08:00', '09:30', '11:00', '14:00', '15:30']; // sessões de 1h30
  const semana = (dias, horarios) => Object.fromEntries(dias.map(d => [d, horarios]));

  // Serviços (valores e durações conforme o site atual)
  const SERVICOS = [
    {
      id: 'doula', nome: 'Doula', preco: 300, duracao: '1h30', duracaoMin: 90,
      descricao: 'Acompanhamento emocional e prático na gestação, no parto e no pós-parto.',
    },
    {
      id: 'psicologia', nome: 'Psicólogas', preco: 200, duracao: '1h30', duracaoMin: 90,
      descricao: 'Atendimento voltado ao acolhimento emocional e aos desafios da maternidade.',
    },
    {
      id: 'palestras', nome: 'Palestras gratuitas', preco: 0, duracao: '1h', duracaoMin: 60,
      descricao: 'Informações sobre saúde mental materna, bem-estar e desenvolvimento.',
    },
  ];

  // Profissionais. Para usar foto real, coloque o arquivo em assets/equipe/ e
  // preencha "foto" (ex.: 'assets/equipe/helena.jpg'). "dias": 0 = domingo ... 6 = sábado.
  const PROFISSIONAIS = [
    {
      id: 'helena', nome: 'Helena Duarte', servico: 'psicologia', capacidade: 1,
      cargo: 'Psicóloga perinatal',
      formacao: 'Graduação em Psicologia, com especialização em psicologia perinatal.',
      bio: 'Acompanha gestantes e mães com foco em ansiedade, autoestima e adaptação à maternidade.',
      iniciais: 'HD', foto: '', tom: ['#efd9d2', '#f6ebdf'],
      agenda: semana([1, 3, 5], HORARIOS_CONSULTA),
    },
    {
      id: 'beatriz', nome: 'Beatriz Nogueira', servico: 'psicologia', capacidade: 1,
      cargo: 'Psicóloga clínica',
      formacao: 'Graduação em Psicologia, com formação em terapia cognitivo-comportamental.',
      bio: 'Atende mães no pós-parto e oferece escuta acolhedora para os desafios dos primeiros meses.',
      iniciais: 'BN', foto: '', tom: ['#e4eadc', '#f6ebdf'],
      agenda: semana([2, 4, 5], HORARIOS_CONSULTA),
    },
    {
      id: 'camila', nome: 'Camila Ribeiro', servico: 'doula', capacidade: 1,
      cargo: 'Doula',
      formacao: 'Formação em doulagem, com curso de apoio ao parto e ao pós-parto.',
      bio: 'Oferece presença, informação e técnicas de conforto para viver a gestação e o parto com segurança.',
      iniciais: 'CR', foto: '', tom: ['#ecc9c2', '#f8efe4'],
      agenda: semana([1, 2, 3, 4, 5], HORARIOS_CONSULTA),
    },
    {
      id: 'marina', nome: 'Marina Castro', servico: 'palestras', capacidade: 15,
      cargo: 'Educadora perinatal',
      formacao: 'Graduação em Enfermagem, com especialização em saúde da mulher.',
      bio: 'Conduz as palestras gratuitas com linguagem simples e espaço para todas as dúvidas.',
      iniciais: 'MC', foto: '', tom: ['#e9dccb', '#fbf3ea'],
      // Três encontros por semana
      agenda: { 1: ['10:00'], 3: ['15:00'], 5: ['10:00'] },
      temas: {
        1: 'Saúde mental na gestação e ansiedade durante a gravidez',
        3: 'Preparação para o pós-parto e cuidados com o bebê',
        5: 'Mudanças emocionais na maternidade e rede de apoio',
      },
    },
  ];

  const ETAPAS = [
    { id: 'servico', nome: 'Serviço' },
    { id: 'profissional', nome: 'Profissional' },
    { id: 'data', nome: 'Data' },
    { id: 'horario', nome: 'Horário' },
    { id: 'dados', nome: 'Seus dados' },
    { id: 'confirmacao', nome: 'Confirmação' },
  ];

  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const DIAS_LONGOS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const paraISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const deISO = s => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
  const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const somaDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dataMin = () => somaDias(hoje(), CONFIG.diasAntecedenciaMinima);
  const dataMax = () => somaDias(hoje(), CONFIG.janelaDias);

  const dataLonga = iso => {
    const d = deISO(iso);
    return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
  };
  const fmtHora = h => { const [hh, mm] = h.split(':'); return mm === '00' ? `${Number(hh)}h` : `${Number(hh)}h${mm}`; };
  const fmtPreco = v => v === 0 ? 'Gratuito' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const servicoPorId = id => SERVICOS.find(s => s.id === id);
  const profPorId = id => PROFISSIONAIS.find(p => p.id === id);

  /* ---------------------------------------------------------
     2. MENU E NAVEGAÇÃO
     --------------------------------------------------------- */
  function iniciarMenu() {
    const botao = $('.menu-botao');
    const menu = $('#menu-principal');
    if (!botao || !menu) return;

    const fechar = () => { menu.classList.remove('aberto'); botao.setAttribute('aria-expanded', 'false'); };
    botao.addEventListener('click', () => {
      const abrir = !menu.classList.contains('aberto');
      menu.classList.toggle('aberto', abrir);
      botao.setAttribute('aria-expanded', String(abrir));
    });
    menu.addEventListener('click', e => { if (e.target.closest('a')) fechar(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', fechar);

    // Destaca no menu a seção que está na tela
    const links = $$('a[href^="#"]', menu).filter(a => !a.classList.contains('btn'));
    const mapa = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const secoes = $$('main section[id]');
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entradas => {
        entradas.forEach(en => {
          if (!en.isIntersecting) return;
          links.forEach(a => a.removeAttribute('aria-current'));
          const alvo = mapa.get(en.target.id);
          if (alvo) alvo.setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      secoes.forEach(s => obs.observe(s));
    }
  }

  // Botões "Saiba mais" dos serviços
  function iniciarSaibaMais() {
    $$('[data-alternar]').forEach(btn => {
      const alvo = document.getElementById(btn.dataset.alternar);
      if (!alvo) return;
      alvo.hidden = true; // sem JavaScript o texto fica visível
      btn.addEventListener('click', () => {
        const abrir = alvo.hidden;
        alvo.hidden = !abrir;
        btn.setAttribute('aria-expanded', String(abrir));
        btn.textContent = abrir ? 'Ver menos' : 'Saiba mais';
      });
    });
  }

  // O botão flutuante do WhatsApp sai da frente enquanto a pessoa preenche o agendamento
  function iniciarBotaoWhatsApp() {
    const zap = $('#zap'), secao = $('#agendamento');
    if (!zap || !secao || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([en]) => zap.classList.toggle('oculto', en.isIntersecting), { threshold: 0.05 }).observe(secao);
  }

  function aplicarModoDemo() {
    if (!CONFIG.demo) $$('[data-demo]').forEach(el => el.remove());
  }

  /* ---------------------------------------------------------
     3. EQUIPE E PROGRAMAÇÃO
     --------------------------------------------------------- */
  function avatarHTML(p, classe) {
    const estilo = `--tom-a:${p.tom[0]};--tom-b:${p.tom[1]}`;
    const conteudo = p.foto
      ? `<img src="${esc(p.foto)}" alt="" loading="lazy">`
      : `<span class="${classe === 'perfil-retrato' ? 'perfil-iniciais' : ''}">${esc(p.iniciais)}</span>`;
    return `<div class="${classe}" style="${estilo}" aria-hidden="true">${conteudo}</div>`;
  }

  function renderizarEquipe() {
    const alvo = $('#equipe');
    if (!alvo) return;
    alvo.innerHTML = PROFISSIONAIS.map(p => {
      const primeiroNome = p.nome.split(' ')[0];
      const rotulo = p.servico === 'palestras' ? `Reservar com ${esc(primeiroNome)}` : `Agendar com ${esc(primeiroNome)}`;
      return `
        <article class="perfil">
          ${avatarHTML(p, 'perfil-retrato')}
          <h3>${esc(p.nome)}</h3>
          <p class="perfil-cargo">${esc(p.cargo)}</p>
          <p class="perfil-formacao">${esc(p.formacao)}</p>
          <p class="perfil-bio">${esc(p.bio)}</p>
          <a class="btn btn-secundario btn-pequeno" href="#agendamento" data-agendar-prof="${p.id}">${rotulo}</a>
        </article>`;
    }).join('');
  }

  function renderizarProgramacao() {
    const alvo = $('#programacao');
    const marina = PROFISSIONAIS.find(p => p.servico === 'palestras');
    if (!alvo || !marina) return;
    alvo.innerHTML = Object.keys(marina.agenda).map(Number).sort().map(dia => `
      <li>
        <span class="quando">${DIAS_LONGOS[dia].replace('-feira', '')}<small>${fmtHora(marina.agenda[dia][0])}, com ${esc(marina.nome.split(' ')[0])}</small></span>
        <span class="tema">${esc(marina.temas[dia])}</span>
      </li>`).join('');
  }

  /* ---------------------------------------------------------
     4. AGENDAMENTO
     --------------------------------------------------------- */

  // ----- Armazenamento (localStorage, com plano B em memória) -----
  let memoria = [];
  function lerReservas() {
    try {
      const bruto = localStorage.getItem(CONFIG.storageKey);
      return bruto ? JSON.parse(bruto) : [];
    } catch (_) { return memoria; }
  }
  function salvarReservas(lista) {
    memoria = lista;
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(lista)); } catch (_) { /* navegador bloqueou: segue em memória */ }
  }

  // ----- Disponibilidade -----
  // Para o site parecer "vivo" na demonstração, alguns horários já vêm ocupados.
  // O resultado é sempre o mesmo para a mesma data (não muda ao recarregar).
  function hash(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function ocupacaoBase(prof, iso, hora) {
    if (!CONFIG.demo) return 0;
    const h = hash(`${prof.id}|${iso}|${hora}`) % 100;
    return prof.capacidade === 1 ? (h < 30 ? 1 : 0) : Math.floor(h / 100 * 8);
  }
  function reservasDoHorario(profId, iso, hora) {
    return lerReservas().filter(r => r.profId === profId && r.data === iso && r.hora === hora && r.status === 'confirmado').length;
  }
  function vagas(prof, iso, hora) {
    return Math.max(0, prof.capacidade - ocupacaoBase(prof, iso, hora) - reservasDoHorario(prof.id, iso, hora));
  }
  function horariosDoDia(prof, iso) { return prof.agenda[deISO(iso).getDay()] || []; }
  function diaDisponivel(prof, iso) { return horariosDoDia(prof, iso).some(h => vagas(prof, iso, h) > 0); }
  function primeiroDiaDisponivel(prof) {
    for (let d = dataMin(); d <= dataMax(); d = somaDias(d, 1)) {
      if (diaDisponivel(prof, paraISO(d))) return d;
    }
    return dataMin();
  }

  // ----- Máscaras e validações -----
  function mascaraCPF(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    if (v.length > 6) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    if (v.length > 3) return `${v.slice(0, 3)}.${v.slice(3)}`;
    return v;
  }
  function mascaraTel(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v ? `(${v}` : '';
  }
  function cpfValido(valor) {
    const d = valor.replace(/\D/g, '');
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    const digito = n => {
      let soma = 0;
      for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
  }

  function validarDados() {
    const p = estado.paciente;
    const erros = {};
    if (p.nome.trim().split(/\s+/).filter(Boolean).length < 2 || p.nome.trim().length < 5) erros.nome = 'Informe seu nome completo (nome e sobrenome).';
    if (CONFIG.validarCPF ? !cpfValido(p.cpf) : p.cpf.replace(/\D/g, '').length !== 11) erros.cpf = 'Informe um CPF válido, com 11 números.';
    const tel = p.tel.replace(/\D/g, '');
    if (tel.length < 10 || tel.length > 11) erros.tel = 'Informe o telefone com DDD, por exemplo (11) 98765-4321.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email.trim())) erros.email = 'Informe um e-mail válido, por exemplo nome@email.com.';
    if (!p.ok) erros.ok = 'Para continuar, é preciso concordar com o uso dos dados para o agendamento.';
    return erros;
  }

  // ----- Estado -----
  const estadoInicial = () => ({
    etapa: 1, servico: null, prof: null, data: null, hora: null, mes: null,
    paciente: { nome: '', cpf: '', tel: '', email: '', ok: false },
    erros: {}, aviso: '', concluido: null, cancelando: null,
  });
  let estado = estadoInicial();

  const el = {
    progresso: $('#progresso'),
    progressoTexto: $('#progresso-texto'),
    painel: $('#painel'),
    resumo: $('#resumo'),
    meus: $('#meus-agendamentos'),
    meusLista: $('#meus-lista'),
  };

  const servicoAtual = () => servicoPorId(estado.servico);
  const profAtual = () => profPorId(estado.prof);

  function definirServico(id) {
    if (estado.servico === id) return;
    estado.servico = id; estado.prof = null; estado.data = null; estado.hora = null; estado.mes = null;
  }
  function definirProf(id) {
    if (estado.prof === id) return;
    estado.prof = id; estado.data = null; estado.hora = null; estado.mes = null;
  }
  function definirData(iso) {
    if (estado.data === iso) return;
    estado.data = iso; estado.hora = null;
  }

  function etapaValida() {
    switch (ETAPAS[estado.etapa - 1].id) {
      case 'servico': return !!estado.servico;
      case 'profissional': return !!estado.prof;
      case 'data': return !!estado.data;
      case 'horario': return !!estado.hora;
      default: return true;
    }
  }

  // ----- Renderização -----
  function render(focar = false) {
    renderProgresso();
    renderPainel();
    renderResumo();
    renderMeus();
    if (focar) {
      const t = $('#painel-titulo');
      if (t) t.focus({ preventScroll: true });
    }
  }

  function renderProgresso() {
    const concluido = !!estado.concluido;
    el.progressoTexto.textContent = concluido ? 'Agendamento concluído' : `Etapa ${estado.etapa} de ${ETAPAS.length}: ${ETAPAS[estado.etapa - 1].nome}`;
    el.progresso.innerHTML = ETAPAS.map((e, i) => {
      const n = i + 1;
      const classe = concluido || n < estado.etapa ? 'feito' : n === estado.etapa ? 'atual' : '';
      return `<li class="${classe}" ${n === estado.etapa && !concluido ? 'aria-current="step"' : ''}>
        <div class="passo-marca"><span class="passo-barra"></span><span class="passo-nome">${n}. ${e.nome}</span></div>
      </li>`;
    }).join('');
  }

  function htmlAcoes() {
    const ultima = estado.etapa === ETAPAS.length;
    const voltar = estado.etapa > 1 ? '<button type="button" class="btn btn-secundario" data-acao="voltar">Voltar</button>' : '<span></span>';
    const avancar = ultima
      ? '<button type="button" class="btn btn-primario" data-acao="confirmar" id="btn-avancar">Confirmar agendamento</button>'
      : '<button type="button" class="btn btn-primario" data-acao="continuar" id="btn-avancar">Continuar</button>';
    return `<div class="painel-acoes">${voltar}${avancar}</div>`;
  }

  function renderPainel() {
    if (estado.concluido) { el.painel.innerHTML = htmlSucesso(estado.concluido); return; }

    const etapa = ETAPAS[estado.etapa - 1].id;
    let titulo = '', ajuda = '', corpo = '';

    if (etapa === 'servico') {
      titulo = 'Qual atendimento você procura?';
      ajuda = 'Escolha uma opção. Você pode voltar e mudar quando quiser.';
      corpo = `<fieldset class="opcoes"><legend class="sr">Serviço</legend>${SERVICOS.map(s => `
        <label class="opcao">
          <input type="radio" name="servico" value="${s.id}" ${estado.servico === s.id ? 'checked' : ''}>
          <span class="opcao-cartao">
            <span class="opcao-radio" aria-hidden="true"></span>
            <span><span class="opcao-nome">${esc(s.nome)}</span><span class="opcao-desc">${esc(s.descricao)}</span></span>
            <span class="opcao-preco">${fmtPreco(s.preco)}<small>${s.preco === 0 ? 'sem custo' : `${s.duracao}`}</small></span>
          </span>
        </label>`).join('')}</fieldset>`;
    }

    if (etapa === 'profissional') {
      const lista = PROFISSIONAIS.filter(p => p.servico === estado.servico);
      if (lista.length === 1 && !estado.prof) estado.prof = lista[0].id;
      titulo = 'Com quem você quer ser atendida?';
      ajuda = 'Estas são as profissionais disponíveis para este atendimento.';
      corpo = `<fieldset class="opcoes"><legend class="sr">Profissional</legend>${lista.map(p => `
        <label class="opcao">
          <input type="radio" name="prof" value="${p.id}" ${estado.prof === p.id ? 'checked' : ''}>
          <span class="opcao-cartao com-avatar">
            ${avatarHTML(p, 'mini-avatar')}
            <span class="opcao-radio" aria-hidden="true"></span>
            <span><span class="opcao-nome">${esc(p.nome)}</span><span class="opcao-desc"><strong>${esc(p.cargo)}.</strong> ${esc(p.bio)}</span></span>
          </span>
        </label>`).join('')}</fieldset>`;
    }

    if (etapa === 'data') {
      const p = profAtual();
      if (!estado.mes) {
        const base = estado.data ? deISO(estado.data) : primeiroDiaDisponivel(p);
        estado.mes = new Date(base.getFullYear(), base.getMonth(), 1);
      }
      titulo = 'Escolha o dia';
      ajuda = p.servico === 'palestras'
        ? 'As palestras acontecem às segundas, quartas e sextas. Dias em verde têm vagas.'
        : `Dias em verde têm horários livres com ${esc(p.nome.split(' ')[0])}.`;
      corpo = `<div class="cal-wrap" id="cal"></div><p class="painel-ajuda" id="cal-escolhido" aria-live="polite" style="margin-top:1rem"></p>`;
    }

    if (etapa === 'horario') {
      const p = profAtual();
      const dia = horariosDoDia(p, estado.data);
      titulo = 'Escolha o horário';
      ajuda = `${esc(dataLonga(estado.data))}.${p.temas ? ` Tema: ${esc(p.temas[deISO(estado.data).getDay()])}.` : ''} Horários ocupados aparecem riscados.`;
      corpo = `<fieldset class="horarios"><legend class="sr">Horário</legend>${dia.map(h => {
        const v = vagas(p, estado.data, h);
        const livre = v > 0;
        let legenda;
        if (p.capacidade === 1) legenda = livre ? 'Livre' : 'Ocupado';
        else legenda = !livre ? 'Esgotado' : v === 1 ? 'Última vaga' : `${v} vagas`;
        return `<label class="horario">
          <input type="radio" name="hora" value="${h}" ${estado.hora === h ? 'checked' : ''} ${livre ? '' : 'disabled'}>
          <span class="horario-cartao">${fmtHora(h)}<small>${legenda}</small></span>
        </label>`;
      }).join('')}</fieldset>`;
    }

    if (etapa === 'dados') {
      const d = estado.paciente, er = estado.erros;
      const campo = (id, rotulo, tipo, valor, extra = '', largo = false) => `
        <div class="campo ${largo ? 'campo-largo' : ''}">
          <label for="f-${id}">${rotulo}</label>
          <input type="${tipo}" id="f-${id}" name="${id}" value="${esc(valor)}" ${extra}
            ${er[id] ? 'aria-invalid="true"' : ''} aria-describedby="e-${id}">
          <p class="campo-erro" id="e-${id}">${er[id] ? esc(er[id]) : ''}</p>
        </div>`;
      titulo = 'Seus dados';
      ajuda = 'Usamos estas informações apenas para confirmar o seu atendimento.';
      corpo = `<div class="campos">
        ${campo('nome', 'Nome completo', 'text', d.nome, 'autocomplete="name" autocapitalize="words"', true)}
        ${campo('cpf', 'CPF', 'text', d.cpf, 'inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" maxlength="14"')}
        ${campo('tel', 'Telefone com DDD', 'tel', d.tel, 'inputmode="tel" autocomplete="tel-national" placeholder="(11) 90000-0000" maxlength="15"')}
        ${campo('email', 'E-mail', 'email', d.email, 'autocomplete="email" placeholder="voce@email.com"', true)}
        <div class="campo campo-largo">
          <label class="consentimento" for="f-ok">
            <input type="checkbox" id="f-ok" name="ok" ${d.ok ? 'checked' : ''} ${er.ok ? 'aria-invalid="true"' : ''} aria-describedby="e-ok">
            <span>Concordo com o uso dos meus dados para realizar e confirmar este agendamento, conforme a Lei Geral de Proteção de Dados (LGPD).</span>
          </label>
          <p class="campo-erro" id="e-ok">${er.ok ? esc(er.ok) : ''}</p>
        </div>
      </div>`;
    }

    if (etapa === 'confirmacao') {
      titulo = 'Confira e confirme';
      ajuda = 'Revise as informações antes de finalizar.';
      corpo = `${linhasResumo(dadosResumoCompleto())}`;
    }

    const aviso = estado.aviso ? `<p class="alerta" role="alert">${esc(estado.aviso)}</p>` : '';
    el.painel.innerHTML = `${aviso}<h3 class="painel-titulo" id="painel-titulo" tabindex="-1">${titulo}</h3><p class="painel-ajuda">${ajuda}</p>${corpo}${htmlAcoes()}`;

    if (etapa === 'data') renderCalendario();
    atualizarAvancar();
  }

  function atualizarAvancar() {
    const b = $('#btn-avancar');
    if (b && b.dataset.acao === 'continuar') b.disabled = !etapaValida();
  }

  // ----- Calendário -----
  function renderCalendario(focoSel) {
    const cont = $('#cal');
    if (!cont) return;
    const p = profAtual();
    const min = dataMin(), max = dataMax();
    const ano = estado.mes.getFullYear(), mes = estado.mes.getMonth();
    const inicio = new Date(ano, mes, 1).getDay();
    const total = new Date(ano, mes + 1, 0).getDate();
    const podeVoltar = new Date(ano, mes, 0) >= min;
    const podeAvancar = new Date(ano, mes + 1, 1) <= max;
    const hojeISO = paraISO(hoje());

    let celulas = '';
    for (let i = 0; i < inicio; i++) celulas += '<span></span>';
    for (let dia = 1; dia <= total; dia++) {
      const d = new Date(ano, mes, dia);
      const iso = paraISO(d);
      const livre = d >= min && d <= max && diaDisponivel(p, iso);
      const sel = estado.data === iso;
      celulas += `<button type="button" class="cal-dia ${livre ? 'livre' : ''} ${iso === hojeISO ? 'hoje' : ''}" data-data="${iso}"
        aria-pressed="${sel}" ${livre ? '' : 'disabled'}
        aria-label="${dataLonga(iso)}${livre ? '' : ', indisponível'}">${dia}</button>`;
    }

    const seta = dir => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
    cont.innerHTML = `
      <div class="cal-topo">
        <button type="button" class="cal-nav" data-cal-nav="-1" aria-label="Mês anterior" ${podeVoltar ? '' : 'disabled'}>${seta(-1)}</button>
        <span class="cal-mes" aria-live="polite">${MESES[mes]} de ${ano}</span>
        <button type="button" class="cal-nav" data-cal-nav="1" aria-label="Próximo mês" ${podeAvancar ? '' : 'disabled'}>${seta(1)}</button>
      </div>
      <div class="cal-grade" role="group" aria-label="Dias de ${MESES[mes]} de ${ano}">
        ${DIAS_CURTOS.map(d => `<span class="cal-dsem" aria-hidden="true">${d}</span>`).join('')}
        ${celulas}
      </div>
      <div class="cal-legenda"><span><i></i>Com horários</span><span><i class="sel"></i>Dia escolhido</span></div>`;

    const escolhido = $('#cal-escolhido');
    if (escolhido) escolhido.textContent = estado.data ? `Dia escolhido: ${dataLonga(estado.data)}.` : '';

    if (focoSel) { const alvo = $(focoSel, cont); if (alvo && !alvo.disabled) alvo.focus(); }
  }

  // ----- Resumo lateral e confirmação -----
  function dadosResumoCompleto() {
    const s = servicoAtual(), p = profAtual(), d = estado.paciente;
    return [
      ['Serviço', s ? s.nome : null],
      ['Profissional', p ? p.nome : null],
      ['Data', estado.data ? dataLonga(estado.data) : null],
      ['Horário', estado.hora ? fmtHora(estado.hora) : null],
      ['Valor', s ? (s.preco === 0 ? 'Gratuito' : `${fmtPreco(s.preco)} (${s.duracao})`) : null],
      ['Paciente', d.nome.trim() || null],
      ['CPF', d.cpf || null],
      ['Telefone', d.tel || null],
      ['E-mail', d.email.trim() || null],
    ];
  }
  function linhasResumo(linhas) {
    return `<dl class="lista-resumo">${linhas.filter(l => l[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  }

  function renderResumo() {
    const s = servicoAtual(), p = profAtual();
    const linha = (rotulo, valor) => `<div><dt>${rotulo}</dt><dd class="${valor ? '' : 'vazio'}">${valor ? esc(valor) : 'A escolher'}</dd></div>`;
    el.resumo.innerHTML = `
      <h3>Seu agendamento</h3>
      <dl>
        ${linha('Serviço', s && s.nome)}
        ${linha('Profissional', p && p.nome)}
        ${linha('Data', estado.data && dataLonga(estado.data))}
        ${linha('Horário', estado.hora && fmtHora(estado.hora))}
        ${linha('Valor', s && (s.preco === 0 ? 'Gratuito' : `${fmtPreco(s.preco)} (${s.duracao})`))}
      </dl>`;
  }

  // ----- Confirmação e sucesso -----
  function gerarProtocolo() {
    const d = new Date();
    const aleatorio = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `MS-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${aleatorio}`;
  }

  function confirmar() {
    const s = servicoAtual(), p = profAtual(), d = estado.paciente;
    // Confere de novo: outra pessoa pode ter ocupado o horário enquanto você preenchia
    if (vagas(p, estado.data, estado.hora) < 1) {
      estado.hora = null; estado.etapa = 4;
      estado.aviso = 'Este horário acabou de ser ocupado. Escolha outro horário para continuar.';
      render(true);
      return;
    }
    const cpfNumeros = d.cpf.replace(/\D/g, '');
    const registro = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      protocolo: gerarProtocolo(),
      servicoId: s.id, servicoNome: s.nome, duracaoMin: s.duracaoMin, duracao: s.duracao, preco: s.preco,
      profId: p.id, profNome: p.nome,
      data: estado.data, hora: estado.hora,
      // O CPF completo não é guardado: apenas os dois últimos dígitos
      paciente: { nome: d.nome.trim(), cpf: `***.***.***-${cpfNumeros.slice(9)}`, tel: d.tel, email: d.email.trim() },
      status: 'confirmado',
      criadoEm: new Date().toISOString(),
    };
    salvarReservas([...lerReservas(), registro]);
    estado.concluido = registro;
    estado.aviso = '';
    render(true);
    $('#agenda').scrollIntoView({ block: 'start' });
  }

  function htmlSucesso(r) {
    const palestra = r.servicoId === 'palestras';
    const linhas = [
      ['Serviço', r.servicoNome], ['Profissional', r.profNome],
      ['Data', dataLonga(r.data)], ['Horário', fmtHora(r.hora)],
      ['Local', CONFIG.endereco], ['Paciente', r.paciente.nome],
    ];
    const msg = `Olá! Acabei de agendar pelo site da Mamãe Serena.\n\nProtocolo: ${r.protocolo}\nServiço: ${r.servicoNome}\nProfissional: ${r.profNome}\nData: ${dataLonga(r.data)}, às ${fmtHora(r.hora)}\nNome: ${r.paciente.nome}`;
    return `
      <div class="sucesso">
        <div class="sucesso-icone"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h3 class="painel-titulo" id="painel-titulo" tabindex="-1">Agendamento realizado com sucesso!</h3>
        <p>${palestra ? 'Sua vaga foi reservada.' : 'Sua consulta foi agendada.'} Confira os detalhes do atendimento.</p>
        <span class="protocolo">Protocolo ${esc(r.protocolo)}</span>
        ${linhasResumo(linhas)}
        <div class="sucesso-acoes">
          <a class="btn btn-primario" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Enviar confirmação no WhatsApp</a>
          <button type="button" class="btn btn-secundario" data-acao="ics" data-id="${r.id}">Adicionar ao calendário</button>
          <button type="button" class="btn-texto" data-acao="novo">Fazer outro agendamento</button>
        </div>
      </div>`;
  }

  function baixarICS(r) {
    const ini = deISO(r.data);
    const [h, m] = r.hora.split(':').map(Number);
    ini.setHours(h, m, 0, 0);
    const fim = new Date(ini.getTime() + r.duracaoMin * 60000);
    const f = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const t = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const linhas = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mamae Serena//Agendamento//PT-BR', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${r.id}@mamaeserena`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART:${f(ini)}`, `DTEND:${f(fim)}`,
      `SUMMARY:${t(`Mamãe Serena: ${r.servicoNome} com ${r.profNome}`)}`,
      `LOCATION:${t(CONFIG.endereco)}`,
      `DESCRIPTION:${t(`Protocolo ${r.protocolo}`)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Atendimento em 1 hora', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ];
    const blob = new Blob([linhas.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mamae-serena-${r.data}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ----- Meus agendamentos -----
  function renderMeus() {
    const lista = lerReservas().filter(r => r.status === 'confirmado')
      .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    el.meus.hidden = lista.length === 0;
    el.meusLista.innerHTML = lista.map(r => {
      const cancelando = estado.cancelando === r.id;
      return `<li>
        <div>
          <strong>${esc(r.servicoNome)} com ${esc(r.profNome)}</strong>
          <span>${esc(dataLonga(r.data))}, às ${fmtHora(r.hora)}. Protocolo ${esc(r.protocolo)}.</span>
        </div>
        <div class="acoes">
          ${cancelando
            ? `<button type="button" class="btn btn-primario btn-pequeno" data-acao="cancelar-sim" data-id="${r.id}">Confirmar cancelamento</button>
               <button type="button" class="btn btn-secundario btn-pequeno" data-acao="cancelar-nao">Manter</button>`
            : `<button type="button" class="btn btn-secundario btn-pequeno" data-acao="cancelar" data-id="${r.id}">Cancelar</button>`}
        </div>
      </li>`;
    }).join('');
  }

  // ----- Eventos -----
  function iniciarAgendamento() {
    if (!el.painel) return;

    el.painel.addEventListener('change', e => {
      const t = e.target;
      if (t.name === 'servico') { definirServico(t.value); atualizarAvancar(); renderResumo(); }
      else if (t.name === 'prof') { definirProf(t.value); atualizarAvancar(); renderResumo(); }
      else if (t.name === 'hora') { estado.hora = t.value; atualizarAvancar(); renderResumo(); }
      else if (t.name === 'ok') { estado.paciente.ok = t.checked; limparErro('ok'); }
    });

    el.painel.addEventListener('input', e => {
      const t = e.target;
      if (!t.matches('.campo input[type="text"], .campo input[type="tel"], .campo input[type="email"]')) return;
      if (t.name === 'cpf') t.value = mascaraCPF(t.value);
      if (t.name === 'tel') t.value = mascaraTel(t.value);
      estado.paciente[t.name] = t.value;
      limparErro(t.name);
    });

    el.painel.addEventListener('click', e => {
      const dia = e.target.closest('.cal-dia');
      if (dia && !dia.disabled) {
        definirData(dia.dataset.data);
        renderCalendario(`[data-data="${dia.dataset.data}"]`);
        atualizarAvancar(); renderResumo();
        return;
      }
      const nav = e.target.closest('[data-cal-nav]');
      if (nav) {
        const passo = Number(nav.dataset.calNav);
        estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() + passo, 1);
        renderCalendario(`[data-cal-nav="${passo}"]`);
        if (!$(`[data-cal-nav="${passo}"]:not(:disabled)`)) $(`[data-cal-nav="${-passo}"]`)?.focus();
        return;
      }
      const acao = e.target.closest('[data-acao]');
      if (!acao) return;
      switch (acao.dataset.acao) {
        case 'voltar': estado.etapa = Math.max(1, estado.etapa - 1); estado.aviso = ''; render(true); break;
        case 'continuar': avancar(); break;
        case 'confirmar': confirmar(); break;
        case 'novo': estado = { ...estadoInicial(), paciente: { ...estado.paciente, ok: false } }; render(true); break;
        case 'ics': { const r = lerReservas().find(x => x.id === acao.dataset.id); if (r) baixarICS(r); break; }
      }
    });

    el.meusLista.addEventListener('click', e => {
      const b = e.target.closest('[data-acao]');
      if (!b) return;
      const acao = b.dataset.acao;
      if (acao === 'cancelar') { estado.cancelando = b.dataset.id; renderMeus(); $('[data-acao="cancelar-sim"]', el.meusLista)?.focus(); }
      if (acao === 'cancelar-nao') { estado.cancelando = null; renderMeus(); }
      if (acao === 'cancelar-sim') {
        salvarReservas(lerReservas().map(r => r.id === b.dataset.id ? { ...r, status: 'cancelado' } : r));
        estado.cancelando = null;
        if (estado.concluido && estado.concluido.id === b.dataset.id) estado = estadoInicial();
        render();
      }
    });

    // Botões "Agendar" espalhados pelo site
    document.addEventListener('click', e => {
      const porServico = e.target.closest('[data-agendar]');
      const porProf = e.target.closest('[data-agendar-prof]');
      if (!porServico && !porProf) return;
      const antigo = estado.concluido ? estadoInicial() : estado;
      estado = { ...antigo, concluido: null, aviso: '', erros: {} };
      if (porProf) {
        const p = profPorId(porProf.dataset.agendarProf);
        definirServico(p.servico); definirProf(p.id); estado.etapa = 3;
      } else {
        definirServico(porServico.dataset.agendar); estado.etapa = 2;
      }
      render();
    });

    render();
  }

  function avancar() {
    const etapa = ETAPAS[estado.etapa - 1].id;
    if (etapa === 'dados') {
      estado.erros = validarDados();
      const chaves = Object.keys(estado.erros);
      if (chaves.length) {
        renderPainel();
        const primeiro = $(`#f-${chaves[0]}`);
        if (primeiro) primeiro.focus();
        return;
      }
    }
    if (!etapaValida()) return;
    estado.etapa = Math.min(ETAPAS.length, estado.etapa + 1);
    estado.aviso = '';
    render(true);
  }

  function limparErro(nome) {
    if (!estado.erros[nome]) return;
    delete estado.erros[nome];
    const campo = $(`#f-${nome}`);
    if (campo) campo.removeAttribute('aria-invalid');
    const msg = $(`#e-${nome}`);
    if (msg) msg.textContent = '';
  }

  /* ---------------------------------------------------------
     Início
     --------------------------------------------------------- */
  aplicarModoDemo();
  iniciarMenu();
  iniciarSaibaMais();
  iniciarBotaoWhatsApp();
  renderizarEquipe();
  renderizarProgramacao();
  iniciarAgendamento();
})();
