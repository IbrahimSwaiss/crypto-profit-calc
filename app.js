const STORAGE_KEYS = {
  trades: "cryptoProfitTrades",
  manualPrices: "cryptoProfitManualPrices"
}

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
  priceErrors: {}
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
  emptyRowTemplate: document.querySelector("#emptyRowTemplate")
}

function loadJson(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key)

    if (!storedValue) {
      return fallback
    }

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

  if (Number.isFinite(manualPrice) && manualPrice > 0) {
    return manualPrice
  }

  const livePrice = Number(state.livePrices[coinId])

  if (Number.isFinite(livePrice) && livePrice > 0) {
    return livePrice
  }

  return 0
}

function getPriceSource(coinId) {
  const manualPrice = Number(state.manualPrices[coinId])
  const livePrice = Number(state.livePrices[coinId])

  if (Number.isFinite(manualPrice) && manualPrice > 0) {
    return "manual"
  }

  if (Number.isFinite(livePrice) && livePrice > 0) {
    return "live"
  }

  return "missing"
}

function formatUsdt(value) {
  const formattedValue = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) >= 1 ? 2 : 6,
    minimumFractionDigits: 2
  }).format(value)

  return `${formattedValue} USDT`
}

function formatNumber(value, maximumFractionDigits = 8) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits
  }).format(value)
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date)
}

function profitClass(value) {
  if (value > 0) {
    return "profit-positive"
  }

  if (value < 0) {
    return "profit-negative"
  }

  return ""
}

function renderCoinOptions() {
  elements.coinId.innerHTML = COINS.map((coin) => (
    `<option value="${coin.id}">${coin.symbol} - ${coin.name}</option>`
  )).join("")
}

function renderPrices() {
  elements.priceGrid.innerHTML = COINS.map((coin) => {
    const currentPrice = getCurrentPrice(coin.id)
    const source = getPriceSource(coin.id)
    const sourceLabel = source === "live" ? "Live" : source === "manual" ? "Manual" : "Needs price"
    const errorMessage = state.priceErrors[coin.id] ? `<p class="form-message error">${state.priceErrors[coin.id]}</p>` : ""
    const manualValue = state.manualPrices[coin.id] ?? ""

    return `
      <article class="price-item">
        <header>
          <div>
            <strong>${coin.symbol}</strong>
            <p class="eyebrow">${coin.name}</p>
          </div>
          <span class="price-source ${source}">${sourceLabel}</span>
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

  return {
    currentPrice,
    currentValue,
    profit,
    quantity
  }
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
  const totals = state.trades.reduce((accumulator, trade) => {
    const calculations = getTradeCalculations(trade)

    accumulator.invested += trade.usdtSpent
    accumulator.value += calculations.currentValue
    accumulator.profit += calculations.profit

    return accumulator
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
    const calculations = getTradeCalculations(trade)

    return `
      <tr>
        <td>${formatDate(trade.tradeDate)}</td>
        <td>${coin.symbol}</td>
        <td>${formatUsdt(trade.usdtSpent)}</td>
        <td>${formatUsdt(trade.entryPrice)}</td>
        <td>${formatNumber(calculations.quantity)} ${coin.symbol}</td>
        <td>${calculations.currentPrice > 0 ? formatUsdt(calculations.currentPrice) : "No price"}</td>
        <td>${formatUsdt(calculations.currentValue)}</td>
        <td class="${profitClass(calculations.profit)}">${formatUsdt(calculations.profit)}</td>
        <td><button class="delete-button" data-delete-trade="${trade.id}" type="button">Delete</button></td>
      </tr>
    `
  }).join("")
}

function render() {
  renderPrices()
  renderSummary()
  renderTotals()
  renderTrades()
}

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
    trade: {
      id: crypto.randomUUID(),
      tradeDate,
      coinId,
      usdtSpent,
      entryPrice
    }
  }
}

function setFormMessage(message, type = "") {
  elements.formMessage.textContent = message
  elements.formMessage.className = `form-message ${type}`.trim()
}

async function fetchCoinPrice(coin) {
  if (coin.binanceSymbol) {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin.binanceSymbol}`)

    if (response.ok) {
      const payload = await response.json()
      const price = Number(payload?.price)

      if (Number.isFinite(price) && price > 0) {
        return price
      }
    }
  }

  const fallbackResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.coinGeckoId}&vs_currencies=usd`)

  if (!fallbackResponse.ok) {
    throw new Error(`Could not load ${coin.symbol} price`)
  }

  const payload = await fallbackResponse.json()
  const price = Number(payload?.[coin.coinGeckoId]?.usd)

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`No ${coin.symbol} price in response`)
  }

  return price
}

async function refreshPrices() {
  elements.priceStatus.textContent = "Loading prices..."
  elements.refreshPricesButton.disabled = true
  state.priceErrors = {}

  const results = await Promise.allSettled(COINS.map(async (coin) => {
    const price = await fetchCoinPrice(coin)
    return { coinId: coin.id, price }
  }))

  results.forEach((result, index) => {
    const coin = COINS[index]

    if (result.status === "fulfilled") {
      state.livePrices[result.value.coinId] = result.value.price
      delete state.priceErrors[result.value.coinId]
      return
    }

    state.priceErrors[coin.id] = result.reason instanceof Error ? result.reason.message : `Could not load ${coin.symbol} price`
  })

  const loadedCount = COINS.filter((coin) => Number(state.livePrices[coin.id]) > 0).length
  const failedCount = Object.keys(state.priceErrors).length
  elements.priceStatus.textContent = failedCount > 0
    ? `${loadedCount} live, ${failedCount} need manual price`
    : `${loadedCount} live prices loaded`
  elements.refreshPricesButton.disabled = false
  render()
}

function addTrade(event) {
  event.preventDefault()

  const result = validateTrade(new FormData(elements.tradeForm))

  if (result.error) {
    setFormMessage(result.error, "error")
    return
  }

  state.trades = [result.trade, ...state.trades]
  saveJson(STORAGE_KEYS.trades, state.trades)
  elements.tradeForm.reset()
  elements.tradeDate.valueAsDate = new Date()
  setFormMessage("Trade added.", "success")
  render()
}

function deleteTrade(tradeId) {
  state.trades = state.trades.filter((trade) => trade.id !== tradeId)
  saveJson(STORAGE_KEYS.trades, state.trades)
  render()
}

function clearTrades() {
  if (state.trades.length === 0) {
    return
  }

  const confirmed = confirm("Clear all saved trades?")

  if (!confirmed) {
    return
  }

  state.trades = []
  saveJson(STORAGE_KEYS.trades, state.trades)
  render()
}

function setManualPrice(coinId, value) {
  const price = Number(value)

  if (!Number.isFinite(price) || price <= 0) {
    delete state.manualPrices[coinId]
  } else {
    state.manualPrices[coinId] = price
  }

  saveJson(STORAGE_KEYS.manualPrices, state.manualPrices)
  render()
}

function clearManualPrice(coinId) {
  delete state.manualPrices[coinId]
  saveJson(STORAGE_KEYS.manualPrices, state.manualPrices)
  render()
}

function bindEvents() {
  elements.tradeForm.addEventListener("submit", addTrade)
  elements.refreshPricesButton.addEventListener("click", refreshPrices)
  elements.clearTradesButton.addEventListener("click", clearTrades)

  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-trade]")
    const clearPriceButton = event.target.closest("[data-clear-price]")

    if (deleteButton) {
      deleteTrade(deleteButton.dataset.deleteTrade)
    }

    if (clearPriceButton) {
      clearManualPrice(clearPriceButton.dataset.clearPrice)
    }
  })

  document.addEventListener("change", (event) => {
    const manualInput = event.target.closest("[data-manual-price]")

    if (manualInput) {
      setManualPrice(manualInput.dataset.manualPrice, manualInput.value)
    }
  })
}

function init() {
  renderCoinOptions()
  bindEvents()
  elements.tradeDate.valueAsDate = new Date()
  render()
  refreshPrices()
}

init()