#!/usr/bin/env python3
"""
Local Whisper Backend Service
Executes Whisper commands and returns results to the web interface
"""

import sys
import os
import subprocess
import json
import time
from pathlib import Path

def execute_whisper_command(audio_file_path, model="medium", language="English"):
    """Execute Whisper command and return results"""
    
    # Determine project directory (configurable via env var)
    project_dir = os.environ.get(
        "AUDIO_TEXT_CONVERTER_DIR",
        "/Users/vijayaraghavanvedantham/Documents/VRI Tech Projects/audio-text-converter",
    )
    if not os.path.exists(project_dir):
        # Fall back to the directory containing this script
        project_dir = os.path.dirname(os.path.abspath(__file__))
    
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
        audio_file_path,
        "--model", model,
        "--output_format", "txt",
        "--language", language
    ]
    
    start_time = time.time()
    
    try:
        # Execute the command
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            check=True,
            cwd=project_dir
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Find the generated text file
        audio_name = Path(audio_file_path).stem
        text_file = f"{audio_name}.txt"
        
        transcription = ""
        word_count = 0
        
        if os.path.exists(text_file):
            with open(text_file, 'r', encoding='utf-8') as f:
                transcription = f.read()
                word_count = len(transcription.split())
        
        return {
            "success": True,
            "transcription": transcription,
            "word_count": word_count,
            "processing_time": processing_time,
            "output_file": text_file,
            "audio_file": audio_file_path
        }
        
    except subprocess.CalledProcessError as e:
        return {
            "success": False,
            "error": e.stderr,
            "command": " ".join(command)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Usage: whisper_backend.py <audio_file_path>"}))
        sys.exit(1)
    
    audio_file_path = sys.argv[1]
    
    if not os.path.exists(audio_file_path):
        print(json.dumps({"success": False, "error": f"Audio file not found: {audio_file_path}"}))
        sys.exit(1)
    
    result = execute_whisper_command(audio_file_path)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
