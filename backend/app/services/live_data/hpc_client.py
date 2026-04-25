from typing import Any

import httpx


HPC_BASE_URL = "https://api.hpc.tools/v1/public"


class HpcClient:
    def __init__(self, timeout: float = 20.0) -> None:
        self.timeout = timeout

    async def fetch_plans_by_year(self, year: int) -> dict[str, Any]:
        return await self._get(f"/plan/year/{year}")

    async def fetch_flows_by_year(self, year: int) -> dict[str, Any]:
        return await self._get("/fts/flow", params={"year": str(year), "groupby": "Country"})

    async def fetch_governing_entities(self, plan_id: int) -> dict[str, Any]:
        return await self._get("/governingEntity", params={"planId": str(plan_id)})

    async def _get(self, path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(base_url=HPC_BASE_URL, timeout=self.timeout) as client:
            response = await client.get(path, params=params)
            response.raise_for_status()
            return response.json()

