from typing import Any

import httpx


WORLD_BANK_BASE_URL = "https://api.worldbank.org/v2"
POPULATION_INDICATOR = "SP.POP.TOTL"


class WorldBankClient:
    def __init__(self, timeout: float = 20.0) -> None:
        self.timeout = timeout

    async def fetch_latest_population(self, iso3: str) -> int:
        path = f"/country/{iso3}/indicator/{POPULATION_INDICATOR}"
        params = {"format": "json", "mrnev": "1"}

        async with httpx.AsyncClient(base_url=WORLD_BANK_BASE_URL, timeout=self.timeout) as client:
            response = await client.get(path, params=params)
            response.raise_for_status()
            payload: list[Any] = response.json()

        if len(payload) < 2 or not payload[1]:
            return 0

        value = payload[1][0].get("value")
        return int(value or 0)

