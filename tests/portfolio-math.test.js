const assert = require('node:assert/strict');

function averageCostBasis(transactions) {
  let amount = 0;
  let totalCost = 0;

  for (const tx of transactions) {
    if (tx.type === 'BUY') {
      totalCost += tx.amount * tx.price + tx.fee;
      amount += tx.amount;
      continue;
    }

    if (amount <= 0) continue;
    const sellAmount = Math.min(tx.amount, amount);
    const avgCost = totalCost / amount;
    totalCost -= sellAmount * avgCost;
    totalCost = Math.max(0, totalCost - tx.fee);
    amount -= sellAmount;
  }

  return { amount, totalCost, avgCost: amount > 0 ? totalCost / amount : 0 };
}

function fifoCostBasis(transactions) {
  const lots = [];
  let buyFeesAcc = 0;

  for (const tx of transactions) {
    if (tx.type === 'BUY') {
      lots.push({ amount: tx.amount, price: tx.price });
      buyFeesAcc += tx.fee;
      continue;
    }

    let remain = tx.amount;
    while (remain > 0 && lots.length > 0) {
      const lot = lots[0];
      const consumed = Math.min(lot.amount, remain);
      lot.amount -= consumed;
      remain -= consumed;
      if (lot.amount <= 1e-12) lots.shift();
    }
  }

  const amount = lots.reduce((s, lot) => s + lot.amount, 0);
  const costWithoutFees = lots.reduce((s, lot) => s + lot.amount * lot.price, 0);
  const totalCost = Math.max(0, costWithoutFees + buyFeesAcc);
  return { amount, totalCost, avgCost: amount > 0 ? totalCost / amount : 0 };
}

function maxDrawdownPercent(values) {
  if (values.length < 2) return 0;
  let peak = values[0];
  let maxDd = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > peak) peak = values[i];
    if (peak > 0) {
      const dd = ((peak - values[i]) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    }
  }
  return maxDd;
}

function concentration(values) {
  const sorted = [...values].sort((a, b) => b - a);
  const total = sorted.reduce((s, v) => s + v, 0);
  if (total <= 0) return { top1: 0, top3: 0 };
  const top1 = (sorted[0] / total) * 100;
  const top3 = (sorted.slice(0, 3).reduce((s, v) => s + v, 0) / total) * 100;
  return { top1, top3 };
}

function near(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

(function testAverageCostBasis() {
  const tx = [
    { type: 'BUY', amount: 10, price: 100, fee: 0 },
    { type: 'BUY', amount: 10, price: 200, fee: 10 },
    { type: 'SELL', amount: 5, price: 300, fee: 5 }
  ];
  const result = averageCostBasis(tx);
  assert.equal(result.amount, 15);
  assert.ok(near(result.totalCost, 2252.5));
  assert.ok(near(result.avgCost, 150.16666666666666));
})();

(function testFifoCostBasis() {
  const tx = [
    { type: 'BUY', amount: 10, price: 100, fee: 0 },
    { type: 'BUY', amount: 10, price: 200, fee: 10 },
    { type: 'SELL', amount: 5, price: 300, fee: 5 }
  ];
  const result = fifoCostBasis(tx);
  assert.equal(result.amount, 15);
  assert.ok(near(result.totalCost, 2510));
  assert.ok(near(result.avgCost, 167.33333333333334));
})();

(function testMaxDrawdown() {
  const dd = maxDrawdownPercent([100, 130, 90, 120, 80, 150]);
  assert.ok(near(dd, 38.46153846153847));
})();

(function testConcentration() {
  const c = concentration([60, 20, 10, 10]);
  assert.ok(near(c.top1, 60));
  assert.ok(near(c.top3, 90));
})();

console.log('All portfolio math tests passed.');
