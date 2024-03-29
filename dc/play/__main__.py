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
                "meeting_number": text,
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
    await client.index_document(index_name, "1", {
        "district": "tuen_mun",
        "year": 2019,
        "meeting_type": "full_council",
        "meeting_number": "第二十次",
        "meeting_date": "2019-01-08T09:30:00+08:00",
        "meeting_location": "屯門屯喜路1號\n屯門政府合署3樓\n屯門區議會會議室",
        "content_type": "application/pdf",
        "url": "https://www.districtcouncils.gov.hk/tm/doc/2016_2019/tc/dc_meetings_minutes/dc_20th_minutes_20190108.pdf",
        "document_type": "minutes",
        "page_number": 3,
        "page_content": "主席歡迎各與會者出席屯門區議會第二十次會議，以及各政府部門代表列席會議。他表示， 政府會繼續安排部門首長輪流出席區議會會議，以加強溝通。出席是次會議的兩位部門首長分別為規劃署署長李啟榮先生及地政總署署長陳松青先生。",
    })
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
    })
    print_result(result)


asyncio.run(main())
