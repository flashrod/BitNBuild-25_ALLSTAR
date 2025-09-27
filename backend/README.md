## Backend Features

### Capital Gains Calculation Engine

This backend supports modular parsing of capital gains statements from major Indian brokers and tax platforms:

- **Zerodha**
- **Groww**
- **Upstox**
- **Taxwise**
- **ClearTax**

#### How it works

1. Upload a capital gains CSV from your broker or tax platform.
2. The backend automatically detects the source and parses the file using the correct logic.
3. Parsed transactions include holding period, gain/loss, and all relevant fields for tax calculation.
4. The engine supports extensibility for future brokers/platforms.

#### Key modules

- `app/services/capital_gains_parser.py`: Dedicated parser for capital gains CSVs, with source detection and broker-specific logic.
- `app/services/file_parser.py`: Main ingestion flow, now routes broker CSVs to `CapitalGainsParser`.

#### Adding support for new brokers/platforms

1. Add a new signature and parser method in `CapitalGainsParser`.
2. Update the source detection logic if needed.
3. Add unit tests for the new format.