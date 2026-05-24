import json
from airports import AIRPORTS_DB


def ai_destination_search(query: str, anthropic_key: str) -> tuple[list[str] | None, str | None]:
    """Return up to 8 IATA codes matching the user's vibe/region query."""
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=anthropic_key)
        prompt = (
            f'You are a flight destination assistant for Indian travellers flying from Delhi.\n'
            f'The user said: "{query}"\n\n'
            f'Return ONLY a valid JSON array of up to 8 IATA airport codes that best match what they want.\n'
            f'Consider vibe words like "beaches", "mountains", "party", "budget", "luxury", "history", "adventure".\n'
            f'Consider regions like "Southeast Asia", "Europe", "Middle East", "South Asia".\n'
            f'Example output: ["BKK","HKT","DPS","SIN","KUL"]\n'
            f'Return ONLY the JSON array — no explanation, no markdown.'
        )
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        codes = json.loads(resp.content[0].text.strip())
        valid = [c for c in codes if c in AIRPORTS_DB]
        return valid, None
    except Exception as exc:
        return None, str(exc)


def transcribe_audio(audio_bytes: bytes, sample_rate: int, sample_width: int) -> str:
    """Transcribe raw PCM audio bytes using Google's free speech API."""
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        audio = sr.AudioData(audio_bytes, sample_rate, sample_width)
        return recognizer.recognize_google(audio)
    except Exception:
        return ""
