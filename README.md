# Crypto Profit Calculator

A small browser-only page for tracking crypto, gold, silver, and Zakah values locally.

## Use

Open `index.html` in a browser. No install step or server is required.

The app has four tabs:

- Crypto buy trades paid in USDT
- Gold purchases by carat and gram weight
- Silver purchases by gram weight
- Zakah calculator with a USD/JOD helper

Each crypto trade asks for:

- Trade date
- Coin
- USDT paid
- Coin price at the trade date

The app calculates:

- Coin received: `USDT paid / entry price`
- Current value: `coin received * current price`
- Profit: `current value - USDT paid`
- Grouped totals per coin
- Overall totals across all coins

Gold and silver purchases calculate current value, profit, and totals from the saved purchase records and the current metal price.

## Zakah

The Zakah tab reads saved crypto trades, gold purchases, silver purchases, and manual price overrides from localStorage. It calculates:

- Portfolio value from crypto, gold, and silver
- Additional cash, inventory, and receivables
- Debts and liabilities
- Gold or silver nisab threshold
- Zakah due at 2.5% when total zakatable wealth is above nisab
- Zakah due converted to JOD using the USD/JOD rate

The USD/JOD calculator is manual and defaults to `1 USD = 0.709 JOD`. Change the rate if you want to use a different value.

## Prices

Current prices are fetched from Binance public USDT ticker endpoints like `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`. If Binance does not return a price, the app falls back to CoinGecko simple price endpoints and treats USD quotes as USDT-equivalent for profit tracking.

If live pricing fails, enter a manual current price for that coin. Manual prices override live prices until cleared.

## Storage

Trades, purchases, manual price overrides, Zakah inputs, and the USD/JOD calculator values are saved in browser localStorage on the same device and browser profile.

## Scope

This version supports buy trades and metal purchases only. It excludes fees, sells, realized profit, CSV import/export, and scholarly Zakah rulings for unusual assets or timing.
