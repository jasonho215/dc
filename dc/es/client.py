import json

import httpx


def json_request(body):
    byte = json.dumps(body, ensure_ascii=False).encode("utf-8")
    return {
        "data": byte,
        "headers": {
            "content-type": "application/json",
        },
    }


class ESError(Exception):
    def __init__(self, message, error):
        super().__init__(message)
        self.error = error


def raise_error(j):
    if "error" in j:
        raise ESError(j["error"]["reason"], j)


class ESClient:
    def __init__(self, base_url):
        self.client = httpx.AsyncClient()
        self.base_url = base_url

    async def delete_index(self, index_name):
        r = await self.client.delete(f"{self.base_url}/{index_name}")
        j = r.json()
        raise_error(j)

    async def create_index(self, index_name, body):
        r = await self.client.put(f"{self.base_url}/{index_name}", **json_request(body))
        j = r.json()
        raise_error(j)

    async def refresh_index(self, index_name):
        r = await self.client.post(f"{self.base_url}/{index_name}/_refresh")
        j = r.json()
        raise_error(j)

    async def index_document(self, index_name, id, body):
        r = await self.client.put(f"{self.base_url}/{index_name}/_doc/{id}", **json_request(body))
        j = r.json()
        raise_error(j)

    async def search_document(self, index_name, body):
        r = await self.client.post(f"{self.base_url}/{index_name}/_search", **json_request(body))
        j = r.json()
        raise_error(j)
        return j
