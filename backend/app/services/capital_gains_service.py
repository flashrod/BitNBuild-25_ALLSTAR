from app.services.capital_gains_parser import CapitalGainsParser, CapitalGain
from typing import List

class CapitalGainsService:
    def __init__(self):
        self.parser = CapitalGainsParser()
        self.gains_db = {}  # In-memory user_id -> List[CapitalGain]

    def ingest(self, user_id: str, file_content: bytes, filename: str):
        gains = self.parser.ingest_gains(file_content, filename)
        self.gains_db[user_id] = gains
        return gains

    def list_gains(self, user_id: str) -> List[CapitalGain]:
        return self.gains_db.get(user_id, [])

    def analyze(self, user_id: str):
        gains = self.gains_db.get(user_id, [])
        return self.parser.analyze_gains(gains)