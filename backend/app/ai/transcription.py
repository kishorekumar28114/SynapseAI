import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def extract_text_from_document(file_path: str) -> str:
    """Extract text from PDF, DOCX, or TXT files."""
    extension = Path(file_path).suffix.lower().lstrip(".")

    if extension == "txt":
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            logger.error(f"TXT extraction error: {e}")
            return ""

    elif extension == "pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            return "\n".join(text_parts)
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return ""

    elif extension == "docx":
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as e:
            logger.error(f"DOCX extraction error: {e}")
            return ""

    return ""


async def transcribe_audio(file_path: str) -> tuple[str, Optional[float]]:
    """
    Transcribe audio using Faster Whisper.
    Returns (transcript_text, duration_seconds).
    """
    try:
        from faster_whisper import WhisperModel

        # Use base model for balance of speed/accuracy
        # Change to "large-v3" for higher accuracy
        model = WhisperModel("base", device="cpu", compute_type="int8")

        segments, info = model.transcribe(
            file_path,
            beam_size=5,
            language=None,  # auto-detect
            vad_filter=True,  # Voice Activity Detection to skip silence
        )

        transcript_parts = []
        for segment in segments:
            transcript_parts.append(segment.text.strip())

        full_transcript = " ".join(transcript_parts)
        duration = info.duration if hasattr(info, "duration") else None

        logger.info(f"Transcribed {file_path}: {len(full_transcript)} chars, {duration:.1f}s")
        return full_transcript, duration

    except ImportError:
        logger.error("faster-whisper not installed. Run: pip install faster-whisper")
        return "", None
    except Exception as e:
        logger.error(f"Transcription error for {file_path}: {e}")
        return "", None
