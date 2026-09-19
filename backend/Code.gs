/* Google Apps Script V8. Planilha privada; implantar como aplicativo da web.
   Execute instalar() uma vez. Veja ATIVAR.md antes de publicar. */
const ZONA = 'America/Sao_Paulo';
const ENDERECO = 'Rua das Acácias, 456, Jardim Belval, Barueri/SP';
const WHATSAPP = '5511978657116';
const HORAS = ['08:00', '09:30', '11:00', '14:00', '15:30'];
const PROF = {
  helena: { nome: 'Helena Duarte', servico: 'psicologia', dias: [1,3,5], capacidade: 1 },
  beatriz: { nome: 'Beatriz Nogueira', servico: 'psicologia', dias: [2,4,5], capacidade: 1 },
  camila: { nome: 'Camila Ribeiro', servico: 'doula', dias: [1,2,3,4,5], capacidade: 1 },
  marina: { nome: 'Marina Castro', servico: 'palestras', dias: [1,3,5], capacidade: 15 },
};
const SERV = {
  psicologia: { nome: 'Psicólogas', preco: 200, duracao: '1h30', duracaoMin: 90 },
  doula: { nome: 'Doula', preco: 300, duracao: '1h30', duracaoMin: 90 },
  palestras: { nome: 'Palestras gratuitas', preco: 0, duracao: '1h', duracaoMin: 60 },
};
function instalar() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PLANILHA_ID')) {
    const ss = SpreadsheetApp.create('Mamãe Serena — Agendamentos privados');
    ss.setSpreadsheetTimeZone(ZONA);
    ss.getSheets()[0].setName('Reservas').appendRow(['Registro JSON — não editar manualmente']);
    props.setProperty('PLANILHA_ID', ss.getId());
  }
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'reenviarPendentes')) {
    ScriptApp.newTrigger('reenviarPendentes').timeBased().everyMinutes(5).create();
  }
  MailApp.getRemainingDailyQuota(); // Solicita permissão de envio na instalação.
  console.log('Planilha privada: https://docs.google.com/spreadsheets/d/' + props.getProperty('PLANILHA_ID'));
}
function planilha() {
  const id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  if (!id) throw new Error('A agenda ainda não foi ativada. Entre em contato pelo WhatsApp.');
  return SpreadsheetApp.openById(id).getSheetByName('Reservas');
}
function ler(sheet) {
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().map((v,i) => ({ linha: i+2, r: JSON.parse(v[0]) }));
}
function salvar(sheet, entrada) {
  sheet.getRange(entrada.linha,1).setValue(JSON.stringify(entrada.r));
  SpreadsheetApp.flush();
}
function resposta(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || e.postData.contents.length > 5000) throw new Error('Solicitação inválida.');
    const b = JSON.parse(e.postData.contents);
    if (!lock.tryLock(20000)) throw new Error('A agenda está ocupada. Tente novamente em instantes.');
    const sheet = planilha(), lista = ler(sheet);
    if (b.acao === 'disponibilidade') {
      const ocupacao = {};
      const hoje = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
      lista.forEach(({r}) => {
        if (r.status === 'confirmado' && r.data >= hoje) {
          const k = r.profId + '|' + r.data + '|' + r.hora;
          ocupacao[k] = (ocupacao[k] || 0) + 1;
        }
      });
      return resposta({ ok: true, ocupacao });
    }
    if (b.acao === 'cancelar') {
      const item = lista.find(x => x.r.id === b.id && x.r.token === b.token && typeof b.token === 'string');
      if (!item) throw new Error('Não foi possível localizar esta reserva. Entre em contato pelo WhatsApp.');
      item.r.status = 'cancelado'; salvar(sheet,item);
      return resposta({ ok: true });
    }
    if (b.acao !== 'reservar') throw new Error('Solicitação inválida.');
    const dados = validar(b);
    const assinatura = JSON.stringify(dados);
    const existente = lista.find(x => x.r.id === b.id);
    if (existente) {
      if (existente.r.assinatura !== assinatura) throw new Error('Solicitação inconsistente. Atualize a página.');
      if (existente.r.status !== 'confirmado') throw new Error('Esta reserva foi cancelada. Inicie outro agendamento.');
      if (!existente.r.emailEnviado) enviar(sheet,existente);
      return resposta({ ok: true, reserva: publico(existente.r) });
    }
    const ocupadas = lista.filter(({r}) => r.status === 'confirmado' && r.profId === dados.profId && r.data === dados.data && r.hora === dados.hora).length;
    if (ocupadas >= PROF[dados.profId].capacidade) throw new Error('Este horário acabou de ser ocupado. Volte e escolha outro horário.');
    const hoje = Utilities.formatDate(new Date(),ZONA,'yyyy-MM-dd');
    const recentes = lista.filter(({r}) => r.paciente.email === dados.paciente.email && r.criadoEm.slice(0,10) === hoje);
    if (recentes.length >= 3) throw new Error('Para mais agendamentos, entre em contato pelo WhatsApp.');
    if (MailApp.getRemainingDailyQuota() < 1) throw new Error('O envio de confirmações está temporariamente indisponível. Tente mais tarde ou entre em contato pelo WhatsApp.');
    const s = SERV[dados.servicoId], p = PROF[dados.profId];
    const r = { ...dados, id: b.id, assinatura,
      protocolo: 'MS-' + Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase(),
      token: Utilities.getUuid() + Utilities.getUuid(),
      servicoNome: s.nome, profNome: p.nome, preco: s.preco, duracao: s.duracao, duracaoMin: s.duracaoMin,
      status: 'confirmado', criadoEm: Utilities.formatDate(new Date(),ZONA,"yyyy-MM-dd'T'HH:mm:ssXXX"),
      emailEnviado: false, tentativasEmail: 0 };
    sheet.appendRow([JSON.stringify(r)]);
    SpreadsheetApp.flush();
    const item = { linha: sheet.getLastRow(), r };
    enviar(sheet,item);
    return resposta({ ok: true, reserva: publico(r) });
  } catch (erro) {
    // Não expõe dados internos do Google ou informações de outros pacientes.
    const seguras = /^(A agenda|O envio|O agendamento|Solicitação|Não foi possível|Este horário|Para mais|Informe|Selecione|Concorde|Esta reserva)/;
    return resposta({ ok: false, erro: seguras.test(erro.message) ? erro.message : 'Não foi possível processar a solicitação. Tente novamente ou entre em contato pelo WhatsApp.' });
  } finally { if (lock.hasLock()) lock.releaseLock(); }
}
function validar(b) {
  if (typeof b.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(b.id)) throw new Error('Solicitação inválida.');
  const p = Object.hasOwn(PROF,b.profId) && PROF[b.profId];
  if (!p || p.servico !== b.servicoId) throw new Error('Selecione um serviço e uma profissional válidos.');
  if (typeof b.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.data)) throw new Error('Selecione uma data válida.');
  const data = new Date(b.data + 'T12:00:00Z');
  if (isNaN(data) || data.toISOString().slice(0,10) !== b.data) throw new Error('Selecione uma data válida.');
  const hoje = new Date(Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd') + 'T12:00:00Z');
  const distancia = (data-hoje)/86400000;
  const dia = data.getUTCDay();
  const horas = p.servico === 'palestras' ? [dia === 3 ? '15:00' : '10:00'] : HORAS;
  if (distancia < 1 || distancia > 90 || !p.dias.includes(dia) || !horas.includes(b.hora)) throw new Error('Selecione uma data e um horário disponíveis, de amanhã até 90 dias.');
  const nome = String(b.paciente?.nome || '').trim();
  const email = String(b.paciente?.email || '').trim().toLowerCase();
  const tel = String(b.paciente?.tel || '').replace(/\D/g,'');
  if (nome.length < 5 || nome.length > 120 || nome.split(/\s+/).length < 2 || /[\r\n]/.test(nome)) throw new Error('Informe seu nome completo.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Informe um e-mail válido.');
  if (!/^\d{10,11}$/.test(tel)) throw new Error('Informe um telefone com DDD.');
  if (b.consentimento !== true) throw new Error('Concorde com o uso dos dados para o agendamento.');
  return { servicoId: b.servicoId, profId: b.profId, data: b.data, hora: b.hora, paciente: { nome, email, tel }, consentimento: true };
}
function publico(r) {
  const { assinatura, tentativasEmail, ...reserva } = r;
  return reserva;
}
function textoEmail(r) {
  const data = r.data.split('-').reverse().join('/');
  const valor = r.preco === 0 ? 'Gratuito' : 'R$ ' + r.preco.toFixed(2).replace('.',',');
  const tema = r.servicoId === 'palestras' ? '\nTema: ' + ({1:'Saúde mental na gestação e ansiedade durante a gravidez',3:'Preparação para o pós-parto e cuidados com o bebê',5:'Mudanças emocionais na maternidade e rede de apoio'})[new Date(r.data+'T12:00:00Z').getUTCDay()] : '';
  return 'Olá, ' + r.paciente.nome + '!\n\nSeu agendamento na Mamãe Serena está confirmado.\n\n' +
    'Protocolo: ' + r.protocolo + '\nServiço: ' + r.servicoNome + '\nProfissional: ' + r.profNome +
    '\nData: ' + data + '\nHorário: ' + r.hora + ' (horário de Brasília)\nDuração: ' + r.duracao +
    '\nValor: ' + valor + '\nModalidade: presencial\nLocal: ' + ENDERECO + tema +
    '\n\nPara cancelar ou remarcar, avise com antecedência pelo WhatsApp: https://wa.me/' + WHATSAPP +
    '\nInforme seu protocolo ao entrar em contato.\n\nMamãe Serena — Estamos aqui para apoiar você em cada etapa.';
}
function enviar(sheet,item) {
  if (item.r.emailEnviado || item.r.status !== 'confirmado') return;
  item.r.tentativasEmail++;
  salvar(sheet,item);
  try {
    MailApp.sendEmail({ to: item.r.paciente.email, subject: 'Confirmação de agendamento — Mamãe Serena — ' + item.r.protocolo, body: textoEmail(item.r), name: 'Mamãe Serena' });
    item.r.emailEnviado = true;
  } catch (_) { item.r.emailEnviado = false; }
  salvar(sheet,item);
}
function reenviarPendentes() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const sheet = planilha();
    const hoje = Utilities.formatDate(new Date(),ZONA,'yyyy-MM-dd');
    for (const item of ler(sheet)) {
      if (MailApp.getRemainingDailyQuota() < 1) break;
      if (item.r.status === 'confirmado' && !item.r.emailEnviado && item.r.tentativasEmail < 6 && item.r.data >= hoje) enviar(sheet,item);
    }
  } finally { lock.releaseLock(); }
}

