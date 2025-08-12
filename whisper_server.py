#!/usr/bin/env python3
"""
Simple Whisper HTTP Server - Python 3.12+ Compatible
Provides HTTP API for the audio-to-text converter web interface
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
import re

class WhisperRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.handle_health_check()
        elif self.path == '/start':
            self.handle_start_request()
        else:
            self.send_error(404, "Not Found")

    def do_POST(self):
        """Handle POST requests for audio processing"""
        if self.path == '/process':
            self.handle_audio_processing()
        else:
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

    def parse_multipart_form_data(self, content, boundary):
        """Simple multipart form data parser"""
        parts = content.split(f'--{boundary}'.encode())
        form_data = {}
        
        for part in parts:
            if b'Content-Disposition: form-data' not in part:
                continue
                
            # Split headers and content
            if b'\r\n\r\n' in part:
                headers, content_part = part.split(b'\r\n\r\n', 1)
                content_part = content_part.rstrip(b'\r\n--')
            else:
                continue
                
            headers_str = headers.decode('utf-8', errors='ignore')
            
            # Extract name from Content-Disposition
            name_match = re.search(r'name="([^"]*)"', headers_str)
            if not name_match:
                continue
                
            field_name = name_match.group(1)
            
            # Check if it's a file
            filename_match = re.search(r'filename="([^"]*)"', headers_str)
            if filename_match:
                filename = filename_match.group(1)
                form_data[field_name] = {
                    'type': 'file',
                    'filename': filename,
                    'content': content_part
                }
            else:
                # Regular form field
                form_data[field_name] = {
                    'type': 'field',
                    'value': content_part.decode('utf-8', errors='ignore')
                }
        
        return form_data

    def handle_audio_processing(self):
        """Process uploaded audio file with Whisper"""
        try:
            # Get content type and boundary
            content_type = self.headers.get('content-type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_error(400, "Expected multipart/form-data")
                return

            # Extract boundary
            boundary_match = re.search(r'boundary=([^;]+)', content_type)
            if not boundary_match:
                self.send_error(400, "No boundary found in content-type")
                return
                
            boundary = boundary_match.group(1).strip()

            # Read the content
            content_length = int(self.headers.get('content-length', 0))
            if content_length == 0:
                self.send_error(400, "No content provided")
                return
                
            content = self.rfile.read(content_length)

            # Parse multipart form data
            form_data = self.parse_multipart_form_data(content, boundary)
            
            # Get the audio file
            if 'audio' not in form_data or form_data['audio']['type'] != 'file':
                self.send_error(400, "No audio file provided")
                return

            audio_data = form_data['audio']
            if not audio_data['filename']:
                self.send_error(400, "No audio file selected")
                return

            # Get optional parameters
            model = form_data.get('model', {}).get('value', 'medium')
            language = form_data.get('language', {}).get('value', 'English')
            preview_mode = form_data.get('preview', {}).get('value', 'false').lower() == 'true'
            preview_duration = int(form_data.get('preview_duration', {}).get('value', '60'))
            
            print(f"📝 Received parameters:")
            print(f"  - Model: {model}")
            print(f"  - Language: {language}")
            print(f"  - Preview mode: {preview_mode}")
            print(f"  - Preview duration: {preview_duration}")
            print(f"  - Audio filename: {audio_data['filename']}")

            # Save uploaded file to temporary location
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
                temp_file.write(audio_data['content'])
                temp_audio_path = temp_file.name

            try:
                # Process with Whisper
                result = self.execute_whisper_command(temp_audio_path, model, language, preview_mode, preview_duration)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = json.dumps({
                    'success': True,
                    'transcription': result['transcription'],
                    'file_info': {
                        'filename': audio_data['filename'],
                        'model': model,
                        'language': language,
                        'preview_mode': preview_mode
                    },
                    'processing_time': result.get('processing_time', 0),
                    'timestamp': time.time()
                })
                
                self.wfile.write(response.encode('utf-8'))
                
            except Exception as process_error:
                print(f"❌ Processing error: {process_error}")
                
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = json.dumps({
                    'success': False,
                    'error': str(process_error),
                    'timestamp': time.time()
                })
                self.wfile.write(response.encode('utf-8'))
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_audio_path)
                except:
                    pass
                    
        except Exception as e:
            print(f"❌ Request handling error: {e}")
            self.send_error(500, f"Processing failed: {str(e)}")

    def execute_whisper_command(self, audio_file_path, model="medium", language="English", preview_mode=False, preview_duration=60):
        """Execute Whisper processing using Python API instead of command line"""
        
        print(f"🎤 Processing audio file: {audio_file_path}")
        print(f"📊 Model: {model}, Language: {language}")
        
        # If preview mode is enabled, create a trimmed version of the audio
        processed_audio_path = audio_file_path
        if preview_mode:
            print(f"🔍 Preview mode enabled - processing only first {preview_duration} seconds")
            processed_audio_path = self.trim_audio_file(audio_file_path, preview_duration)
        
        start_time = time.time()
        
        try:
            # Import whisper here to check if it's available
            import whisper
            
            # Estimate processing time
            file_size_mb = os.path.getsize(processed_audio_path) / (1024 * 1024)
            estimated_minutes = max(1, int(file_size_mb * 0.5))  # Rough estimate
            
            if preview_mode:
                estimated_minutes = max(1, int(estimated_minutes * 0.2))  # Preview is much faster
            
            print(f"⏱️  Estimated processing time: {estimated_minutes} minute(s)")
            
            mode_text = f" (Preview: {preview_duration}s)" if preview_mode else ""
            print(f"🚀 Starting Whisper processing{mode_text}...")
            print(f"💻 Using Python API with model: {model}")
            
            # Load Whisper model
            print(f"📥 Loading Whisper model '{model}'...")
            whisper_model = whisper.load_model(model)
            
            # Transcribe audio
            print(f"🎵 Transcribing audio...")
            result = whisper_model.transcribe(processed_audio_path, language=language.lower() if language != "English" else None)
            
            processing_time = time.time() - start_time
            
            # Get transcription text
            transcription = result["text"].strip()
            
            # Clean up temporary files
            try:
                if preview_mode and processed_audio_path != audio_file_path:
                    os.unlink(processed_audio_path)
            except:
                pass
            
            print(f"✅ Transcription completed in {processing_time:.1f} seconds")
            print(f"📝 Generated {len(transcription)} characters")
            
            return {
                'transcription': transcription,
                'processing_time': processing_time,
                'model': model,
                'language': language,
                'preview_mode': preview_mode
            }
            
        except ImportError:
            raise Exception("Whisper module not found. Please install with: pip install openai-whisper")
        except Exception as e:
            processing_time = time.time() - start_time
            print(f"❌ Processing failed after {processing_time:.1f} seconds: {e}")
            raise

    def trim_audio_file(self, audio_file_path, duration_seconds):
        """Trim audio file to specified duration using ffmpeg"""
        try:
            # Create output path for trimmed file
            base_name = os.path.splitext(audio_file_path)[0]
            trimmed_path = f"{base_name}_trimmed.mp3"
            
            # Use ffmpeg to trim audio
            cmd = [
                'ffmpeg', '-y',  # -y to overwrite output file
                '-i', audio_file_path,
                '-t', str(duration_seconds),  # Duration in seconds
                '-c', 'copy',  # Copy codec (faster)
                trimmed_path
            ]
            
            print(f"✂️  Trimming audio to {duration_seconds} seconds...")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                print(f"⚠️  ffmpeg warning: {result.stderr}")
                # If ffmpeg fails, use the original file
                return audio_file_path
            
            print(f"✅ Audio trimmed successfully")
            return trimmed_path
            
        except Exception as e:
            print(f"⚠️  Audio trimming failed: {e}")
            # Return original file if trimming fails
            return audio_file_path

def main():
    """Main function to start the server"""
    
    print("🎤 Starting Whisper HTTP Server...")
    
    # Check if whisper is available
    try:
        result = subprocess.run(['whisper', '--help'], capture_output=True, timeout=10)
        if result.returncode != 0:
            print("❌ Whisper command not found. Please install with: pip install openai-whisper")
            sys.exit(1)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Whisper command not found. Please install with: pip install openai-whisper")
        sys.exit(1)
    
    # Start HTTP server
    server_address = ('0.0.0.0', 8765)#for listening on all ip
    httpd = HTTPServer(server_address, WhisperRequestHandler)
    
    print(f"📡 Server running at http://{server_address[0]}:{server_address[1]}")
    print("✅ Whisper backend ready for requests")
    print("🔄 Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.shutdown()

if __name__ == '__main__':
    main()
