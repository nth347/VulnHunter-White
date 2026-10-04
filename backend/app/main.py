from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import auth, discoveries, docker, projects, settings, vulns
from .auth import AccessTokenMiddleware
from .i18n import translate_source
from .models import init_db
from .services.shutdown import install_signal_bridge, reset as reset_shutdown
from .tools import register_all_tools
from .db_migrations import run_migrations

app = FastAPI(title="VulnHunter-White", version="0.1.0")

# Token gate must sit inside CORS so 401 responses still get CORS headers.
app.add_middleware(AccessTokenMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def request_language(request: Request) -> str:
    """Language for this request, from the Accept-Language header."""
    raw = request.headers.get("accept-language") or ""
    # Only the primary tag matters; the frontend sends a bare "en"/"zh".
    return raw.split(",")[0].split(";")[0].strip() or "en"


@app.exception_handler(HTTPException)
async def localized_http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """Translate error detail into the caller's language.

    Call sites that already use i18n.tr() pass through unchanged; this catches
    the ones still raising inline Chinese so no message reaches an English UI
    untranslated.
    """
    if isinstance(exc.detail, str):
        translated = translate_source(exc.detail, request_language(request))
        if translated != exc.detail:
            exc = HTTPException(
                status_code=exc.status_code,
                detail=translated,
                headers=exc.headers,
            )
    return await http_exception_handler(request, exc)


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(vulns.router)
app.include_router(settings.router)
app.include_router(docker.router)
app.include_router(discoveries.router)


@app.on_event("startup")
def on_startup() -> None:
    reset_shutdown()
    init_db()
    run_migrations()
    register_all_tools()
    install_signal_bridge()
    from .services.pipeline import recover_inflight_projects

    recover_inflight_projects()
    from .services.cli_tool_index import start_cli_tool_scanner

    start_cli_tool_scanner()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "VulnHunter-White"}
