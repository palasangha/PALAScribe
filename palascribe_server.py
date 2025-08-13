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
        
        conn.commit()
        conn.close()
        print("✅ Database initialized")
    
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
                        'is_preview', 'error_message', 'audio_file_name', 'audio_file_path']:
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
    
    def save_audio_file(self, project_id, file_data, original_name, mime_type):
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
        
        # Insert audio file record
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
            'error_message': 'errorMessage'
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
        if self.path.startswith('/projects/'):
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
                self.send_json_response(project)
            else:
                print(f"❌ Project {project_id} not found")
                self.send_error_response(404, "Project not found")
        except Exception as e:
            print(f"❌ Error getting project {project_id}: {e}")
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
            
            if not audio_data or not filename:
                print(f"❌ Multipart parsing failed - audio_data: {bool(audio_data)}, filename: {filename}")
                self.send_error_response(400, "No audio file found")
                return
            
            # Save audio file
            print(f"💾 Attempting to save audio file: {filename} ({len(audio_data)} bytes)")
            mime_type = "audio/mpeg"  # Default, could be detected
            file_path = self.db_manager.save_audio_file(project_id, audio_data, filename, mime_type)
            print(f"✅ Audio file saved to: {file_path}")
            
            # Update project status
            print(f"📝 Updating project {project_id} status to 'processing'")
            self.db_manager.update_project(project_id, {
                'status': 'processing'
            })
            
            print(f"📤 Sending success response for audio upload")
            self.send_json_response({
                "message": "Audio file uploaded successfully",
                "file_path": file_path,
                "filename": filename
            })
            
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
                shutil.copyfileobj(f, self.wfile)
                
        except Exception as e:
            self.send_error(500, str(e))
    
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
        
        # Ensure we're in the right directory
        project_dir = "./"
        os.chdir(project_dir)
        
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
        
        # Construct the Whisper command
        command = [
            "whisper-env/bin/whisper", 
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
            
            if transcription.strip():
                print(f"📝 Generated transcription: {word_count} words")
                
                # Apply Pali corrections
                print("🔍 Applying Pali corrections...")
                original_transcription = transcription
                transcription = apply_pali_corrections(transcription)
                
                if transcription != original_transcription:
                    print("✅ Pali corrections were applied!")
                    word_count = len(transcription.split())
                
                # Clean up text file
                try:
                    if os.path.exists(text_file):
                        os.unlink(text_file)
                        print(f"🗑️ Cleaned up text file: {text_file}")
                except Exception as e:
                    print(f"❌ Error cleaning up {text_file}: {e}")
            
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
                "formatted_text": transcription,  # For now, same as transcription
                "word_count": word_count,
                "processing_time": processing_time,
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
    server = ThreadingHTTPServer(('0.0.0.0', port), handler_class) #for listening on all interfaces
    
    print(f"✅ Server running on http://0.0.0.0:{port}")
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
