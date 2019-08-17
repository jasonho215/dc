import asyncio
import json

from ...es.search import SearchClient

base_url = "http://localhost:9200"


def chunks(l, n):
    """Yield successive n-sized chunks from l."""
    for i in range(0, len(l), n):
        yield l[i:i + n]


async def main():
    client = SearchClient(base_url)
    await client.recreate_index()
    with open("data/data.json") as f:
        data = json.load(f)
        lst = []
        for idx, item in enumerate(data):
            lst.append((str(idx), item))
        for chunk in chunks(lst, 100):
            await client.bulk_index(chunk)
    await client.refresh_index()


asyncio.run(main())
