import argparse
import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.services.live_data.hpc_client import HpcClient
from app.services.live_data.normalizer import normalize_snapshot
from app.services.live_data.world_bank_client import WorldBankClient


ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"


async def ingest(year: int, month: int, limit: int) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    hpc = HpcClient()
    world_bank = WorldBankClient()

    plans_payload = await hpc.fetch_plans_by_year(year)
    flows_payload = await hpc.fetch_flows_by_year(year)
    _write_json(RAW_DIR / f"ocha_hpc_plans_{year}.json", plans_payload)
    _write_json(RAW_DIR / f"ocha_fts_flows_{year}.json", flows_payload)

    plan_ids = [int(plan["id"]) for plan in plans_payload.get("data", []) if plan.get("isReleased")]
    governing_payloads = await asyncio.gather(
        *(hpc.fetch_governing_entities(plan_id) for plan_id in plan_ids),
        return_exceptions=True,
    )
    governing_entities_by_plan_id = {
        plan_id: payload if isinstance(payload, dict) else {"data": [], "error": str(payload)}
        for plan_id, payload in zip(plan_ids, governing_payloads, strict=True)
    }
    _write_json(RAW_DIR / f"ocha_governing_entities_{year}.json", governing_entities_by_plan_id)

    iso3_values = sorted(
        {
            str(location.get("iso3")).upper()
            for plan in plans_payload.get("data", [])
            for location in plan.get("locations", [])
            if location.get("adminLevel") == 0 and location.get("iso3")
        }
    )
    population_values = await asyncio.gather(
        *(world_bank.fetch_latest_population(iso3) for iso3 in iso3_values),
        return_exceptions=True,
    )
    populations_by_iso3 = {
        iso3: population if isinstance(population, int) else 0
        for iso3, population in zip(iso3_values, population_values, strict=True)
    }
    _write_json(RAW_DIR / f"world_bank_population_{year}.json", populations_by_iso3)

    snapshot = normalize_snapshot(
        year=year,
        month=month,
        plans_payload=plans_payload,
        flows_payload=flows_payload,
        governing_entities_by_plan_id=governing_entities_by_plan_id,
        populations_by_iso3=populations_by_iso3,
        limit=limit,
    )
    output_path = PROCESSED_DIR / f"globe_snapshot_{year}.json"
    _write_json(output_path, snapshot.model_dump(by_alias=True))
    return output_path


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch latest public humanitarian data for GlobeWatch.")
    parser.add_argument("--year", type=int, default=datetime.now(UTC).year)
    parser.add_argument("--month", type=int, default=datetime.now(UTC).month)
    parser.add_argument("--limit", type=int, default=12)
    args = parser.parse_args()

    output_path = asyncio.run(ingest(year=args.year, month=args.month, limit=args.limit))
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()

