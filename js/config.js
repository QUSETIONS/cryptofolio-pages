(function () {
  const AppConfig = {
    COINGECKO_API: 'https://api.coingecko.com/api/v3',
    STORAGE_KEY: 'cryptofolio_assets',
    SNAPSHOTS_KEY: 'cryptofolio_snapshots',
    TRANSACTIONS_KEY: 'cryptofolio_transactions',
    SETTINGS_KEY: 'cryptofolio_settings',
    ALERT_RULES_KEY: 'cryptofolio_alert_rules',
    ALERT_HISTORY_KEY: 'cryptofolio_alert_history',
    UPDATE_INTERVAL: 60000,
    SNAPSHOT_INTERVAL: 5 * 60 * 1000,
    MAX_SNAPSHOT_POINTS: 288,
    MAX_ALERT_HISTORY: 20,
    PRICE_FETCH_MIN_INTERVAL_MS: 8000,
    VALID_ROUTES: ['dashboard', 'assets', 'transactions', 'risk', 'macro', 'news', 'calendar', 'decision', 'alerts', 'strategy', 'stress', 'attribution', 'settings'],
    DEFAULT_ROUTE: 'dashboard',
    VALID_ALERT_TYPES: ['PRICE_ABOVE', 'PRICE_BELOW', 'POSITION_ABOVE', 'DRAWDOWN_ABOVE'],
    VALID_TRANSACTION_TYPES: ['BUY', 'SELL'],
    COIN_INFO: {
      bitcoin: { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
      ethereum: { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
      tether: { symbol: 'USDT', name: 'Tether', color: '#26A17B' },
      binancecoin: { symbol: 'BNB', name: 'BNB', color: '#F3BA2F' },
      solana: { symbol: 'SOL', name: 'Solana', color: '#00FFA3' },
      ripple: { symbol: 'XRP', name: 'XRP', color: '#23292F' },
      cardano: { symbol: 'ADA', name: 'Cardano', color: '#0033AD' },
      dogecoin: { symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633' },
      polkadot: { symbol: 'DOT', name: 'Polkadot', color: '#E6007A' },
      'avalanche-2': { symbol: 'AVAX', name: 'Avalanche', color: '#E84142' }
    }
  };

  window.AppConfig = AppConfig;
})();
