from starlette.responses import JSONResponse


async def app(scope, receive, send):
    assert scope["type"] == "http"
    resp = JSONResponse({"hello": "world"})
    await resp(scope, receive, send)
