import asyncio
import json

from ..es import ESClient, ESError

base_url = "http://localhost:9200"
index_name = "document"

keyword = {"type": "keyword"}
integer = {"type": "integer"}
date = {"type": "date"}
text = {
    "type": "text",
    "analyzer": "icu_analyzer",
    # Allow highlights
    "index_options": "offsets",
}


def print_result(result):
    print(json.dumps(result, ensure_ascii=False, indent=2))


async def main():
    client = ESClient(base_url)
    try:
        await client.delete_index(index_name)
    except ESError:
        pass
    await client.create_index(index_name, {
        "mappings": {
            "properties": {
                "district": keyword,
                "year": integer,
                # full_council, committee, working_group
                "meeting_type": keyword,
                "meeting_number": keyword,
                "meeting_date": date,
                "meeting_location": text,
                "content_type": keyword,
                "url": keyword,
                # agenda, minutes, audio
                "document_type": keyword,
                # if meeting_type == committee
                "committee_name": text,
                # if meeting_type == working_group
                "wg_name": text,
                # if document_type == (agenda || minutes)
                "page_number": integer,
                # if document_type == (agenda || minutes)
                "page_content": text,
                # if document_type == audio
                "agenda_code": keyword,
                # if document_type == audio
                "agenda_title": text,
                # if document_type == audio
                "duration": integer,
            },
        },
    })
    with open("sample/data.json") as f:
        data = json.load(f)
        for idx, item in enumerate(data):
            await client.index_document(index_name, str(idx), item)
    await client.refresh_index(index_name)

    q = "區議會 陳松青"
    terms = q.split(" ")
    should = []
    for term in terms:
        term = term.strip()
        should.append({"match_phrase": {"meeting_number": term}})
        should.append({"match_phrase": {"meeting_location": term}})
        should.append({"match_phrase": {"page_content": term}})
    result = await client.search_document(index_name, {
        "query": {
            "bool": {
                "should": should,
            },
        },
        "highlight": {
            "fields": {
                "meeting_number": {},
                "meeting_location": {},
                "page_content": {},
            },
        },
        "aggs": {
            "by_district": {
                "terms": {
                    "field": "district",
                },
                "aggs": {
                    "by_year": {
                        "terms": {
                            "field": "year",
                        },
                        "aggs": {
                            "by_meeting_type": {
                                "terms": {
                                    "field": "meeting_type",
                                },
                                "aggs": {
                                    "by_meeting_number": {
                                        "terms": {
                                            "field": "meeting_number",
                                        },
                                        "aggs": {
                                            "by_document_type": {
                                                "terms": {
                                                    "field": "document_type",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })
    print_result(result)


asyncio.run(main())
