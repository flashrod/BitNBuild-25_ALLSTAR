import pandas as pd
from io import BytesIO

class CapitalGainsParser:
    """
    Dedicated parser for capital gains CSVs from brokers (Zerodha, Groww, Upstox) and tax platforms (Taxwise, ClearTax, etc.)
    """
    def __init__(self):
        # Define broker/platform signatures (unique columns)
        self.signatures = {
            'zerodha': ['trade_date', 'isin', 'gain_loss', 'holding_period'],
            'groww': ['transaction_date', 'security_name', 'capital_gain'],
            'upstox': ['sell_date', 'symbol', 'profit_loss'],
            'taxwise': ['acquisition_date', 'sale_date', 'capital_gain_amount'],
            'cleartax': ['buy_date', 'sell_date', 'gain'],
        }

    def detect_source(self, df):
        """
        Detect the source/platform of the CSV based on column names.
        Returns: source name (str) or 'unknown'
        """
        cols = set(df.columns)
        for source, sig_cols in self.signatures.items():
            if any(col in cols for col in sig_cols):
                return source
        return 'unknown'

    def parse(self, file_content: bytes, filename: str) -> dict:
        """
        Main entrypoint: detects source and routes to correct parser.
        Returns: dict with 'source', 'capital_gains' (list of txns)
        """
        # Try to read CSV with different encodings
        for encoding in ['utf-8', 'iso-8859-1', 'cp1252']:
            try:
                df = pd.read_csv(BytesIO(file_content), encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            df = pd.read_csv(BytesIO(file_content), encoding='utf-8', errors='ignore')

        # Normalize column names
        df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
        source = self.detect_source(df)

        # Route to correct parser (stub)
        if source == 'zerodha':
            capital_gains = self._parse_zerodha(df)
        elif source == 'groww':
            capital_gains = self._parse_groww(df)
        elif source == 'upstox':
            capital_gains = self._parse_upstox(df)
        elif source == 'taxwise':
            capital_gains = self._parse_taxwise(df)
        elif source == 'cleartax':
            capital_gains = self._parse_cleartax(df)
        else:
            capital_gains = []

        return {'source': source, 'capital_gains': capital_gains}

    def _parse_zerodha(self, df):
        # Zerodha: columns like trade_date, buy_date, isin, gain_loss, holding_period
        results = []
        for _, row in df.iterrows():
            try:
                trade_date = pd.to_datetime(row.get('trade_date')) if 'trade_date' in row else None
                buy_date = pd.to_datetime(row.get('buy_date')) if 'buy_date' in row else None
                holding_period = row.get('holding_period')
                if holding_period is None and buy_date is not None and trade_date is not None:
                    holding_period = (trade_date - buy_date).days
                gain_loss = row.get('gain_loss')
                if gain_loss is None and 'price' in row and 'buy_price' in row and 'quantity' in row:
                    gain_loss = (float(row['price']) - float(row['buy_price'])) * float(row['quantity'])
                results.append({
                    'trade_date': trade_date,
                    'buy_date': buy_date,
                    'isin': row.get('isin'),
                    'instrument': row.get('instrument'),
                    'quantity': float(row.get('quantity', 0)),
                    'price': float(row.get('price', 0)),
                    'buy_price': float(row.get('buy_price', 0)),
                    'holding_period': holding_period,
                    'gain_loss': float(gain_loss) if gain_loss is not None else 0,
                })
            except Exception:
                continue
        return results

    def _parse_groww(self, df):
        # Groww: columns like transaction_date, buy_date, security_name, capital_gain
        results = []
        for _, row in df.iterrows():
            try:
                transaction_date = pd.to_datetime(row.get('transaction_date')) if 'transaction_date' in row else None
                buy_date = pd.to_datetime(row.get('buy_date')) if 'buy_date' in row else None
                holding_period = row.get('holding_period')
                if holding_period is None and buy_date is not None and transaction_date is not None:
                    holding_period = (transaction_date - buy_date).days
                capital_gain = row.get('capital_gain')
                if capital_gain is None and 'sell_price' in row and 'buy_price' in row and 'units' in row:
                    capital_gain = (float(row['sell_price']) - float(row['buy_price'])) * float(row['units'])
                results.append({
                    'transaction_date': transaction_date,
                    'buy_date': buy_date,
                    'security_name': row.get('security_name'),
                    'units': float(row.get('units', 0)),
                    'sell_price': float(row.get('sell_price', 0)),
                    'buy_price': float(row.get('buy_price', 0)),
                    'holding_period': holding_period,
                    'capital_gain': float(capital_gain) if capital_gain is not None else 0,
                })
            except Exception:
                continue
        return results

    def _parse_upstox(self, df):
        # Upstox: columns like sell_date, buy_date, symbol, profit_loss
        results = []
        for _, row in df.iterrows():
            try:
                sell_date = pd.to_datetime(row.get('sell_date')) if 'sell_date' in row else None
                buy_date = pd.to_datetime(row.get('buy_date')) if 'buy_date' in row else None
                holding_period = row.get('holding_period')
                if holding_period is None and buy_date is not None and sell_date is not None:
                    holding_period = (sell_date - buy_date).days
                profit_loss = row.get('profit_loss')
                if profit_loss is None and 'sell_price' in row and 'buy_price' in row and 'qty' in row:
                    profit_loss = (float(row['sell_price']) - float(row['buy_price'])) * float(row['qty'])
                results.append({
                    'sell_date': sell_date,
                    'buy_date': buy_date,
                    'symbol': row.get('symbol'),
                    'qty': float(row.get('qty', 0)),
                    'sell_price': float(row.get('sell_price', 0)),
                    'buy_price': float(row.get('buy_price', 0)),
                    'holding_period': holding_period,
                    'profit_loss': float(profit_loss) if profit_loss is not None else 0,
                })
            except Exception:
                continue
        return results

    def _parse_taxwise(self, df):
        # TODO: Implement Taxwise-specific parsing
        return []

    def _parse_cleartax(self, df):
        # TODO: Implement ClearTax-specific parsing
        return []