import pytest
from app.services.capital_gains_parser import CapitalGainsParser

def test_zerodha_parsing():
    parser = CapitalGainsParser()
    # Minimal Zerodha CSV sample
    csv = (
        'trade_date,buy_date,isin,instrument,quantity,price,buy_price,holding_period,gain_loss\n'
        '2024-01-10,2023-01-10,INE123A01016,ABC Ltd,10,200,150,365,500\n'
    ).encode('utf-8')
    result = parser.parse(csv, 'zerodha.csv')
    assert result['source'] == 'zerodha'
    assert len(result['capital_gains']) == 1
    assert result['capital_gains'][0]['gain_loss'] == 500

def test_groww_parsing():
    parser = CapitalGainsParser()
    csv = (
        'transaction_date,buy_date,security_name,units,sell_price,buy_price,holding_period,capital_gain\n'
        '2024-01-10,2023-01-10,XYZ Fund,5,100,80,365,100\n'
    ).encode('utf-8')
    result = parser.parse(csv, 'groww.csv')
    assert result['source'] == 'groww'
    assert len(result['capital_gains']) == 1
    assert result['capital_gains'][0]['capital_gain'] == 100

def test_upstox_parsing():
    parser = CapitalGainsParser()
    csv = (
        'sell_date,buy_date,symbol,qty,sell_price,buy_price,holding_period,profit_loss\n'
        '2024-01-10,2023-01-10,UPSTOX,20,300,250,365,1000\n'
    ).encode('utf-8')
    result = parser.parse(csv, 'upstox.csv')
    assert result['source'] == 'upstox'
    assert len(result['capital_gains']) == 1
    assert result['capital_gains'][0]['profit_loss'] == 1000