from .client import ESClient, ESError

keyword = {"type": "keyword"}
integer = {"type": "integer"}
date = {"type": "date"}
text = {
    "type": "text",
    "analyzer": "icu_analyzer",
    # Allow highlights
    "index_options": "offsets",
}


class SearchClient:
    def __init__(self, base_url):
        self.client = ESClient(base_url)
        self.index_name = "document"

    async def recreate_index(self):
        try:
            await self.client.delete_index(self.index_name)
        except ESError:
            pass
        await self.client.create_index(self.index_name, {
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
                    "agenda_title": text,
                    # if document_type == audio
                    "duration": integer,
                },
            },
        })

    async def index_document(self, id, body):
        await self.client.index_document(self.index_name, id, body)

    async def bulk_index(self, docs):
        await self.client.bulk_index(self.index_name, docs)

    async def refresh_index(self):
        await self.client.refresh_index(self.index_name)

    def _keyword_to_match_phrases(self, keyword):
        terms = keyword.split(" ")
        should = []
        for term in terms:
            term = term.strip()
            should.append({"match_phrase": {"page_content": term}})
            should.append({"match_phrase": {"agenda_title": term}})
            should.append({"match_phrase": {"meeting_number": term}})
            should.append({"match_phrase": {"meeting_location": term}})
        return should

    async def search1(self, *, keyword, district, year):
        should = self._keyword_to_match_phrases(keyword)
        filter_ = [
            {"bool": {"should": should}},
        ]
        if district:
            filter_.append({
                "terms": {"district": district}
            })
        if year:
            filter_.append({
                "terms": {"year": year}
            })
        return await self.client.search_document(self.index_name, {
            "_source": {
                "excludes": ["page_content"],
            },
            "query": {
                "bool": {
                    "must": {
                        "match_all": {},
                    },
                    "filter": filter_,
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

    def interpret_search1_result(self, result):
        output = []
        for b1 in result["aggregations"]["by_district"]["buckets"]:
            district = b1["key"]
            for b2 in b1["by_year"]["buckets"]:
                year = b2["key"]
                for b3 in b2["by_meeting_type"]["buckets"]:
                    meeting_type = b3["key"]
                    for b4 in b3["by_meeting_number"]["buckets"]:
                        meeting_number = b4["key"]
                        count_by_document_type = {}
                        for b5 in b4["by_document_type"]["buckets"]:
                            document_type = b5["key"]
                            count = b5["doc_count"]
                            count_by_document_type[document_type] = count
                        output.append({
                            "district": district,
                            "year": year,
                            "meeting_type": meeting_type,
                            "meeting_number": meeting_number,
                            "count_by_document_type": count_by_document_type,
                        })
        return output

    async def search2(self, *, keyword, district, year, meeting_type, meeting_number, document_type):
        should = self._keyword_to_match_phrases(keyword)
        return await self.client.search_document(self.index_name, {
            "_source": {
                "excludes": ["page_content"],
            },
            "query": {
                "bool": {
                    "must": {
                        "match_all": {},
                    },
                    "filter": [
                        {"bool": {"should": should}},
                        {"term": {"district": district}},
                        {"term": {"year": year}},
                        {"term": {"meeting_type": meeting_type}},
                        {"term": {"meeting_number": meeting_number}},
                        {"term": {"document_type": document_type}},
                    ],
                },
            },
            "highlight": {
                "fields": {
                    "page_content": {},
                    "agenda_title": {},
                },
            },
        })
