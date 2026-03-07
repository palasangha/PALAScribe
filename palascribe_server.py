#!/usr/bin/env python3
"""
PALAScribe Multi-User Server
Provides HTTP API with database persistence for multi-user functionality
"""

import sys
import os
import subprocess
import json
import uuid
import tempfile
import shutil
import re
import time
import math
import tempfile
import sqlite3
import uuid
import shutil
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler, ThreadingHTTPServer
import urllib.parse
from io import BytesIO
from datetime import datetime, timedelta
import threading
import secrets
import hashlib

try:
    import websocket as websocket_client
    MCP_WS_AVAILABLE = True
except Exception as e:
    print(f"⚠️ websocket-client not available: {e}")
    MCP_WS_AVAILABLE = False

# Load environment variables
from pathlib import Path
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

# Google OAuth
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from google_auth_oauthlib.flow import Flow
    import jwt
    GOOGLE_AUTH_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Google Auth not available: {e}")
    GOOGLE_AUTH_AVAILABLE = False

# PDF generation
try:
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False

# Configuration from environment
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/auth/google/callback')
SUPER_ADMIN_EMAIL = os.getenv('SUPER_ADMIN_EMAIL', '')
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
MCP_SERVER_WS_URL = os.getenv('MCP_SERVER_WS_URL', 'ws://localhost:4000')
MCP_METADATA_AGENT_ID = os.getenv('MCP_METADATA_AGENT_ID', 'metadata-extraction-agent')
MCP_METADATA_TOOL_NAME = os.getenv('MCP_METADATA_TOOL_NAME', 'extract_metadata')
MCP_METADATA_MODEL = os.getenv('MCP_METADATA_MODEL', 'ollama')
MCP_METADATA_OUTPUT_TYPE = os.getenv('MCP_METADATA_OUTPUT_TYPE', 'pala')
MCP_STORAGE_AGENT_ID = os.getenv('MCP_STORAGE_AGENT_ID', 'storage-agent')
MCP_STORAGE_TOOL_NAME = os.getenv('MCP_STORAGE_TOOL_NAME', 'store_document')
MCP_STORAGE_TYPE = os.getenv('MCP_STORAGE_TYPE', 'PalaScribe')
MCP_STORAGE_CREATED_BY = os.getenv('MCP_STORAGE_CREATED_BY', 'web-dashboard')
# Increased timeout for MCP calls (metadata extraction can take 60-120s with LLM processing)
AGENT_HTTP_TIMEOUT_SECONDS = int(os.getenv('AGENT_HTTP_TIMEOUT_SECONDS', '120'))

# Global variables for tracking active transcriptions
active_transcriptions = {}  # {project_id: {'process': subprocess_obj, 'cancelled': bool}}
transcription_lock = threading.Lock()

# Transcription status and logs tracking
transcription_status = {}  # {project_id: {'start_time': timestamp, 'logs': [lines]}}
MAX_LOG_LINES = 50  # Keep last 50 log lines per project

# Pali corrections dictionary and function (moved from whisper_server.py)
PALI_CORRECTIONS = {
    # Core Buddhist concepts
    'buddha': 'Buddha',
    'budha': 'Buddha',
    'budhha': 'Buddha',
    'dharma': 'Dhamma',
    'darma': 'Dhamma',
    'dhamma': 'Dhamma',
    'sangha': 'Saṅgha',
    'sanga': 'Saṅgha',
    'sankha': 'Saṅgha',
    'nirvana': 'Nibbāna',
    'nirvāna': 'Nibbāna',
    'nibbana': 'Nibbāna',
    'nibbāna': 'Nibbāna',
    'karma': 'Kamma',
    'karman': 'Kamma',
    'kamma': 'Kamma',
    'samsara': 'Saṃsāra',
    'sansara': 'Saṃsāra',
    'saṃsāra': 'Saṃsāra',
    
    # Meditation terms
    'vipassana': 'Vipassanā',
    'vipassanā': 'Vipassanā',
    'vipasana': 'Vipassanā',
    'samatha': 'Samatha',
    'shamatha': 'Samatha',
    'samadhi': 'Samādhi',
    'samādhī': 'Samādhi',
    'jhana': 'Jhāna',
    'jhaana': 'Jhāna',
    'jhāna': 'Jhāna',
    'dhyana': 'Jhāna',
    'mindfulness': 'Sati',
    'sati': 'Sati',
    'satii': 'Sati',
    'satipatthana': 'Satipaṭṭhāna',
    'satipattana': 'Satipaṭṭhāna',
    'satipatthana': 'Satipaṭṭhāna',
    
    # Four Noble Truths and Eightfold Path
    'dukkha': 'Dukkha',
    'dukha': 'Dukkha',
    'suffering': 'Dukkha',
    'tanha': 'Taṇhā',
    'trishna': 'Taṇhā',
    'tanha': 'Taṇhā',
    'taṇhā': 'Taṇhā',
    'craving': 'Taṇhā',
    'magga': 'Magga',
    'marga': 'Magga',
    'eightfold': 'Aṭṭhaṅgika',
    'noble': 'Ariya',
    'arya': 'Ariya',
    'ariya': 'Ariya',
    
    # Precepts and ethics
    'sila': 'Sīla',
    'seela': 'Sīla',
    'sīla': 'Sīla',
    'sheela': 'Sīla',
    'precept': 'Sīla',
    'precepts': 'Sīla',
    'panna': 'Paññā',
    'prajna': 'Paññā',
    'paññā': 'Paññā',
    'panya': 'Paññā',
    'panjja': 'Paññā',
    'prajñā': 'Paññā',
    'pannya': 'Paññā',
    'wisdom': 'Paññā',
    
    # Monastic terms
    'bhikkhu': 'Bhikkhu',
    'bikhu': 'Bhikkhu',
    'bhikku': 'Bhikkhu',
    'monk': 'Bhikkhu',
    'bhikkhuni': 'Bhikkhunī',
    'bikkhuni': 'Bhikkhunī',
    'bhikkhunī': 'Bhikkhunī',
    'bhikkuni': 'Bhikkhunī',
    'nun': 'Bhikkhunī',
    'uposatha': 'Uposatha',
    'upasampadā': 'Upasampadā',
    'upasampada': 'Upasampadā',
    
    # Texts and teachings
    'sutta': 'Sutta',
    'sutra': 'Sutta',
    'tripitaka': 'Tipiṭaka',
    'tipitaka': 'Tipiṭaka',
    'tipiṭaka': 'Tipiṭaka',
    'abhidhamma': 'Abhidhamma',
    'abhidharma': 'Abhidhamma',
    'vinaya': 'Vinaya',
    'pali': 'Pāli',
    'paali': 'Pāli',
    'pāli': 'Pāli',
    
    # Common Pali words
    'metta': 'Mettā',
    'mettā': 'Mettā',
    'meta': 'Mettā',
    'loving': 'Mettā',
    'karuna': 'Karuṇā',
    'karuṇā': 'Karuṇā',
    'karuna': 'Karuṇā',
    'compassion': 'Karuṇā',
    'mudita': 'Muditā',
    'muditā': 'Muditā',
    'joy': 'Muditā',
    'upekkha': 'Upekkhā',
    'upekkhā': 'Upekkhā',
    'upexa': 'Upekkhā',
    'equanimity': 'Upekkhā',
    'anicca': 'Anicca',
    'annica': 'Anicca',
    'impermanence': 'Anicca',
    'anatta': 'Anattā',
    'anattā': 'Anattā',
    'anatman': 'Anattā',
    'selflessness': 'Anattā',
    
    # Places and people
    'bodhi': 'Bodhi',
    'bodhisattva': 'Bodhisatta',
    'bodhisatta': 'Bodhisatta',
    'tathagata': 'Tathāgata',
    'tathāgata': 'Tathāgata',
    'gaya': 'Gayā',
    'gayā': 'Gayā',
    'varanasi': 'Vārāṇasī',
    'benares': 'Vārāṇasī',
    'vārāṇasī': 'Vārāṇasī',
    'sarnath': 'Sārnāth',
    'sārnāth': 'Sārnāth',
    
    # Festivals and ceremonies  
    'vesak': 'Vesākha',
    'vesākha': 'Vesākha',
    'wesak': 'Vesākha',
    'kathina': 'Kaṭhina',
    'kaṭhina': 'Kaṭhina',
    'paritta': 'Paritta',
    'parita': 'Paritta',
    
    # Common mispronunciations
    'namo': 'Namo',
    'nama': 'Namo',
    'namaste': 'Namaste',
    'sabbe': 'Sabbe',
    'sabe': 'Sabbe',
    'satta': 'Satta',
    'bhava': 'Bhava',
    'bava': 'Bhava',
    'become': 'Bhava',
    'becoming': 'Bhava'
}

def format_transcription_text(text):
    """
    Format transcribed text by adding paragraph breaks.
    This runs as a post-processing step after Pali corrections.
    """
    if not text or not text.strip():
        return text
    
    print("📄 Applying paragraph formatting...")
    
    # Split into sentences
    import re
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) <= 2:
        return text  # Not enough content to format
    
    formatted_paragraphs = []
    current_paragraph = []
    
    # Strong discourse markers that definitely indicate new paragraphs
    strong_markers = [
        'well', 'so now', 'however', 'but now', 'therefore', 'thus', 'in conclusion',
        'finally', 'first', 'second', 'third', 'next step', 'also important',
        'for example', 'in fact', 'actually', 'ultimately', 'in summary'
    ]
    
    # VRI/Buddhist-specific strong markers
    buddhist_strong_markers = [
        'the buddha said', 'the buddha taught', 'according to the buddha',
        'in vipassana', 'when meditating', 'during meditation',
        'the dhamma teaches', 'this technique', 'this method', 'this practice',
        'noble truth', 'four foundation', 'eight fold'
    ]
    
    # Question patterns that indicate topic changes
    question_patterns = [
        r'^what.*', r'^how.*', r'^why.*', r'^when.*', r'^where.*'
    ]
    
    for i, sentence in enumerate(sentences):
        sentence = sentence.strip()
        if not sentence:
            continue
            
        sentence_lower = sentence.lower()
        
        # Check if this sentence should start a new paragraph
        should_break = False
        
        # Check for strong discourse markers at the beginning
        if current_paragraph:
            first_words = sentence_lower.split()[:4]
            sentence_start = ' '.join(first_words)
            
            # Strong markers always create breaks
            if any(marker in sentence_start for marker in strong_markers + buddhist_strong_markers):
                should_break = True
            
            # Questions create breaks
            if any(re.match(pattern, sentence_lower) for pattern in question_patterns):
                should_break = True
            
            # Force break if paragraph gets too long (5+ sentences or 500+ characters)
            current_text = '. '.join(current_paragraph)
            if len(current_paragraph) >= 5 or len(current_text) > 500:
                should_break = True
        
        # Start new paragraph if needed
        if should_break and current_paragraph:
            formatted_paragraphs.append('. '.join(current_paragraph) + '.')
            current_paragraph = []
        
        # Add sentence to current paragraph
        current_paragraph.append(sentence)
    
    # Add any remaining sentences
    if current_paragraph:
        formatted_paragraphs.append('. '.join(current_paragraph) + '.')
    
    # Join paragraphs with double line breaks
    formatted_text = '\n\n'.join(formatted_paragraphs)
    
    paragraph_count = len(formatted_paragraphs)
    
    print(f"✅ Paragraph formatting applied: {len(sentences)} sentences → {paragraph_count} paragraphs")
    return formatted_text

def parse_timecode_to_seconds(value):
    """Convert SRT/VTT-style timecode (HH:MM:SS,mmm) to seconds."""
    try:
        if not value:
            return None
        clean = str(value).strip().replace(',', '.')
        parts = clean.split(':')
        if len(parts) != 3:
            return None
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds = float(parts[2])
        return (hours * 3600) + (minutes * 60) + seconds
    except Exception:
        return None

def parse_srt_segments(srt_content):
    """Parse SRT content into timestamped transcript segments."""
    segments = []
    if not srt_content or not str(srt_content).strip():
        return segments

    blocks = re.split(r'\r?\n\r?\n+', srt_content.strip())
    for idx, block in enumerate(blocks):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue

        time_line_index = 0
        if '-->' not in lines[time_line_index] and len(lines) > 1 and '-->' in lines[1]:
            time_line_index = 1

        if '-->' not in lines[time_line_index]:
            continue

        try:
            start_raw, end_raw = [part.strip() for part in lines[time_line_index].split('-->', 1)]
        except Exception:
            continue

        start_seconds = parse_timecode_to_seconds(start_raw)
        end_seconds = parse_timecode_to_seconds(end_raw)
        text_lines = lines[time_line_index + 1:]
        text = ' '.join(text_lines).strip()

        if not text:
            continue

        segments.append({
            'id': f'seg-{idx + 1}',
            'start': start_seconds,
            'end': end_seconds,
            'text': text,
            'speaker': ''
        })

    return segments


def parse_whisper_json_segments(json_content):
    """Parse Whisper JSON output into timestamped transcript segments with confidence metadata."""
    segments = []
    if not json_content or not str(json_content).strip():
        return segments

    try:
        data = json.loads(json_content)
    except Exception:
        return segments

    raw_segments = data.get('segments') if isinstance(data, dict) else None
    if not isinstance(raw_segments, list):
        return segments

    for idx, segment in enumerate(raw_segments):
        if not isinstance(segment, dict):
            continue

        text = str(segment.get('text') or '').strip()
        if not text:
            continue

        avg_logprob = segment.get('avg_logprob')
        no_speech_prob = segment.get('no_speech_prob')
        confidence = segment.get('confidence')

        if confidence is None and isinstance(avg_logprob, (int, float)):
            try:
                confidence = max(0.0, min(1.0, math.exp(float(avg_logprob))))
            except Exception:
                confidence = None
        if confidence is None and isinstance(no_speech_prob, (int, float)):
            try:
                confidence = max(0.0, min(1.0, 1.0 - float(no_speech_prob)))
            except Exception:
                confidence = None

        segments.append({
            'id': str(segment.get('id') or f'seg-{idx + 1}'),
            'start': segment.get('start'),
            'end': segment.get('end'),
            'text': text,
            'speaker': str(segment.get('speaker') or ''),
            'confidence': confidence,
            'avg_logprob': avg_logprob,
            'no_speech_prob': no_speech_prob,
            'tokens': segment.get('tokens')
        })

    return segments


def apply_pali_corrections(text):
    """
    Apply Pali word corrections to transcribed text using simple pattern matching.
    """
    if not text or not text.strip():
        return text
    
    corrected_text = text
    corrections_made = []
    
    # Sort corrections by length (longest first) to handle overlapping patterns correctly
    sorted_corrections = sorted(PALI_CORRECTIONS.items(), key=lambda x: len(x[0]), reverse=True)
    
    for english_term, pali_term in sorted_corrections:
        # Create a regex pattern that matches the word with word boundaries
        pattern = r'\b' + re.escape(english_term) + r'\b'
        
        # Check if the pattern exists in the text before trying to replace
        if re.search(pattern, corrected_text, flags=re.IGNORECASE):
            
            # Function to handle case preservation
            def replace_func(match):
                matched_word = match.group(0)
                
                # Preserve original case pattern
                if matched_word.isupper():
                    return pali_term.upper()
                elif matched_word.istitle():
                    return pali_term.title() if pali_term.islower() else pali_term
                elif matched_word.islower():
                    return pali_term
                else:
                    return pali_term
            
            # Apply the replacement with case-insensitive matching
            old_text = corrected_text
            corrected_text = re.sub(pattern, replace_func, corrected_text, flags=re.IGNORECASE)
            
            # Track corrections made for logging
            if old_text != corrected_text:
                corrections_made.append(f"{english_term} → {pali_term}")
    
    # Log final results
    if corrections_made:
        print(f"✅ Applied {len(corrections_made)} Pali corrections")
    
    return corrected_text


def write_provenance_header_text_file(output_path, metadata, text_body):
    """
    Write a transcription text file with a small inline JSON provenance header.
    The header is delimited by explicit start/end markers so readers can
    detect and parse it easily.
    """
    try:
        # Use a user-friendly label and markers: 'Source Info'
        start_marker = "---SOURCE-INFO-START---"
        end_marker = "---SOURCE-INFO-END---"
        header_json = json.dumps(metadata, indent=2, ensure_ascii=False)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"{start_marker}\n")
            f.write(header_json)
            f.write(f"\n{end_marker}\n\n")
            f.write(text_body)

        print(f"✅ Wrote transcription with provenance to: {output_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to write provenance file {output_path}: {e}")
        return False


def generate_pdf_with_provenance(output_pdf_path, metadata, text_body):
    """Generate a simple PDF with a provenance first page and the transcription text.

    Falls back to writing a plain text file if ReportLab is not available.
    """
    if not REPORTLAB_AVAILABLE:
        print("⚠️ reportlab not available — falling back to writing a .txt with source-info header")
        # fallback: write a .txt file next to desired pdf path with .txt extension
        txt_path = str(Path(output_pdf_path).with_suffix('.txt'))
        return write_provenance_header_text_file(txt_path, metadata, text_body)

    try:
        doc = SimpleDocTemplate(
            output_pdf_path,
            pagesize=A4,
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm,
        )

        styles = getSampleStyleSheet()
        elems = []

        # Provenance block
        prov_json = json.dumps(metadata, indent=2, ensure_ascii=False)
        elems.append(Paragraph("Source Info", styles['Heading2']))
        elems.append(Preformatted(prov_json, styles['Code']))
        elems.append(PageBreak())

        # Transcription paragraphs
        for para in text_body.split('\n\n'):
            p = para.strip().replace('\n', ' ')
            if p:
                elems.append(Paragraph(p, styles['BodyText']))
                elems.append(Spacer(1, 6))

        doc.build(elems)
        print(f"✅ Generated PDF with provenance: {output_pdf_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to generate PDF {output_pdf_path}: {e}")
        return False


def regenerate_pdf_for_project(db_manager, project_id, transcription_text, editor=None, change_summary=None, model=None):
    """Regenerate and archive PDF for a project in the background.

    Saves files under `exports/{project_id}/` and keeps versioned archives.
    Also maintains a simple `index.json` manifest in that folder.
    """
    try:
        if not transcription_text or not str(transcription_text).strip():
            print(f"ℹ️ No transcription text provided for project {project_id}; skipping PDF regeneration")
            return False

        project = db_manager.get_project(project_id)
        if not project:
            print(f"❌ Project {project_id} not found for PDF regeneration")
            return False

        audio_path = project.get('audio_file_path') or project.get('audioFilePath')
        base = None
        if audio_path:
            base = Path(audio_path).stem
        else:
            base = project.get('name') or project_id

        exports_dir = Path('exports') / project_id
        exports_dir.mkdir(parents=True, exist_ok=True)

        # Determine next version number by scanning existing versioned PDFs
        existing = []
        for p in exports_dir.glob(f"{base}_v*.pdf"):
            try:
                stem = p.stem  # e.g., basename_v3
                ver = int(stem.split('_v')[-1])
                existing.append(ver)
            except Exception:
                continue

        next_version = max(existing) + 1 if existing else 1

        new_filename = f"{base}_v{next_version}.pdf"
        new_path = exports_dir / new_filename
        latest_path = exports_dir / f"{base}.pdf"

        now = datetime.now().isoformat()

        # Build metadata with history entry
        index_path = exports_dir / 'index.json'
        history = []
        if index_path.exists():
            try:
                with open(index_path, 'r', encoding='utf-8') as f:
                    idx = json.load(f)
                    history = idx.get('history', [])
            except Exception as e:
                print(f"⚠️ Could not read existing export index: {e}")

        entry = {
            'version': next_version,
            'file': new_filename,
            'actor': editor or 'system',
            'action': 'edit' if editor else 'auto',
            'timestamp': now,
            'note': change_summary or ''
        }
        history.append(entry)

        # Try to get the original uploaded filename and optional source_path from the database if available
        original_filename = ''
        source_path_val = ''
        try:
            # DatabaseManager may provide recent audio info for the project
            audio_rec = db_manager.get_latest_audio_for_project(project_id)
            if audio_rec:
                original_filename = audio_rec.get('original_name') or audio_rec.get('original_name') or ''
                source_path_val = audio_rec.get('source_path') or ''
        except Exception:
            original_filename = ''
            source_path_val = ''

        metadata = {
            'stored_filename': Path(audio_path).name if audio_path else '',
            'original_filename': original_filename,
            'original_path': str(audio_path) if audio_path else '',
            'source_path': source_path_val,
            'processing_model': model or project.get('processing_model') or '',
            'version': next_version,
            'last_edited_by': editor or 'system',
            'last_edited_at': now,
            'history': history
        }

        ok = generate_pdf_with_provenance(str(new_path), metadata, transcription_text)
        if not ok:
            print(f"❌ PDF generation failed for project {project_id}")
            return False

        # Write a per-version companion JSON manifest with full provenance
        try:
            companion_manifest_path = exports_dir / f"{base}_v{next_version}.json"
            manifest_content = {
                'project_id': project_id,
                'pdf_file': new_filename,
                'version': next_version,
                'generated_at': now,
                'generated_by': editor or 'system',
                'processing_model': model or project.get('processing_model') or '',
                'stored_filename': metadata.get('stored_filename', ''),
                'original_filename': metadata.get('original_filename', ''),
                'original_path': metadata.get('original_path', ''),
                'source_path': metadata.get('source_path', ''),
                'note': change_summary or '',
                'history': history,
                # include a short excerpt for quick inspection
                'transcription_excerpt': (transcription_text[:1000] + '...') if transcription_text and len(transcription_text) > 1000 else transcription_text
            }
            with open(companion_manifest_path, 'w', encoding='utf-8') as mf:
                json.dump(manifest_content, mf, indent=2, ensure_ascii=False)
            # Add manifest filename to the history entry we just appended
            if history and isinstance(history, list):
                history[-1]['manifest'] = companion_manifest_path.name
        except Exception as e:
            print(f"⚠️ Could not write companion manifest: {e}")

        # Update the project's DB record to embed the latest provenance
        try:
            db_manager.update_project(project_id, {'export_provenance': json.dumps(manifest_content, ensure_ascii=False)})
            print(f"✅ Stored latest export provenance in DB for project {project_id}")
        except Exception as e:
            print(f"⚠️ Could not update project's export_provenance in DB: {e}")

        # Update latest copy
        try:
            shutil.copyfile(str(new_path), str(latest_path))
        except Exception as e:
            print(f"⚠️ Could not copy latest PDF: {e}")

        # Update index manifest
        try:
            idx_content = {
                'project_id': project_id,
                'base': base,
                'latest': latest_path.name,
                'history': history
            }
            with open(index_path, 'w', encoding='utf-8') as f:
                json.dump(idx_content, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️ Could not write export index.json: {e}")

        print(f"✅ Regenerated PDF for project {project_id}: {new_path}")
        return True
    except Exception as e:
        print(f"❌ Unexpected error regenerating PDF for project {project_id}: {e}")
        return False


# Authentication helper functions
def create_jwt_token(user_id, email, role):
    """Create JWT token for authenticated user"""
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')
    return token


def verify_jwt_token(token):
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def _select_approved_text(project):
    """Select the best approved text content from project fields."""
    return (
        project.get('edited_text')
        or project.get('editedText')
        or project.get('transcription')
        or ''
    )


def _extract_metadata_via_mcp(text):
    """Invoke metadata extraction agent via MCP WebSocket JSON-RPC."""
    if not MCP_WS_AVAILABLE:
        raise Exception("websocket-client dependency is not available")

    return _invoke_mcp_tool(
        agent_id=MCP_METADATA_AGENT_ID,
        tool_name=MCP_METADATA_TOOL_NAME,
        arguments={
            "text": text,
            "model": MCP_METADATA_MODEL,
            "output_type": "combined"
        }
    )


def _invoke_mcp_tool(agent_id, tool_name, arguments):
    """Invoke any MCP tool via WebSocket JSON-RPC and return `result`."""
    if not MCP_WS_AVAILABLE:
        raise Exception("websocket-client dependency is not available")

    request_id = f"req-{uuid.uuid4()}"
    request_payload = {
        "jsonrpc": "2.0",
        "method": "tools/invoke",
        "params": {
            "agentId": agent_id,
            "toolName": tool_name,
            "arguments": arguments
        },
        "id": request_id
    }

    # Log request keys for debugging
    arg_keys = list(arguments.keys()) if arguments else []
    print(f"🔌 MCP Request: {agent_id}/{tool_name} with args: {arg_keys}")
    print(f"📤 Full request payload:")
    print(json.dumps(request_payload, indent=2, ensure_ascii=False))

    ws = None
    try:
        ws = websocket_client.create_connection(MCP_SERVER_WS_URL, timeout=AGENT_HTTP_TIMEOUT_SECONDS)
        ws.send(json.dumps(request_payload, ensure_ascii=False))

        deadline = time.time() + AGENT_HTTP_TIMEOUT_SECONDS
        while time.time() < deadline:
            raw_message = ws.recv()
            if not raw_message:
                continue

            parsed = json.loads(raw_message)
            if parsed.get('id') != request_id:
                continue

            if 'error' in parsed and parsed['error']:
                raise Exception(f"MCP error: {parsed['error']}")

            result = parsed.get('result')
            if result is None:
                raise Exception("MCP response did not contain result")
            
            # Check if result indicates failure (MCP agents return success: false with error message)
            if isinstance(result, dict) and result.get('success') is False:
                error_msg = result.get('error', 'Unknown error from MCP agent')
                raise Exception(f"MCP agent failed: {error_msg}")
            
            return result

        raise Exception("Timed out waiting for MCP metadata response")
    finally:
        try:
            if ws:
                ws.close()
        except Exception:
            pass


def _store_document_via_mcp(project, approved_text, metadata_payload):
    """Invoke storage-agent/store_document MCP tool with PALAScribe approval payload."""
    source_name = (
        project.get('audio_file_name')
        or project.get('audioFileName')
        or project.get('name')
        or 'document.txt'
    )
    file_format = 'txt'
    if '.' in source_name:
        file_format = source_name.rsplit('.', 1)[-1].lower() or 'txt'

    language = 'en'
    try:
        model_info_raw = project.get('processing_model') or project.get('processingModel') or '{}'
        model_info = json.loads(model_info_raw) if isinstance(model_info_raw, str) else model_info_raw
        if isinstance(model_info, dict) and model_info.get('language'):
            language = str(model_info.get('language')).lower()
    except Exception:
        language = 'en'

    storage_arguments = {
        "type": "Transcription",
        "original_file": source_name,
        "file_format": file_format,
        "processed_data": {
            "text": approved_text
        },
        "metadata": {
            "language": language,
            "source": "PALAScribe",
            **(metadata_payload if isinstance(metadata_payload, dict) else {})
        },
        "app_data": {
            "app": "PalaScribe",
            "project_name": project.get('name') or '',
            "project_id": project.get('id') or '',
            "status": project.get('status') or 'Approved',
            "assigned_to": project.get('assigned_to') or project.get('assignedTo') or '',
            "reviewed_by": project.get('reviewed_by_user_id') or '',
            "approved_by": project.get('approved_by_user_id') or '',
            "approved_date": project.get('approved_date') or project.get('approvedDate') or '',
            "created_date": project.get('created') or '',
            "audio_file": source_name
        },
        "created_by": "PalaScribe",
        "tags": [
            "palascribe",
            "transcription",
            language.lower() if language else "unknown",
            project.get('name', '').lower().replace(' ', '-') if project.get('name') else 'project',
            "approved"
        ]
    }

    return _invoke_mcp_tool(
        agent_id=MCP_STORAGE_AGENT_ID,
        tool_name=MCP_STORAGE_TOOL_NAME,
        arguments=storage_arguments
    )


def sync_approved_project_to_pala(db_manager, project_id):
    """Background worker: extract metadata and store approved project in Pala platform."""
    print(f"\n{'='*60}")
    print(f"🔄 SYNC THREAD STARTED for project {project_id}")
    print(f"   MCP WebSocket Available: {MCP_WS_AVAILABLE}")
    print(f"   MCP Server URL: {MCP_SERVER_WS_URL}")
    print(f"   Current thread: {threading.current_thread().name}")
    print(f"{'='*60}\n")
    
    if not MCP_WS_AVAILABLE:
        print(f"❌ SYNC ABORTED: websocket-client not available")
        db_manager.update_project(project_id, {
            'metadata_sync_status': 'failed',
            'storage_sync_status': 'failed',
            'storage_error': 'websocket-client dependency is not available'
        })
        return

    sync_stage = 'metadata'

    try:
        project = db_manager.get_project(project_id)
        if not project:
            print(f"❌ SYNC ABORTED: Project {project_id} not found in database")
            return

        print(f"📦 Project loaded: name='{project.get('name')}', has_transcription={bool(project.get('transcription'))}, has_editedText={bool(project.get('editedText'))}, has_edited_text={bool(project.get('edited_text'))}")
        
        approved_text = _select_approved_text(project)
        if not approved_text or not str(approved_text).strip():
            print(f"❌ SYNC ABORTED: No approved text found")
            db_manager.update_project(project_id, {
                'metadata_sync_status': 'failed',
                'storage_sync_status': 'failed',
                'storage_error': 'No approved text found for metadata extraction'
            })
            return

        print(f"📝 Approved text length: {len(approved_text)} characters")
        
        # Log first 200 chars of text for debugging
        text_preview = approved_text[:200] if approved_text else "(empty)"
        print(f"📄 Text preview: {text_preview}...")
        
        db_manager.update_project(project_id, {
            'metadata_sync_status': 'in_progress',
            'storage_sync_status': 'pending',
            'storage_error': ''
        })
        print(f"🔄 Status updated: metadata=in_progress, storage=pending")

        print(f"\n📤 STEP 1: Extracting metadata via MCP...")
        
        # Prepare metadata arguments
        metadata_arguments = {
            "text": approved_text,
            "model": MCP_METADATA_MODEL,
            "output_type": "combined"
        }
        
        # Log the request
        metadata_request_payload = {
            "jsonrpc": "2.0",
            "method": "tools/invoke",
            "params": {
                "agentId": MCP_METADATA_AGENT_ID,
                "toolName": MCP_METADATA_TOOL_NAME,
                "arguments": metadata_arguments
            }
        }
        print(f"🔌 MCP Request: {MCP_METADATA_AGENT_ID}/{MCP_METADATA_TOOL_NAME}")
        print(f"📤 Full metadata request payload:")
        print(json.dumps(metadata_request_payload, indent=2, ensure_ascii=False))
        
        metadata_payload = _extract_metadata_via_mcp(approved_text)
        print(f"✅ Metadata extracted successfully")
        print(f"   Agent: {MCP_METADATA_AGENT_ID}/{MCP_METADATA_TOOL_NAME}")
        print(f"   Metadata keys: {list(metadata_payload.keys()) if metadata_payload else 'None'}")

        db_manager.update_project(project_id, {
            'metadata_sync_status': 'extracted',
            'metadata_payload': json.dumps(metadata_payload, ensure_ascii=False),
            'metadata_synced_at': datetime.now().isoformat(),
            'storage_sync_status': 'in_progress'
        })
        print(f"🔄 Status updated: metadata=extracted, storage=in_progress")

        sync_stage = 'storage'
        print(f"\n📤 STEP 2: Storing document via MCP...")
        storage_result = _store_document_via_mcp(project, approved_text, metadata_payload)
        print(f"✅ Storage completed successfully")
        print(f"   Agent: {MCP_STORAGE_AGENT_ID}/{MCP_STORAGE_TOOL_NAME}")
        print(f"   Storage result keys: {list(storage_result.keys()) if storage_result else 'None'}")

        storage_record_id = (
            storage_result.get('recordId')
            or storage_result.get('id')
            or storage_result.get('storageId')
            or ''
        )

        db_manager.update_project(project_id, {
            'storage_sync_status': 'stored',
            'storage_record_id': str(storage_record_id),
            'storage_synced_at': datetime.now().isoformat(),
            'storage_error': ''
        })
        print(f"\n{'='*60}")
        print(f"✅ SYNC COMPLETED for project {project_id}")
        print(f"   Storage Record ID: {storage_record_id}")
        print(f"{'='*60}\n")

    except Exception as e:
        err = str(e)
        print(f"\n{'='*60}")
        print(f"❌ SYNC FAILED for project {project_id}")
        print(f"   Stage: {sync_stage}")
        print(f"   Error: {err}")
        print(f"{'='*60}\n")
        import traceback
        traceback.print_exc()
        
        failed_updates = {
            'storage_sync_status': 'failed',
            'storage_error': err
        }
        if sync_stage == 'metadata':
            failed_updates['metadata_sync_status'] = 'failed'
        db_manager.update_project(project_id, failed_updates)


def verify_google_token(token):
    """Verify Google ID token and return user info"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name'),
            'picture': idinfo.get('picture')
        }
    except ValueError:
        return None


# Transcription status and logging helper functions
def add_transcription_log(project_id, message):
    """Add a log message to a project's transcription logs"""
    with transcription_lock:
        if project_id not in transcription_status:
            transcription_status[project_id] = {
                'start_time': time.time(),
                'logs': []
            }
        
        # Add timestamp to log message
        log_entry = f"[{datetime.now().strftime('%H:%M:%S')}] {message}"
        transcription_status[project_id]['logs'].append(log_entry)
        
        # Keep only last MAX_LOG_LINES
        if len(transcription_status[project_id]['logs']) > MAX_LOG_LINES:
            transcription_status[project_id]['logs'] = transcription_status[project_id]['logs'][-MAX_LOG_LINES:]


def get_transcription_status(project_id):
    """Get current status and logs for a transcription"""
    with transcription_lock:
        if project_id not in transcription_status:
            return {
                'running': False,
                'elapsed_time': 0,
                'logs': [],
                'status': 'Not started'
            }
        
        status_data = transcription_status[project_id]
        elapsed = time.time() - status_data['start_time']
        
        return {
            'running': project_id in active_transcriptions,
            'elapsed_time': round(elapsed, 1),
            'logs': status_data['logs'][-20:],  # Return last 20 logs
            'status': 'Processing...' if project_id in active_transcriptions else 'Completed'
        }


def clear_transcription_status(project_id):
    """Clear status for a project after transcription completes"""
    with transcription_lock:
        if project_id in transcription_status:
            del transcription_status[project_id]


class DatabaseManager:
    """Handles all database operations for projects and audio files"""
    
    def __init__(self, db_path="palascribe.db"):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """Initialize database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table for Google OAuth authentication
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                google_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                profile_picture TEXT,
                role TEXT DEFAULT 'reviewer',
                created_at TEXT NOT NULL,
                last_login TEXT
            )
        ''')
        
        # Projects table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                assigned_to TEXT,
                start_date TEXT,
                end_date TEXT,
                status TEXT DEFAULT 'In Review',
                audio_file_name TEXT,
                audio_file_path TEXT,
                transcription TEXT,
                formatted_text TEXT,
                edited_text TEXT,
                rich_content TEXT,
                word_count INTEGER DEFAULT 0,
                processing_time REAL,
                is_preview BOOLEAN DEFAULT 0,
                error_message TEXT,
                created TEXT NOT NULL,
                updated TEXT NOT NULL,
                created_by_user_id TEXT,
                assigned_to_user_id TEXT,
                reviewed_by_user_id TEXT,
                assigned_date TEXT,
                reviewed_date TEXT,
                approved_by_user_id TEXT,
                approved_date TEXT,
                processing_model TEXT,
                metadata_sync_status TEXT DEFAULT 'not_started',
                metadata_payload TEXT,
                metadata_synced_at TEXT,
                storage_sync_status TEXT DEFAULT 'not_started',
                storage_record_id TEXT,
                storage_synced_at TEXT,
                storage_error TEXT,
                FOREIGN KEY (created_by_user_id) REFERENCES users (id),
                FOREIGN KEY (assigned_to_user_id) REFERENCES users (id),
                FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id),
                FOREIGN KEY (approved_by_user_id) REFERENCES users (id)
            )
        ''')
        
        # Audio files table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audio_files (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                original_name TEXT,
                file_path TEXT,
                file_size INTEGER,
                mime_type TEXT,
                duration REAL,
                created TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            )
        ''')
        
        # Create uploads directory
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        # DB migration: ensure source_path column exists on audio_files
        try:
            cursor.execute("PRAGMA table_info(audio_files)")
            cols = [r[1] for r in cursor.fetchall()]
            if 'source_path' not in cols:
                try:
                    cursor.execute("ALTER TABLE audio_files ADD COLUMN source_path TEXT")
                    print("✅ Added 'source_path' column to audio_files table")
                except Exception as me:
                    print(f"⚠️ Could not add source_path column: {me}")
        except Exception as e:
            print(f"⚠️ Error checking audio_files schema: {e}")
        
        conn.commit()
        conn.close()
        print("✅ Database initialized")
        # Ensure projects table has an export_provenance column for DB-embedded provenance
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(projects)")
            cols = [r[1] for r in cursor.fetchall()]
            if 'export_provenance' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN export_provenance TEXT")
                    print("✅ Added 'export_provenance' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add export_provenance column: {me}")
            if 'transcript_segments' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN transcript_segments TEXT")
                    print("✅ Added 'transcript_segments' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add transcript_segments column: {me}")
            
            # Add user assignment columns for auth system
            if 'created_by_user_id' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN created_by_user_id TEXT")
                    print("✅ Added 'created_by_user_id' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add created_by_user_id column: {me}")
            
            if 'assigned_to_user_id' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN assigned_to_user_id TEXT")
                    print("✅ Added 'assigned_to_user_id' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add assigned_to_user_id column: {me}")
            
            if 'reviewed_by_user_id' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN reviewed_by_user_id TEXT")
                    print("✅ Added 'reviewed_by_user_id' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add reviewed_by_user_id column: {me}")
            
            if 'assigned_date' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN assigned_date TEXT")
                    print("✅ Added 'assigned_date' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add assigned_date column: {me}")
            
            if 'reviewed_date' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN reviewed_date TEXT")
                    print("✅ Added 'reviewed_date' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add reviewed_date column: {me}")
            
            if 'approved_by_user_id' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN approved_by_user_id TEXT")
                    print("✅ Added 'approved_by_user_id' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add approved_by_user_id column: {me}")
            
            if 'approved_date' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN approved_date TEXT")
                    print("✅ Added 'approved_date' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add approved_date column: {me}")
            
            if 'processing_model' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN processing_model TEXT")
                    print("✅ Added 'processing_model' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add processing_model column: {me}")

            if 'metadata_sync_status' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN metadata_sync_status TEXT DEFAULT 'not_started'")
                    print("✅ Added 'metadata_sync_status' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add metadata_sync_status column: {me}")

            if 'metadata_payload' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN metadata_payload TEXT")
                    print("✅ Added 'metadata_payload' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add metadata_payload column: {me}")

            if 'metadata_synced_at' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN metadata_synced_at TEXT")
                    print("✅ Added 'metadata_synced_at' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add metadata_synced_at column: {me}")

            if 'storage_sync_status' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN storage_sync_status TEXT DEFAULT 'not_started'")
                    print("✅ Added 'storage_sync_status' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add storage_sync_status column: {me}")

            if 'storage_record_id' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN storage_record_id TEXT")
                    print("✅ Added 'storage_record_id' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add storage_record_id column: {me}")

            if 'storage_synced_at' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN storage_synced_at TEXT")
                    print("✅ Added 'storage_synced_at' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add storage_synced_at column: {me}")

            if 'storage_error' not in cols:
                try:
                    cursor.execute("ALTER TABLE projects ADD COLUMN storage_error TEXT")
                    print("✅ Added 'storage_error' column to projects table")
                except Exception as me:
                    print(f"⚠️ Could not add storage_error column: {me}")

            # Backfill export_provenance from existing exports/*/index.json if present
            try:
                exports_root = Path('exports')
                if exports_root.exists() and exports_root.is_dir():
                    for proj_dir in exports_root.iterdir():
                        if not proj_dir.is_dir():
                            continue
                        idx_path = proj_dir / 'index.json'
                        if not idx_path.exists():
                            continue
                        try:
                            with open(idx_path, 'r', encoding='utf-8') as f:
                                idx = json.load(f)
                            history = idx.get('history', [])
                            if history:
                                latest = history[-1]
                                manifest_name = latest.get('manifest') or latest.get('manifest_file')
                                if manifest_name:
                                    manifest_path = proj_dir / manifest_name
                                    if manifest_path.exists():
                                        with open(manifest_path, 'r', encoding='utf-8') as mf:
                                            manifest_json = json.load(mf)
                                            project_id = idx.get('project_id') or proj_dir.name
                                            # Only update if project exists in DB
                                            cursor.execute('SELECT id FROM projects WHERE id = ?', (project_id,))
                                            if cursor.fetchone():
                                                cursor.execute('UPDATE projects SET export_provenance = ? WHERE id = ?', (json.dumps(manifest_json, ensure_ascii=False), project_id))
                                                print(f"✅ Backfilled export_provenance for project {project_id}")
                        except Exception as e:
                            print(f"⚠️ Could not backfill provenance for {proj_dir}: {e}")
            except Exception as e:
                print(f"⚠️ Error scanning exports for backfill: {e}")

            conn.commit()
            conn.close()
        except Exception as e:
            print(f"⚠️ Error during export_provenance migration/backfill: {e}")

    def get_latest_audio_for_project(self, project_id):
        """Return the latest audio_files record for a project, or None."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''SELECT * FROM audio_files WHERE project_id = ? ORDER BY created DESC LIMIT 1''', (project_id,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                return None
            cols = [d[0] for d in cursor.description]
            result = dict(zip(cols, row))
            conn.close()
            return result
        except Exception as e:
            print(f"⚠️ Error fetching audio record for project {project_id}: {e}")
            return None
    
    def create_project(self, name, assigned_to="", created_by_user_id=None):
        """Create a new project with unique name handling"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Generate unique name if duplicate exists
        unique_name = self._generate_unique_name(cursor, name)
        
        project_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO projects (id, name, assigned_to, start_date, status, created, updated, created_by_user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (project_id, unique_name, assigned_to, now, 'new', now, now, created_by_user_id))
        
        conn.commit()
        
        # Get the created project
        project = self.get_project(project_id)
        conn.close()
        
        print(f"✅ Created project: {unique_name} (ID: {project_id})")
        return project
    
    def _generate_unique_name(self, cursor, base_name):
        """Generate unique project name by appending _1, _2, etc."""
        cursor.execute('SELECT name FROM projects WHERE name LIKE ?', (f"{base_name}%",))
        existing_names = [row[0] for row in cursor.fetchall()]
        
        if base_name not in existing_names:
            return base_name
            
        counter = 1
        while f"{base_name}_{counter}" in existing_names:
            counter += 1
            
        return f"{base_name}_{counter}"
    
    def get_project(self, project_id):
        """Get project by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # This allows us to access columns by name
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self._row_to_project(row)
        return None
    
    def get_all_projects(self):
        """Get all projects"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # This allows us to access columns by name
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM projects ORDER BY created DESC')
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_project(row) for row in rows]
    
    def update_project(self, project_id, updates):
        """Update project with given fields"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build dynamic update query
        update_fields = []
        values = []
        
        for field, value in updates.items():
            if field in ['name', 'assigned_to', 'status', 'transcription', 'formatted_text', 
                        'edited_text', 'rich_content', 'word_count', 'processing_time', 
                        'is_preview', 'error_message', 'audio_file_name', 'audio_file_path', 'export_provenance',
                        'transcript_segments', 'reviewed_by_user_id', 'reviewed_date', 'approved_by_user_id', 'approved_date',
                        'processing_model', 'metadata_sync_status', 'metadata_payload', 'metadata_synced_at',
                        'storage_sync_status', 'storage_record_id', 'storage_synced_at', 'storage_error']:
                update_fields.append(f"{field} = ?")
                # Serialize transcript_segments to JSON if it's a list/dict
                if field == 'transcript_segments' and isinstance(value, (list, dict)):
                    values.append(json.dumps(value, ensure_ascii=False))
                else:
                    values.append(value)
        
        if update_fields:
            values.append(datetime.now().isoformat())  # updated timestamp
            values.append(project_id)  # WHERE clause
            
            query = f"UPDATE projects SET {', '.join(update_fields)}, updated = ? WHERE id = ?"
            cursor.execute(query, values)
            conn.commit()
        
        conn.close()
        print(f"✅ Updated project {project_id}")
    
    def delete_project(self, project_id):
        """Delete project and associated files"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get audio file path for cleanup
        cursor.execute('SELECT audio_file_path FROM projects WHERE id = ?', (project_id,))
        row = cursor.fetchone()
        
        # Delete project record
        cursor.execute('DELETE FROM projects WHERE id = ?', (project_id,))
        cursor.execute('DELETE FROM audio_files WHERE project_id = ?', (project_id,))
        
        conn.commit()
        conn.close()
        
        # Clean up audio file
        if row and row[0]:
            audio_path = Path(row[0])
            if audio_path.exists():
                try:
                    audio_path.unlink()
                    print(f"✅ Deleted audio file: {audio_path}")
                except Exception as e:
                    print(f"⚠️ Could not delete audio file: {e}")
        
        print(f"✅ Deleted project {project_id}")
    
    def save_audio_file(self, project_id, file_data, original_name, mime_type, source_path=None):
        """Save audio file to disk and update project"""
        # Create unique filename
        file_extension = Path(original_name).suffix
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_extension}"
        file_path = Path("uploads") / filename
        
        # Save file to disk
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Update database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Insert audio file record (include optional source_path)
        try:
            cursor.execute('''
                INSERT INTO audio_files (id, project_id, original_name, file_path, source_path, 
                                       file_size, mime_type, created)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (file_id, project_id, original_name, str(file_path), source_path,
                  len(file_data), mime_type, datetime.now().isoformat()))
        except Exception:
            # Fallback if the column doesn't exist for some reason
            cursor.execute('''
                INSERT INTO audio_files (id, project_id, original_name, file_path, 
                                       file_size, mime_type, created)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (file_id, project_id, original_name, str(file_path), 
                  len(file_data), mime_type, datetime.now().isoformat()))
        
        # Update project with audio info
        cursor.execute('''
            UPDATE projects SET audio_file_name = ?, audio_file_path = ?, updated = ?
            WHERE id = ?
        ''', (original_name, str(file_path), datetime.now().isoformat(), project_id))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Saved audio file: {filename} for project {project_id}")
        return str(file_path)
    
    def _row_to_project(self, row):
        """Convert database row to project dictionary"""
        # Convert sqlite3.Row to dict
        project = dict(row)
        
        # Fetch user names for user_id fields
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for user_field in ['created_by_user_id', 'assigned_to_user_id', 'reviewed_by_user_id', 'approved_by_user_id']:
            user_id = project.get(user_field)
            if user_id:
                cursor.execute('SELECT name FROM users WHERE id = ?', (user_id,))
                user_row = cursor.fetchone()
                if user_row:
                    name_field = user_field.replace('_user_id', '_name')
                    project[name_field] = user_row[0]
                    print(f"✅ Found user name for {user_field}: {user_row[0]}")
        
        conn.close()
        
        # Convert snake_case field names to camelCase for client compatibility
        field_mapping = {
            'assigned_to': 'assignedTo',
            'start_date': 'startDate',
            'end_date': 'endDate',
            'audio_file_name': 'audioFileName',
            'audio_file_path': 'audioFilePath',
            'formatted_text': 'formattedText',
            'edited_text': 'editedText',
            'rich_content': 'richContent',
            'word_count': 'wordCount',
            'processing_time': 'processingTime',
            'is_preview': 'isPreview',
            'error_message': 'errorMessage',
            'export_provenance': 'exportProvenance',
            'transcript_segments': 'transcriptSegments',
            'created_by_user_id': 'createdByUserId',
            'created_by_name': 'createdByName',
            'assigned_to_user_id': 'assignedToUserId',
            'assigned_to_name': 'assignedToName',
            'assigned_date': 'assignedDate',
            'reviewed_by_user_id': 'reviewedByUserId',
            'reviewed_by_name': 'reviewedByName',
            'reviewed_date': 'reviewedDate',
            'approved_by_user_id': 'approvedByUserId',
            'approved_by_name': 'approvedByName',
            'approved_date': 'approvedDate',
            'processing_model': 'processingModel',
            'metadata_sync_status': 'metadataSyncStatus',
            'metadata_payload': 'metadataPayload',
            'metadata_synced_at': 'metadataSyncedAt',
            'storage_sync_status': 'storageSyncStatus',
            'storage_record_id': 'storageRecordId',
            'storage_synced_at': 'storageSyncedAt',
            'storage_error': 'storageError'
        }
        
        # Create new project dict with camelCase field names
        converted_project = {}
        for key, value in project.items():
            new_key = field_mapping.get(key, key)
            converted_project[new_key] = value
        
        # Debug: log approved projects
        if converted_project.get('status') == 'Approved':
            print(f"🔍 Approved project: {converted_project.get('name')}")
            print(f"   approvedByUserId: {converted_project.get('approvedByUserId')}")
            print(f"   approvedByName: {converted_project.get('approvedByName')}")
            print(f"   approvedDate: {converted_project.get('approvedDate')}")
            print(f"   reviewedByName: {converted_project.get('reviewedByName')}")
        
        # Add audio URL if file exists
        print(f"🔍 _row_to_project: audioFilePath = {converted_project.get('audioFilePath')}")
        if converted_project.get('audioFilePath'):
            audio_path = Path(converted_project['audioFilePath'])
            print(f"🔍 _row_to_project: audio_path = {audio_path}")
            print(f"🔍 _row_to_project: audio_path.exists() = {audio_path.exists()}")
            if audio_path.exists():
                audio_url = f"/audio/{audio_path.name}"
                converted_project['audioUrl'] = audio_url
                print(f"✅ _row_to_project: Generated audioUrl = {audio_url}")
            else:
                print(f"❌ _row_to_project: Audio file does not exist at {audio_path}")
        else:
            print(f"❌ _row_to_project: No audioFilePath found in project")
        
        print(f"📋 _row_to_project: Final project keys = {list(converted_project.keys())}")
        return converted_project

    # User management methods
    def create_or_update_user(self, google_id, email, name=None, profile_picture=None):
        """Create a new user or update existing user from Google OAuth"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT * FROM users WHERE google_id = ? OR email = ?', (google_id, email))
        existing = cursor.fetchone()
        
        now = datetime.now().isoformat()
        
        if existing:
            # Update existing user
            user_id = existing[0]
            cursor.execute('''
                UPDATE users 
                SET name = ?, profile_picture = ?, last_login = ?
                WHERE id = ?
            ''', (name, profile_picture, now, user_id))
            print(f"✅ Updated existing user: {email}")
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            # Check if this is the super admin
            role = 'admin' if email == SUPER_ADMIN_EMAIL else 'reviewer'
            cursor.execute('''
                INSERT INTO users (id, google_id, email, name, profile_picture, role, created_at, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, google_id, email, name, profile_picture, role, now, now))
            print(f"✅ Created new user: {email} with role: {role}")
        
        conn.commit()
        
        # Get the user
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        cols = [d[0] for d in cursor.description]
        user = dict(zip(cols, row))
        
        conn.close()
        return user
    
    def get_user(self, user_id):
        """Get user by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return None
        
        cols = [d[0] for d in cursor.description]
        user = dict(zip(cols, row))
        conn.close()
        return user
    
    def get_user_by_email(self, email):
        """Get user by email"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return None
        
        cols = [d[0] for d in cursor.description]
        user = dict(zip(cols, row))
        conn.close()
        return user
    
    def get_all_users(self):
        """Get all users"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
        rows = cursor.fetchall()
        
        users = []
        for row in rows:
            cols = [d[0] for d in cursor.description]
            users.append(dict(zip(cols, row)))
        
        conn.close()
        return users
    
    def update_user_role(self, user_id, role):
        """Update user role (admin or reviewer)"""
        if role not in ['admin', 'reviewer']:
            raise ValueError("Role must be 'admin' or 'reviewer'")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if user is super admin (can't change their role)
        cursor.execute('SELECT email FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        if row and row[0] == SUPER_ADMIN_EMAIL:
            conn.close()
            raise ValueError("Cannot change super admin role")
        
        cursor.execute('UPDATE users SET role = ? WHERE id = ?', (role, user_id))
        conn.commit()
        conn.close()
        print(f"✅ Updated user {user_id} role to {role}")
        return True
    
    def assign_project_to_user(self, project_id, user_id):
        """Assign a project to a reviewer"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        
        cursor.execute('''
            UPDATE projects 
            SET assigned_to_user_id = ?, assigned_date = ?, status = ?
            WHERE id = ?
        ''', (user_id, now, 'Assigned', project_id))
        
        conn.commit()
        conn.close()
        print(f"✅ Assigned project {project_id} to user {user_id}")
        return True

class PALAScribeHandler(BaseHTTPRequestHandler):
    """HTTP request handler for PALAScribe API"""
    
    def __init__(self, *args, db_manager=None, **kwargs):
        self.db_manager = db_manager
        super().__init__(*args, **kwargs)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        path_only = urllib.parse.urlparse(self.path).path
        if path_only == '/health':
            self.handle_health_check()
        elif path_only == '/auth/config':
            self.handle_auth_config()
        elif path_only == '/api/dictionary':
            self.handle_get_dictionary()
        elif path_only == '/auth/me':
            self.handle_get_current_user()
        elif path_only == '/auth/logout':
            self.handle_logout()
        elif path_only == '/users':
            self.handle_get_users()
        elif path_only == '/projects':
            self.handle_get_projects()
        elif '/projects/' in path_only and path_only.endswith('/status'):
            # Handle transcription status endpoint
            project_id = path_only.split('/')[2]
            self.handle_get_transcription_status(project_id)
        elif path_only.startswith('/projects/'):
            project_id = path_only.split('/')[-1]
            self.handle_get_project(project_id)
        elif path_only.startswith('/audio/'):
            filename = path_only.split('/')[-1]
            self.handle_get_audio(filename)
        else:
            # Handle static file serving
            self.handle_static_file()
    
    def handle_static_file(self):
        """Serve static files (HTML, CSS, JS)"""
        try:
            # Handle root path
            if self.path == '/':
                file_path = 'index-server.html'
            else:
                # Remove leading slash and query parameters
                file_path = self.path.lstrip('/').split('?')[0]
            
            # Security: prevent directory traversal
            if '..' in file_path or file_path.startswith('/'):
                self.send_error(403, "Forbidden")
                return
            
            # Check if file exists
            if not os.path.exists(file_path):
                self.send_error(404, f"File not found: {file_path}")
                return
            
            # Determine content type
            content_type = 'text/html'
            if file_path.endswith('.css'):
                content_type = 'text/css'
            elif file_path.endswith('.js'):
                content_type = 'application/javascript'
            elif file_path.endswith('.json'):
                content_type = 'application/json'
            elif file_path.endswith('.png'):
                content_type = 'image/png'
            elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            elif file_path.endswith('.ico'):
                content_type = 'image/x-icon'
            
            # Read and serve file
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            
            print(f"📄 Served static file: {file_path} ({content_type})")
            
        except Exception as e:
            print(f"❌ Error serving static file {self.path}: {e}")
            self.send_error(500, f"Internal server error: {str(e)}")
    
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/auth/google':
            self.handle_google_auth()
        elif self.path == '/process':
            self.handle_audio_processing()  # Original Whisper processing
        elif self.path == '/projects':
            self.handle_create_project()
        elif self.path.startswith('/projects/') and self.path.endswith('/audio'):
            project_id = self.path.split('/')[-2]
            self.handle_upload_audio(project_id)
        elif self.path.startswith('/projects/') and self.path.endswith('/transcribe'):
            project_id = self.path.split('/')[-2]
            self.handle_transcribe_project(project_id)
        elif self.path.startswith('/projects/') and self.path.endswith('/cancel'):
            project_id = self.path.split('/')[-2]
            self.handle_cancel_transcription(project_id)
        elif self.path.startswith('/projects/') and self.path.endswith('/assign'):
            project_id = self.path.split('/')[-2]
            self.handle_assign_project(project_id)
        else:
            self.send_error(404, "Not Found")
    
    def do_PUT(self):
        """Handle PUT requests"""
        if self.path.startswith('/users/') and '/role' in self.path:
            user_id = self.path.split('/')[2]
            self.handle_update_user_role(user_id)
        elif self.path.startswith('/projects/'):
            project_id = self.path.split('/')[-1]
            self.handle_update_project(project_id)
        else:
            self.send_error(404, "Not Found")
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        if self.path.startswith('/api/dictionary/'):
            english_word = urllib.parse.unquote(self.path.split('/')[-1])
            self.handle_delete_dictionary_word(english_word)
        elif self.path.startswith('/projects/'):
            project_id = self.path.split('/')[-1]
            self.handle_delete_project(project_id)
        else:
            self.send_error(404, "Not Found")
    
    def do_HEAD(self):
        """Handle HEAD requests (for favicon.ico and other resources)"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
        elif self.path == '/favicon.ico':
            # Serve favicon.ico
            try:
                file_path = os.path.join(os.getcwd(), 'favicon.ico')
                if os.path.exists(file_path):
                    file_size = os.path.getsize(file_path)
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/x-icon')
                    self.send_header('Content-Length', str(file_size))
                    self.end_headers()
                else:
                    self.send_error(404, "Favicon not found")
            except Exception as e:
                self.send_error(500, f"Error serving favicon: {str(e)}")
        else:
            # For other static files, check if they exist and send appropriate headers
            try:
                # Remove leading slash and query parameters
                path = self.path.lstrip('/').split('?')[0]
                file_path = os.path.join(os.getcwd(), path)
                
                if os.path.exists(file_path) and os.path.isfile(file_path):
                    file_size = os.path.getsize(file_path)
                    
                    # Determine content type
                    content_type = 'text/html'
                    if file_path.endswith('.css'):
                        content_type = 'text/css'
                    elif file_path.endswith('.js'):
                        content_type = 'application/javascript'
                    elif file_path.endswith('.json'):
                        content_type = 'application/json'
                    elif file_path.endswith('.png'):
                        content_type = 'image/png'
                    elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                        content_type = 'image/jpeg'
                    elif file_path.endswith('.ico'):
                        content_type = 'image/x-icon'
                    
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Length', str(file_size))
                    self.end_headers()
                else:
                    self.send_error(404, "Not Found")
            except Exception as e:
                self.send_error(500, f"Internal server error: {str(e)}")

    def handle_health_check(self):
        """Health check endpoint"""
        self.send_json_response({
            "status": "healthy",
            "service": "PALAScribe Multi-User Server",
            "timestamp": time.time()
        })

    def handle_auth_config(self):
        """Return minimal auth config for frontend bootstrap"""
        self.send_json_response({
            "googleClientId": GOOGLE_CLIENT_ID,
            "redirectUri": GOOGLE_REDIRECT_URI,
            "configured": bool(GOOGLE_CLIENT_ID)
        })
    
    # Authentication handlers
    def get_current_user_from_token(self):
        """Extract and verify user from Authorization header"""
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.replace('Bearer ', '')
        payload = verify_jwt_token(token)
        if not payload:
            return None
        
        user = self.db_manager.get_user(payload['user_id'])
        return user
    
    def require_auth(self, required_role=None):
        """Decorator to require authentication and optional role"""
        user = self.get_current_user_from_token()
        if not user:
            self.send_error_response(401, "Unauthorized - Please log in")
            return None
        
        if required_role and user['role'] != required_role and user['role'] != 'admin':
            self.send_error_response(403, f"Forbidden - {required_role} role required")
            return None
        
        return user

    def is_project_assigned_to_user(self, project, user):
        """Return True if the project is assigned to the given user."""
        if not project or not user:
            return False

        assigned_user_id = str(project.get('assignedToUserId') or project.get('assigned_to_user_id') or '').strip()
        user_id = str(user.get('id') or '').strip()
        if assigned_user_id and user_id and assigned_user_id == user_id:
            return True

        assigned_to = str(project.get('assignedTo') or project.get('assigned_to') or '').strip().lower()
        user_email = str(user.get('email') or '').strip().lower()
        user_name = str(user.get('name') or '').strip().lower()

        return bool(assigned_to and assigned_to in [user_email, user_name])
    
    def handle_google_auth(self):
        """Handle Google OAuth token verification"""
        try:
            if not GOOGLE_AUTH_AVAILABLE:
                self.send_error_response(500, "Google Auth not configured")
                return
            
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            google_token = data.get('token')
            if not google_token:
                self.send_error_response(400, "Token required")
                return
            
            # Verify Google token
            user_info = verify_google_token(google_token)
            if not user_info:
                self.send_error_response(401, "Invalid Google token")
                return
            
            # Create or update user in database
            user = self.db_manager.create_or_update_user(
                google_id=user_info['google_id'],
                email=user_info['email'],
                name=user_info['name'],
                profile_picture=user_info['picture']
            )
            
            # Create JWT token
            jwt_token = create_jwt_token(user['id'], user['email'], user['role'])
            
            self.send_json_response({
                "token": jwt_token,
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "name": user['name'],
                    "role": user['role'],
                    "profilePicture": user['profile_picture']
                }
            })
            
            print(f"✅ User logged in: {user['email']} ({user['role']})")
            
        except Exception as e:
            print(f"❌ Error in Google auth: {e}")
            self.send_error_response(500, str(e))
    
    def handle_get_current_user(self):
        """Get current logged-in user"""
        user = self.get_current_user_from_token()
        if not user:
            self.send_error_response(401, "Not authenticated")
            return
        
        self.send_json_response({
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "role": user['role'],
                "profilePicture": user['profile_picture']
            }
        })
    
    def handle_logout(self):
        """Logout (client should discard token)"""
        self.send_json_response({"message": "Logged out successfully"})
    
    def handle_get_users(self):
        """Get all users (admin only)"""
        user = self.require_auth('admin')
        if not user:
            return
        
        try:
            users = self.db_manager.get_all_users()
            users_list = [{
                "id": u['id'],
                "email": u['email'],
                "name": u['name'],
                "role": u['role'],
                "profilePicture": u['profile_picture'],
                "createdAt": u['created_at'],
                "lastLogin": u['last_login'],
                "isSuperAdmin": u['email'] == SUPER_ADMIN_EMAIL
            } for u in users]
            
            self.send_json_response({"users": users_list})
        except Exception as e:
            print(f"❌ Error getting users: {e}")
            self.send_error_response(500, str(e))
    
    def handle_get_transcription_status(self, project_id):
        """Get transcription status and debug logs for a project"""
        try:
            status = get_transcription_status(project_id)
            self.send_json_response(status)
        except Exception as e:
            print(f"❌ Error getting transcription status: {e}")
            self.send_error_response(500, str(e))
    
    def handle_get_projects(self):
        """Get all projects"""
        user = self.require_auth()
        if not user:
            return

        try:
            projects = self.db_manager.get_all_projects()

            if user.get('role') == 'reviewer':
                projects = [
                    project for project in projects
                    if self.is_project_assigned_to_user(project, user)
                ]

            self.send_json_response({"projects": projects})
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def handle_get_project(self, project_id):
        """Get specific project"""
        user = self.require_auth()
        if not user:
            return

        try:
            print(f"🔍 Getting project: {project_id}")
            project = self.db_manager.get_project(project_id)
            if project:
                if user.get('role') == 'reviewer' and not self.is_project_assigned_to_user(project, user):
                    self.send_error_response(403, "Forbidden - You can only access projects assigned to you")
                    return

                print(f"✅ Found project: {project.get('name', 'Unnamed')}")
                print(f"📋 Project audio data: audioFilePath={project.get('audioFilePath')}, audioUrl={project.get('audioUrl')}")
                # If an exports manifest exists for this project, include the
                # latest provenance metadata so the client can show the header
                try:
                    exports_dir = Path('exports') / project_id
                    exports_index = exports_dir / 'index.json'
                    if exports_index.exists():
                        with open(exports_index, 'r', encoding='utf-8') as f:
                            idx = json.load(f)
                            # Attach latest history entry and manifest to response
                            project['exportManifest'] = {
                                'latest': idx.get('latest'),
                                'history': idx.get('history', [])
                            }

                            # Prefer DB-embedded provenance if present on the project
                            try:
                                db_prov = project.get('exportProvenance') or project.get('export_provenance')
                                if db_prov:
                                    if isinstance(db_prov, str):
                                        try:
                                            parsed = json.loads(db_prov)
                                            project['latestExportProvenance'] = parsed
                                            project['latestExportInfo'] = parsed
                                            # Also provide a short human-readable header
                                            try:
                                                project['exportHeaderText'] = f"Project: {project.get('name')}\nAudio: {parsed.get('original_filename') or ''}\nExport: {parsed.get('pdf_file') or parsed.get('latest') or ''}"
                                            except Exception:
                                                pass
                                            # Skip filesystem scanning
                                            manifest_loaded = True
                                        except Exception:
                                            # stored value is not JSON, ignore and continue to filesystem
                                            manifest_loaded = False
                                    elif isinstance(db_prov, dict):
                                        project['latestExportProvenance'] = db_prov
                                        project['latestExportInfo'] = db_prov
                                        project['exportHeaderText'] = f"Project: {project.get('name')}\nAudio: {db_prov.get('original_filename') or ''}\nExport: {db_prov.get('pdf_file') or db_prov.get('latest') or ''}"
                                        manifest_loaded = True
                                else:
                                    manifest_loaded = False
                            except Exception as e:
                                print(f"⚠️ Error checking DB-embedded provenance: {e}")

                            # If DB provenance not present, try per-version companion JSON manifests if present
                            manifest_loaded = manifest_loaded if 'manifest_loaded' in locals() else False
                            if not manifest_loaded:
                                manifest_loaded = False
                                history = idx.get('history', [])
                                if history:
                                    latest_entry = history[-1]
                                    manifest_name = latest_entry.get('manifest') or latest_entry.get('manifest_file')
                                    if manifest_name:
                                        manifest_path = exports_dir / manifest_name
                                        try:
                                            if manifest_path.exists():
                                                with open(manifest_path, 'r', encoding='utf-8') as mf:
                                                    manifest_json = json.load(mf)
                                                    project['latestExportProvenance'] = manifest_json
                                                    project['latestExportInfo'] = manifest_json
                                                    manifest_loaded = True
                                        except Exception as me:
                                            print(f"⚠️ Could not read companion manifest {manifest_path}: {me}")

                            # Try to read a companion provenance text file for the
                            # latest version so the client can display full JSON metadata.
                            base = idx.get('base') or Path(project.get('audioFilePath', '')).stem or project.get('name') or project_id
                            latest_txt_candidates = []

                            # Preferred: latest base.txt (latest copy)
                            latest_txt_candidates.append(exports_dir / f"{base}.txt")

                            # Next: versioned companion file based on history
                            history = idx.get('history', [])
                            if history:
                                latest_entry = history[-1]
                                latest_file = latest_entry.get('file')
                                if latest_file:
                                    latest_txt_candidates.append(exports_dir / Path(latest_file).with_suffix('.txt'))

                            # Also try any *_vN.txt files matching base
                            latest_txt_candidates.extend(list(exports_dir.glob(f"{base}_v*.txt")))

                            latest_prov = None
                            for cand in latest_txt_candidates:
                                try:
                                    if cand and cand.exists():
                                        with open(cand, 'r', encoding='utf-8') as pf:
                                            content = pf.read()
                                            # Try new marker first, fall back to old 'PROVENANCE' marker
                                            start_marker = '---SOURCE-INFO-START---'
                                            end_marker = '---SOURCE-INFO-END---'
                                            old_start = '---PROVENANCE-START---'
                                            old_end = '---PROVENANCE-END---'

                                            # Check for new markers
                                            if start_marker in content and end_marker in content:
                                                try:
                                                    start = content.index(start_marker) + len(start_marker)
                                                    end = content.index(end_marker)
                                                    header_text = content[start:end].strip()
                                                    latest_prov = json.loads(header_text)
                                                    project['latestExportProvenance'] = latest_prov
                                                    project['latestExportInfo'] = latest_prov
                                                    break
                                                except Exception as je:
                                                    print(f"⚠️ Could not parse source-info JSON in {cand}: {je}")
                                            else:
                                                # Try old markers if present
                                                if old_start in content and old_end in content:
                                                    try:
                                                        start = content.index(old_start) + len(old_start)
                                                        end = content.index(old_end)
                                                        header_text = content[start:end].strip()
                                                        latest_prov = json.loads(header_text)
                                                        project['latestExportProvenance'] = latest_prov
                                                        project['latestExportInfo'] = latest_prov
                                                        break
                                                    except Exception as je:
                                                        print(f"⚠️ Could not parse old provenance JSON in {cand}: {je}")

                                                # As a last resort try to parse whole file as JSON
                                                    try:
                                                        maybe = json.loads(content)
                                                        project['latestExportProvenance'] = maybe
                                                        project['latestExportInfo'] = maybe
                                                        latest_prov = maybe
                                                        break
                                                    except Exception:
                                                        # Not JSON — but the file may be a plain text header.
                                                        # Attach the raw content as `exportHeaderText` so the
                                                        # UI can display the human-readable header immediately.
                                                        try:
                                                            project['exportHeaderText'] = content
                                                            latest_prov = None
                                                            break
                                                        except Exception:
                                                            continue
                                except Exception as e:
                                    print(f"⚠️ Error reading candidate provenance file {cand}: {e}")

                            if not latest_prov:
                                # Build a minimal fallback provenance from index.json and DB audio record
                                try:
                                    audio_rec = self.db_manager.get_latest_audio_for_project(project_id)
                                except Exception:
                                    audio_rec = None

                                fallback = {
                                    'project_id': project_id,
                                    'base': base,
                                    'latest': idx.get('latest'),
                                    'history': idx.get('history', []),
                                    'original_filename': audio_rec.get('original_name') if audio_rec else '',
                                    'source_path': audio_rec.get('source_path') if audio_rec else ''
                                }
                                project['latestExportProvenance'] = fallback
                                # Also provide a small human-readable header for immediate display
                                try:
                                    header_lines = [f"Project: {project.get('name')}", f"Audio: {fallback.get('original_filename') or ''}", f"Export: {fallback.get('latest')}"]
                                    project['exportHeaderText'] = "\n".join([l for l in header_lines if l])
                                except Exception:
                                    project['exportHeaderText'] = ''
                                print(f"ℹ️ Attached fallback provenance for project {project_id}")
                except Exception as e:
                    print(f"⚠️ Could not read exports manifest for project {project_id}: {e}")

                self.send_json_response(project)
            else:
                print(f"❌ Project {project_id} not found")
                self.send_error_response(404, "Project not found")
        except Exception as e:
            print(f"❌ Error getting project {project_id}: {e}")
            self.send_error_response(500, str(e))

    def handle_get_dictionary(self):
        """Get current dictionary mappings"""
        try:
            print("📚 Getting dictionary mappings...")
            # Return the current PALI_CORRECTIONS dictionary
            self.send_json_response(PALI_CORRECTIONS)
        except Exception as e:
            print(f"❌ Error getting dictionary: {e}")
            self.send_error_response(500, str(e))
    
    def handle_delete_dictionary_word(self, english_word):
        """Delete a word mapping from the dictionary"""
        try:
            print(f"🗑️  Attempting to delete dictionary word: {english_word}")
            
            # Check if the word exists in the dictionary
            if english_word not in PALI_CORRECTIONS:
                print(f"❌ Word '{english_word}' not found in dictionary")
                self.send_error_response(404, f"Word '{english_word}' not found in dictionary")
                return
            
            # Remove the word from the dictionary
            pali_word = PALI_CORRECTIONS[english_word]
            del PALI_CORRECTIONS[english_word]
            
            print(f"✅ Deleted dictionary mapping: '{english_word}' → '{pali_word}'")
            
            # Send success response
            self.send_json_response({
                "success": True,
                "message": f"Successfully deleted mapping '{english_word}' → '{pali_word}'",
                "deleted": {
                    "english": english_word,
                    "pali": pali_word
                }
            })
            
        except Exception as e:
            print(f"❌ Error deleting dictionary word '{english_word}': {e}")
            self.send_error_response(500, str(e))
    
    def handle_update_user_role(self, user_id):
        """Update user role (admin only)"""
        admin = self.require_auth('admin')
        if not admin:
            return
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            new_role = data.get('role')
            if not new_role or new_role not in ['admin', 'reviewer']:
                self.send_error_response(400, "Invalid role")
                return
            
            self.db_manager.update_user_role(user_id, new_role)
            
            self.send_json_response({
                "message": f"User role updated to {new_role}",
                "userId": user_id,
                "role": new_role
            })
            
        except ValueError as e:
            self.send_error_response(400, str(e))
        except Exception as e:
            print(f"❌ Error updating user role: {e}")
            self.send_error_response(500, str(e))
    
    def handle_assign_project(self, project_id):
        """Assign project to a reviewer (admin only)"""
        admin = self.require_auth('admin')
        if not admin:
            return
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            user_id = data.get('userId')
            if not user_id:
                self.send_error_response(400, "User ID required")
                return
            
            # Verify user exists
            user = self.db_manager.get_user(user_id)
            if not user:
                self.send_error_response(404, "User not found")
                return
            
            self.db_manager.assign_project_to_user(project_id, user_id)
            
            self.send_json_response({
                "message": f"Project assigned to {user['name'] or user['email']}",
                "projectId": project_id,
                "assignedTo": {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user['email']
                }
            })
            
        except Exception as e:
            print(f"❌ Error assigning project: {e}")
            self.send_error_response(500, str(e))
    
    def handle_create_project(self):
        """Create new project"""
        # For now, make auth optional to not break existing flow
        # In production, you'd require auth here
        user = self.get_current_user_from_token()
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            name = data.get('name', '').strip()
            assigned_to = data.get('assignedTo', '').strip()
            assigned_to_user_id = data.get('assignedToUserId')
            
            if not name:
                self.send_error_response(400, "Project name is required")
                return
            
            # Pass user_id if authenticated
            user_id = user['id'] if user else None
            project = self.db_manager.create_project(name, assigned_to, created_by_user_id=user_id)

            if assigned_to_user_id:
                reviewer = self.db_manager.get_user(assigned_to_user_id)
                if reviewer and reviewer.get('role') == 'reviewer':
                    self.db_manager.assign_project_to_user(project['id'], assigned_to_user_id)
                    project = self.db_manager.get_project(project['id'])
            # Also create a simple exports header so the UI can show project
            # header information immediately (no transcription needed).
            try:
                exports_dir = Path('exports') / project['id']
                exports_dir.mkdir(parents=True, exist_ok=True)

                # Sanitize base name for files
                base = project.get('name') or project['id']
                base_safe = re.sub(r'[^A-Za-z0-9_.-]', '_', base)

                created_dt = project.get('created') or datetime.now().isoformat()
                date_created = created_dt.split('T')[0] if 'T' in created_dt else created_dt
                date_exported = datetime.now().strftime('%Y-%m-%d')

                header_lines = []
                header_lines.append('Project:')
                header_lines.append(project.get('name') or '')
                header_lines.append('Assigned to:')
                header_lines.append(project.get('assignedTo') or 'Unassigned')
                header_lines.append('Audio File:')
                header_lines.append(project.get('audioFileName') or 'No audio')
                header_lines.append('Date Created:')
                header_lines.append(date_created)
                header_lines.append('Date Exported:')
                header_lines.append(date_exported)
                header_lines.append('Word Count:')
                header_lines.append('0')
                header_lines.append('Character Count:')
                header_lines.append('0')

                header_text = '\n'.join(header_lines)

                header_path = exports_dir / f"{base_safe}_header.txt"
                with open(header_path, 'w', encoding='utf-8') as hf:
                    hf.write(header_text)

                # Create a minimal index.json referencing this header so GET /projects
                # can discover it via exports/index.json
                index_path = exports_dir / 'index.json'
                idx_content = {
                    'project_id': project['id'],
                    'base': base_safe,
                    'latest': header_path.name,
                    'history': [
                        {
                            'version': 0,
                            'file': header_path.name,
                            'actor': 'system',
                            'action': 'create',
                            'timestamp': datetime.now().isoformat(),
                            'note': 'Initial project header'
                        }
                    ]
                }
                with open(index_path, 'w', encoding='utf-8') as jf:
                    json.dump(idx_content, jf, indent=2, ensure_ascii=False)
            except Exception as e:
                print(f"⚠️ Could not write initial export header for project {project.get('id')}: {e}")

            self.send_json_response(project, status=201)
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def handle_update_project(self, project_id):
        """Update existing project"""
        user = self.require_auth()
        if not user:
            return

        try:
            existing_project = self.db_manager.get_project(project_id)
            if not existing_project:
                self.send_error_response(404, "Project not found")
                return

            if user.get('role') == 'reviewer' and not self.is_project_assigned_to_user(existing_project, user):
                self.send_error_response(403, "Forbidden - You can only update projects assigned to you")
                return

            previous_status = existing_project.get('status') if existing_project else None
            print(f"📋 BEFORE UPDATE: project_id={project_id}, previous_status={previous_status}")

            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Convert camelCase fields to snake_case for database
            field_mapping = {
                'assignedTo': 'assigned_to',
                'startDate': 'start_date',
                'endDate': 'end_date',
                'audioFileName': 'audio_file_name',
                'audioFilePath': 'audio_file_path',
                'formattedText': 'formatted_text',
                'editedText': 'edited_text',
                'richContent': 'rich_content',
                'wordCount': 'word_count',
                'processingTime': 'processing_time',
                'isPreview': 'is_preview',
                'errorMessage': 'error_message',
                'transcriptSegments': 'transcript_segments',
                'exportProvenance': 'export_provenance',
                'metadataSyncStatus': 'metadata_sync_status',
                'metadataPayload': 'metadata_payload',
                'metadataSyncedAt': 'metadata_synced_at',
                'storageSyncStatus': 'storage_sync_status',
                'storageRecordId': 'storage_record_id',
                'storageSyncedAt': 'storage_synced_at',
                'storageError': 'storage_error'
            }
            
            # Convert field names
            converted_data = {}
            for key, value in data.items():
                # Use snake_case if conversion exists, otherwise keep original
                db_key = field_mapping.get(key, key)
                converted_data[db_key] = value

            if user.get('role') == 'reviewer':
                attempts_approve_status = converted_data.get('status') == 'Approved'
                touches_approval_fields = any(
                    field in converted_data for field in ['approved_by_user_id', 'approved_date']
                )
                if attempts_approve_status or touches_approval_fields:
                    self.send_error_response(403, "Forbidden - Reviewers cannot approve projects")
                    return
            
            print(f"🔄 Updating project {project_id} with fields: {list(converted_data.keys())}")
            print(f"📊 Converted data status: {converted_data.get('status')}")
            
            self.db_manager.update_project(project_id, converted_data)
            
            # Return updated project
            project = self.db_manager.get_project(project_id)
            if project:
                self.send_json_response(project)

                try:
                    current_status = converted_data.get('status')
                    print(f"🔍 Status check: previous='{previous_status}' -> current='{current_status}'")
                    
                    # Trigger sync if:
                    # 1. Status transitioned TO Approved (new approval)
                    # 2. Status IS Approved AND was explicitly sent in this update (re-approval or explicit approval)
                    transitioned_to_approved = (
                        current_status == 'Approved'
                        and previous_status != 'Approved'
                    )
                    explicitly_set_to_approved = (
                        current_status == 'Approved'
                        and 'status' in data  # Only if status was in the request
                    )
                    should_sync = transitioned_to_approved or explicitly_set_to_approved
                    
                    print(f"🔍 Transition to approved: {transitioned_to_approved}")
                    print(f"🔍 Explicitly set to Approved: {explicitly_set_to_approved}")
                    print(f"🔍 Should sync: {should_sync}")
                    
                    if should_sync:
                        print(f"🚀 Triggering metadata/storage sync for approved project {project_id}")
                        self.db_manager.update_project(project_id, {
                            'metadata_sync_status': 'pending',
                            'storage_sync_status': 'pending',
                            'storage_error': ''
                        })
                        threading.Thread(
                            target=sync_approved_project_to_pala,
                            args=(self.db_manager, project_id),
                            daemon=True
                        ).start()
                except Exception as e:
                    print(f"⚠️ Could not trigger metadata/storage sync for project {project_id}: {e}")

                # Trigger PDF regeneration when transcription or edited text changes,
                # or when status transitions to 'ready'. Run in background.
                try:
                    should_regen = False
                    if 'transcription' in converted_data or 'edited_text' in converted_data:
                        should_regen = True
                    if converted_data.get('status') == 'ready':
                        should_regen = True

                    if should_regen:
                        # Determine transcription text to use
                        transcription_text = converted_data.get('transcription') or converted_data.get('edited_text') or project.get('transcription') or project.get('editedText') or ''
                        editor = None
                        # Accept optional editor field from client (camelCase)
                        if 'editedBy' in data:
                            editor = data.get('editedBy')
                        elif 'editor' in data:
                            editor = data.get('editor')

                        change_summary = data.get('changeSummary') or data.get('note') or None
                        model = converted_data.get('processing_model') or None

                        threading.Thread(
                            target=regenerate_pdf_for_project,
                            args=(self.db_manager, project_id, transcription_text, editor, change_summary, model),
                            daemon=True
                        ).start()
                except Exception as e:
                    print(f"⚠️ Failed to start background PDF regeneration: {e}")
            else:
                self.send_error_response(404, "Project not found")
                
        except Exception as e:
            print(f"❌ Error updating project {project_id}: {e}")
            self.send_error_response(500, str(e))
    
    def handle_delete_project(self, project_id):
        """Delete project"""
        try:
            # Check if project exists
            project = self.db_manager.get_project(project_id)
            if not project:
                self.send_error_response(404, "Project not found")
                return
            
            self.db_manager.delete_project(project_id)
            self.send_json_response({"message": "Project deleted successfully"})
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def handle_upload_audio(self, project_id):
        """Handle audio file upload for project"""
        try:
            # Check if project exists
            project = self.db_manager.get_project(project_id)
            if not project:
                self.send_error_response(404, "Project not found")
                return
            
            # Parse multipart form data
            content_type = self.headers['Content-Type']
            if not content_type.startswith('multipart/form-data'):
                self.send_error_response(400, "Expected multipart/form-data")
                return
            
            content_length = int(self.headers['Content-Length'])
            form_data = self.rfile.read(content_length)
            
            print(f"📥 Received multipart form data: {len(form_data)} bytes")
            print(f"📋 Content-Type: {content_type}")
            
            # Extract audio file (improved parsing)
            boundary = content_type.split('boundary=')[-1]
            if boundary.startswith('"') and boundary.endswith('"'):
                boundary = boundary[1:-1]  # Remove quotes if present
            boundary = boundary.encode()
            
            print(f"🔍 Using boundary: {boundary}")
            
            parts = form_data.split(b'--' + boundary)
            print(f"📦 Found {len(parts)} parts in multipart data")
            
            audio_data = None
            filename = None
            source_path = None
            
            for i, part in enumerate(parts):
                print(f"🔍 Processing part {i}: {len(part)} bytes")
                if b'Content-Disposition: form-data; name="audio"' in part:
                    print(f"✅ Found audio part in part {i}")
                    
                    # Extract filename
                    if b'filename="' in part:
                        filename = part.split(b'filename="')[1].split(b'"')[0].decode('utf-8')
                        print(f"📁 Extracted filename: {filename}")
                    
                    # Extract file data (after double CRLF)
                    if b'\r\n\r\n' in part:
                        audio_data = part.split(b'\r\n\r\n', 1)[1]
                        # Remove trailing boundary data
                        if b'\r\n--' in audio_data:
                            audio_data = audio_data.split(b'\r\n--')[0]
                        print(f"📄 Extracted audio data: {len(audio_data)} bytes")
                    break
                # Also accept optional sourcePath field (plain text)
                if b'Content-Disposition: form-data; name="sourcePath"' in part:
                    try:
                        if b'\r\n\r\n' in part:
                            raw = part.split(b'\r\n\r\n', 1)[1]
                            if b'\r\n--' in raw:
                                raw = raw.split(b'\r\n--')[0]
                            source_path = raw.decode('utf-8', errors='ignore').strip()
                            print(f"📎 Extracted sourcePath: {source_path}")
                    except Exception as e:
                        print(f"⚠️ Could not parse sourcePath part: {e}")
                    continue
            
            if not audio_data or not filename:
                print(f"❌ Multipart parsing failed - audio_data: {bool(audio_data)}, filename: {filename}")
                self.send_error_response(400, "No audio file found")
                return
            
            # Save audio file
            print(f"💾 Attempting to save audio file: {filename} ({len(audio_data)} bytes)")
            mime_type = "audio/mpeg"  # Default, could be detected
            file_path = self.db_manager.save_audio_file(project_id, audio_data, filename, mime_type, source_path=source_path)
            print(f"✅ Audio file saved to: {file_path}")
            
            # Update project status
            print(f"📝 Updating project {project_id} status to 'In Review' (transcribing)")
            self.db_manager.update_project(project_id, {
                'status': 'In Review'
            })
            
            print(f"📤 Sending success response for audio upload")
            # Return additional info including stored original name and optional source_path
            audio_rec = self.db_manager.get_latest_audio_for_project(project_id)
            resp = {
                "message": "Audio file uploaded successfully",
                "file_path": file_path,
                "filename": filename
            }
            if audio_rec:
                resp['original_name'] = audio_rec.get('original_name')
                resp['source_path'] = audio_rec.get('source_path') if 'source_path' in audio_rec else ''

            self.send_json_response(resp)
            
        except Exception as e:
            print(f"❌ Audio upload error: {e}")
            self.send_error_response(500, str(e))

    def handle_transcribe_project(self, project_id):
        """Start transcription for an existing project"""
        try:
            print(f"🎙️ Starting transcription for project {project_id}")
            
            # Get project
            project = self.db_manager.get_project(project_id)
            if not project:
                print(f"❌ Project {project_id} not found in database")
                self.send_error_response(404, "Project not found")
                return
            
            print(f"📋 Retrieved project data: {project}")
            print(f"🔍 Audio file path in project (snake_case): {project.get('audio_file_path')}")
            print(f"🔍 Audio file path in project (camelCase): {project.get('audioFilePath')}")
            print(f"🔍 Audio file name in project: {project.get('audio_file_name')} or {project.get('audioFileName')}")
            
            # Check for audio file path in both naming conventions
            audio_file_path = project.get('audio_file_path') or project.get('audioFilePath')
            
            if not audio_file_path:
                print(f"❌ No audio file path found for project {project_id}")
                print(f"📋 Full project keys: {list(project.keys())}")
                self.send_error_response(400, "No audio file uploaded for this project")
                return
            
            # Get transcription parameters from request
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    params = json.loads(post_data.decode('utf-8'))
                except:
                    params = {}
            else:
                params = {}
            
            model = params.get('model', 'medium')
            language = params.get('language', 'English')
            preview_mode = params.get('preview', False)
            preview_duration = params.get('previewDuration', 60)
            
            print(f"🎙️ Starting transcription for project {project_id}")
            print(f"🔧 Model: {model}, Language: {language}, Preview: {preview_mode}")
            
            # Initialize transcription status and logging
            add_transcription_log(project_id, f"🎙️ Starting transcription")
            add_transcription_log(project_id, f"🔧 Model: {model}, Language: {language}, Preview: {preview_mode}")
            
            # Update project status
            self.db_manager.update_project(project_id, {'status': 'In Review'})
            
            # Process the audio file
            print(f"🎵 Using audio file path: {audio_file_path}")
            add_transcription_log(project_id, f"🎵 Using audio file: {audio_file_path}")
            
            result = self.execute_whisper_command(
                audio_file_path,
                model=model,
                language=language,
                preview_mode=preview_mode,
                preview_duration=preview_duration,
                project_id=project_id
            )
            
            # Update project with results
            if result.get('success'):
                # Check if the transcription was cancelled while we were processing
                global active_transcriptions, transcription_lock
                with transcription_lock:
                    if project_id in active_transcriptions and active_transcriptions[project_id].get('cancelled'):
                        print(f"🛑 Transcription was cancelled for project {project_id}, skipping result update")
                        add_transcription_log(project_id, f"🛑 Processing cancelled")
                        self.send_json_response({'success': False, 'error': 'Processing was cancelled'})
                        return
                
                self.db_manager.update_project(project_id, {
                    'transcription': result.get('transcription', ''),
                    'formatted_text': result.get('formatted_text', ''),
                    'transcript_segments': json.dumps(result.get('segments', []), ensure_ascii=False),
                    'word_count': result.get('word_count', 0),
                    'processing_time': result.get('processing_time', 0),
                    'processing_model': json.dumps({
                        'provider': 'OpenAI Whisper',
                        'model': model,
                        'language': language
                    }),
                    'status': 'Needs_Review'  # Set to ready for review status
                })
                print(f"✅ Transcription completed for project {project_id}")
                add_transcription_log(project_id, f"✅ Transcription completed ({result.get('word_count', 0)} words, {result.get('processing_time', 0):.1f}s)")
            else:
                # For failed transcriptions, also check if it was cancelled
                if result.get('error') == 'Processing was cancelled':
                    print(f"🛑 Transcription was cancelled for project {project_id}")
                    add_transcription_log(project_id, f"🛑 Transcription cancelled")
                else:
                    self.db_manager.update_project(project_id, {
                        'status': 'In Review',  # Reset to In Review on error
                        'error_message': result.get('error', 'Unknown error')
                    })
                    print(f"❌ Transcription failed for project {project_id}")
                    add_transcription_log(project_id, f"❌ Error: {result.get('error', 'Unknown error')}")
            
            self.send_json_response(result)
            
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            self.send_error_response(500, str(e))
    
    def handle_cancel_transcription(self, project_id):
        """Cancel an active transcription"""
        try:
            print(f"🛑 Cancel request for project {project_id}")
            
            global active_transcriptions, transcription_lock
            
            with transcription_lock:
                if project_id in active_transcriptions:
                    transcription_info = active_transcriptions[project_id]
                    process = transcription_info.get('process')
                    
                    if process and process.poll() is None:  # Process is still running
                        print(f"🛑 Terminating transcription process for project {project_id}")
                        process.terminate()
                        
                        # Wait a bit for graceful termination
                        try:
                            process.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            print(f"🛑 Force killing transcription process for project {project_id}")
                            process.kill()
                    
                    # Mark as cancelled and remove from active list
                    transcription_info['cancelled'] = True
                    del active_transcriptions[project_id]
                    
                    # Update project status in database
                    self.db_manager.update_project(project_id, {
                        'status': 'In Review',
                        'updated_at': datetime.now().isoformat()
                    })
                    
                    print(f"✅ Successfully cancelled transcription for project {project_id}")
                    self.send_json_response({'success': True, 'message': 'Transcription cancelled'})
                else:
                    print(f"ℹ️ No active transcription found for project {project_id}")
                    self.send_json_response({'success': True, 'message': 'No active transcription to cancel'})
                    
        except Exception as e:
            print(f"❌ Cancel transcription error: {e}")
            self.send_error_response(500, str(e))
    
    def handle_get_audio(self, filename):
        """Serve audio files with range request support for seeking"""
        try:
            file_path = Path("uploads") / filename
            if not file_path.exists():
                self.send_error(404, "Audio file not found")
                return

            # Determine content type
            extension = file_path.suffix.lower()
            content_types = {
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.m4a': 'audio/mp4',
                '.ogg': 'audio/ogg'
            }
            content_type = content_types.get(extension, 'audio/mpeg')
            
            file_size = file_path.stat().st_size
            
            # Check for Range header (required for seeking in audio/video)
            range_header = self.headers.get('Range')
            
            if range_header:
                # Parse range header (e.g., "bytes=1000-2000" or "bytes=1000-")
                try:
                    byte_range = range_header.replace('bytes=', '').split('-')
                    start = int(byte_range[0]) if byte_range[0] else 0
                    end = int(byte_range[1]) if byte_range[1] else file_size - 1
                    
                    # Validate range
                    if start >= file_size or start < 0 or end >= file_size:
                        self.send_error(416, "Requested Range Not Satisfiable")
                        return
                    
                    content_length = end - start + 1
                    
                    # Send 206 Partial Content response
                    self.send_response(206)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                    self.send_header('Content-Length', str(content_length))
                    self.send_header('Accept-Ranges', 'bytes')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    # Send the requested byte range
                    with open(file_path, 'rb') as f:
                        f.seek(start)
                        bytes_to_send = content_length
                        chunk_size = 8192
                        
                        while bytes_to_send > 0:
                            chunk = f.read(min(chunk_size, bytes_to_send))
                            if not chunk:
                                break
                            try:
                                self.wfile.write(chunk)
                                bytes_to_send -= len(chunk)
                            except (BrokenPipeError, ConnectionResetError):
                                print(f"⚠️ Client disconnected during range streaming")
                                return
                    
                except (ValueError, IndexError) as e:
                    print(f"⚠️ Invalid range header: {range_header} - {e}")
                    self.send_error(400, "Bad Range Header")
                    return
            else:
                # No range request - send entire file
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(file_size))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                with open(file_path, 'rb') as f:
                    try:
                        shutil.copyfileobj(f, self.wfile)
                    except (BrokenPipeError, ConnectionResetError) as conn_err:
                        print(f"⚠️ Client disconnected during audio streaming: {conn_err}")
                        return
                    except OSError as oe:
                        if getattr(oe, 'errno', None) in (32,):
                            print(f"⚠️ Socket error during streaming: {oe}")
                            return
                        raise

        except Exception as e:
            if isinstance(e, (BrokenPipeError, ConnectionResetError)):
                print(f"⚠️ Client disconnected before error handling: {e}")
                return
            try:
                self.send_error(500, str(e))
            except Exception:
                pass
                print(f"❌ Failed to send error response after exception: {e}")
    
    def handle_audio_processing(self):
        """Handle Whisper audio processing (original functionality)"""
        try:
            # Get multipart form data for audio processing
            content_type = self.headers.get('Content-Type', '')
            
            if not content_type.startswith('multipart/form-data'):
                self.send_error_response(400, "Expected multipart/form-data")
                return
            
            content_length = int(self.headers['Content-Length'])
            form_data = self.rfile.read(content_length)
            
            # Parse form data to extract audio file and parameters
            boundary = content_type.split('boundary=')[-1].encode()
            parts = form_data.split(b'--' + boundary)
            
            audio_data = None
            filename = None
            model = "medium"
            language = "English"
            preview_mode = False
            preview_duration = 60
            project_id = None
            
            # Parse form fields
            for part in parts:
                if b'Content-Disposition: form-data' in part:
                    if b'name="audio"' in part and b'filename="' in part:
                        # Extract filename
                        filename = part.split(b'filename="')[1].split(b'"')[0].decode('utf-8')
                        
                        # Extract file data (after double CRLF)
                        if b'\r\n\r\n' in part:
                            audio_data = part.split(b'\r\n\r\n', 1)[1]
                            # Remove trailing boundary data
                            if b'\r\n--' in audio_data:
                                audio_data = audio_data.split(b'\r\n--')[0]
                    
                    elif b'name="model"' in part:
                        model_data = part.split(b'\r\n\r\n', 1)[1].split(b'\r\n--')[0]
                        model = model_data.decode('utf-8').strip()
                    
                    elif b'name="language"' in part:
                        lang_data = part.split(b'\r\n\r\n', 1)[1].split(b'\r\n--')[0]
                        language = lang_data.decode('utf-8').strip()
                    
                    elif b'name="preview"' in part:
                        preview_data = part.split(b'\r\n\r\n', 1)[1].split(b'\r\n--')[0]
                        preview_mode = preview_data.decode('utf-8').strip().lower() == 'true'
                    
                    elif b'name="previewDuration"' in part:
                        duration_data = part.split(b'\r\n\r\n', 1)[1].split(b'\r\n--')[0]
                        try:
                            preview_duration = int(duration_data.decode('utf-8').strip())
                        except:
                            preview_duration = 60
                    
                    elif b'name="projectId"' in part:
                        project_data = part.split(b'\r\n\r\n', 1)[1].split(b'\r\n--')[0]
                        project_id = project_data.decode('utf-8').strip()
            
            if not audio_data or not filename:
                self.send_error_response(400, "No audio file provided")
                return
            
            print(f"📁 Processing file: {filename} ({len(audio_data)} bytes)")
            print(f"🔧 Model: {model}, Language: {language}, Preview: {preview_mode}")
            
            # Save audio file temporarily
            original_ext = os.path.splitext(filename)[1].lower() if filename else ''
            if not original_ext or original_ext not in ['.mp3', '.wav', '.m4a', '.flac', '.ogg']:
                original_ext = '.wav'
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=original_ext) as temp_file:
                temp_file.write(audio_data)
                temp_audio_path = temp_file.name
            
            print(f"💾 Saved audio to temporary file: {temp_audio_path}")
            
            # Process with Whisper
            print("🚀 Starting Whisper processing...")
            result = self.execute_whisper_command(
                temp_audio_path,
                model=model,
                language=language,
                preview_mode=preview_mode,
                preview_duration=preview_duration
            )
            
            # If we have a project ID, update the project with results
            if project_id and result.get('success'):
                try:
                    self.db_manager.update_project(project_id, {
                        'transcription': result.get('transcription', ''),
                        'formatted_text': result.get('formatted_text', ''),
                        'word_count': result.get('word_count', 0),
                        'processing_time': result.get('processing_time', 0),
                        'status': 'completed'
                    })
                    print(f"✅ Updated project {project_id} with transcription results")
                except Exception as e:
                    print(f"⚠️ Could not update project: {e}")
            elif project_id and not result.get('success'):
                try:
                    self.db_manager.update_project(project_id, {
                        'status': 'failed',
                        'error_message': result.get('error', 'Unknown error')
                    })
                except Exception as e:
                    print(f"⚠️ Could not update project status: {e}")
            
            # Clean up temporary file
            try:
                os.unlink(temp_audio_path)
                print("🗑️ Cleaned up temporary audio file")
            except Exception as cleanup_error:
                print(f"⚠️ Warning: Could not delete temp file: {cleanup_error}")
            
            # Send response
            self.send_json_response(result)
            
        except Exception as e:
            print(f"❌ Audio processing error: {e}")
            import traceback
            traceback.print_exc()
            self.send_error_response(500, str(e))

    def execute_whisper_command(self, audio_file_path, model="medium", language="English", preview_mode=False, preview_duration=60, project_id=None):
        """Execute Whisper command and return results (adapted from whisper_server.py)"""
        
        # Determine project directory (configurable via env var)
        project_dir = os.environ.get(
            "AUDIO_TEXT_CONVERTER_DIR",
            "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter",
        )
        if not os.path.exists(project_dir):
            # Fall back to the directory containing this script
            project_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Get file size for logging and time estimation
        file_size = os.path.getsize(audio_file_path)
        file_size_mb = file_size / (1024 * 1024)
        
        # If preview mode is enabled, create a trimmed version of the audio
        processed_audio_path = audio_file_path
        if preview_mode:
            print(f"🔍 Preview mode enabled - processing only first {preview_duration} seconds")
            if project_id:
                add_transcription_log(project_id, f"🔍 Preview mode: {preview_duration}s")
            processed_audio_path = self.trim_audio_file(audio_file_path, preview_duration)
            if processed_audio_path:
                # Update file size for the trimmed version
                file_size = os.path.getsize(processed_audio_path)
                file_size_mb = file_size / (1024 * 1024)
                print(f"✅ Audio trimmed to {file_size_mb:.1f}MB")
                if project_id:
                    add_transcription_log(project_id, f"✅ Audio trimmed to {file_size_mb:.1f}MB")
            else:
                print("⚠️ Warning: Audio trimming failed, processing full file")
                if project_id:
                    add_transcription_log(project_id, f"⚠️ Trimming failed, using full file")
                processed_audio_path = audio_file_path
        
        # Normalize language for Whisper CLI (accepts names, but short codes are safer)
        language_map = {
            "english": "en",
            "hindi": "hi",
            "sinhala": "si",
            "tamil": "ta",
            "pali": "pi",
        }
        language_cli = language_map.get(str(language or "").strip().lower(), language)
        
        mode_text = f" (Preview: {preview_duration}s)" if preview_mode else ""
        print(f"🎙️ Processing audio file: {os.path.basename(audio_file_path)} ({file_size_mb:.1f}MB){mode_text}")
        print(f"🔧 Using model: {model}, language: {language_cli}")
        
        # Locate whisper executable inside possible virtualenv locations
        possible_whisper = [
            os.path.join(project_dir, 'whisper-env', 'bin', 'whisper'),
            os.path.join(project_dir, 'whisper-env', 'whisper-env', 'bin', 'whisper'),
        ]
        whisper_exec = None
        for p in possible_whisper:
            if os.path.exists(p):
                whisper_exec = p
                break

        # Fallback to system `whisper` if no bundled executable is found
        if not whisper_exec:
            whisper_exec = 'whisper'

        # Construct the Whisper command
        command = [
            whisper_exec,
            processed_audio_path,
            "--model", model,
            "--output_format", "all",
            "--language", language_cli
        ]
        
        print(f"🚀 Executing command: {' '.join(command)}")
        if project_id:
            add_transcription_log(project_id, f"🚀 Starting Whisper (model: {model}, file: {file_size_mb:.1f}MB)")
        start_time = time.time()
        
        try:
            # Set timeout based on file size + model + acceleration availability.
            # Previous timeout (1.5 min/MB) was too aggressive for CPU medium/large runs.
            timeout_override = os.environ.get("WHISPER_TIMEOUT_SECONDS")
            if timeout_override:
                try:
                    timeout_seconds = max(300, int(timeout_override))
                except ValueError:
                    timeout_seconds = 0
            else:
                timeout_seconds = 0

            if timeout_seconds <= 0:
                if preview_mode:
                    timeout_seconds = 900  # 15 minutes for preview runs
                else:
                    model_factor = {
                        "tiny": 1.0,
                        "base": 1.4,
                        "small": 2.0,
                        "medium": 3.2,
                        "large": 5.0,
                        "large-v2": 5.0,
                        "large-v3": 5.0,
                    }.get(str(model).lower(), 3.2)

                    # Conservative baseline for CPU-bound execution.
                    minutes_per_mb = 2.4 * model_factor

                    # If Apple Silicon acceleration is present, allow tighter timeout.
                    # We only tighten after a positive check to avoid false optimism.
                    try:
                        acceleration_ok = False
                        torch_python = os.path.join(project_dir, 'whisper-env', 'whisper-env', 'bin', 'python')
                        if not os.path.exists(torch_python):
                            torch_python = os.path.join(project_dir, 'whisper-env', 'bin', 'python')
                        if os.path.exists(torch_python):
                            probe = subprocess.run(
                                [
                                    torch_python,
                                    '-c',
                                    'import torch; print(int(bool(getattr(torch.backends, "mps", None) and torch.backends.mps.is_available())))'
                                ],
                                capture_output=True,
                                text=True,
                                timeout=8,
                            )
                            acceleration_ok = (probe.returncode == 0 and probe.stdout.strip() == '1')
                        if acceleration_ok:
                            minutes_per_mb *= 0.6
                    except Exception:
                        pass

                    estimated_minutes = max(45, int(file_size_mb * minutes_per_mb))
                    timeout_seconds = min(estimated_minutes * 60, 28800)  # cap at 8 hours
                    if project_id:
                        accel_status = "with MPS acceleration" if acceleration_ok else "CPU-bound"
                        add_transcription_log(project_id, f"⏱️ Timeout: {estimated_minutes}min ({accel_status})")
            
            print(f"⏰ Setting timeout to {timeout_seconds} seconds")
            
            # Use Popen for better process control and cancellation support
            global active_transcriptions, transcription_lock
            
            # Create environment with unbuffered output
            env = os.environ.copy()
            env['PYTHONUNBUFFERED'] = '1'
            
            if project_id:
                add_transcription_log(project_id, f"🔄 Initializing Whisper subprocess...")
            print(f"🔍 [POPEN_PRE] About to create subprocess with command: {command[0]}")
            print(f"🔍 [POPEN_PRE] Full command: {' '.join(command)}")
            print(f"🔍 [POPEN_PRE] Working dir: {project_dir}")
            sys.stdout.flush()
            
            try:
                process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    universal_newlines=True,
                    cwd=project_dir,
                    env=env,
                    preexec_fn=None  # Ensure clean subprocess
                )
                if project_id:
                    add_transcription_log(project_id, f"✨ Whisper process running (PID: {process.pid})")
                print(f"🔍 [POPEN_POST] Process created successfully, PID: {process.pid}")
                sys.stdout.flush()
            except Exception as popen_error:
                if project_id:
                    add_transcription_log(project_id, f"❌ Failed to start process: {str(popen_error)[:50]}")
                print(f"❌ [POPEN_ERROR] Failed to create subprocess: {popen_error}")
                sys.stdout.flush()
                raise

            if project_id:
                add_transcription_log(project_id, f"📊 Reading transcription output...")
            print(f"🔍 [WHISPER] Process started, reading streams...")
            sys.stdout.flush()
            # Stream logs live while the process is running
            stdout_lines = []
            stderr_lines = []

            def stream_pipe(pipe, label, collector):
                try:
                    if pipe is None:
                        print(f"⚠️ [STREAM] {label} pipe is None")
                        return
                    print(f"🔍 [STREAM] Starting to read {label}")
                    sys.stdout.flush()
                    line_count = 0
                    for raw_line in iter(pipe.readline, ''):
                        if raw_line == '':
                            print(f"🔍 [STREAM] {label} EOF reached")
                            break
                        line_count += 1
                        collector.append(raw_line)
                        line = raw_line.rstrip('\n')
                        if line.strip():
                            print(f"📡 Whisper {label}: {line}")
                    print(f"✅ [STREAM] {label} finished reading {line_count} lines")
                except Exception as stream_err:
                    print(f"⚠️ Whisper {label} stream error: {stream_err}")
                finally:
                    try:
                        if pipe is not None:
                            pipe.close()
                    except Exception:
                        pass

            stdout_thread = threading.Thread(
                target=stream_pipe,
                args=(process.stdout, 'stdout', stdout_lines),
                daemon=False,
            )
            stderr_thread = threading.Thread(
                target=stream_pipe,
                args=(process.stderr, 'stderr', stderr_lines),
                daemon=False,
            )
            stdout_thread.start()
            stderr_thread.start()
            
            print(f"🔍 [WHISPER] Threads started, now waiting for process...")
            
            # Track the process if project_id is provided
            if project_id:
                with transcription_lock:
                    active_transcriptions[project_id] = {
                        'process': process,
                        'start_time': start_time,
                        'cancelled': False
                    }
                    print(f"📝 Tracking transcription process for project {project_id}")
            
            # Wait for process completion with timeout while streaming logs live
            timed_out = False
            heartbeat_last = start_time
            while True:
                if process.poll() is not None:
                    print(f"🔍 [WHISPER] Process poll returned {process.returncode}")
                    break

                elapsed = time.time() - start_time
                if elapsed > timeout_seconds:
                    timed_out = True
                    if project_id:
                        add_transcription_log(project_id, f"⏰ Timeout reached ({int(elapsed)}s > {timeout_seconds}s)")
                    print(f"⏰ Process timed out after {timeout_seconds} seconds")
                    process.kill()
                    break

                if time.time() - heartbeat_last >= 60:
                    print(f"⏳ Whisper still running for {int(elapsed)}s (project={project_id})")
                    heartbeat_last = time.time()

                time.sleep(1)

            # Ensure process and reader threads have ended
            print(f"🔍 [WHISPER] Waiting for process to finish...")
            try:
                process.wait(timeout=10)
            except Exception as e:
                print(f"⚠️ Process wait error: {e}")

            print(f"🔍 [WHISPER] Waiting for threads to finish...")
            stdout_thread.join(timeout=10)
            stderr_thread.join(timeout=10)
            print(f"🔍 [WHISPER] Threads finished")

            stdout = ''.join(stdout_lines)
            stderr = ''.join(stderr_lines)
            print(f"🔍 [WHISPER] Collected {len(stdout_lines)} stdout lines, {len(stderr_lines)} stderr lines")


            if timed_out:
                # Clean up tracking
                if project_id and project_id in active_transcriptions:
                    with transcription_lock:
                        del active_transcriptions[project_id]

                if project_id:
                    add_transcription_log(project_id, f"❌ Processing timed out")
                return {
                    'success': False,
                    'error': f'Processing timed out after {timeout_seconds} seconds',
                    'processing_time': time.time() - start_time
                }
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Check if process was cancelled (return code -15 = SIGTERM)
            if process.returncode == -15:
                if project_id:
                    add_transcription_log(project_id, f"🛑 Process cancelled by user")
                print(f"🛑 Process was terminated (SIGTERM) for project {project_id}")
                # Clean up tracking if still exists
                if project_id:
                    with transcription_lock:
                        if project_id in active_transcriptions:
                            del active_transcriptions[project_id]
                return {
                    'success': False,
                    'error': 'Processing was cancelled',
                    'processing_time': processing_time
                }
            
            # Check if process was cancelled via tracking
            if project_id:
                with transcription_lock:
                    if project_id in active_transcriptions:
                        if active_transcriptions[project_id].get('cancelled'):
                            if project_id:
                                add_transcription_log(project_id, f"🛑 Processing cancelled")
                            print(f"🛑 Process was cancelled for project {project_id}")
                            del active_transcriptions[project_id]
                            return {
                                'success': False,
                                'error': 'Processing was cancelled',
                                'processing_time': processing_time
                            }
                        # Remove from tracking since it completed
                        del active_transcriptions[project_id]
            
            if project_id:
                add_transcription_log(project_id, f"⏱️ Whisper completed in {processing_time:.1f}s (exit code: {process.returncode})")
            print(f"✅ Whisper processing completed in {processing_time:.1f} seconds")
            print(f"🔍 Command return code: {process.returncode}")
            
            # Enhanced debugging - capture and display stdout/stderr
            if stdout:
                print(f"📤 Whisper stdout: {stdout[:500]}...")
            if stderr:
                print(f"📤 Whisper stderr: {stderr[:500]}...")
            
            # Find and read the generated text file
            audio_name = Path(processed_audio_path).stem
            text_file = f"{audio_name}.txt"
            
            # Enhanced debugging - check current working directory and files
            print(f"🔍 Current working directory: {os.getcwd()}")
            print(f"🔍 Audio file name stem: {audio_name}")
            print(f"🔍 Files in current directory:")
            try:
                current_files = os.listdir('.')
                relevant_files = [f for f in current_files if audio_name.lower() in f.lower() or f.endswith(('.txt', '.srt', '.vtt', '.json'))]
                for file in relevant_files[:10]:  # Limit output
                    file_path = os.path.join('.', file)
                    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                    print(f"   📄 {file} ({file_size} bytes)")
                    
                # Also check if there are any files that contain the base temp name
                base_temp_name = Path(processed_audio_path).name.replace('.mp3', '').replace('.wav', '').replace('.m4a', '')
                print(f"🔍 Base temp name: {base_temp_name}")
                temp_related = [f for f in current_files if base_temp_name in f and f.endswith(('.txt', '.srt', '.vtt', '.json'))]
                if temp_related:
                    print(f"🔍 Temp-name related files: {temp_related}")
                    for file in temp_related:
                        file_path = os.path.join('.', file)
                        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                        print(f"   📄 {file} ({file_size} bytes)")
                        
            except Exception as e:
                print(f"❌ Error listing directory: {e}")
            
            print(f"🔍 Looking for transcription file: {text_file}")
            print(f"🔍 Expected file exists: {os.path.exists(text_file)}")
            
            transcription = ""
            word_count = 0
            segments = []
            
            # Enhanced file search - try multiple possible filenames
            possible_files = [
                f"{audio_name}.txt",
                f"{Path(audio_file_path).stem}.txt",  # Original audio name
                f"{Path(processed_audio_path).name}.txt",  # Full processed name with extension
            ]
            
            # Also check for SRT files as fallback
            srt_files = [
                f"{audio_name}.srt",
                f"{Path(audio_file_path).stem}.srt",
                f"{Path(processed_audio_path).name}.srt",
            ]

            json_files = [
                f"{audio_name}.json",
                f"{Path(audio_file_path).stem}.json",
                f"{Path(processed_audio_path).name}.json",
            ]

            # Prefer Whisper JSON (if available) so we can preserve confidence metadata.
            try:
                unique_json_candidates = []
                for candidate in json_files:
                    if candidate and candidate not in unique_json_candidates:
                        unique_json_candidates.append(candidate)

                for json_candidate in unique_json_candidates:
                    if os.path.exists(json_candidate):
                        with open(json_candidate, 'r', encoding='utf-8') as jf:
                            json_raw = jf.read()
                        parsed_segments = parse_whisper_json_segments(json_raw)
                        if parsed_segments:
                            segments = parsed_segments
                            print(f"✅ Parsed {len(segments)} rich segments (with confidence) from {json_candidate}")
                            break
            except Exception as e:
                print(f"⚠️ Failed to parse Whisper JSON segments: {e}")

            # Parse timestamp segments from the first available SRT file.
            # Keep this independent from TXT fallback so we can always power
            # the transcript rail in the UI.
            try:
                unique_srt_candidates = []
                for candidate in srt_files:
                    if candidate and candidate not in unique_srt_candidates:
                        unique_srt_candidates.append(candidate)

                if not segments:
                    for srt_candidate in unique_srt_candidates:
                        if os.path.exists(srt_candidate):
                            with open(srt_candidate, 'r', encoding='utf-8') as sf:
                                srt_raw = sf.read()
                            parsed_segments = parse_srt_segments(srt_raw)
                            if parsed_segments:
                                segments = parsed_segments
                                print(f"✅ Parsed {len(segments)} timestamp segments from {srt_candidate}")
                                break
            except Exception as e:
                print(f"⚠️ Failed to parse SRT segments: {e}")
            
            # Also search for any .txt files created recently
            try:
                txt_files = [f for f in os.listdir('.') if f.endswith('.txt')]
                # Filter out project documentation files
                project_files = ['SEAMLESS_WORKFLOW.txt', 'FILE_SIZE_FIX.txt', 'INTEGRATION_SUCCESS.txt', 
                               'PROGRESS_TRACKING_SUCCESS.txt', 'SUCCESS.txt', 'TECHNICAL_SPECS.txt',
                               'ARCHITECTURE_CONSOLIDATION.txt', 'DEMO_DOCUMENTATION.txt']
                whisper_files = [f for f in txt_files if f not in project_files]
                
                if whisper_files:
                    print(f"🔍 Found potential Whisper .txt files: {whisper_files}")
                    # Add recent .txt files to possible files
                    for txt_file in whisper_files:
                        if txt_file not in possible_files:
                            possible_files.append(txt_file)
                            
                if txt_files:
                    print(f"🔍 All .txt files in directory: {txt_files}")
            except Exception as e:
                print(f"❌ Error searching for .txt files: {e}")
            
            print(f"🔍 Checking possible transcription files: {possible_files}")
            
            for potential_file in possible_files:
                print(f"🔍 Checking file: {potential_file}")
                if os.path.exists(potential_file):
                    try:
                        file_size = os.path.getsize(potential_file)
                        print(f"✅ Found file: {potential_file} ({file_size} bytes)")
                        
                        with open(potential_file, 'r', encoding='utf-8') as f:
                            file_content = f.read()
                            
                        print(f"📄 File content length: {len(file_content)} characters")
                        print(f"📄 File content preview: {file_content[:200]}...")
                        
                        if file_content.strip():
                            transcription = file_content
                            word_count = len(transcription.split())
                            text_file = potential_file  # Update for cleanup
                            print(f"✅ Using transcription from: {potential_file}")
                            break
                        else:
                            print(f"⚠️ File {potential_file} is empty")
                            
                    except Exception as e:
                        print(f"❌ Error reading file {potential_file}: {e}")
                else:
                    print(f"❌ File not found: {potential_file}")
            
            # If no TXT file found, try SRT files as fallback
            if not transcription.strip():
                print(f"🔍 No TXT files found, trying SRT files as fallback: {srt_files}")
                for srt_file in srt_files:
                    print(f"🔍 Checking SRT file: {srt_file}")
                    if os.path.exists(srt_file):
                        try:
                            file_size = os.path.getsize(srt_file)
                            print(f"✅ Found SRT file: {srt_file} ({file_size} bytes)")
                            
                            with open(srt_file, 'r', encoding='utf-8') as f:
                                srt_content = f.read()
                                
                            print(f"📄 SRT content length: {len(srt_content)} characters")
                            print(f"📄 SRT content preview: {srt_content[:200]}...")
                            
                            if srt_content.strip():
                                # Convert SRT to plain text by extracting only the text lines
                                lines = srt_content.strip().split('\n')
                                text_lines = []
                                for line in lines:
                                    line = line.strip()
                                    # Skip sequence numbers, timestamps, and empty lines
                                    if line and not line.isdigit() and '-->' not in line:
                                        text_lines.append(line)
                                
                                transcription = ' '.join(text_lines)
                                word_count = len(transcription.split())
                                text_file = srt_file  # Update for cleanup
                                print(f"✅ Using transcription from SRT file: {srt_file}")
                                print(f"📝 Converted SRT to text: {len(transcription)} characters")
                                break
                            else:
                                print(f"⚠️ SRT file {srt_file} is empty")
                                
                        except Exception as e:
                            print(f"❌ Error reading SRT file {srt_file}: {e}")
                    else:
                        print(f"❌ SRT file not found: {srt_file}")
            
                # Initialize formatted_text as fallback
            formatted_text = transcription

            if transcription.strip():
                print(f"📝 Generated transcription: {word_count} words")
                
                # Apply Pali corrections to full transcription
                print("🔍 Applying Pali corrections to transcription...")
                original_transcription = transcription
                transcription = apply_pali_corrections(transcription)
                
                if transcription != original_transcription:
                    print("✅ Pali corrections were applied to transcription!")
                    word_count = len(transcription.split())
                
                # Apply Pali corrections to each segment as well
                if segments:
                    print(f"🔍 Applying Pali corrections to {len(segments)} segments...")
                    corrected_count = 0
                    for segment in segments:
                        if 'text' in segment and segment['text']:
                            original_text = segment['text']
                            corrected_text = apply_pali_corrections(original_text)
                            if corrected_text != original_text:
                                segment['text'] = corrected_text
                                corrected_count += 1
                    if corrected_count > 0:
                        print(f"✅ Applied Pali corrections to {corrected_count} segments")
                
                # Apply text formatting as post-processing
                print("📄 Applying text formatting...")
                formatted_text = format_transcription_text(transcription)

                # Always prepare a provenance metadata block and prepend it to
                # the transcription and formatted_text returned to the client.
                try:
                    # Try to get original uploaded filename from DB (if available)
                    original_filename = ''
                    stored_filename = Path(audio_file_path).name if audio_file_path else ''
                    try:
                        if project_id:
                            audio_rec = self.db_manager.get_latest_audio_for_project(project_id)
                            if audio_rec:
                                original_filename = audio_rec.get('original_name') or ''
                    except Exception:
                        original_filename = ''

                    provenance_meta = {
                        "stored_filename": stored_filename,
                        "original_filename": original_filename,
                        "original_path": str(audio_file_path) if audio_file_path else '',
                        "whisper_model": model,
                        "processing_time_seconds": processing_time,
                        "transcription_version": 1,
                        "created_at": datetime.now().isoformat()
                    }

                    # Don't prepend SOURCE-INFO to transcription anymore
                    # transcription and formatted_text remain clean
                except Exception as e:
                    print(f"⚠️ Could not prepare inline provenance header: {e}")

                # Generate a PDF with a provenance first page and the transcription
                try:
                    pdf_path = Path(audio_file_path).with_suffix('.pdf')
                    metadata = provenance_meta

                    generated = generate_pdf_with_provenance(str(pdf_path), metadata, transcription)

                    # If Whisper produced a separate text file (text_file) in the
                    # working directory, remove it to avoid duplicates.
                    try:
                        if os.path.exists(text_file):
                            os.unlink(text_file)
                            print(f"🗑️ Cleaned up temp text file: {text_file}")
                    except Exception as e:
                        print(f"❌ Error cleaning up temp file {text_file}: {e}")

                    if generated:
                        # Also write a companion plain-text file that contains
                        # the inline provenance header followed by the transcription
                        # so that downloads and API responses can include the header.
                        try:
                            prov_txt_path = pdf_path.with_suffix('.txt')
                            ok_txt = write_provenance_header_text_file(str(prov_txt_path), metadata, transcription)
                            if ok_txt:
                                # Read back the file and replace the in-memory
                                # transcription so the API response includes the header
                                try:
                                    with open(prov_txt_path, 'r', encoding='utf-8') as pf:
                                        transcription = pf.read()
                                except Exception as re:
                                    print(f"⚠️ Could not read written provenance text file: {re}")
                        except Exception as e:
                            print(f"⚠️ Could not write companion provenance text file: {e}")

                        text_file = str(pdf_path)
                    else:
                        # Fallback: keep the original text result in memory and
                        # return it without a saved PDF path.
                        print("⚠️ PDF generation failed; returning transcription in-memory")
                except Exception as e:
                    print(f"❌ Error while generating final PDF with provenance: {e}")
            
            # If transcription is empty, treat as error
            if not transcription.strip():
                error_msg = "No transcription generated by Whisper."
                print(f"❌ {error_msg}")
                if process.returncode != 0:
                    print(f"❌ Whisper command failed with return code: {process.returncode}")
                    if stderr:
                        print(f"❌ Error details: {stderr}")
                return {"success": False, "error": error_msg}
            
            # Clean up trimmed audio if it was created
            if processed_audio_path != audio_file_path:
                try:
                    os.unlink(processed_audio_path)
                    print("🗑️ Cleaned up trimmed audio file")
                except:
                    pass
            return {
                "success": True,
                "transcription": transcription,
                "formatted_text": formatted_text,  # Now contains properly formatted text
                "segments": segments,
                "word_count": word_count,
                "processing_time": processing_time,
                "output_file": text_file,
                "model": model,
                "language": language,
                "preview_mode": preview_mode
            }
            
        except subprocess.TimeoutExpired:
            error_msg = f"Processing timeout after {timeout_seconds} seconds"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        
        except subprocess.CalledProcessError as e:
            error_msg = f"Whisper processing failed: {e.stderr}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        
        except Exception as e:
            error_msg = f"Processing error: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}

    def trim_audio_file(self, audio_file_path, duration_seconds):
        """Trim audio file to specified duration using ffmpeg"""
        try:
            original_ext = os.path.splitext(audio_file_path)[1].lower()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=original_ext or '.wav') as trimmed_file:
                trimmed_path = trimmed_file.name
            
            command = [
                'ffmpeg', 
                '-i', audio_file_path,
                '-t', str(duration_seconds),
                '-c', 'copy',
                '-y',
                trimmed_path
            ]
            
            result = subprocess.run(command, capture_output=True, text=True, check=True, timeout=30)
            
            if os.path.exists(trimmed_path) and os.path.getsize(trimmed_path) > 0:
                print(f"✅ Successfully trimmed audio to {duration_seconds} seconds")
                return trimmed_path
            
        except Exception as e:
            print(f"⚠️ Audio trimming failed: {e}")
            return None
    
    def send_json_response(self, data, status=200):
        """Send JSON response with CORS headers"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = json.dumps(data, indent=2)
        self.wfile.write(response.encode('utf-8'))
    
    def send_error_response(self, status, message):
        """Send error response"""
        self.send_json_response({
            "success": False,
            "error": message
        }, status=status)

def create_handler_with_db(db_manager):
    """Create handler class with database manager"""
    def handler(*args, **kwargs):
        return PALAScribeHandler(*args, db_manager=db_manager, **kwargs)
    return handler

def main():
    """Start the PALAScribe multi-user server"""
    port = int(os.getenv('PORT', '8000'))
    
    print("🚀 Starting PALAScribe Multi-User Server...")
    
    # Initialize database
    db_manager = DatabaseManager()
    
    # Create server
    handler_class = create_handler_with_db(db_manager)
    server = ThreadingHTTPServer(('localhost', port), handler_class)
    
    print(f"✅ Server running on http://localhost:{port}")
    print("📊 Database initialized")
    print("🎯 API Endpoints:")
    print("   GET  /health - Health check")
    print("   GET  /projects - List all projects")
    print("   POST /projects - Create project")
    print("   GET  /projects/{id} - Get project")
    print("   PUT  /projects/{id} - Update project")
    print("   DELETE /projects/{id} - Delete project")
    print("   POST /projects/{id}/audio - Upload audio")
    print("   POST /projects/{id}/transcribe - Start transcription")
    print("   POST /projects/{id}/cancel - Cancel transcription")
    print("   GET  /audio/{filename} - Get audio file")
    print("   POST /process - Whisper processing (legacy)")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.shutdown()

if __name__ == "__main__":
    main()
