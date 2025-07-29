#!/usr/bin/env python3
"""
Test Preview Mode Functionality
Tests that preview mode correctly limits audio processing to 60 seconds.
"""

import time
import requests
import os

def test_preview_mode():
    """Test preview mode functionality"""
    
    print("🔍 Testing Preview Mode Functionality...")
    print("=" * 50)
    
    server_url = "http://localhost:8765"
    
    # Check server health
    try:
        response = requests.get(f"{server_url}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Server not responding")
            return False
    except:
        print("❌ Cannot connect to server")
        return False
    
    print("✅ Server is running")
    
    # Create a test project
    try:
        project_data = {
            "name": f"Preview Mode Test {int(time.time())}",
            "assignedTo": "Test User"
        }
        
        response = requests.post(f"{server_url}/projects", json=project_data, timeout=10)
        if response.status_code not in [200, 201]:
            print(f"❌ Failed to create project: {response.status_code}")
            return False
            
        project = response.json()
        project_id = project["id"]
        print(f"✅ Created test project: {project_id}")
        
    except Exception as e:
        print(f"❌ Project creation failed: {e}")
        return False
    
    # Test preview mode with our test audio file
    try:
        audio_file_path = "test-preview-audio.wav"
        
        if not os.path.exists(audio_file_path):
            print(f"❌ Test audio file not found: {audio_file_path}")
            return False
        
        # Get original file size
        file_size = os.path.getsize(audio_file_path)
        file_size_mb = file_size / (1024 * 1024)
        print(f"📁 Test file: {audio_file_path} ({file_size_mb:.2f} MB)")
        
        # Upload and process with preview mode
        with open(audio_file_path, 'rb') as f:
            files = {'audio': f}
            data = {
                'projectId': project_id,
                'model': 'tiny',  # Use fastest model for testing
                'language': 'English',
                'preview': 'true',
                'previewDuration': '60'
            }
            
            print("🚀 Starting preview mode transcription...")
            start_time = time.time()
            
            response = requests.post(f"{server_url}/process", files=files, data=data, timeout=300)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            print(f"⏱️ Processing completed in {processing_time:.1f} seconds")
            
            if response.status_code != 200:
                print(f"❌ Processing failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
            
            result = response.json()
            
            # Validate preview mode results
            if not result.get("success"):
                print(f"❌ Processing failed: {result.get('error', 'Unknown error')}")
                return False
            
            if not result.get("preview_mode"):
                print("❌ Preview mode flag not set - may not have processed as preview")
                return False
            
            word_count = result.get("word_count", 0)
            transcription_length = len(result.get("transcription", ""))
            
            print(f"✅ Preview mode confirmed")
            print(f"📝 Word count: {word_count}")
            print(f"📝 Transcription length: {transcription_length} characters")
            print(f"⏱️ Processing time: {result.get('processing_time', processing_time):.1f}s")
            
            # For a 120-second audio file, preview mode should be significantly faster
            if processing_time > 120:
                print("⚠️ Warning: Preview mode took longer than expected")
                return False
            
            print("✅ Preview mode test PASSED")
            return True
            
    except Exception as e:
        print(f"❌ Preview mode test failed: {e}")
        return False
    
    finally:
        # Clean up test project
        try:
            requests.delete(f"{server_url}/projects/{project_id}", timeout=10)
            print(f"🗑️ Cleaned up test project: {project_id}")
        except:
            pass

def test_production_readiness():
    """Test for production-ready setup - checks issues user reported"""
    print("\n🏭 Testing Production Readiness...")
    print("-" * 40)
    
    server_url = "http://localhost:8765"
    
    # Test 1: Check for favicon.ico
    try:
        response = requests.get(f"{server_url}/favicon.ico", timeout=5)
        if response.status_code == 404:
            print("❌ Missing favicon.ico - causes 404 errors in browser")
            return False
        elif response.status_code == 200:
            print("✅ favicon.ico served successfully")
        else:
            print(f"⚠️ favicon.ico returned status {response.status_code}")
    except Exception as e:
        print(f"❌ favicon.ico test failed: {e}")
        return False
    
    # Test 2: Check for Tailwind CDN usage (production warning)
    test_pages = ["/", "/index.html", "/index-server.html"]
    
    for page in test_pages:
        try:
            response = requests.get(f"{server_url}{page}", timeout=5)
            if response.status_code == 200:
                html_content = response.text
                
                if 'cdn.tailwindcss.com' in html_content:
                    print(f"❌ {page} uses Tailwind CDN - will show production warning")
                    print("   This causes: 'cdn.tailwindcss.com should not be used in production'")
                    return False
                else:
                    print(f"✅ {page} uses local CSS (no CDN warnings)")
            
        except Exception as e:
            print(f"❌ CDN check failed for {page}: {e}")
            return False
    
    print("✅ Production readiness test PASSED")
    return True

if __name__ == "__main__":
    success = test_preview_mode() and test_production_readiness()
    exit(0 if success else 1)
