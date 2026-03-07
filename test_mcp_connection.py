#!/usr/bin/env python3
"""
Test MCP server connection with dummy data
"""
import json
import os
import sys

# Try to import websocket-client
try:
    from websocket import create_connection
    print("✅ websocket-client library is available")
except ImportError:
    print("❌ websocket-client library is NOT available")
    print("   Run: pip install websocket-client>=1.8.0")
    sys.exit(1)

# Configuration
MCP_SERVER_WS_URL = os.environ.get("MCP_SERVER_WS_URL", "ws://localhost:4000")
TIMEOUT = 120  # seconds - increased for LLM processing

print(f"\n{'='*60}")
print(f"🔌 Testing MCP Server Connection")
print(f"   URL: {MCP_SERVER_WS_URL}")
print(f"   Timeout: {TIMEOUT}s")
print(f"{'='*60}\n")

# Test 1: Metadata Extraction Agent
print("📤 TEST 1: Metadata Extraction Agent")
print("-" * 60)

metadata_request = {
    "jsonrpc": "2.0",
    "id": "test-metadata-1",
    "method": "tools/invoke",
    "params": {
        "agentId": "metadata-extraction-agent",
        "toolName": "extract_metadata",
        "arguments": {
            "text": "Dear Friends,\n\nThis is a teaching about mindfulness and compassion in daily life.\n\nThe Buddha taught that mindfulness is the path to liberation. Through awareness of our thoughts, feelings, and actions, we can cultivate wisdom and compassion.\n\nMay all beings be happy and free from suffering.\n\nWith metta,\nVenerable Teacher",
            "model": "ollama",
            "output_type": "pala"
        }
    }
}

print(f"Request payload:")
print(json.dumps(metadata_request, indent=2))
print()

try:
    ws = create_connection(MCP_SERVER_WS_URL, timeout=TIMEOUT)
    print("✅ WebSocket connection established")
    
    ws.send(json.dumps(metadata_request, ensure_ascii=False))
    print("✅ Request sent")
    
    response = ws.recv()
    ws.close()
    
    result = json.loads(response)
    print("✅ Response received:")
    print(json.dumps(result, indent=2))
    
    if "error" in result:
        print(f"\n❌ MCP returned error: {result['error']}")
    elif "result" in result:
        print(f"\n✅ Metadata extraction successful!")
        print(f"   Result keys: {list(result['result'].keys()) if isinstance(result['result'], dict) else type(result['result'])}")
    else:
        print(f"\n⚠️ Unexpected response format")
        
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60 + "\n")

# Test 2: Storage Agent
print("📤 TEST 2: Storage Agent")
print("-" * 60)

storage_request = {
    "jsonrpc": "2.0",
    "id": "test-storage-1",
    "method": "tools/invoke",
    "params": {
        "agentId": "storage-agent",
        "toolName": "store_document",
        "arguments": {
            "type": "ocr",
            "original_file": "test-audio.mp3",
            "file_format": "mp3",
            "processed_data": {
                "transcription": "Test transcription text",
                "approved_text": "Test approved text"
            },
            "metadata": {
                "title": "Test Document",
                "language": "en",
                "category": "teaching"
            },
            "app_data": {
                "project_id": "test-project-123",
                "project_name": "Test Project",
                "approved_by": "Test User",
                "approved_date": "2026-03-03T14:00:00Z"
            },
            "created_by": "web-dashboard"
        }
    }
}

print(f"Request payload:")
print(json.dumps(storage_request, indent=2))
print()

try:
    ws = create_connection(MCP_SERVER_WS_URL, timeout=TIMEOUT)
    print("✅ WebSocket connection established")
    
    ws.send(json.dumps(storage_request, ensure_ascii=False))
    print("✅ Request sent")
    
    response = ws.recv()
    ws.close()
    
    result = json.loads(response)
    print("✅ Response received:")
    print(json.dumps(result, indent=2))
    
    if "error" in result:
        print(f"\n❌ MCP returned error: {result['error']}")
    elif "result" in result:
        print(f"\n✅ Storage successful!")
        print(f"   Result keys: {list(result['result'].keys()) if isinstance(result['result'], dict) else type(result['result'])}")
    else:
        print(f"\n⚠️ Unexpected response format")
        
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("🏁 MCP Connection Test Complete")
print("="*60 + "\n")
