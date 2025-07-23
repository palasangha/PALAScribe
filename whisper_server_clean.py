#!/usr/bin/env python3
"""
Local Whisper HTTP Server - Clean Version
Provides HTTP API for the audio-to-text converter web interface
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
        """Parse multipart form data"""
        try:
            # Read all content
            content = fp.read()
            if isinstance(content, bytes):
                content_str = content.decode('utf-8', errors='ignore')
            else:
                content_str = str(content)
            
            # Split by boundary
            boundary_str = '--' + boundary
            parts = content_str.split(boundary_str)
            
            for part in parts:
                if 'Content-Disposition:' in part:
                    self._parse_part(part.strip())
                    
        except Exception as e:
            print(f"Error parsing multipart data: {e}")
    
    def _parse_part(self, part):
        """Parse individual part of multipart data"""
        try:
            lines = part.split('\n')
            headers = {}
            content_start = 0
            
            # Parse headers
            for i, line in enumerate(lines):
                line = line.strip()
                if not line:
                    content_start = i + 1
                    break
                if ':' in line:
                    key, value = line.split(':', 1)
                    headers[key.strip().lower()] = value.strip()
            
            # Get content
            content_lines = lines[content_start:]
            content = '\n'.join(content_lines)
            
            # Parse Content-Disposition header
            disposition = headers.get('content-disposition', '')
            field_name = None
            filename = None
            
            if 'name=' in disposition:
                # Extract field name
                parts = disposition.split('name=')
                if len(parts) > 1:
                    name_part = parts[1].split(';')[0].strip().strip('"')
                    field_name = name_part
            
            if 'filename=' in disposition:
                # Extract filename
                parts = disposition.split('filename=')
                if len(parts) > 1:
                    filename_part = parts[1].split(';')[0].strip().strip('"')
                    filename = filename_part
            
            # Store the field
            if field_name:
                if filename:
                    # It's a file upload
                    file_obj = SimpleFileField(filename, content.encode('latin-1') if content else b'')
                    self.file_objects[field_name] = file_obj
                else:
                    # It's a regular form field
                    self.fields[field_name] = content.strip()
                    
        except Exception as e:
            print(f"Error parsing form part: {e}")
    
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
        self.content = content
        self.file = BytesIO(content)
    
    def read(self):
        return self.content


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
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

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

    def handle_audio_processing(self):
        """Process uploaded audio file with Whisper"""
        try:
            # Parse multipart form data
            content_type = self.headers['content-type']
            if not content_type or not content_type.startswith('multipart/form-data'):
                self.send_error(400, "Expected multipart/form-data")
                return

            # Parse the form data using our custom parser
            form = SimpleFieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'}
            )

            # Get the audio file
            if 'audio' not in form:
                self.send_error(400, "No audio file provided")
                return

            audio_field = form['audio']
            if not audio_field.filename:
                self.send_error(400, "No audio file selected")
                return

            # Get optional parameters
            model = form.getvalue('model', 'medium')
            language = form.getvalue('language', 'English')
            preview_mode = form.getvalue('preview', 'false').lower() == 'true'
            preview_duration = int(form.getvalue('preview_duration', '60'))
            
            print(f"📝 Received parameters:")
            print(f"  - Model: {model}")
            print(f"  - Language: {language}")
            print(f"  - Preview mode: {preview_mode}")
            print(f"  - Preview duration: {preview_duration}")
            print(f"  - Audio filename: {audio_field.filename}")

            # Save uploaded file to temporary location
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
                audio_content = audio_field.read()
                temp_file.write(audio_content)
                temp_audio_path = temp_file.name

            try:
                # Process with Whisper
                result = self.execute_whisper_command(temp_audio_path, model, language, preview_mode, preview_duration)
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = json.dumps(result)
                self.wfile.write(response.encode('utf-8'))

            finally:
                # Clean up temporary file
                if os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)

        except Exception as e:
            print(f"Server error: {str(e)}")
            self.send_error(500, f"Server error: {str(e)}")

    def trim_audio_file(self, audio_file_path, duration_seconds):
        """Trim audio file to specified duration using ffmpeg"""
        try:
            # Create a new temporary file for the trimmed audio
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as trimmed_file:
                trimmed_path = trimmed_file.name
            
            # Use ffmpeg to trim the audio file
            command = [
                'ffmpeg', 
                '-i', audio_file_path,
                '-t', str(duration_seconds),
                '-c', 'copy',  # Copy without re-encoding for speed
                '-y',  # Overwrite output file
                trimmed_path
            ]
            
            print(f"🎵 Trimming audio with command: {' '.join(command)}")
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=True,
                timeout=30  # Should be fast for trimming
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
        project_dir = "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter"
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
            # For preview mode, use shorter timeout
            timeout_seconds = 300 if preview_mode else 1800  # 5 minutes for preview, 30 minutes for full
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
            
            # Find the generated text and SRT files
            audio_name = Path(processed_audio_path).stem
            text_file = f"{audio_name}.txt"
            srt_file = f"{audio_name}.srt"
            
            transcription = ""
            word_count = 0
            timestamps = []
            
            # Read plain text transcription
            if os.path.exists(text_file):
                with open(text_file, 'r', encoding='utf-8') as f:
                    transcription = f.read()
                    word_count = len(transcription.split())
                
                print(f"📝 Generated transcription: {word_count} words")
                
                # Clean up the generated text file
                os.unlink(text_file)
            else:
                print(f"⚠️ Warning: Expected text file {text_file} not found")
            
            # Read SRT file for timestamps
            if os.path.exists(srt_file):
                timestamps = self.parse_srt_file(srt_file)
                print(f"⏰ Parsed {len(timestamps)} timestamp segments from SRT")
                
                # Clean up the SRT file
                os.unlink(srt_file)
            else:
                print(f"⚠️ Warning: Expected SRT file {srt_file} not found")
            
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


def main():
    # Set up the server
    port = 8765  # Port that the frontend expects
    server_address = ('localhost', port)
    httpd = HTTPServer(server_address, WhisperRequestHandler)
    
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
