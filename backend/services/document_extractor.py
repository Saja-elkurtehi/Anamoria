import asyncio
import io
from pathlib import Path


def _extract_pdf(content: bytes) -> str:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(content))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(p for p in pages if p.strip())


def _extract_sync(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(content)
    if suffix in (".txt", ".md"):
        return content.decode("utf-8", errors="replace")
    raise ValueError(f"Unsupported file type '{suffix}'. Accepted: .pdf, .txt, .md")


async def extract_text(filename: str, content: bytes) -> str:
    return await asyncio.to_thread(_extract_sync, filename, content)
