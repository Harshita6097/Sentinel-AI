"""
Text Parser — normalises raw emergency report text.

Handles noisy input from SMS, WhatsApp, call-centre transcripts, etc.
Interface is designed for future replacement with a transformer pre-processor.
"""
import re


def parse(raw: str) -> str:
    """
    Clean and normalise a raw emergency report string.

    Steps:
      1. Strip leading/trailing whitespace
      2. Collapse multiple spaces / newlines into a single space
      3. Remove non-printable / control characters
      4. Normalise common SMS abbreviations
      5. Fix run-together punctuation (e.g. "help!flood" → "help! flood")
      6. Preserve original casing (entity extractor handles case-folding)

    Args:
        raw: Unprocessed report string from any input channel.

    Returns:
        Cleaned string ready for entity extraction.
    """
    if not raw or not raw.strip():
        raise ValueError("Report text cannot be empty.")

    text = raw.strip()

    # Remove control characters (keep printable ASCII + unicode letters)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)

    # Normalise common SMS shorthand
    _ABBREV = {
        r'\bpls\b': 'please',
        r'\burgnt\b': 'urgent',
        r'\bhlp\b': 'help',
        r'\bppl\b': 'people',
        r'\bhosp\b': 'hospital',
        r'\bimmed\b': 'immediately',
        r'\bw/\b': 'with',
        r'\bw/o\b': 'without',
        r'\bapprox\b': 'approximately',
    }
    for pattern, replacement in _ABBREV.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # Ensure space after sentence-ending punctuation if missing
    text = re.sub(r'([.!?])([A-Za-z])', r'\1 \2', text)

    # Collapse any new double-spaces introduced above
    text = re.sub(r' {2,}', ' ', text).strip()

    return text
