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
import tempfile
import sqlite3
import uuid
import shutil
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler, ThreadingHTTPServer
import urllib.parse
from io import BytesIO
from datetime import datetime
import threading

# PDF generation
try:
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False

# Global variables for tracking active transcriptions
active_transcriptions = {}  # {project_id: {'process': subprocess_obj, 'cancelled': bool}}
transcription_lock = threading.Lock()

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

class DatabaseManager:
    """Handles all database operations for projects and audio files"""
    
    def __init__(self, db_path="palascribe.db"):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """Initialize database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Projects table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                assigned_to TEXT,
                start_date TEXT,
                end_date TEXT,
                status TEXT DEFAULT 'new',
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
                updated TEXT NOT NULL
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
    
    def create_project(self, name, assigned_to=""):
        """Create a new project with unique name handling"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Generate unique name if duplicate exists
        unique_name = self._generate_unique_name(cursor, name)
        
        project_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO projects (id, name, assigned_to, start_date, status, created, updated)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (project_id, unique_name, assigned_to, now, 'new', now, now))
        
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
                        'is_preview', 'error_message', 'audio_file_name', 'audio_file_path', 'export_provenance']:
                update_fields.append(f"{field} = ?")
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
        columns = ['id', 'name', 'assigned_to', 'start_date', 'end_date', 'status',
                  'audio_file_name', 'audio_file_path', 'transcription', 'formatted_text',
                  'edited_text', 'rich_content', 'word_count', 'processing_time',
                  'is_preview', 'error_message', 'created', 'updated']
        
        project = dict(zip(columns, row))
        
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
            'export_provenance': 'exportProvenance'
        }
        
        # Create new project dict with camelCase field names
        converted_project = {}
        for key, value in project.items():
            new_key = field_mapping.get(key, key)
            converted_project[new_key] = value
        
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
        if self.path == '/health':
            self.handle_health_check()
        elif self.path == '/api/dictionary':
            self.handle_get_dictionary()
        elif self.path == '/projects':
            self.handle_get_projects()
        elif self.path.startswith('/projects/'):
            project_id = self.path.split('/')[-1]
            self.handle_get_project(project_id)
        elif self.path.startswith('/audio/'):
            filename = self.path.split('/')[-1]
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
        if self.path == '/process':
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
        else:
            self.send_error(404, "Not Found")
    
    def do_PUT(self):
        """Handle PUT requests"""
        if self.path.startswith('/projects/'):
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
    
    def handle_get_projects(self):
        """Get all projects"""
        try:
            projects = self.db_manager.get_all_projects()
            self.send_json_response({"projects": projects})
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def handle_get_project(self, project_id):
        """Get specific project"""
        try:
            print(f"🔍 Getting project: {project_id}")
            project = self.db_manager.get_project(project_id)
            if project:
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
    
    def handle_create_project(self):
        """Create new project"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            name = data.get('name', '').strip()
            assigned_to = data.get('assignedTo', '').strip()
            
            if not name:
                self.send_error_response(400, "Project name is required")
                return
            
            project = self.db_manager.create_project(name, assigned_to)
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
        try:
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
                'errorMessage': 'error_message'
            }
            
            # Convert field names
            converted_data = {}
            for key, value in data.items():
                # Use snake_case if conversion exists, otherwise keep original
                db_key = field_mapping.get(key, key)
                converted_data[db_key] = value
            
            print(f"🔄 Updating project {project_id} with fields: {list(converted_data.keys())}")
            
            self.db_manager.update_project(project_id, converted_data)
            
            # Return updated project
            project = self.db_manager.get_project(project_id)
            if project:
                self.send_json_response(project)
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
            print(f"📝 Updating project {project_id} status to 'processing'")
            self.db_manager.update_project(project_id, {
                'status': 'processing'
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
            
            # Update project status
            self.db_manager.update_project(project_id, {'status': 'processing'})
            
            # Process the audio file
            print(f"🎵 Using audio file path: {audio_file_path}")
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
                        self.send_json_response({'success': False, 'error': 'Processing was cancelled'})
                        return
                
                self.db_manager.update_project(project_id, {
                    'transcription': result.get('transcription', ''),
                    'formatted_text': result.get('formatted_text', ''),
                    'word_count': result.get('word_count', 0),
                    'processing_time': result.get('processing_time', 0),
                    'status': 'Needs_Review'  # Set to ready for review status
                })
                print(f"✅ Transcription completed for project {project_id}")
            else:
                # For failed transcriptions, also check if it was cancelled
                if result.get('error') == 'Processing was cancelled':
                    print(f"🛑 Transcription was cancelled for project {project_id}")
                else:
                    self.db_manager.update_project(project_id, {
                        'status': 'Error',  # Use consistent error status
                        'error_message': result.get('error', 'Unknown error')
                    })
                    print(f"❌ Transcription failed for project {project_id}")
            
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
                        'status': 'new',
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
        """Serve audio files"""
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

            # Send file
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(file_path.stat().st_size))
            self.end_headers()

            with open(file_path, 'rb') as f:
                try:
                    shutil.copyfileobj(f, self.wfile)
                except (BrokenPipeError, ConnectionResetError) as conn_err:
                    # Client disconnected while streaming audio; log and stop quietly.
                    print(f"⚠️ Client disconnected during audio streaming: {conn_err}")
                    return
                except OSError as oe:
                    # Treat EPIPE (broken pipe) as client disconnect on some platforms
                    if getattr(oe, 'errno', None) in (32,):
                        print(f"⚠️ Socket error during streaming (treated as client disconnect): {oe}")
                        return
                    raise

        except Exception as e:
            # If the client disconnected (BrokenPipe/ConnectionReset), don't try to
            # write an error response which will also fail with BrokenPipe.
            if isinstance(e, (BrokenPipeError, ConnectionResetError)):
                print(f"⚠️ Client disconnected before error handling: {e}")
                return
            # Other exceptions should return a 500 to the client if possible
            try:
                self.send_error(500, str(e))
            except Exception:
                # If sending the error also fails (e.g., broken pipe), just log it.
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
            processed_audio_path = self.trim_audio_file(audio_file_path, preview_duration)
            if processed_audio_path:
                # Update file size for the trimmed version
                file_size = os.path.getsize(processed_audio_path)
                file_size_mb = file_size / (1024 * 1024)
                print(f"✅ Audio trimmed to {file_size_mb:.1f}MB")
            else:
                print("⚠️ Warning: Audio trimming failed, processing full file")
                processed_audio_path = audio_file_path
        
        # Estimate processing time
        estimated_minutes = max(1, int(file_size_mb * 1.5))
        if preview_mode:
            estimated_minutes = max(1, int(estimated_minutes * 0.2))
        
        mode_text = f" (Preview: {preview_duration}s)" if preview_mode else ""
        print(f"🎙️ Processing audio file: {os.path.basename(audio_file_path)} ({file_size_mb:.1f}MB){mode_text}")
        print(f"🔧 Using model: {model}, language: {language}")
        
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
            "--output_format", "txt",
            "--output_format", "srt",
            "--language", language
        ]
        
        print(f"🚀 Executing command: {' '.join(command)}")
        start_time = time.time()
        
        try:
            # Set timeout based on file size
            if preview_mode:
                timeout_seconds = 300  # 5 minutes for preview
            else:
                estimated_minutes = max(30, file_size_mb * 1.5)
                timeout_seconds = int(estimated_minutes * 60)
                timeout_seconds = min(timeout_seconds, 14400)  # Cap at 4 hours
            
            print(f"⏰ Setting timeout to {timeout_seconds} seconds")
            
            # Use Popen for better process control and cancellation support
            global active_transcriptions, transcription_lock
            
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=project_dir
            )
            
            # Track the process if project_id is provided
            if project_id:
                with transcription_lock:
                    active_transcriptions[project_id] = {
                        'process': process,
                        'start_time': start_time,
                        'cancelled': False
                    }
                    print(f"📝 Tracking transcription process for project {project_id}")
            
            # Wait for process completion with timeout
            try:
                stdout, stderr = process.communicate(timeout=timeout_seconds)
            except subprocess.TimeoutExpired:
                print(f"⏰ Process timed out after {timeout_seconds} seconds")
                process.kill()
                stdout, stderr = process.communicate()
                
                # Clean up tracking
                if project_id and project_id in active_transcriptions:
                    with transcription_lock:
                        del active_transcriptions[project_id]
                
                return {
                    'success': False,
                    'error': f'Processing timed out after {timeout_seconds} seconds',
                    'processing_time': time.time() - start_time
                }
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Check if process was cancelled (return code -15 = SIGTERM)
            if process.returncode == -15:
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
                            print(f"🛑 Process was cancelled for project {project_id}")
                            del active_transcriptions[project_id]
                            return {
                                'success': False,
                                'error': 'Processing was cancelled',
                                'processing_time': processing_time
                            }
                        # Remove from tracking since it completed
                        del active_transcriptions[project_id]
            
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
                relevant_files = [f for f in current_files if audio_name.lower() in f.lower() or f.endswith(('.txt', '.srt', '.vtt'))]
                for file in relevant_files[:10]:  # Limit output
                    file_path = os.path.join('.', file)
                    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                    print(f"   📄 {file} ({file_size} bytes)")
                    
                # Also check if there are any files that contain the base temp name
                base_temp_name = Path(processed_audio_path).name.replace('.mp3', '').replace('.wav', '').replace('.m4a', '')
                print(f"🔍 Base temp name: {base_temp_name}")
                temp_related = [f for f in current_files if base_temp_name in f and f.endswith(('.txt', '.srt', '.vtt'))]
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
                
                # Apply Pali corrections
                print("🔍 Applying Pali corrections...")
                original_transcription = transcription
                transcription = apply_pali_corrections(transcription)
                
                if transcription != original_transcription:
                    print("✅ Pali corrections were applied!")
                    word_count = len(transcription.split())
                
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

                    start_marker = "---SOURCE-INFO-START---"
                    end_marker = "---SOURCE-INFO-END---"
                    header_json = json.dumps(provenance_meta, indent=2, ensure_ascii=False)
                    header_block = f"{start_marker}\n{header_json}\n{end_marker}\n\n"

                    # Prepend header to both returned transcription and formatted text
                    transcription = header_block + transcription
                    formatted_text = header_block + formatted_text
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
    port = 8765
    
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
