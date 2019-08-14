import asyncio
import json

from ...es.search import SearchClient

base_url = "http://localhost:9200"


async def main():
    client = SearchClient(base_url)
    await client.recreate_index()
    with open("data/data.json") as f:
        data = json.load(f)
        for idx, item in enumerate(data):
            await client.index_document(str(idx), item)
    await client.refresh_index()


asyncio.run(main())
