from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .api import auth, discoveries, docker, projects, settings, vulns
from .auth import AccessTokenMiddleware
from .config import ROOT_DIR
from .i18n import translate_source
from .models import init_db
from .services.runtime import runtime_payload
from .services.shutdown import install_signal_bridge, reset as reset_shutdown
from .tools import register_all_tools

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

_FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"
_FRONTEND_INDEX = _FRONTEND_DIST / "index.html"


@app.on_event("startup")
def on_startup() -> None:
    reset_shutdown()
    init_db()
    register_all_tools()
    install_signal_bridge()
    from .services.pipeline import recover_inflight_projects

    recover_inflight_projects()
    from .services.cli_tool_index import start_cli_tool_scanner

    start_cli_tool_scanner()
    from .services.app_update import start_app_update_checker

    start_app_update_checker()


@app.get("/api/health")
def health() -> dict:
    payload = {"ok": True, "service": "VulnHunter-White"}
    payload.update(runtime_payload())
    return payload


if _FRONTEND_DIST.is_dir() and _FRONTEND_INDEX.is_file():
    assets = _FRONTEND_DIST / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="frontend-assets")

    @app.get("/")
    def spa_root():
        return FileResponse(_FRONTEND_INDEX)

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        # Never shadow API or already-mounted assets.
        if full_path.startswith("api/") or full_path == "api":
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        candidate = (_FRONTEND_DIST / full_path).resolve()
        try:
            candidate.relative_to(_FRONTEND_DIST.resolve())
        except ValueError:
            return FileResponse(_FRONTEND_INDEX)
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_FRONTEND_INDEX)
