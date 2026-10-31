import { K, FAC, TAXM } from '../constants.js';
import { clamp } from '../math/util.js';

export const economyMethods = {
  monthTick() {
    let tr = 0, tc = 0, ti = 0;
    let revCom = 0, revInd = 0, revExp = 0;
    let upPower = 0, upWater = 0, upRoads = 0, upCity = 0;
    const T = this.tax;

    // 4.1 Arrecadação Tributária Proporcional à Ocupação e Nível
    this.bl.forEach(i => {
      if (!this.isOrigin(i) || this.ab[i] || this.riot[i] || (this.cons && this.cons.has(i))) return;
      const k = this.kind[i];
      const hasInfra = this.wtOn[i] && this.pwOn[i] && this.roadAdj[i];
      if (!hasInfra) return;

      if (k === K.RES || k === K.SKY_RES) {
        const p = this.popCapacityAt ? this.popCapacityAt(i) : 4;
        tr += p * 2.1 * (T.r / 10) * TAXM[this.cls[i]];
      } else if (k === K.IND) {
        const j = this.jobsCapacityAt ? this.jobsCapacityAt(i) : 6;
        ti += j * 2.3 * (T.i / 10);
      } else if (k === K.COM || k === K.SKY_COM || k === K.MEGA) {
        const j = this.jobsCapacityAt ? this.jobsCapacityAt(i) : 5;
        tc += j * 2.5 * (T.c / 10) * TAXM[this.cls[i]];
      }
    });

    // 4.2 Receita Comercial: Participação em vendas locais
    // Depende do poder de compra dos cidadãos empregados, proximidade e fluxo
    if (this.employed > 0 && this.nCom > 0) {
      const avgSalary = 28 + (this.cls ? 14 : 0);
      const purchasingPower = this.employed * avgSalary * 0.14;
      revCom = Math.min(purchasingPower, this.nCom * 42) * (1 - this.unemp * 0.5);
    }

    // 4.3 Receita Industrial: Produção física, salários e valor adicionado
    if (this.nInd > 0) {
      const activeFactories = this.nInd;
      const factoryOutput = activeFactories * 58;
      const opCosts = activeFactories * 22;
      revInd = Math.max(0, factoryOutput - opCosts) * (this.pwD <= this.pwS ? 1.0 : 0.6);
    }

    // 4.4 Exportações e Comércio Externo: Excedente da produção manufatureira
    if (this.nInd > this.nCom * 0.8 && this.roads > 10) {
      const surplus = Math.max(0, this.nInd - (this.pop * 0.08));
      revExp = Math.round(surplus * 26);
    }

    // 9. Orçamento Público e Despesas Recorrentes de Infraestrutura
    // - Rede e usinas de energia
    // - Rede de água e torres
    // - Malha viária e asfalto
    // - Serviços municipais (Polícia, Bombeiros, Hospitais, Escolas, Parques)
    for (let i = 0; i < this.kind.length; i++) {
      const k = this.kind[i];
      if (k === K.ROAD) upRoads += 1.4;
      else if (this.isOrigin(i) && this.built[i] && !this.cons.has(i)) {
        if (k === K.COAL || k === K.SOLAR) upPower += FAC[k].up;
        else if (k === K.WTOWER) upWater += FAC[k].up;
        else if (FAC[k] && FAC[k].up) upCity += FAC[k].up;
      }
    }

    // Manutenção de rede de canos e postes subterrâneos/aéreos
    let pipeCount = 0, pwLineCount = 0;
    if (this.pipe) for (let i = 0; i < this.pipe.length; i++) if (this.pipe[i]) pipeCount++;
    if (this.pw) for (let i = 0; i < this.pw.length; i++) if (this.pw[i]) pwLineCount++;
    upWater += pipeCount * 0.35;
    upPower += pwLineCount * 0.35;

    // Inflação impacta custos de custeio
    const itg = 4 + (10 - this.interest) * 2 - this.unemp * 100 / 5;
    this.inflation = clamp(this.inflation + (itg - this.inflation) * 0.25, 0, 40);
    const inflationFactor = 1 + (this.inflation * 1.5 / 100);

    let totalOpExpense = Math.round((upPower + upWater + upRoads + upCity) * inflationFactor);

    // 6. Sistema de Dívida Pública e Amortização de Empréstimos
    let debtInterest = 0, debtAmort = 0;
    if (this.debtTotal > 0) {
      // Juros mensais sobre o saldo devedor
      debtInterest = Math.round(this.debtTotal * (this.interest / 1200));
      // Amortização de 2.5% do principal por mês
      debtAmort = Math.min(this.debtTotal, Math.max(50, Math.round(this.debtTotal * 0.025)));
      this.debtTotal -= debtAmort;
    }

    // Rendimento financeiro de reservas positivas
    const rent = this.funds > 0 ? Math.round(this.funds * (this.interest * 0.6) / 1200) : 0;

    tr = Math.round(tr);
    tc = Math.round(tc);
    ti = Math.round(ti);
    revCom = Math.round(revCom);
    revInd = Math.round(revInd);
    revExp = Math.round(revExp);

    const totalIncome = tr + tc + ti + revCom + revInd + revExp + rent;
    const totalExpense = totalOpExpense + debtInterest + debtAmort;

    this.last = {
      tr, tc, ti,
      revCom, revInd, revExp,
      up: totalExpense,
      rent,
      debt: debtInterest,
      debtAmort
    };

    this.income = totalIncome;
    this.expense = totalExpense;
    this.funds += totalIncome - totalExpense;

    // 6. Financiamento Automático Governamental (O saldo nunca fica artificialmente negativo)
    if (this.funds < 0) {
      const deficit = -this.funds;
      // Toma empréstimo em blocos de $2.000 acima do déficit
      const loanAmount = Math.ceil((deficit + 800) / 1000) * 1000;
      this.funds += loanAmount;
      this.debtTotal = (this.debtTotal || 0) + loanAmount;
      this.loansCount = (this.loansCount || 0) + 1;
      this.log(`🏛️ Empréstimo Governamental aprovado: +$${loanAmount} creditados no caixa municipal (Juros: ${this.interest}% a.a.). Saldo devedor: $${this.debtTotal}.`, 'warn');
    }

    // Histórico para gráficos
    const h = this.hist;
    h.pop.push(this.pop);
    h.funds.push(this.funds);
    h.happy.push(this.happy);
    h.inf = h.inf || [];
    h.inf.push(+this.inflation.toFixed(1));
    if (h.pop.length > 60) { h.pop.shift(); h.funds.shift(); h.happy.shift(); }
    if (h.inf.length > 60) h.inf.shift();

    // Alertas de Gestão Municipal
    if (this.pwD > this.pwS) this.log('⚡ Sobrecarga na rede elétrica! Construa mais usinas.', 'bad');
    if (this.wtD > this.wtS) this.log('💧 Déficit na rede de água! Instale mais torres de água.', 'bad');
    if (this.unemp > 0.25) this.log(`⚠️ Desemprego elevado (${Math.round(this.unemp * 100)}%): incentive indústrias e comércios.`, 'bad');
    if (this.debtTotal > 50000) this.log(`⚠️ Dívida Pública Crítica ($${this.debtTotal}): o pagamento de juros está comprometendo o orçamento!`, 'bad');
    if (this.flight) {
      this.log('Fuga de capital: ' + this.flight + ' lote(s) da Elite abandonados (imposto residencial acima de 18%).', 'bad');
      this.flight = 0;
    }
  }
};
