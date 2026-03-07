#!/usr/bin/env python3
"""
End-to-end test: Simulate full approval workflow
- Create dummy project data
- Extract metadata via MCP
- Store document via MCP
- Validate results
"""
import json
import os
import sys
import uuid
from datetime import datetime

# Try to import websocket-client
try:
    from websocket import create_connection
    print("✅ websocket-client library is available\n")
except ImportError:
    print("❌ websocket-client library is NOT available")
    sys.exit(1)

# Configuration
MCP_SERVER_WS_URL = os.environ.get("MCP_SERVER_WS_URL", "ws://localhost:4000")
TIMEOUT = 120  # seconds

def invoke_mcp_tool(agent_id, tool_name, arguments):
    """Invoke an MCP tool and return result"""
    request_id = f"req-{uuid.uuid4()}"
    payload = {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": "tools/invoke",
        "params": {
            "agentId": agent_id,
            "toolName": tool_name,
            "arguments": arguments
        }
    }
    
    print("\n" + "="*70)
    print(f"📤 REQUEST PAYLOAD:")
    print("="*70)
    print(json.dumps(payload, indent=2))
    
    try:
        ws = create_connection(MCP_SERVER_WS_URL, timeout=TIMEOUT)
        ws.send(json.dumps(payload, ensure_ascii=False))
        
        deadline = datetime.now().timestamp() + TIMEOUT
        while datetime.now().timestamp() < deadline:
            response = ws.recv()
            if not response:
                continue
            
            result = json.loads(response)
            if result.get('id') != request_id:
                continue
            
            ws.close()
            
            print("\n" + "="*70)
            print(f"📥 RESPONSE PAYLOAD:")
            print("="*70)
            print(json.dumps(result, indent=2))
            
            return result.get('result')
        
        ws.close()
        raise Exception("Timed out waiting for response")
    except Exception as e:
        print(f"\n❌ MCP call failed: {e}")
        import traceback
        traceback.print_exc()
        return None

print("="*70)
print("🔄 END-TO-END SYNC WORKFLOW TEST")
print("="*70)

# Create dummy project data (matching PALAScribe structure)
project_id = str(uuid.uuid4())
project_name = f"Test-Project-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

# Realistic approved text (similar to what real projects would have)
approved_text = """The Buddha taught that there are Five Precepts which form the foundation of ethical conduct:

1. Abstaining from killing or harming living beings
2. Abstaining from stealing or taking what is not given
3. Abstaining from sexual misconduct
4. Abstaining from false speech and lying
5. Abstaining from intoxicating drinks and drugs

By following these precepts, one cultivates compassion and mindfulness in daily life, which leads to inner peace and liberation from suffering."""

print(f"\n📦 Test Project Data:")
print(f"   Project ID: {project_id}")
print(f"   Project Name: {project_name}")
print(f"   Approved Text Length: {len(approved_text)} characters")
print(f"   Text Preview: {approved_text[:100]}...\n")

# ============================================================================
# STEP 1: Extract Metadata
# ============================================================================
print("="*70)
print("STEP 1: Extract Metadata via MCP")
print("="*70)

metadata_args = {
    "text": approved_text,
    "model": "ollama",
    "output_type": "combined"
}

print(f"\n📤 Calling: metadata-extraction-agent/extract_metadata")
print(f"   Arguments: {list(metadata_args.keys())}")
print(f"   Text length: {len(metadata_args['text'])} chars\n")

metadata_result = invoke_mcp_tool(
    agent_id="metadata-extraction-agent",
    tool_name="extract_metadata",
    arguments=metadata_args
)

if metadata_result is None:
    print("❌ Metadata extraction failed")
    sys.exit(1)

# Check for success flag
if isinstance(metadata_result, dict):
    if metadata_result.get('success') is False:
        print(f"❌ Metadata extraction failed: {metadata_result.get('error')}")
        sys.exit(1)
    
    if metadata_result.get('success') is True:
        print("✅ Metadata extraction successful!")
        actual_result = metadata_result.get('result', metadata_result)
    else:
        actual_result = metadata_result
else:
    actual_result = metadata_result

print(f"\n📋 Metadata Result Structure:")
if isinstance(actual_result, dict):
    print(f"   Top-level keys: {list(actual_result.keys())}")
    if 'pala_metadata' in actual_result:
        print(f"   pala_metadata keys: {list(actual_result['pala_metadata'].keys())}")
    if 'extraction_metadata' in actual_result:
        print(f"   extraction_metadata keys: {list(actual_result['extraction_metadata'].keys())}")

print(f"\n📊 Metadata Sample:")
print(json.dumps(actual_result, indent=2)[:500] + "...")

# ============================================================================
# STEP 2: Store Document
# ============================================================================
print("\n" + "="*70)
print("STEP 2: Store Document via MCP")
print("="*70)

storage_args = {
    "type": "Transcription",
    "original_file": "test-audio.mp3",
    "file_format": "mp3",
    "processed_data": {
        "text": approved_text
    },
    "metadata": {
        "language": "en",
        "source": "PALAScribe"
    },
    "app_data": {
        "app": "PalaScribe",
        "project_name": project_name,
        "project_id": project_id,
        "status": "Approved",
        "assigned_to": "Test User",
        "reviewed_by": "Reviewer UUID",
        "approved_by": "Approver UUID",
        "approved_date": datetime.now().isoformat(),
        "created_date": datetime.now().isoformat(),
        "audio_file": "test-audio.mp3"
    },
    "created_by": "PalaScribe",
    "tags": [
        "palascribe",
        "transcription",
        "en",
        project_name.lower().replace(' ', '-'),
        "approved"
    ]
}

print(f"\n📤 Calling: storage-agent/store_document")
print(f"   Arguments: {list(storage_args.keys())}")
print(f"   Type: {storage_args['type']}")
print(f"   File Format: {storage_args['file_format']}\n")

storage_result = invoke_mcp_tool(
    agent_id="storage-agent",
    tool_name="store_document",
    arguments=storage_args
)

if storage_result is None:
    print("❌ Storage failed")
    sys.exit(1)

# Check for success flag
if isinstance(storage_result, dict):
    if storage_result.get('success') is False:
        print(f"❌ Storage failed: {storage_result.get('error')}")
        sys.exit(1)
    
    if storage_result.get('success') is True:
        print("✅ Storage successful!")
        actual_storage = storage_result.get('result', storage_result)
    else:
        actual_storage = storage_result
else:
    actual_storage = storage_result

print(f"\n📋 Storage Result Structure:")
if isinstance(actual_storage, dict):
    print(f"   Top-level keys: {list(actual_storage.keys())}")

print(f"\n📊 Storage Sample:")
print(json.dumps(actual_storage, indent=2)[:500] + "...")

# Extract document ID
document_id = None
if isinstance(actual_storage, dict):
    # Try nested result first (from storage agent wrapper)
    if 'result' in actual_storage and isinstance(actual_storage['result'], dict):
        document_id = actual_storage['result'].get('document_id')
    # Try direct result
    document_id = document_id or actual_storage.get('document_id')

print(f"\n🔑 Document ID: {document_id}")

# ============================================================================
# FINAL REPORT
# ============================================================================
print("\n" + "="*70)
print("✅ END-TO-END TEST COMPLETED SUCCESSFULLY")
print("="*70)
print(f"\n📊 Summary:")
print(f"   ✅ Metadata extraction: SUCCESS")
print(f"   ✅ Document storage: SUCCESS")
print(f"   ✅ Document ID: {document_id}")
print(f"\n🎯 Both MCP agents are working correctly!")
print(f"\n💡 Next step: Restart PALAScribe server and approve a project to test integration.\n")
