import { clamp } from '../core/math/util.js';
import { cfg } from './config.js';
import { $, cl, Q } from './dom.js';
import { uiState } from './app-loop.js';
import { newGame, save } from '../persistence/storage.js';
import { CITY_RANKS } from '../core/constants.js';
import { saveRemoteCity } from '../persistence/remote-storage.js';

export const NG = { size: 48, type: 'lake', starter: 1 };

export const NGO = {
  size: [[32, 'Pequeno 32x32'], [48, 'Médio 48x48'], [64, 'Grande 64x64'], [96, 'Enorme 96x96']],
  type: [['continent', 'Continente'], ['island', 'Ilha'], ['river', 'Rio'], ['lake', 'Lago']],
  starter: [[1, 'Vila pronta'], [0, 'Terreno vazio']]
};

export const spark = (a, col) => {
  if (a.length < 2) return '<svg class="in"></svg>';
  const mn = Math.min.apply(null, a), mx = Math.max.apply(null, a), sp = mx - mn || 1;
  return '<svg class="in" viewBox="0 0 100 40" preserveAspectRatio="none" shape-rendering="crispEdges"><polyline fill="none" stroke="' + col + '" stroke-width="2" points="' + a.map((v, i) => (i / (a.length - 1) * 100).toFixed(1) + ',' + (38 - (v - mn) / sp * 36).toFixed(1)).join(' ') + '"/></svg>';
};

const row = (l, r, c) => '<div class="r in ' + (c || '') + '"><span>' + l + '</span><span>' + r + '</span></div>';
const hd = (t) => '<div class="h">' + t + '</div>';
const step = (k, v) => '<button class="pb sm" data-k="' + k + '" data-d="-1">-</button> <b>' + v + '</b> <button class="pb sm" data-k="' + k + '" data-d="1">+</button>';
const cyc = (k) => {
  const o = NGO[k], i = Math.max(0, o.findIndex(a => a[0] === NG[k]));
  return '<button class="pb sm" data-n="' + k + '" data-d="-1">&lt;</button> <b>' + o[i][1] + '</b> <button class="pb sm" data-n="' + k + '" data-d="1">&gt;</button>';
};

export function openModal(t) {
  uiState.tab = t;
  $('win').style.display = 'flex';
  drawModal();
}

export function closeModal() {
  $('win').style.display = 'none';
  uiState.dirty = true;
}

export function drawModal() {
  const g = uiState.g;
  const tab = uiState.tab;
  const T = [['budget', 'Orçamento'], ['stats', 'Cidade'], ['ranks', 'Marcos'], ['log', 'Mensagens'], ['new', 'Novo jogo']];
  $('tabs').innerHTML = T.map(a => '<button class="pb sm' + (a[0] === tab ? ' sel' : '') + '" data-t="' + a[0] + '">' + a[1] + '</button>').join('');
  let h = '';
  if (tab === 'budget') {
    const L = g.last || {}, debtTotal = g.debtTotal || 0, inf = g.inflation || 4;
    const net = (L.tr || 0) + (L.tc || 0) + (L.ti || 0) + (L.revCom || 0) + (L.revInd || 0) + (L.revExp || 0) + (L.rent || 0) - (L.up || 0);

    h += hd('RECEITA MUNICIPAL DIVERSIFICADA');
    h += row('Impostos R / C / I', `R $${L.tr || 0} • C $${L.tc || 0} • I $${L.ti || 0}`, 'g');
    h += row('Receita Comercial (Vendas Locais)', `$${L.revCom || 0}`, 'g');
    h += row('Receita Industrial (Produção)', `$${L.revInd || 0}`, 'g');
    h += row('Exportações e Comércio Externo', `$${L.revExp || 0}`, 'g');
    if (L.rent > 0) h += row('Rendimento de Reservas', `+$${L.rent}`, 'g');

    h += hd('ALÍQUOTAS TRIBUTÁRIAS');
    h += row('Imposto Residencial (IPTU)', step('r', g.tax.r + '%'));
    h += row('Imposto Comercial (ISS)', step('c', g.tax.c + '%'));
    h += row('Imposto Industrial (ICMS)', step('i', g.tax.i + '%'));
    h += '<div class="dim">Impostos elevados aumentam a arrecadação imediata, mas reduzem investimentos e geram fuga de moradores.</div>';

    h += hd('DÍVIDA PÚBLICA E CRÉDITO GOVERNAMENTAL');
    h += row('Saldo Devedor Total', `<b>$${debtTotal.toLocaleString()}</b>`, debtTotal > 0 ? 'b' : 'g');
    h += row('Taxa de Juros (Selic)', step('int', g.interest + '%'));
    h += row('Amortização Mensal Paga', `$${L.debtAmort || 0}/mês`);
    h += row('Juros da Dívida Pagos', `$${L.debt || 0}/mês`, L.debt > 0 ? 'b' : '');
    h += row('Empréstimos Tomados', `${g.loansCount || 0} operação(ões)`);
    h += '<div class="dim">O saldo nunca fica negativo. Déficits acionam linhas de crédito governamentais automáticas com amortização mensal.</div>';

    h += hd('DESPESAS E CUSTEIO MUNICIPAL');
    h += row('Custeio Operacional Total', `$${L.up || 0}/mês`, 'b');
    h += row('Inflação de Preços', `<b>${inf.toFixed(1)}%</b>`, inf > 9 ? 'b' : '');
    h += row('Superávit / Déficit Líquido', (net >= 0 ? '+' : '') + `$${net}/mês`, net >= 0 ? 'g' : 'b');

    h += hd('HISTÓRICO FINANCEIRO');
    h += '<div class="dim">Caixa Disponível</div>' + spark(g.hist.funds, '#ffd54a') + '<div class="dim">População</div>' + spark(g.hist.pop, '#7be08a') + '<div class="dim">Inflação</div>' + spark(g.hist.inf || [], '#ff8a7a');
  } else if (tab === 'stats') {
    const s = g.stats, pc = g.popC, tot = pc[0] + pc[1] + pc[2] || 1, ap = [g.apP, Math.round((g.apP + g.apR) / 2), g.apR];
    const curRank = CITY_RANKS[g.cityRank || 0] || CITY_RANKS[0];
    const nextRank = CITY_RANKS[(g.cityRank || 0) + 1];
    h += hd('DEMOGRAFIA E MERCADO DE TRABALHO REALISTA');
    h += row('População Total Residente', `<b>${(g.pop || 0).toLocaleString()} habitantes</b>`, 'g');
    h += row('População Economicamente Ativa (PEA)', `${(g.pea || 0).toLocaleString()} pessoas (~55%)`);
    h += row('Trabalhadores Empregados', `${(g.employed || 0).toLocaleString()}`);
    h += row('Taxa de Desemprego', `<b>${Math.round((g.unemp || 0) * 100)}%</b> (${(g.unempCount || 0).toLocaleString()} desempregados)`, (g.unemp || 0) > 0.15 ? 'b' : 'g');
    h += row('Postos de Trabalho Disponíveis', `${(g.jobs || 0).toLocaleString()} vagas preenchidas • ${(g.jobsAvail || 0).toLocaleString()} vagas livres`);

    h += hd('PROGRESSÃO E RANK MUNICIPAL') +
      row('Nível da Cidade', '<b>' + curRank.name + ' (Nível ' + (g.cityRank || 0) + ')</b>', 'g') +
      row('Pontos da Cidade', '<b>' + (g.cityPoints || 0) + ' pts</b>') +
      (nextRank ? row('Próxima Meta (' + nextRank.name + ')', g.pop + ' / ' + nextRank.minPop + ' hab', g.pop < nextRank.minPop ? 'b' : 'g') : row('Status', '<b>METRÓPOLE MÁXIMA</b>', 'g'));
    h += hd('POPULAÇÃO POR CLASSE') + ['Pobre', 'Média', 'Elite'].map((n, c) => row(n + ' (' + Math.round(pc[c] / tot * 100) + '%)', pc[c] + ' hab. | aprov. ' + ap[c] + '%', ap[c] < 35 ? 'b' : '')).join('');
    h += hd('POLÍTICA') + row('Aprovação popular', g.apP + '%', g.apP < 35 ? 'b' : '') + row('Aprovação da Elite', g.apR + '%', g.apR < 35 ? 'b' : '') + row('Bairros em protesto', g.nProt, g.nProt ? 'b' : '') + row('Fábricas em greve', g.strikes, g.strikes ? 'b' : '');
    h += hd('CIDADE') + [['Empregos', g.jobs], ['Desemprego', Math.round(g.unemp * 100) + '%'], ['Felicidade', g.happy + '%'], ['Índice de crime', g.crimeIdx + '%'], ['Energia (oferta/demanda)', g.pwS + ' / ' + g.pwD], ['Água (oferta/demanda)', g.wtS + ' / ' + g.wtD], ['Prédios R / C / I', g.nRes + ' / ' + g.nCom + ' / ' + g.nInd], ['Ruas', g.roads], ['Demanda R / C / I', Math.round(g.demand.r * 100) + ' / ' + Math.round(g.demand.c * 100) + ' / ' + Math.round(g.demand.i * 100)], ['Incêndios', s.fires], ['Crimes resolvidos', s.solved], ['Crimes impunes', s.lost]].map(a => row(a[0], a[1])).join('');
    h += '<div class="dim">Escolas e hospitais perto de bairros pobres elevam a classe social. Protestos param impostos e empregos: baixe impostos, controle a inflação ou mande a polícia.</div>';
  } else if (tab === 'ranks') {
    h += hd('TRILHA DE MARCOS MUNICIPAIS');
    h += '<div class="dim" style="margin-bottom:8px">Cresça a população para desbloquear novas estruturas e tecnologias, além de receber bônus direto no tesouro.</div>';
    CITY_RANKS.forEach(rk => {
      const isReached = (g.cityRank || 0) >= rk.rank;
      const isCurrent = (g.cityRank || 0) === rk.rank;
      const progress = isReached ? 100 : Math.min(100, Math.round((g.pop / (rk.minPop || 1)) * 100));
      const statusBadge = isReached
        ? '<span style="color:#7be08a;font-weight:700">✓ CONCLUÍDO</span>'
        : (isCurrent ? '<span style="color:#ffd24a;font-weight:700">★ ATUAL</span>' : `<span style="color:#8bb3cf">${progress}% (${g.pop}/${rk.minPop})</span>`);

      h += `<div class="r in ${isReached ? 'g' : ''}" style="flex-direction:column;align-items:stretch;gap:4px;padding:8px 10px;margin-bottom:6px;border-left:3px solid ${isReached ? '#7be08a' : (isCurrent ? '#ffd24a' : '#1c6b9e')}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <b style="color:${isReached ? '#fff' : '#a4c8e0'}">Nível ${rk.rank}: ${rk.name}</b>
          ${statusBadge}
        </div>
        <div style="font-size:11px;color:#d8ecf8">${rk.desc}</div>
        <div style="font-size:11px;color:#ffd24a">🔓 Desbloqueia: <b>${rk.unlocks}</b></div>
        ${rk.bonus > 0 ? `<div style="font-size:11px;color:#7be08a">💰 Bônus municipal: <b>+$${rk.bonus.toLocaleString()}</b></div>` : ''}
      </div>`;
    });
  } else if (tab === 'log') {
    h += g.logs.length ? g.logs.map(l => '<div class="lg ' + l.lvl + '">' + l.t + ' - ' + cl(l.m) + '</div>').join('') : '<div class="dim">Sem mensagens ainda.</div>';
  } else {
    h += row('Tamanho', cyc('size')) + row('Tipo de mapa', cyc('type')) + row('Cidade inicial', cyc('starter')) + row('Confirmar antes de construir', '<button class="pb sm" id="nCf">' + (cfg.confirm ? 'SIM' : 'NÃO') + '</button>') + '<div style="margin-top:8px; display: flex; gap: 8px;"><button class="pb ok" id="nGo">CRIAR CIDADE</button><button class="pb no" id="nMenu">SALVAR E SAIR PARA O MENU</button></div>';
  }
  $('wc').innerHTML = h;
  Q('#tabs [data-t]', b => { b.onclick = () => { uiState.tab = b.dataset.t; drawModal(); }; });
  Q('#wc [data-k]', b => {
    b.onclick = () => {
      const k = b.dataset.k, d = +b.dataset.d;
      if (k === 'int') g.interest = clamp(g.interest + d, 1, 25);
      else g.tax[k] = clamp(g.tax[k] + d, 0, 30);
      g.recalc();
      drawModal();
    };
  });
  Q('#wc [data-n]', b => {
    b.onclick = () => {
      const k = b.dataset.n, o = NGO[k], i = Math.max(0, o.findIndex(a => a[0] === NG[k]));
      NG[k] = o[(i + (+b.dataset.d) + o.length) % o.length][0];
      drawModal();
    };
  });
  const cf = $('nCf'); if (cf) cf.onclick = () => { cfg.confirm = !cfg.confirm; drawModal(); };
  const go = $('nGo'); if (go) go.onclick = () => { newGame({ size: NG.size, type: NG.type, starter: NG.starter === 1 }); save(); closeModal(); };
  const menu = $('nMenu');
  if (menu) {
    menu.onclick = async () => {
      if (uiState.g && uiState.g.id) {
        try {
          await saveRemoteCity(uiState.g.id, uiState.g.toJSON());
        } catch (e) {}
      }
      closeModal();
      if (window.DeltaScreenManager) window.DeltaScreenManager.showTitleScreen();
    };
  }
}

export function initModals() {
  $('wx').onclick = closeModal;
}
