import httpx
from app.config import BACKEND_API_URL


async def get_crop_season(crop_season_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BACKEND_API_URL}/cropseason/{crop_season_id}")
        resp.raise_for_status()
        return resp.json()


async def get_field(field_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BACKEND_API_URL}/field/{field_id}")
        resp.raise_for_status()
        return resp.json()


async def get_soil_records(field_id: str) -> list:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BACKEND_API_URL}/field/{field_id}/soilrecord")
        resp.raise_for_status()
        return resp.json()


async def get_crop(crop_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BACKEND_API_URL}/crop/{crop_id}")
        resp.raise_for_status()
        return resp.json()