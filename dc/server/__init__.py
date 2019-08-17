import io
import json
import os
from urllib.parse import parse_qsl

from ..es.search import SearchClient

client = SearchClient(os.getenv("ES_ENDPOINT", "http://localhost:9200"))


def parse_query_string(query_string):
    if not query_string:
        return []
    return parse_qsl(query_string, keep_blank_values=True, strict_parsing=True)


class StatusError(Exception):
    def __init__(self, status):
        super().__init__(str(status))
        self.status = status


async def send_bytes(
    send,
    body=b"",
    status=200,
    content_type=b"application/octet-stream",
):
    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [
            [b"content-length", str(len(body)).encode("utf-8")],
            [b"content-type", content_type],
        ],
    })
    await send({
        "type": "http.response.body",
        "body": body,
    })


async def send_json(send, j):
    await send_bytes(
        send,
        body=json.dumps(j, ensure_ascii=False).encode("utf-8"),
        content_type=b"application/json",
    )


async def send_status(send, status):
    await send_bytes(send, status=status)


def content_type_and_content_length(scope, content_type):
    actual_content_type = None
    actual_content_length = None
    for name, value in scope["headers"]:
        if name == b"content-type":
            actual_content_type = value
        if name == b"content-length":
            actual_content_length = int(value.decode("utf-8"))

    if actual_content_type != content_type:
        raise StatusError(400)

    if actual_content_length is None:
        raise StatusError(400)

    return actual_content_length


async def read_bytes(scope, receive, send, content_type, body_limit=1024):
    content_length = content_type_and_content_length(scope, content_type)
    count = 0
    buf = io.BytesIO()
    while True:
        r = await receive()
        assert r["type"] == "http.request"
        count += buf.write(r["body"])
        if count > body_limit:
            raise StatusError(413)
        if not r["more_body"]:
            break

    if count != content_length:
        raise StatusError(400)

    return buf.getvalue()


async def read_json(scope, receive, send):
    b = await read_bytes(scope, receive, send, b"application/json")
    try:
        return json.load(io.BytesIO(b))
    except Exception:
        raise StatusError(400)


async def search1(scope, receive, send):
    query_string = scope.get("query_string", b"").decode("utf-8")

    # Prepare input
    pairs = parse_query_string(query_string)
    keyword = ""
    district = []
    year = []
    for name, value in pairs:
        if name == "keyword":
            keyword = value
        if name == "district":
            district.append(value)
        if name == "year":
            year.append(value)

    result = await client.search1(keyword=keyword, district=district, year=year)
    interpreted_result = client.interpret_search1_result(result)
    body = {
        "items": interpreted_result,
    }
    await send_json(send, body)


async def search2(scope, receive, send):
    query_string = scope.get("query_string", b"").decode("utf-8")

    # Prepare input
    pairs = parse_query_string(query_string)
    keyword = ""
    district = ""
    year = ""
    meeting_type = ""
    meeting_number = ""
    document_type = ""
    for name, value in pairs:
        if name == "keyword":
            keyword = value
        if name == "district":
            district = value
        if name == "year":
            year = value
        if name == "meeting_type":
            meeting_type = value
        if name == "meeting_number":
            meeting_number = value
        if name == "document_type":
            document_type = value

    body = await client.search2(
        keyword=keyword,
        district=district,
        year=year,
        meeting_type=meeting_type,
        meeting_number=meeting_number,
        document_type=document_type,
    )
    await send_json(send, body)


async def root(scope, receive, send):
    await send_status(send, 200)


async def app(scope, receive, send):
    assert scope["type"] == "http"
    raw_path = scope["raw_path"]
    routes = {
        b"/": root,
        b"/search1": search1,
        b"/search2": search2,
    }

    try:
        handler = routes[raw_path]
    except KeyError:
        await send_status(send, 404)
        return

    try:
        await handler(scope, receive, send)
    except StatusError as e:
        await send_status(send, e.status)
