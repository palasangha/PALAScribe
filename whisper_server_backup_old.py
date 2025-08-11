#!/usr/bin/env python3
"""
Local Whisper HTTP Server - Clean Version
Provides HTTP API for PALAScribe web interface
Fixed for Python 3.12+ compatibility and proper port configuration
"""

import sys
import os
import subprocess
import json
import time
import tempfile
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
from io import BytesIO


# Pali Dictionary for Text Correction
# Maps common English/phonetic transcriptions to proper Pali terms with diacritics
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
    'namaste': 'Namaste',  # Not Pali but commonly confused
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
    
    This function:
    1. Preserves original formatting and punctuation
    2. Performs case-insensitive matching
    3. Only replaces whole words (not partial matches)
    4. Maintains original capitalization context when possible
    
    Args:
        text (str): The transcribed text to correct
        
    Returns:
        str: Text with Pali corrections applied
    """
    if not text or not text.strip():
        print("⚠️ Pali corrections: Empty or whitespace-only text provided")
        return text
    
    import re
    
    print(f"🔍 Pali corrections: Processing text with {len(text)} characters, {len(text.split())} words")
    print(f"📝 First 150 chars of input text: {text[:150]}...")
    
    corrected_text = text
    corrections_made = []
    
    # Sort corrections by length (longest first) to handle overlapping patterns correctly
    sorted_corrections = sorted(PALI_CORRECTIONS.items(), key=lambda x: len(x[0]), reverse=True)
    
    print(f"🔍 Checking against {len(sorted_corrections)} Pali correction patterns...")
    
    for i, (english_term, pali_term) in enumerate(sorted_corrections):
        # Create a regex pattern that matches the word with word boundaries
        # This ensures we only match complete words, not partial matches
        pattern = r'\b' + re.escape(english_term) + r'\b'
        
        # Check if the pattern exists in the text before trying to replace
        if re.search(pattern, corrected_text, flags=re.IGNORECASE):
            print(f"🎯 Found potential match for '{english_term}' -> '{pali_term}'")
            
            # Function to handle case preservation
            def replace_func(match):
                matched_word = match.group(0)
                print(f"   📝 Replacing '{matched_word}' with '{pali_term}'")
                
                # Preserve original case pattern
                if matched_word.isupper():
                    # ALL CAPS -> ALL CAPS
                    return pali_term.upper()
                elif matched_word.istitle():
                    # Title Case -> Title Case
                    return pali_term.title() if pali_term.islower() else pali_term
                elif matched_word.islower():
                    # lowercase -> preserve Pali capitalization
                    return pali_term
                else:
                    # Mixed case -> preserve Pali capitalization
                    return pali_term
            
            # Apply the replacement with case-insensitive matching
            old_text = corrected_text
            corrected_text = re.sub(pattern, replace_func, corrected_text, flags=re.IGNORECASE)
            
            # Track corrections made for logging
            if old_text != corrected_text:
                corrections_made.append(f"{english_term} → {pali_term}")
        
        # Log progress every 50 patterns for very verbose debugging
        if (i + 1) % 50 == 0:
            print(f"🔍 Processed {i + 1}/{len(sorted_corrections)} patterns, {len(corrections_made)} corrections so far")
    
    # Log final results
    if corrections_made:
        print(f"✅ Applied {len(corrections_made)} Pali corrections:")
        for correction in corrections_made:
            print(f"   • {correction}")
        print(f"📝 First 150 chars of corrected text: {corrected_text[:150]}...")
    else:
        print("ℹ️ No Pali corrections applied - no matching patterns found")
        print("🔍 Double-checking for some common terms in text:")
        common_checks = ['buddha', 'dharma', 'karma', 'nirvana', 'meditation', 'mindfulness', 'wisdom']
        for term in common_checks:
            if term.lower() in text.lower():
                print(f"   ✓ Found '{term}' in text (case-insensitive)")
                # Check if it's a whole word
                import re
                pattern = r'\b' + re.escape(term) + r'\b'
                if re.search(pattern, text, flags=re.IGNORECASE):
                    print(f"   ⚠️ '{term}' exists as whole word but wasn't corrected - check dictionary!")
                else:
                    print(f"   ℹ️ '{term}' found but not as a whole word")
    
    return corrected_text


class SimpleFieldStorage:
    """Simple multipart form parser to replace deprecated cgi module"""
    
    def __init__(self, fp, headers, environ):
        self.fields = {}
        self.files = {}
        self.file_objects = {}
        
        content_type = headers.get('content-type', '')
        if 'multipart/form-data' in content_type and 'boundary=' in content_type:
            boundary = content_type.split('boundary=')[1].strip()
            self._parse_multipart(fp, boundary)
    
    def _parse_multipart(self, fp, boundary):
        """Parse multipart form data with proper binary handling"""
        try:
            # Read all content as bytes
            content = fp.read()
            if not isinstance(content, bytes):
                content = content.encode('utf-8')
            
            # Split by boundary (as bytes)
            boundary_bytes = ('--' + boundary).encode('ascii')
            parts = content.split(boundary_bytes)
            
            for part in parts[1:-1]:  # Skip first empty part and last closing part
                if len(part) < 4:  # Skip tiny parts
                    continue
                    
                # Find the double CRLF that separates headers from content
                header_end = part.find(b'\r\n\r\n')
                if header_end == -1:
                    header_end = part.find(b'\n\n')
                    if header_end == -1:
                        continue
                    header_bytes = part[:header_end]
                    content_bytes = part[header_end + 2:]
                else:
                    header_bytes = part[:header_end]
                    content_bytes = part[header_end + 4:]
                
                # Parse headers
                try:
                    header_str = header_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    header_str = header_bytes.decode('latin-1', errors='ignore')
                
                headers = {}
                for line in header_str.split('\n'):
                    line = line.strip()
                    if ':' in line:
                        key, value = line.split(':', 1)
                        headers[key.strip().lower()] = value.strip()
                
                # Parse Content-Disposition
                disposition = headers.get('content-disposition', '')
                field_name = self._extract_field_name(disposition)
                filename = self._extract_filename(disposition)
                
                if field_name:
                    if filename:
                        # It's a file upload
                        # Remove trailing CRLF if present
                        if content_bytes.endswith(b'\r\n'):
                            content_bytes = content_bytes[:-2]
                        elif content_bytes.endswith(b'\n'):
                            content_bytes = content_bytes[:-1]
                            
                        file_obj = SimpleFileField(filename, content_bytes)
                        self.file_objects[field_name] = file_obj
                        print(f"📁 Parsed file field: {field_name} -> {filename} ({len(content_bytes)} bytes)")
                    else:
                        # It's a regular form field
                        try:
                            field_value = content_bytes.decode('utf-8').strip()
                        except UnicodeDecodeError:
                            field_value = content_bytes.decode('latin-1', errors='ignore').strip()
                        
                        self.fields[field_name] = field_value
                        print(f"📝 Parsed form field: {field_name} = {field_value}")
                        
        except Exception as e:
            print(f"Error parsing multipart data: {e}")
            import traceback
            traceback.print_exc()
    
    def _extract_field_name(self, disposition):
        """Extract field name from Content-Disposition header"""
        if 'name=' not in disposition:
            return None
        
        # Handle quoted and unquoted values
        import re
        match = re.search(r'name=(["\']?)([^"\';\s]+)\1', disposition)
        return match.group(2) if match else None
    
    def _extract_filename(self, disposition):
        """Extract filename from Content-Disposition header"""
        if 'filename=' not in disposition:
            return None
            
        # Handle quoted and unquoted values
        import re  
        match = re.search(r'filename=(["\']?)([^"\';\r\n]+)\1', disposition)
        return match.group(2) if match else None
    
    def getvalue(self, key, default=None):
        """Get value of a form field"""
        return self.fields.get(key, default)
    
    def __contains__(self, key):
        """Check if key exists in fields or files"""
        return key in self.fields or key in self.file_objects
    
    def __getitem__(self, key):
        """Get field or file by key"""
        if key in self.file_objects:
            return self.file_objects[key]
        elif key in self.fields:
            return SimpleFieldValue(self.fields[key])
        raise KeyError(key)


class SimpleFileField:
    """Simple file field object"""
    
    def __init__(self, filename, content):
        self.filename = filename
        self.content = content if isinstance(content, bytes) else content.encode('utf-8')
        self.file = BytesIO(self.content)
    
    def read(self):
        return self.content
    
    def save(self, filepath):
        """Save file content to disk"""
        with open(filepath, 'wb') as f:
            f.write(self.content)


class SimpleFieldValue:
    """Simple form field value"""
    
    def __init__(self, value):
        self.value = value
    
    @property
    def filename(self):
        return None


class WhisperRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler for Whisper API"""
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        print("🔧 CORS preflight request received")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
        print("✅ CORS preflight response sent")

    def do_GET(self):
        """Handle GET requests for health checks"""
        if self.path == '/health':
            self.handle_health_check()
        elif self.path == '/start':
            self.handle_start_request()
        else:
            self.send_error(404, "Not Found")

    def do_POST(self):
        """Handle POST requests for audio processing"""
        print(f"📨 POST request received: {self.path}")
        if self.path == '/process':
            self.handle_audio_processing()
        else:
            print(f"❌ Unknown POST path: {self.path}")
            self.send_error(404, "Not Found")

    def handle_health_check(self):
        """Handle health check requests"""
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = json.dumps({
                "status": "healthy",
                "service": "Whisper Backend",
                "timestamp": time.time()
            })
            self.wfile.write(response.encode('utf-8'))
        except Exception as e:
            self.send_error(500, f"Health check failed: {str(e)}")

    def handle_start_request(self):
        """Handle startup/status requests"""
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = json.dumps({
                "status": "running",
                "service": "Whisper Backend",
                "message": "Server is already running",
                "timestamp": time.time()
            })
            self.wfile.write(response.encode('utf-8'))
        except Exception as e:
            self.send_error(500, f"Start request failed: {str(e)}")

    def handle_audio_processing(self):
        """Process uploaded audio file with Whisper"""
        try:
            print("🎵 Audio processing request received")
            print(f"📋 Headers: {dict(self.headers)}")
            print(f"📋 Content-Length: {self.headers.get('content-length', 'unknown')}")
            
            # Read the request body properly
            content_length = int(self.headers.get('content-length', 0))
            if content_length > 0:
                print(f"📖 Reading {content_length} bytes from request body...")
                post_data = self.rfile.read(content_length)
                print(f"✅ Successfully read {len(post_data)} bytes")
            else:
                print("⚠️ No content-length header found")
                post_data = b''
                self.send_error(400, "No content-length header")
                return

            # Parse the multipart form data
            print("� Parsing multipart form data...")
            form_data = SimpleFieldStorage(
                BytesIO(post_data),
                self.headers,
                {}
            )
            
            # Extract parameters  
            preview_mode = form_data.getvalue('preview', 'false').lower() == 'true'
            model = form_data.getvalue('model', 'medium')
            language = form_data.getvalue('language', 'English')
            preview_duration = int(form_data.getvalue('preview_duration', '60'))
            
            print(f"📊 Parameters: preview_mode={preview_mode}, model={model}, language={language}")
            if preview_mode:
                print(f"🔍 Preview mode enabled - processing first {preview_duration} seconds only")
            
            # Get the uploaded audio file
            if 'audio' not in form_data:
                print("❌ No audio file found in request")
                print(f"📋 Available fields: {list(form_data.fields.keys())}")
                print(f"📋 Available files: {list(form_data.file_objects.keys())}")
                self.send_error(400, "No audio file uploaded")
                return
            
            audio_file = form_data['audio']
            if not hasattr(audio_file, 'filename') or not audio_file.filename:
                print("❌ Invalid audio file")
                self.send_error(400, "Invalid audio file")
                return
            
            filename = audio_file.filename
            file_content = audio_file.read()
            print(f"📁 Processing file: {filename} ({len(file_content)} bytes)")
            
            # Determine the correct file extension based on the uploaded filename
            original_ext = os.path.splitext(filename)[1].lower() if filename else ''
            if not original_ext or original_ext not in ['.mp3', '.wav', '.m4a', '.flac', '.ogg']:
                original_ext = '.wav'  # Default to WAV if unknown
            
            print(f"🎵 Using file extension: {original_ext}")
            
            # Save the uploaded file to a temporary location with correct extension
            with tempfile.NamedTemporaryFile(delete=False, suffix=original_ext) as temp_file:
                temp_file.write(file_content)
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
            
            # Clean up the temporary file
            try:
                os.unlink(temp_audio_path)
                print("🗑️ Cleaned up temporary audio file")
            except Exception as cleanup_error:
                print(f"⚠️ Warning: Could not delete temp file: {cleanup_error}")
            
            # Send the response
            print("📤 Sending transcription response...")
            response_data = json.dumps(result)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Content-Length', str(len(response_data)))
            self.end_headers()
            
            self.wfile.write(response_data.encode('utf-8'))
            self.wfile.flush()
            
            if result.get('success'):
                print(f"✅ Transcription completed successfully ({result.get('word_count', 0)} words)")
            else:
                print(f"❌ Transcription failed: {result.get('error', 'Unknown error')}")

        except Exception as e:
            print(f"❌ Server error: {str(e)}")
            import traceback
            traceback.print_exc()
            try:
                self.send_error(500, f"Server error: {str(e)}")
            except:
                print("❌ Failed to send error response")

    def trim_audio_file(self, audio_file_path, duration_seconds):
        """Trim audio file to specified duration using ffmpeg"""
        try:
            # Get the original file extension to preserve format compatibility
            original_ext = os.path.splitext(audio_file_path)[1].lower()
            
            # Create a new temporary file for the trimmed audio
            # Use the same extension as the original file to avoid codec issues
            with tempfile.NamedTemporaryFile(delete=False, suffix=original_ext or '.wav') as trimmed_file:
                trimmed_path = trimmed_file.name
            
            # First, try to copy without re-encoding for speed (works for same format)
            command_copy = [
                'ffmpeg', 
                '-i', audio_file_path,
                '-t', str(duration_seconds),
                '-c', 'copy',  # Copy without re-encoding for speed
                '-y',  # Overwrite output file
                trimmed_path
            ]
            
            print(f"🎵 Trimming audio with copy command: {' '.join(command_copy)}")
            
            try:
                result = subprocess.run(
                    command_copy,
                    capture_output=True,
                    text=True,
                    check=True,
                    timeout=30
                )
                
                if os.path.exists(trimmed_path) and os.path.getsize(trimmed_path) > 0:
                    print(f"✅ Successfully trimmed audio to {duration_seconds} seconds (copy mode)")
                    return trimmed_path
                    
            except subprocess.CalledProcessError as copy_error:
                print(f"⚠️ Copy mode failed: {copy_error.stderr}")
                print("🔄 Falling back to re-encoding...")
                
                # If copy fails, try with re-encoding (slower but more compatible)
                command_reencode = [
                    'ffmpeg', 
                    '-i', audio_file_path,
                    '-t', str(duration_seconds),
                    '-acodec', 'pcm_s16le',  # Use PCM encoding for WAV
                    '-ar', '16000',  # 16kHz sample rate (good for speech)
                    '-ac', '1',  # Mono channel
                    '-y',  # Overwrite output file
                    trimmed_path
                ]
                
                # If original was MP3, use MP3 encoding
                if original_ext == '.mp3':
                    command_reencode = [
                        'ffmpeg', 
                        '-i', audio_file_path,
                        '-t', str(duration_seconds),
                        '-acodec', 'mp3',
                        '-ab', '128k',  # 128kbps bitrate
                        '-ar', '16000',  # 16kHz sample rate
                        '-ac', '1',  # Mono channel
                        '-y',  # Overwrite output file
                        trimmed_path
                    ]
                
                print(f"🎵 Re-encoding with command: {' '.join(command_reencode)}")
                
                result = subprocess.run(
                    command_reencode,
                    capture_output=True,
                    text=True,
                    check=True,
                    timeout=60  # Re-encoding takes longer
                )
            
            if os.path.exists(trimmed_path) and os.path.getsize(trimmed_path) > 0:
                print(f"✅ Successfully trimmed audio to {duration_seconds} seconds")
                return trimmed_path
            else:
                print("❌ Trimmed file is empty or doesn't exist")
                return None
                
        except subprocess.CalledProcessError as e:
            print(f"❌ ffmpeg trimming failed: {e.stderr}")
            return None
        except subprocess.TimeoutExpired:
            print("❌ Audio trimming timed out")
            return None
        except Exception as e:
            print(f"❌ Audio trimming error: {str(e)}")
            return None

    def execute_whisper_command(self, audio_file_path, model="medium", language="English", preview_mode=False, preview_duration=60):
        """Execute Whisper command and return results"""
        
        # Ensure we're in the right directory
        project_dir = "~/PALAScribe"
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
        
        # Estimate processing time (rough estimate: 1MB = 1-2 minutes on medium model)
        estimated_minutes = max(1, int(file_size_mb * 1.5))
        if preview_mode:
            estimated_minutes = max(1, int(estimated_minutes * 0.2))  # Preview is much faster
        
        if estimated_minutes > 60:
            time_estimate = f"{estimated_minutes // 60}h {estimated_minutes % 60}m"
        else:
            time_estimate = f"{estimated_minutes}m"
        
        mode_text = f" (Preview: {preview_duration}s)" if preview_mode else ""
        print(f"🎙️ Processing audio file: {os.path.basename(audio_file_path)} ({file_size_mb:.1f}MB){mode_text}")
        print(f"⏱️ Estimated processing time: ~{time_estimate}")
        print(f"🔧 Using model: {model}, language: {language}")
        
        # Construct the Whisper command to generate both text and SRT (with timestamps)
        command = [
            "whisper-env/bin/whisper", 
            processed_audio_path,
            "--model", model,
            "--output_format", "txt",
            "--output_format", "srt",  # Also generate SRT for timestamps
            "--language", language
        ]
        
        print(f"🚀 Executing command: {' '.join(command)}")
        start_time = time.time()
        
        try:
            # Execute the command with a timeout
            # Calculate timeout based on file size (rough estimate: 1 minute per MB for medium model)
            if preview_mode:
                timeout_seconds = 300  # 5 minutes for preview (60 seconds of audio)
            else:
                # For full files: base time + size-based scaling
                # Medium model: ~1-2 minutes per minute of audio
                # Rough estimate: 60-120 seconds per MB of audio file
                estimated_minutes = max(30, file_size_mb * 1.5)  # At least 30 min, or 1.5 min per MB
                timeout_seconds = int(estimated_minutes * 60)
                # Cap at 4 hours for very large files
                timeout_seconds = min(timeout_seconds, 14400)
            
            print(f"⏰ Setting timeout to {timeout_seconds} seconds ({timeout_seconds/60:.1f} minutes) for {file_size_mb:.1f}MB file")
            
            result = subprocess.run(
                command, 
                capture_output=True, 
                text=True, 
                check=True,
                cwd=project_dir,
                timeout=timeout_seconds
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            print(f"✅ Whisper processing completed in {processing_time:.1f} seconds")
            
            # Debug: Show Whisper's stdout/stderr
            if result.stdout:
                print(f"📋 Whisper stdout: {result.stdout}")
            if result.stderr:
                print(f"📋 Whisper stderr: {result.stderr}")
            
            # Debug: List all files in current directory to see what was created
            current_files = os.listdir('.')
            txt_files = [f for f in current_files if f.endswith('.txt')]
            srt_files = [f for f in current_files if f.endswith('.srt')]
            print(f"🔍 All .txt files in directory: {txt_files}")
            print(f"🔍 All .srt files in directory: {srt_files}")
            
            # Also check for files that contain the base name (without path)
            audio_basename = os.path.basename(processed_audio_path)
            audio_name_no_ext = os.path.splitext(audio_basename)[0]
            print(f"🔍 Audio basename: {audio_basename}, name without ext: {audio_name_no_ext}")
            print(f"🔍 Processed audio path: {processed_audio_path}")
            
            # Check for various possible output file names
            possible_names = [
                f"{audio_name_no_ext}.txt",  # Base name
                f"{Path(processed_audio_path).stem}.txt",  # Full path stem
                f"{os.path.splitext(os.path.basename(processed_audio_path))[0]}.txt"  # Basename stem
            ]
            print(f"🔍 Checking for possible file names: {possible_names}")
            
            # Find the generated text and SRT files
            audio_name = Path(processed_audio_path).stem
            text_file = f"{audio_name}.txt"
            srt_file = f"{audio_name}.srt"
            
            print(f"🔍 Expected text file: {text_file}")
            print(f"🔍 Expected SRT file: {srt_file}")
            
            # Check if any of the possible names exist
            for possible_name in possible_names:
                if os.path.exists(possible_name):
                    print(f"✅ Found possible match: {possible_name}")
                else:
                    print(f"❌ Not found: {possible_name}")
            
            # If the expected text file doesn't exist, try to find any recent .txt file
            transcription = ""
            word_count = 0
            timestamps = []
            
            # Try to find the text file - first try exact match, then search for Whisper-generated files only
            actual_text_file = None
            if os.path.exists(text_file):
                actual_text_file = text_file
                print(f"✅ Found expected text file: {text_file}")
            elif txt_files:
                # Only look for files that match the temp file pattern (tmpXXXXXX.txt)
                # Whisper creates files using the same base name as the audio file
                recent_threshold = time.time() - 60  # Only files created in the last minute
                
                candidate_files = []
                for f in txt_files:
                    if os.path.exists(f):
                        file_ctime = os.path.getctime(f)
                        # Only consider files that:
                        # 1. Start with "tmp" AND were created very recently (Whisper temp files)
                        # 2. Have the same base name as our audio file
                        if (f.startswith('tmp') and file_ctime > recent_threshold) or f == text_file:
                            candidate_files.append((f, file_ctime))
                            print(f"📋 Candidate file: {f} (created {time.time() - file_ctime:.1f}s ago)")
                
                if candidate_files:
                    # Get the most recently created candidate file
                    actual_text_file = max(candidate_files, key=lambda x: x[1])[0]
                    print(f"✅ Found recent Whisper text file: {actual_text_file}")
                else:
                    print(f"⚠️ No recent Whisper text files found among: {txt_files}")
                    print(f"🔍 Expected file: {text_file}")
                    # List all txt files with their creation times for debugging
                    for f in txt_files:
                        if os.path.exists(f):
                            ctime = os.path.getctime(f)
                            age_seconds = time.time() - ctime
                            print(f"    {f}: created {age_seconds:.1f}s ago")
            
            # Read plain text transcription
            if actual_text_file and os.path.exists(actual_text_file):
                with open(actual_text_file, 'r', encoding='utf-8') as f:
                    transcription = f.read()
                    word_count = len(transcription.split())
                
                print(f"📝 Generated transcription: {word_count} words from {actual_text_file}")
                print(f"🔍 First 200 characters of transcription: {transcription[:200]}...")
                
                # Always apply Pali corrections (they will only trigger if relevant words are found)
                print("🔍 Applying Pali corrections to transcription...")
                original_transcription = transcription
                transcription = apply_pali_corrections(transcription)
                
                # Check if any corrections were made
                if transcription != original_transcription:
                    print("✅ Pali corrections were applied!")
                    # Update word count after corrections
                    new_word_count = len(transcription.split())
                    if new_word_count != word_count:
                        print(f"📊 Word count changed from {word_count} to {new_word_count} after corrections")
                        word_count = new_word_count
                else:
                    print("ℹ️ No Pali corrections were needed (no matching terms found)")
                
                # Clean up the generated text file
                try:
                    os.unlink(actual_text_file)
                    print(f"🗑️ Cleaned up text file: {actual_text_file}")
                except:
                    print(f"⚠️ Could not delete text file: {actual_text_file}")
            else:
                print(f"⚠️ Warning: No text file found (expected {text_file})")
                # Try to extract transcription from Whisper stdout
                if result.stdout and result.stdout.strip():
                    print("🔧 Extracting transcription from Whisper stdout...")
                    # Parse the SRT-style output from stdout to get plain text
                    stdout_lines = result.stdout.strip().split('\n')
                    text_lines = []
                    
                    for line in stdout_lines:
                        line = line.strip()
                        # Skip empty lines
                        if not line:
                            continue
                        # Skip timestamp lines (contain --> or are just numbers in brackets)
                        if '-->' in line or line.startswith('[') and ']' in line:
                            # Extract text after the timestamp bracket
                            if ']' in line:
                                text_part = line.split(']', 1)
                                if len(text_part) > 1:
                                    text_content = text_part[1].strip()
                                    if text_content:
                                        text_lines.append(text_content)
                        else:
                            # Regular text line
                            text_lines.append(line)
                    
                    transcription = ' '.join(text_lines)
                    word_count = len(transcription.split()) if transcription else 0
                    
                    if transcription:
                        print(f"📝 Extracted transcription from stdout: {word_count} words")
                        print(f"🔍 First 200 chars: {transcription[:200]}...")
                        
                        # Always apply Pali corrections (they will only trigger if relevant words are found)
                        print("🔍 Applying Pali corrections to extracted transcription...")
                        original_transcription = transcription
                        transcription = apply_pali_corrections(transcription)
                        
                        # Check if any corrections were made
                        if transcription != original_transcription:
                            print("✅ Pali corrections were applied to extracted transcription!")
                            # Update word count after corrections
                            new_word_count = len(transcription.split())
                            if new_word_count != word_count:
                                print(f"📊 Word count changed from {word_count} to {new_word_count} after corrections")
                                word_count = new_word_count
                        else:
                            print("ℹ️ No Pali corrections were needed for extracted transcription")
                    else:
                        print("⚠️ Could not extract transcription from stdout")
                else:
                    print("⚠️ No stdout output to extract transcription from")
            
            # Similarly, find and read SRT file
            actual_srt_file = None
            if os.path.exists(srt_file):
                actual_srt_file = srt_file
                print(f"✅ Found expected SRT file: {srt_file}")
            elif srt_files:
                # Find the most recently created srt file
                srt_files_with_time = [(f, os.path.getctime(f)) for f in srt_files if os.path.exists(f)]
                if srt_files_with_time:
                    actual_srt_file = max(srt_files_with_time, key=lambda x: x[1])[0]
                    print(f"✅ Found recent SRT file: {actual_srt_file}")
            
            # Read SRT file for timestamps
            if actual_srt_file and os.path.exists(actual_srt_file):
                timestamps = self.parse_srt_file(actual_srt_file)
                print(f"⏰ Parsed {len(timestamps)} timestamp segments from {actual_srt_file}")
                
                # Clean up the SRT file
                try:
                    os.unlink(actual_srt_file)
                    print(f"🗑️ Cleaned up SRT file: {actual_srt_file}")
                except:
                    print(f"⚠️ Could not delete SRT file: {actual_srt_file}")
            else:
                print(f"⚠️ Warning: No SRT file found (expected {srt_file})")
            
            # Clean up trimmed audio file if it was created
            if preview_mode and processed_audio_path != audio_file_path:
                try:
                    os.unlink(processed_audio_path)
                except:
                    pass  # Ignore cleanup errors
            
            return {
                "success": True,
                "transcription": transcription,
                "word_count": word_count,
                "processing_time": processing_time,
                "preview_mode": preview_mode,
                "preview_duration": preview_duration if preview_mode else None,
                "timestamps": timestamps,
                "model": model,
                "language": language,
                "file_size_mb": file_size_mb,
                "estimated_time": time_estimate,
                "command": " ".join(command)
            }
        except subprocess.TimeoutExpired:
            # Clean up trimmed audio file if it was created
            if preview_mode and processed_audio_path != audio_file_path:
                try:
                    os.unlink(processed_audio_path)
                except:
                    pass
            
            return {
                "success": False,
                "error": f"Processing timed out after {timeout_seconds} seconds"
            }
        except subprocess.CalledProcessError as e:
            # Clean up trimmed audio file if it was created
            if preview_mode and processed_audio_path != audio_file_path:
                try:
                    os.unlink(processed_audio_path)
                except:
                    pass
            
            return {
                "success": False,
                "error": f"Whisper command failed: {e.stderr or str(e)}"
            }
        except Exception as e:
            # Clean up trimmed audio file if it was created
            if preview_mode and processed_audio_path != audio_file_path:
                try:
                    os.unlink(processed_audio_path)
                except:
                    pass
            
            return {
                "success": False,
                "error": str(e)
            }

    def parse_srt_file(self, srt_file_path):
        """Parse SRT file and extract timestamps with text segments"""
        timestamps = []
        
        try:
            with open(srt_file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                
            # Split into subtitle blocks
            blocks = content.split('\n\n')
            
            for block in blocks:
                if not block.strip():
                    continue
                    
                lines = block.strip().split('\n')
                if len(lines) < 3:
                    continue
                
                # Parse timestamp line (format: 00:00:00,000 --> 00:00:05,000)
                timestamp_line = lines[1]
                if '-->' not in timestamp_line:
                    continue
                
                start_time_str, end_time_str = timestamp_line.split(' --> ')
                
                # Convert timestamp to seconds
                start_seconds = self.timestamp_to_seconds(start_time_str.strip())
                end_seconds = self.timestamp_to_seconds(end_time_str.strip())
                
                # Get text (all lines after timestamp)
                text = ' '.join(lines[2:]).strip()
                
                timestamps.append({
                    'start': start_seconds,
                    'end': end_seconds,
                    'text': text
                })
                
        except Exception as e:
            print(f"Error parsing SRT file: {e}")
            
        return timestamps
    
    def timestamp_to_seconds(self, timestamp_str):
        """Convert SRT timestamp (HH:MM:SS,mmm) to seconds"""
        try:
            # Format: HH:MM:SS,mmm
            time_part, milliseconds = timestamp_str.split(',')
            hours, minutes, seconds = time_part.split(':')
            
            total_seconds = (
                int(hours) * 3600 +
                int(minutes) * 60 +
                int(seconds) +
                int(milliseconds) / 1000
            )
            
            return total_seconds
        except:
            return 0.0


def find_available_port(start_port=8765, max_attempts=10):
    """Find an available port starting from the given port"""
    import socket
    
    for port in range(start_port, start_port + max_attempts):
        try:
            # Test if port is available
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    
    return None


def main():
    # Find an available port (prefer 8765, but fall back to others if needed)
    preferred_port = 8765
    port = find_available_port(preferred_port)
    
    if port is None:
        print("❌ Error: No available ports found in range 8765-8774")
        print("💡 Try killing any existing Whisper server processes:")
        print("   lsof -ti:8765 | xargs kill -9")
        sys.exit(1)
    
    if port != preferred_port:
        print(f"⚠️ Port {preferred_port} is busy, using port {port} instead")
        print(f"💡 Update your frontend config to use http://localhost:{port}")
        print(f"💡 Or kill the existing process: lsof -ti:{preferred_port} | xargs kill -9")
    
    # Set up the server
    server_address = ('localhost', port)
    httpd = HTTPServer(server_address, WhisperRequestHandler)
    
    # Allow socket reuse to prevent "Address already in use" errors
    httpd.allow_reuse_address = True
    
    print(f"🎵 Whisper HTTP Server starting on http://localhost:{port}")
    print("✅ Ready to process audio files!")
    print("🔍 Preview mode supported - will process only first 60 seconds when enabled")
    print("📋 Endpoints:")
    print("   - GET  /health  - Health check")
    print("   - GET  /start   - Status check")  
    print("   - POST /process - Process audio file")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()


if __name__ == "__main__":
    main()
