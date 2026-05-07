const STORAGE_KEYS = {
  trades: "cryptoProfitTrades",
  manualPrices: "cryptoProfitManualPrices",
  goldPurchases: "goldPurchases",
  silverPurchases: "silverPurchases",
  manualMetalPrices: "manualMetalPrices"
}

const TROY_OZ_TO_GRAMS = 31.1035
const CARAT_PURITY = { 24: 1, 21: 21 / 24, 18: 18 / 24 }

const GOLD_NISAB_GRAMS = 85
const SILVER_NISAB_GRAMS = 595

const COINS = [
  { id: "btc-bitcoin", symbol: "BTC", name: "Bitcoin", binanceSymbol: "BTCUSDT", coinGeckoId: "bitcoin" },
  { id: "eth-ethereum", symbol: "ETH", name: "Ethereum", binanceSymbol: "ETHUSDT", coinGeckoId: "ethereum" },
  { id: "sol-solana", symbol: "SOL", name: "Solana", binanceSymbol: "SOLUSDT", coinGeckoId: "solana" },
  { id: "bnb-binance-coin", symbol: "BNB", name: "BNB", binanceSymbol: "BNBUSDT", coinGeckoId: "binancecoin" },
  { id: "xrp-xrp", symbol: "XRP", name: "XRP", binanceSymbol: "XRPUSDT", coinGeckoId: "ripple" },
  { id: "ada-cardano", symbol: "ADA", name: "Cardano", binanceSymbol: "ADAUSDT", coinGeckoId: "cardano" },
  { id: "doge-dogecoin", symbol: "DOGE", name: "Dogecoin", binanceSymbol: "DOGEUSDT", coinGeckoId: "dogecoin" },
  { id: "trx-tron", symbol: "TRX", name: "TRON", binanceSymbol: "TRXUSDT", coinGeckoId: "tron" },
  { id: "ton-toncoin", symbol: "TON", name: "Toncoin", binanceSymbol: "TONUSDT", coinGeckoId: "the-open-network" },
  { id: "avax-avalanche", symbol: "AVAX", name: "Avalanche", binanceSymbol: "AVAXUSDT", coinGeckoId: "avalanche-2" }
]

const state = {
  trades: loadJson(STORAGE_KEYS.trades, []),
  manualPrices: loadJson(STORAGE_KEYS.manualPrices, {}),
  livePrices: {},
  priceErrors: {},
  goldPurchases: loadJson(STORAGE_KEYS.goldPurchases, []),
  silverPurchases: loadJson(STORAGE_KEYS.silverPurchases, []),
  metalPrices: { gold: 0, silver: 0 },
  manualMetalPrices: loadJson(STORAGE_KEYS.manualMetalPrices, { gold: 0, silver: 0 }),
  metalErrors: {}
}

const elements = {
  tradeForm: document.querySelector("#tradeForm"),
  tradeDate: document.querySelector("#tradeDate"),
  coinId: document.querySelector("#coinId"),
  entryPrice: document.querySelector("#entryPrice"),
  formMessage: document.querySelector("#formMessage"),
  priceGrid: document.querySelector("#priceGrid"),
  priceStatus: document.querySelector("#priceStatus"),
  refreshPricesButton: document.querySelector("#refreshPricesButton"),
  summaryRows: document.querySelector("#summaryRows"),
  tradeRows: document.querySelector("#tradeRows"),
  clearTradesButton: document.querySelector("#clearTradesButton"),
  totalInvested: document.querySelector("#totalInvested"),
  totalValue: document.querySelector("#totalValue"),
  overallProfit: document.querySelector("#overallProfit"),
  emptyRowTemplate: document.querySelector("#emptyRowTemplate"),
  // Gold
  goldForm: document.querySelector("#goldForm"),
  goldDate: document.querySelector("#goldDate"),
  goldCarat: document.querySelector("#goldCarat"),
  goldEntryPrice: document.querySelector("#goldEntryPrice"),
  goldFormMessage: document.querySelector("#goldFormMessage"),
  goldTotalInvested: document.querySelector("#goldTotalInvested"),
  goldTotalValue: document.querySelector("#goldTotalValue"),
  goldTotalProfit: document.querySelector("#goldTotalProfit"),
  goldSummaryRows: document.querySelector("#goldSummaryRows"),
  goldPurchaseRows: document.querySelector("#goldPurchaseRows"),
  clearGoldButton: document.querySelector("#clearGoldButton"),
  goldPriceGrid: document.querySelector("#goldPriceGrid"),
  // Silver
  silverForm: document.querySelector("#silverForm"),
  silverDate: document.querySelector("#silverDate"),
  silverEntryPrice: document.querySelector("#silverEntryPrice"),
  silverFormMessage: document.querySelector("#silverFormMessage"),
  silverTotalInvested: document.querySelector("#silverTotalInvested"),
  silverTotalValue: document.querySelector("#silverTotalValue"),
  silverTotalProfit: document.querySelector("#silverTotalProfit"),
  silverSummaryRows: document.querySelector("#silverSummaryRows"),
  silverPurchaseRows: document.querySelector("#silverPurchaseRows"),
  clearSilverButton: document.querySelector("#clearSilverButton"),
  silverPriceGrid: document.querySelector("#silverPriceGrid"),
  // Zakah (result elements only — portfolio values are updated by ID in renderZakah)
  zakahNisabValue: document.querySelector("#zakahNisabValue"),
  zakahTotalWealth: document.querySelector("#zakahTotalWealth"),
  zakahDue: document.querySelector("#zakahDue"),
  nisabStatusBadge: document.querySelector("#nisabStatusBadge")
}

// ── Utilities ──

function loadJson(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key)
    if (!storedValue) return fallback
    return JSON.parse(storedValue)
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getCoin(coinId) {
  return COINS.find((coin) => coin.id === coinId) ?? COINS[0]
}

function getCurrentPrice(coinId) {
  const manualPrice = Number(state.manualPrices[coinId])
  if (Number.isFinite(manualPrice) && manualPrice > 0) return manualPrice
  const livePrice = Number(state.livePrices[coinId])
  if (Number.isFinite(livePrice) && livePrice > 0) return livePrice
  return 0
}

function getPriceSource(coinId) {
  const manualPrice = Number(state.manualPrices[coinId])
  const livePrice = Number(state.livePrices[coinId])
  if (Number.isFinite(manualPrice) && manualPrice > 0) return "manual"
  if (Number.isFinite(livePrice) && livePrice > 0) return "live"
  return "missing"
}

function getGoldPricePerGram() {
  if (state.manualMetalPrices.gold > 0) return state.manualMetalPrices.gold
  return state.metalPrices.gold > 0 ? state.metalPrices.gold / TROY_OZ_TO_GRAMS : 0
}

function getSilverPricePerGram() {
  if (state.manualMetalPrices.silver > 0) return state.manualMetalPrices.silver
  return state.metalPrices.silver > 0 ? state.metalPrices.silver / TROY_OZ_TO_GRAMS : 0
}

function getGoldPriceSource() {
  if (state.manualMetalPrices.gold > 0) return "manual"
  if (state.metalPrices.gold > 0) return "live"
  return "missing"
}

function getSilverPriceSource() {
  if (state.manualMetalPrices.silver > 0) return "manual"
  if (state.metalPrices.silver > 0) return "live"
  return "missing"
}

function formatUsd(value) {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) >= 1 ? 2 : 6,
    minimumFractionDigits: 2
  }).format(value)
  return `${formatted} USD`
}

function formatUsdt(value) {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) >= 1 ? 2 : 6,
    minimumFractionDigits: 2
  }).format(value)
  return `${formatted} USDT`
}

function formatNumber(value, maximumFractionDigits = 8) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value)
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date)
}

function profitClass(value) {
  if (value > 0) return "profit-positive"
  if (value < 0) return "profit-negative"
  return ""
}

function sourceLabel(source) {
  if (source === "live") return "Live"
  if (source === "manual") return "Manual"
  return "Needs price"
}

// ── Tab switching ──

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.tab === tabId)
  )
  document.querySelectorAll(".tab-panel").forEach((panel) =>
    panel.classList.toggle("hidden", panel.id !== `tab-${tabId}`)
  )
}

// ── Crypto rendering ──

function renderCoinOptions() {
  elements.coinId.innerHTML = COINS.map((coin) =>
    `<option value="${coin.id}">${coin.symbol} - ${coin.name}</option>`
  ).join("")
}

function renderPrices() {
  elements.priceGrid.innerHTML = COINS.map((coin) => {
    const currentPrice = getCurrentPrice(coin.id)
    const source = getPriceSource(coin.id)
    const errorMessage = state.priceErrors[coin.id]
      ? `<p class="form-message error">${state.priceErrors[coin.id]}</p>`
      : ""
    const manualValue = state.manualPrices[coin.id] ?? ""

    return `
      <article class="price-item">
        <header>
          <div>
            <strong>${coin.symbol}</strong>
            <p class="eyebrow">${coin.name}</p>
          </div>
          <span class="price-source ${source}">${sourceLabel(source)}</span>
        </header>
        <div class="price-value">${currentPrice > 0 ? formatUsdt(currentPrice) : "No price"}</div>
        <div class="manual-price-row">
          <label>
            <span>Manual current price</span>
            <input data-manual-price="${coin.id}" type="number" min="0" step="0.01" inputmode="decimal" value="${manualValue}" placeholder="Set price">
          </label>
          <button data-clear-price="${coin.id}" type="button">Clear</button>
        </div>
        ${errorMessage}
      </article>
    `
  }).join("")
}

function getTradeCalculations(trade) {
  const currentPrice = getCurrentPrice(trade.coinId)
  const quantity = trade.usdtSpent / trade.entryPrice
  const currentValue = quantity * currentPrice
  const profit = currentValue - trade.usdtSpent
  return { currentPrice, currentValue, profit, quantity }
}

function groupTradesByCoin() {
  return state.trades.reduce((groups, trade) => {
    const coin = getCoin(trade.coinId)
    const calculations = getTradeCalculations(trade)
    const existing = groups.get(trade.coinId) ?? {
      coin,
      invested: 0,
      quantity: 0,
      currentValue: 0,
      profit: 0,
      currentPrice: calculations.currentPrice
    }
    existing.invested += trade.usdtSpent
    existing.quantity += calculations.quantity
    existing.currentValue += calculations.currentValue
    existing.profit += calculations.profit
    existing.currentPrice = calculations.currentPrice
    groups.set(trade.coinId, existing)
    return groups
  }, new Map())
}

function renderSummary() {
  const groups = Array.from(groupTradesByCoin().values())
  if (groups.length === 0) {
    elements.summaryRows.innerHTML = '<tr><td colspan="6" class="empty-state">No coin totals yet.</td></tr>'
    return
  }
  elements.summaryRows.innerHTML = groups.map((group) => `
    <tr>
      <td>${group.coin.symbol}</td>
      <td>${formatUsdt(group.invested)}</td>
      <td>${formatNumber(group.quantity)} ${group.coin.symbol}</td>
      <td>${group.currentPrice > 0 ? formatUsdt(group.currentPrice) : "No price"}</td>
      <td>${formatUsdt(group.currentValue)}</td>
      <td class="${profitClass(group.profit)}">${formatUsdt(group.profit)}</td>
    </tr>
  `).join("")
}

function renderTotals() {
  const totals = state.trades.reduce((acc, trade) => {
    const calc = getTradeCalculations(trade)
    acc.invested += trade.usdtSpent
    acc.value += calc.currentValue
    acc.profit += calc.profit
    return acc
  }, { invested: 0, value: 0, profit: 0 })

  elements.totalInvested.textContent = formatUsdt(totals.invested)
  elements.totalValue.textContent = formatUsdt(totals.value)
  elements.overallProfit.textContent = formatUsdt(totals.profit)
  elements.overallProfit.className = profitClass(totals.profit)
}

function renderTrades() {
  if (state.trades.length === 0) {
    const clone = elements.emptyRowTemplate.content.cloneNode(true)
    elements.tradeRows.replaceChildren(clone)
    return
  }
  elements.tradeRows.innerHTML = state.trades.map((trade) => {
    const coin = getCoin(trade.coinId)
    const calc = getTradeCalculations(trade)
    return `
      <tr>
        <td>${formatDate(trade.tradeDate)}</td>
        <td>${coin.symbol}</td>
        <td>${formatUsdt(trade.usdtSpent)}</td>
        <td>${formatUsdt(trade.entryPrice)}</td>
        <td>${formatNumber(calc.quantity)} ${coin.symbol}</td>
        <td>${calc.currentPrice > 0 ? formatUsdt(calc.currentPrice) : "No price"}</td>
        <td>${formatUsdt(calc.currentValue)}</td>
        <td class="${profitClass(calc.profit)}">${formatUsdt(calc.profit)}</td>
        <td><button class="delete-button" data-delete-trade="${trade.id}" type="button">Delete</button></td>
      </tr>
    `
  }).join("")
}

function renderCrypto() {
  renderPrices()
  renderSummary()
  renderTotals()
  renderTrades()
}

// ── Gold rendering ──

function groupGoldByCarat() {
  return state.goldPurchases.reduce((groups, p) => {
    const carat = p.carat ?? 24
    const existing = groups.get(carat) ?? { carat, totalGrams: 0, totalPaid: 0, pureGrams: 0 }
    existing.totalGrams += p.weightGrams
    existing.totalPaid += p.totalPaid
    existing.pureGrams += p.weightGrams * CARAT_PURITY[carat]
    groups.set(carat, existing)
    return groups
  }, new Map())
}

function renderGoldPrice() {
  const pricePerGram = getGoldPricePerGram()
  const source = getGoldPriceSource()
  const pricePerOz = state.metalPrices.gold
  const manualValue = state.manualMetalPrices.gold > 0 ? state.manualMetalPrices.gold : ""
  const errorMessage = state.metalErrors.gold
    ? `<p class="form-message error">${state.metalErrors.gold}</p>`
    : ""

  elements.goldPriceGrid.innerHTML = `
    <article class="price-item">
      <header>
        <div>
          <strong>XAU</strong>
          <p class="eyebrow">Gold</p>
        </div>
        <span class="price-source ${source}">${sourceLabel(source)}</span>
      </header>
      <div class="price-value">${pricePerGram > 0 ? formatUsd(pricePerGram) + " / g" : "No price"}</div>
      ${pricePerOz > 0 ? `<p class="form-message">${formatUsd(pricePerOz)} / troy oz</p>` : ""}
      <div class="manual-price-row">
        <label>
          <span>Manual price (USD/gram)</span>
          <input data-manual-metal="gold" type="number" min="0" step="0.01" inputmode="decimal" value="${manualValue}" placeholder="Set price per gram">
        </label>
        <button data-clear-metal="gold" type="button">Clear</button>
      </div>
      ${errorMessage}
    </article>
  `
}

function renderGoldSummary() {
  if (state.goldPurchases.length === 0) {
    elements.goldSummaryRows.innerHTML = '<tr><td colspan="7" class="empty-state">No gold purchases yet.</td></tr>'
    return
  }
  const goldPrice24k = getGoldPricePerGram()
  const groups = Array.from(groupGoldByCarat().values()).sort((a, b) => b.carat - a.carat)

  elements.goldSummaryRows.innerHTML = groups.map((group) => {
    const purity = CARAT_PURITY[group.carat]
    const currentPriceForCarat = goldPrice24k * purity
    const currentValue = group.totalGrams * currentPriceForCarat
    const profit = currentValue - group.totalPaid
    const avgEntry = group.totalPaid / group.totalGrams
    return `
      <tr>
        <td><strong>${group.carat}k</strong></td>
        <td>${formatNumber(group.totalGrams, 3)} g</td>
        <td>${formatNumber(group.pureGrams, 3)} g</td>
        <td>${formatUsd(avgEntry)} / g</td>
        <td>${currentPriceForCarat > 0 ? formatUsd(currentPriceForCarat) + " / g" : "No price"}</td>
        <td>${formatUsd(currentValue)}</td>
        <td class="${profitClass(profit)}">${formatUsd(profit)}</td>
      </tr>
    `
  }).join("")
}

function renderGoldPurchases() {
  if (state.goldPurchases.length === 0) {
    elements.goldPurchaseRows.innerHTML = '<tr><td colspan="9" class="empty-state">No purchases yet. Add a gold purchase above.</td></tr>'
    return
  }
  const goldPrice24k = getGoldPricePerGram()
  elements.goldPurchaseRows.innerHTML = state.goldPurchases.map((p) => {
    const carat = p.carat ?? 24
    const purity = CARAT_PURITY[carat]
    const currentPriceForCarat = goldPrice24k * purity
    const currentValue = p.weightGrams * currentPriceForCarat
    const profit = currentValue - p.totalPaid
    return `
      <tr>
        <td>${formatDate(p.date)}</td>
        <td><strong>${carat}k</strong></td>
        <td>${formatNumber(p.weightGrams, 3)} g</td>
        <td>${formatUsd(p.totalPaid)}</td>
        <td>${formatUsd(p.entryPricePerGram)} / g</td>
        <td>${currentPriceForCarat > 0 ? formatUsd(currentPriceForCarat) + " / g" : "No price"}</td>
        <td>${formatUsd(currentValue)}</td>
        <td class="${profitClass(profit)}">${formatUsd(profit)}</td>
        <td><button class="delete-button" data-delete-gold="${p.id}" type="button">Delete</button></td>
      </tr>
    `
  }).join("")
}

function renderGoldMetrics() {
  const goldPrice24k = getGoldPricePerGram()
  const totals = state.goldPurchases.reduce((acc, p) => {
    const purity = CARAT_PURITY[p.carat ?? 24]
    acc.invested += p.totalPaid
    acc.value += p.weightGrams * goldPrice24k * purity
    return acc
  }, { invested: 0, value: 0 })
  const profit = totals.value - totals.invested

  elements.goldTotalInvested.textContent = formatUsd(totals.invested)
  elements.goldTotalValue.textContent = formatUsd(totals.value)
  elements.goldTotalProfit.textContent = formatUsd(profit)
  elements.goldTotalProfit.className = profitClass(profit)
}

function renderGold() {
  renderGoldPrice()
  renderGoldSummary()
  renderGoldPurchases()
  renderGoldMetrics()
}

// ── Silver rendering ──

function renderSilverPrice() {
  const pricePerGram = getSilverPricePerGram()
  const source = getSilverPriceSource()
  const pricePerOz = state.metalPrices.silver
  const manualValue = state.manualMetalPrices.silver > 0 ? state.manualMetalPrices.silver : ""
  const errorMessage = state.metalErrors.silver
    ? `<p class="form-message error">${state.metalErrors.silver}</p>`
    : ""

  elements.silverPriceGrid.innerHTML = `
    <article class="price-item">
      <header>
        <div>
          <strong>XAG</strong>
          <p class="eyebrow">Silver</p>
        </div>
        <span class="price-source ${source}">${sourceLabel(source)}</span>
      </header>
      <div class="price-value">${pricePerGram > 0 ? formatUsd(pricePerGram) + " / g" : "No price"}</div>
      ${pricePerOz > 0 ? `<p class="form-message">${formatUsd(pricePerOz)} / troy oz</p>` : ""}
      <div class="manual-price-row">
        <label>
          <span>Manual price (USD/gram)</span>
          <input data-manual-metal="silver" type="number" min="0" step="0.001" inputmode="decimal" value="${manualValue}" placeholder="Set price per gram">
        </label>
        <button data-clear-metal="silver" type="button">Clear</button>
      </div>
      ${errorMessage}
    </article>
  `
}

function renderSilverSummary() {
  if (state.silverPurchases.length === 0) {
    elements.silverSummaryRows.innerHTML = '<tr><td colspan="5" class="empty-state">No silver purchases yet.</td></tr>'
    return
  }
  const pricePerGram = getSilverPricePerGram()
  const totalGrams = state.silverPurchases.reduce((sum, p) => sum + p.weightGrams, 0)
  const totalInvested = state.silverPurchases.reduce((sum, p) => sum + p.totalPaid, 0)
  const avgEntry = totalInvested / totalGrams
  const currentValue = totalGrams * pricePerGram
  const profit = currentValue - totalInvested

  elements.silverSummaryRows.innerHTML = `
    <tr>
      <td>${formatNumber(totalGrams, 3)} g</td>
      <td>${formatUsd(avgEntry)} / g</td>
      <td>${pricePerGram > 0 ? formatUsd(pricePerGram) + " / g" : "No price"}</td>
      <td>${formatUsd(currentValue)}</td>
      <td class="${profitClass(profit)}">${formatUsd(profit)}</td>
    </tr>
  `
}

function renderSilverPurchases() {
  if (state.silverPurchases.length === 0) {
    elements.silverPurchaseRows.innerHTML = '<tr><td colspan="8" class="empty-state">No purchases yet. Add a silver purchase above.</td></tr>'
    return
  }
  const pricePerGram = getSilverPricePerGram()
  elements.silverPurchaseRows.innerHTML = state.silverPurchases.map((p) => {
    const currentValue = p.weightGrams * pricePerGram
    const profit = currentValue - p.totalPaid
    return `
      <tr>
        <td>${formatDate(p.date)}</td>
        <td>${formatNumber(p.weightGrams, 3)} g</td>
        <td>${formatUsd(p.totalPaid)}</td>
        <td>${formatUsd(p.entryPricePerGram)} / g</td>
        <td>${pricePerGram > 0 ? formatUsd(pricePerGram) + " / g" : "No price"}</td>
        <td>${formatUsd(currentValue)}</td>
        <td class="${profitClass(profit)}">${formatUsd(profit)}</td>
        <td><button class="delete-button" data-delete-silver="${p.id}" type="button">Delete</button></td>
      </tr>
    `
  }).join("")
}

function renderSilverMetrics() {
  const pricePerGram = getSilverPricePerGram()
  const totals = state.silverPurchases.reduce((acc, p) => {
    acc.invested += p.totalPaid
    acc.value += p.weightGrams * pricePerGram
    return acc
  }, { invested: 0, value: 0 })
  const profit = totals.value - totals.invested

  elements.silverTotalInvested.textContent = formatUsd(totals.invested)
  elements.silverTotalValue.textContent = formatUsd(totals.value)
  elements.silverTotalProfit.textContent = formatUsd(profit)
  elements.silverTotalProfit.className = profitClass(profit)
}

function renderSilver() {
  renderSilverPrice()
  renderSilverSummary()
  renderSilverPurchases()
  renderSilverMetrics()
}

// ── Zakah ──

function getZakahInput(id) {
  return Math.max(0, Number(document.querySelector(`#${id}`)?.value) || 0)
}

function getNisabBasis() {
  return document.querySelector('input[name="nisabBasis"]:checked')?.value ?? "gold"
}

function getPortfolioValues() {
  const goldPrice24k = getGoldPricePerGram()
  const silverPricePerGram = getSilverPricePerGram()

  const cryptoValue = state.trades.reduce((sum, trade) => sum + getTradeCalculations(trade).currentValue, 0)

  const goldTotals = state.goldPurchases.reduce((acc, p) => {
    const purity = CARAT_PURITY[p.carat ?? 24]
    acc.value += p.weightGrams * goldPrice24k * purity
    acc.pureGrams += p.weightGrams * purity
    return acc
  }, { value: 0, pureGrams: 0 })

  const silverTotals = state.silverPurchases.reduce((acc, p) => {
    acc.value += p.weightGrams * silverPricePerGram
    acc.grams += p.weightGrams
    return acc
  }, { value: 0, grams: 0 })

  return {
    cryptoValue,
    goldValue: goldTotals.value,
    goldPureGrams: goldTotals.pureGrams,
    silverValue: silverTotals.value,
    silverGrams: silverTotals.grams
  }
}

function renderZakah() {
  const goldPricePerGram = getGoldPricePerGram()
  const silverPricePerGram = getSilverPricePerGram()
  const portfolio = getPortfolioValues()

  // Portfolio display
  document.querySelector("#zakahCryptoValue").textContent = formatUsd(portfolio.cryptoValue)
  document.querySelector("#zakahGoldValue").textContent = formatUsd(portfolio.goldValue)
  document.querySelector("#zakahGoldGrams").textContent = `${formatNumber(portfolio.goldPureGrams, 3)}g pure gold equiv.`
  document.querySelector("#zakahSilverValue").textContent = formatUsd(portfolio.silverValue)
  document.querySelector("#zakahSilverGrams").textContent = `${formatNumber(portfolio.silverGrams, 3)}g`
  const portfolioSubtotal = portfolio.cryptoValue + portfolio.goldValue + portfolio.silverValue
  document.querySelector("#zakahPortfolioSubtotal").textContent = formatUsd(portfolioSubtotal)

  // Manual extras
  const cash = getZakahInput("zakahCash")
  const inventory = getZakahInput("zakahInventory")
  const receivables = getZakahInput("zakahReceivables")
  const liabilities = getZakahInput("zakahLiabilities")

  const totalWealth = Math.max(0, portfolioSubtotal + cash + inventory + receivables - liabilities)

  const basis = getNisabBasis()
  const nisabValue = basis === "gold"
    ? GOLD_NISAB_GRAMS * goldPricePerGram
    : SILVER_NISAB_GRAMS * silverPricePerGram

  const isAbove = nisabValue > 0 && totalWealth >= nisabValue
  const zakahDue = isAbove ? totalWealth * 0.025 : 0

  elements.zakahNisabValue.textContent = nisabValue > 0 ? formatUsd(nisabValue) : "Needs metal price"
  elements.zakahTotalWealth.textContent = formatUsd(totalWealth)
  elements.zakahDue.textContent = nisabValue > 0 ? formatUsd(zakahDue) : "—"

  const badge = elements.nisabStatusBadge
  if (nisabValue === 0) {
    badge.textContent = "—"
    badge.className = "nisab-status-badge"
  } else if (isAbove) {
    badge.textContent = "Above Nisab"
    badge.className = "nisab-status-badge above"
  } else {
    badge.textContent = "Below Nisab"
    badge.className = "nisab-status-badge below"
  }
}

// ── Validation ──

function validateTrade(formData) {
  const tradeDate = String(formData.get("tradeDate") ?? "")
  const coinId = String(formData.get("coinId") ?? "")
  const usdtSpent = Number(formData.get("usdtSpent"))
  const entryPrice = Number(formData.get("entryPrice"))

  if (!tradeDate || Number.isNaN(new Date(`${tradeDate}T00:00:00`).getTime())) {
    return { error: "Enter a valid trade date." }
  }
  if (!COINS.some((coin) => coin.id === coinId)) {
    return { error: "Choose a supported coin." }
  }
  if (!Number.isFinite(usdtSpent) || usdtSpent <= 0) {
    return { error: "USDT paid must be greater than zero." }
  }
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    return { error: "Entry price must be greater than zero." }
  }

  return {
    trade: { id: crypto.randomUUID(), tradeDate, coinId, usdtSpent, entryPrice }
  }
}

function validateMetalPurchase(formData, dateField, weightField, paidField, priceField) {
  const date = String(formData.get(dateField) ?? "")
  const weightGrams = Number(formData.get(weightField))
  const totalPaid = Number(formData.get(paidField))
  const entryPricePerGram = Number(formData.get(priceField))

  if (!date || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    return { error: "Enter a valid purchase date." }
  }
  if (!Number.isFinite(weightGrams) || weightGrams <= 0) {
    return { error: "Weight must be greater than zero." }
  }
  if (!Number.isFinite(totalPaid) || totalPaid <= 0) {
    return { error: "USD paid must be greater than zero." }
  }
  if (!Number.isFinite(entryPricePerGram) || entryPricePerGram <= 0) {
    return { error: "Entry price per gram must be greater than zero." }
  }

  return { purchase: { id: crypto.randomUUID(), date, weightGrams, totalPaid, entryPricePerGram } }
}

function validateGoldPurchase(formData) {
  const result = validateMetalPurchase(formData, "goldDate", "goldWeight", "goldUsdPaid", "goldEntryPrice")
  if (result.error) return result

  const carat = Number(formData.get("goldCarat"))
  if (![24, 21, 18].includes(carat)) return { error: "Select a valid carat (24k, 21k, or 18k)." }

  return { purchase: { ...result.purchase, carat } }
}

// ── Message helpers ──

function setFormMessage(el, message, type = "") {
  el.textContent = message
  el.className = `form-message ${type}`.trim()
}

// ── Crypto price fetch ──

async function fetchCoinPrice(coin) {
  if (coin.binanceSymbol) {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin.binanceSymbol}`)
    if (response.ok) {
      const payload = await response.json()
      const price = Number(payload?.price)
      if (Number.isFinite(price) && price > 0) return price
    }
  }

  const fallbackResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.coinGeckoId}&vs_currencies=usd`)
  if (!fallbackResponse.ok) throw new Error(`Could not load ${coin.symbol} price`)

  const payload = await fallbackResponse.json()
  const price = Number(payload?.[coin.coinGeckoId]?.usd)
  if (!Number.isFinite(price) || price <= 0) throw new Error(`No ${coin.symbol} price in response`)

  return price
}

async function refreshPrices() {
  elements.priceStatus.textContent = "Loading prices..."
  elements.refreshPricesButton.disabled = true
  state.priceErrors = {}

  const [cryptoResults] = await Promise.all([
    Promise.allSettled(COINS.map(async (coin) => {
      const price = await fetchCoinPrice(coin)
      return { coinId: coin.id, price }
    })),
    fetchMetalPrices()
  ])

  cryptoResults.forEach((result, index) => {
    const coin = COINS[index]
    if (result.status === "fulfilled") {
      state.livePrices[result.value.coinId] = result.value.price
      delete state.priceErrors[result.value.coinId]
    } else {
      state.priceErrors[coin.id] = result.reason instanceof Error
        ? result.reason.message
        : `Could not load ${coin.symbol} price`
    }
  })

  const loadedCount = COINS.filter((coin) => Number(state.livePrices[coin.id]) > 0).length
  const failedCount = Object.keys(state.priceErrors).length
  elements.priceStatus.textContent = failedCount > 0
    ? `${loadedCount} live, ${failedCount} need manual price`
    : `${loadedCount} live prices loaded`

  elements.refreshPricesButton.disabled = false
  renderCrypto()
  renderGold()
  renderSilver()
  renderZakah()
}

// ── Metals price fetch ──

async function fetchMetalPrices() {
  try {
    const response = await fetch("https://metals.live/api/spot")
    if (!response.ok) throw new Error("Metals API error")
    const data = await response.json()
    const gold = data.find((m) => m.metal === "XAU")?.price ?? 0
    const silver = data.find((m) => m.metal === "XAG")?.price ?? 0
    if (gold > 0) {
      state.metalPrices.gold = gold
      delete state.metalErrors.gold
    } else {
      state.metalErrors.gold = "Could not load gold price"
    }
    if (silver > 0) {
      state.metalPrices.silver = silver
      delete state.metalErrors.silver
    } else {
      state.metalErrors.silver = "Could not load silver price"
    }
  } catch {
    state.metalErrors.gold = "Could not load gold price"
    state.metalErrors.silver = "Could not load silver price"
  }
}

// ── Crypto event handlers ──

function addTrade(event) {
  event.preventDefault()
  const result = validateTrade(new FormData(elements.tradeForm))
  if (result.error) {
    setFormMessage(elements.formMessage, result.error, "error")
    return
  }
  state.trades = [result.trade, ...state.trades]
  saveJson(STORAGE_KEYS.trades, state.trades)
  elements.tradeForm.reset()
  elements.tradeDate.valueAsDate = new Date()
  setFormMessage(elements.formMessage, "Trade added.", "success")
  renderCrypto()
}

function deleteTrade(tradeId) {
  state.trades = state.trades.filter((trade) => trade.id !== tradeId)
  saveJson(STORAGE_KEYS.trades, state.trades)
  renderCrypto()
}

function clearTrades() {
  if (state.trades.length === 0) return
  if (!confirm("Clear all saved trades?")) return
  state.trades = []
  saveJson(STORAGE_KEYS.trades, state.trades)
  renderCrypto()
}

function setManualPrice(coinId, value) {
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) {
    delete state.manualPrices[coinId]
  } else {
    state.manualPrices[coinId] = price
  }
  saveJson(STORAGE_KEYS.manualPrices, state.manualPrices)
  renderCrypto()
}

function clearManualPrice(coinId) {
  delete state.manualPrices[coinId]
  saveJson(STORAGE_KEYS.manualPrices, state.manualPrices)
  renderCrypto()
}

// ── Gold event handlers ──

function autoFillGoldEntryPrice() {
  const carat = Number(elements.goldCarat.value)
  const goldPrice24k = getGoldPricePerGram()
  if (goldPrice24k > 0 && !elements.goldEntryPrice.value) {
    const priceForCarat = goldPrice24k * (CARAT_PURITY[carat] ?? 1)
    elements.goldEntryPrice.value = priceForCarat.toFixed(2)
  }
}

function addGoldPurchase(event) {
  event.preventDefault()
  const result = validateGoldPurchase(new FormData(elements.goldForm))
  if (result.error) {
    setFormMessage(elements.goldFormMessage, result.error, "error")
    return
  }
  state.goldPurchases = [result.purchase, ...state.goldPurchases]
  saveJson(STORAGE_KEYS.goldPurchases, state.goldPurchases)
  elements.goldForm.reset()
  elements.goldDate.valueAsDate = new Date()
  setFormMessage(elements.goldFormMessage, "Purchase added.", "success")
  renderGold()
  renderZakah()
}

function deleteGoldPurchase(id) {
  state.goldPurchases = state.goldPurchases.filter((p) => p.id !== id)
  saveJson(STORAGE_KEYS.goldPurchases, state.goldPurchases)
  renderGold()
  renderZakah()
}

function clearGoldPurchases() {
  if (state.goldPurchases.length === 0) return
  if (!confirm("Clear all saved gold purchases?")) return
  state.goldPurchases = []
  saveJson(STORAGE_KEYS.goldPurchases, state.goldPurchases)
  renderGold()
  renderZakah()
}

function setManualMetalPrice(metal, value) {
  const price = Number(value)
  state.manualMetalPrices[metal] = (Number.isFinite(price) && price > 0) ? price : 0
  saveJson(STORAGE_KEYS.manualMetalPrices, state.manualMetalPrices)
  renderGold()
  renderSilver()
  renderZakah()
}

function clearManualMetalPrice(metal) {
  state.manualMetalPrices[metal] = 0
  saveJson(STORAGE_KEYS.manualMetalPrices, state.manualMetalPrices)
  renderGold()
  renderSilver()
  renderZakah()
}

// ── Silver event handlers ──

function addSilverPurchase(event) {
  event.preventDefault()
  const result = validateMetalPurchase(new FormData(elements.silverForm), "silverDate", "silverWeight", "silverUsdPaid", "silverEntryPrice")
  if (result.error) {
    setFormMessage(elements.silverFormMessage, result.error, "error")
    return
  }
  state.silverPurchases = [result.purchase, ...state.silverPurchases]
  saveJson(STORAGE_KEYS.silverPurchases, state.silverPurchases)
  elements.silverForm.reset()
  elements.silverDate.valueAsDate = new Date()
  setFormMessage(elements.silverFormMessage, "Purchase added.", "success")
  renderSilver()
  renderZakah()
}

function deleteSilverPurchase(id) {
  state.silverPurchases = state.silverPurchases.filter((p) => p.id !== id)
  saveJson(STORAGE_KEYS.silverPurchases, state.silverPurchases)
  renderSilver()
  renderZakah()
}

function clearSilverPurchases() {
  if (state.silverPurchases.length === 0) return
  if (!confirm("Clear all saved silver purchases?")) return
  state.silverPurchases = []
  saveJson(STORAGE_KEYS.silverPurchases, state.silverPurchases)
  renderSilver()
  renderZakah()
}

// ── Event binding ──

function bindEvents() {
  // Tab nav
  document.querySelector(".tab-nav").addEventListener("click", (event) => {
    const btn = event.target.closest(".tab-btn")
    if (btn) switchTab(btn.dataset.tab)
  })

  // Crypto
  elements.tradeForm.addEventListener("submit", addTrade)
  elements.refreshPricesButton.addEventListener("click", refreshPrices)
  elements.clearTradesButton.addEventListener("click", clearTrades)

  // Gold
  elements.goldForm.addEventListener("submit", addGoldPurchase)
  elements.clearGoldButton.addEventListener("click", clearGoldPurchases)
  elements.goldCarat.addEventListener("change", autoFillGoldEntryPrice)

  // Silver
  elements.silverForm.addEventListener("submit", addSilverPurchase)
  elements.clearSilverButton.addEventListener("click", clearSilverPurchases)

  // Zakah live calculation
  document.querySelector("#zakahForm").addEventListener("input", renderZakah)
  document.querySelectorAll('input[name="nisabBasis"]').forEach((radio) =>
    radio.addEventListener("change", renderZakah)
  )
  elements.goldCarat.addEventListener("change", renderZakah)

  // Delegated: crypto manual prices, gold/silver deletes, metal manual prices
  document.addEventListener("click", (event) => {
    const deleteTradeBtn = event.target.closest("[data-delete-trade]")
    const clearPriceBtn = event.target.closest("[data-clear-price]")
    const deleteGoldBtn = event.target.closest("[data-delete-gold]")
    const deleteSilverBtn = event.target.closest("[data-delete-silver]")
    const clearMetalBtn = event.target.closest("[data-clear-metal]")

    if (deleteTradeBtn) deleteTrade(deleteTradeBtn.dataset.deleteTrade)
    if (clearPriceBtn) clearManualPrice(clearPriceBtn.dataset.clearPrice)
    if (deleteGoldBtn) deleteGoldPurchase(deleteGoldBtn.dataset.deleteGold)
    if (deleteSilverBtn) deleteSilverPurchase(deleteSilverBtn.dataset.deleteSilver)
    if (clearMetalBtn) clearManualMetalPrice(clearMetalBtn.dataset.clearMetal)
  })

  document.addEventListener("change", (event) => {
    const manualCryptoInput = event.target.closest("[data-manual-price]")
    const manualMetalInput = event.target.closest("[data-manual-metal]")

    if (manualCryptoInput) setManualPrice(manualCryptoInput.dataset.manualPrice, manualCryptoInput.value)
    if (manualMetalInput) setManualMetalPrice(manualMetalInput.dataset.manualMetal, manualMetalInput.value)
  })
}

// ── Init ──

function init() {
  renderCoinOptions()
  bindEvents()
  elements.tradeDate.valueAsDate = new Date()
  elements.goldDate.valueAsDate = new Date()
  elements.silverDate.valueAsDate = new Date()
  renderCrypto()
  renderGold()
  renderSilver()
  renderZakah()
  refreshPrices()
}

init()
