import asyncio
import json

from ..es.search import SearchClient

base_url = "http://localhost:9200"


def print_result(result):
    print(json.dumps(result, ensure_ascii=False, indent=2))


async def main():
    client = SearchClient(base_url)
    await client.recreate_index()
    with open("sample/data.json") as f:
        data = json.load(f)
        for idx, item in enumerate(data):
            await client.index_document(str(idx), item)
    await client.refresh_index()
    keyword = "陳松青"
    result = await client.search1(keyword=keyword)
    interpreted_result = client.interpret_search1_result(result)
    print_result(interpreted_result)
    for item in interpreted_result:
        r = await client.search2(
            keyword=keyword,
            district=item["district"],
            year=item["year"],
            meeting_type=item["meeting_type"],
            meeting_number=item["meeting_number"],
        )
        print_result(r)


asyncio.run(main())
