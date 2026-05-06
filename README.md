# Crypto Profit Calculator

A small browser-only page for tracking buy trades paid in USDT and calculating unrealized profit based on each coin's current USDT-equivalent price.

## Use

Open `index.html` in a browser. No install step or server is required.

Each trade asks for:

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

## Prices

Current prices are fetched from Binance public USDT ticker endpoints like `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`. If Binance does not return a price, the app falls back to CoinGecko simple price endpoints and treats USD quotes as USDT-equivalent for profit tracking.

If live pricing fails, enter a manual current price for that coin. Manual prices override live prices until cleared.

## Storage

Trades and manual price overrides are saved in browser localStorage on the same device and browser profile.

## Scope

This first version supports buy trades only and excludes fees, sells, realized profit, and CSV import/export.