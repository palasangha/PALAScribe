#!/usr/bin/env python3
"""
Static File Serving Test
Tests that would have caught the missing static file functionality
"""

import requests
import time
import sys

def test_static_file_serving():
    """Test that static files are properly served"""
    base_url = 'http://localhost:8765'
    
    # Test files that should be served
    static_files = [
        '/index-server.html',
        '/index.html', 
        '/js/project-manager-server.js',
        '/js/ui-controller-fixed.js',
        '/js/config.js',
        '/css/styles.css'
    ]
    
    print("🧪 Testing static file serving...")
    
    for file_path in static_files:
        try:
            response = requests.get(f"{base_url}{file_path}", timeout=5)
            
            if response.status_code == 200:
                print(f"✅ {file_path} - Served successfully ({len(response.content)} bytes)")
            else:
                print(f"❌ {file_path} - Failed with status {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ {file_path} - Error: {e}")
            return False
    
    return True

def test_production_readiness():
    """Test for production-ready setup - no CDN warnings, proper favicon, etc."""
    base_url = 'http://localhost:8765'
    
    print("🏭 Testing production readiness...")
    
    # Test 1: Check for favicon.ico
    try:
        response = requests.get(f"{base_url}/favicon.ico", timeout=5)
        if response.status_code == 404:
            print("❌ Missing favicon.ico - will cause 404 errors in browser")
            return False
        elif response.status_code == 200:
            print("✅ favicon.ico served successfully")
        else:
            print(f"⚠️ favicon.ico returned status {response.status_code}")
    except Exception as e:
        print(f"❌ favicon.ico test failed: {e}")
        return False
    
    # Test 2: Check for Tailwind CDN usage (production warning)
    try:
        response = requests.get(f"{base_url}/index-server.html", timeout=5)
        html_content = response.text
        
        if 'cdn.tailwindcss.com' in html_content:
            print("❌ Using Tailwind CDN - will show production warning in browser")
            print("   Recommendation: Install Tailwind CSS locally for production")
            return False
        else:
            print("✅ No CDN-based CSS frameworks detected")
            
    except Exception as e:
        print(f"❌ CDN check failed: {e}")
        return False
    
    # Test 3: Check for other common production issues
    try:
        response = requests.get(f"{base_url}/index-server.html", timeout=5)
        html_content = response.text
        
        # Check for console.log statements (should be removed in production)
        if 'console.log' in html_content:
            print("⚠️ Warning: console.log statements found in HTML")
        
        # Check for proper meta tags
        if '<meta charset=' not in html_content:
            print("⚠️ Warning: Missing charset meta tag")
        
        if 'viewport' not in html_content:
            print("⚠️ Warning: Missing viewport meta tag")
            
        print("✅ Basic production checks completed")
        
    except Exception as e:
        print(f"❌ Production checks failed: {e}")
        return False
    
    return True

def test_html_loads_dependencies():
    """Test that HTML files contain proper script/css references"""
    base_url = 'http://localhost:8765'
    
    try:
        response = requests.get(f"{base_url}/index-server.html")
        html_content = response.text
        
        # Check for essential dependencies
        required_scripts = [
            'js/config.js',
            'js/project-manager-server.js', 
            'js/ui-controller-fixed.js'
        ]
        
        required_styles = [
            'css/styles.css'
        ]
        
        print("🧪 Testing HTML dependency loading...")
        
        for script in required_scripts:
            if script in html_content:
                print(f"✅ Script reference found: {script}")
            else:
                print(f"❌ Missing script reference: {script}")
                return False
        
        for style in required_styles:
            if style in html_content:
                print(f"✅ Style reference found: {style}")
            else:
                print(f"❌ Missing style reference: {style}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ HTML dependency test failed: {e}")
        return False

def test_ui_elements_present():
    """Test that essential UI elements are present in the HTML"""
    base_url = 'http://localhost:8765'
    
    try:
        response = requests.get(f"{base_url}/index-server.html")
        html_content = response.text
        
        print("🧪 Testing UI element presence...")
        
        # Essential UI elements that should be present
        required_elements = [
            # Processing cancel buttons
            'btn-cancel-processing',
            'btn-cancel-background-processing',
            
            # Status indicators
            'processing-status-indicator',
            'processing-status-text',
            'processing-status-bar',
            
            # Project modal
            'new-project-modal',
            'btn-close-modal',
            'btn-cancel-create',
            
            # Main functionality
            'create-project-form',
            'project-name',
            'project-assigned-to'
        ]
        
        missing_elements = []
        
        for element_id in required_elements:
            if f'id="{element_id}"' in html_content:
                print(f"✅ Element found: {element_id}")
            else:
                print(f"❌ Missing element: {element_id}")
                missing_elements.append(element_id)
        
        if missing_elements:
            print(f"❌ Missing {len(missing_elements)} required UI elements: {missing_elements}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ UI elements test failed: {e}")
        return False

def test_complete_page_load():
    """Test that a complete page load would work"""
    base_url = 'http://localhost:8765'
    
    print("🧪 Testing complete page load simulation...")
    
    # 1. Load main HTML
    try:
        html_response = requests.get(f"{base_url}/index-server.html")
        if html_response.status_code != 200:
            print(f"❌ HTML load failed: {html_response.status_code}")
            return False
        print("✅ HTML loaded successfully")
        
        # 2. Load CSS (browser would do this automatically)
        css_response = requests.get(f"{base_url}/css/styles.css")
        if css_response.status_code != 200:
            print(f"❌ CSS load failed: {css_response.status_code}")
            return False
        print("✅ CSS loaded successfully")
        
        # 3. Load JavaScript files (browser would do this automatically)
        js_files = [
            '/js/config.js',
            '/js/project-manager-server.js',
            '/js/ui-controller-fixed.js'
        ]
        
        for js_file in js_files:
            js_response = requests.get(f"{base_url}{js_file}")
            if js_response.status_code != 200:
                print(f"❌ JS load failed: {js_file} - {js_response.status_code}")
                return False
            print(f"✅ JavaScript loaded successfully: {js_file}")
        
        # 4. Test API endpoint (JavaScript would call this)
        api_response = requests.get(f"{base_url}/health")
        if api_response.status_code != 200:
            print(f"❌ API call failed: {api_response.status_code}")
            return False
        print("✅ API endpoint accessible")
        
        return True
        
    except Exception as e:
        print(f"❌ Complete page load test failed: {e}")
        return False
    """Test that a complete page load would work"""
    base_url = 'http://localhost:8765'
    
    print("🧪 Testing complete page load simulation...")
    
    # 1. Load main HTML
    try:
        html_response = requests.get(f"{base_url}/index-server.html")
        if html_response.status_code != 200:
            print(f"❌ HTML load failed: {html_response.status_code}")
            return False
        print("✅ HTML loaded successfully")
        
        # 2. Load CSS (browser would do this automatically)
        css_response = requests.get(f"{base_url}/css/styles.css")
        if css_response.status_code != 200:
            print(f"❌ CSS load failed: {css_response.status_code}")
            return False
        print("✅ CSS loaded successfully")
        
        # 3. Load JavaScript files (browser would do this automatically)
        js_files = [
            '/js/config.js',
            '/js/project-manager-server.js',
            '/js/ui-controller-fixed.js'
        ]
        
        for js_file in js_files:
            js_response = requests.get(f"{base_url}{js_file}")
            if js_response.status_code != 200:
                print(f"❌ JS load failed: {js_file} - {js_response.status_code}")
                return False
            print(f"✅ JavaScript loaded successfully: {js_file}")
        
        # 4. Test API endpoint (JavaScript would call this)
        api_response = requests.get(f"{base_url}/health")
        if api_response.status_code != 200:
            print(f"❌ API call failed: {api_response.status_code}")
            return False
        print("✅ API endpoint accessible")
        
        return True
        
    except Exception as e:
        print(f"❌ Complete page load test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Running Enhanced Integration Tests")
    print("=" * 50)
    
    # Wait for server to be ready
    print("⏳ Waiting for server...")
    time.sleep(2)
    
    tests_passed = 0
    total_tests = 5
    
    # Run tests
    if test_static_file_serving():
        tests_passed += 1
        print("✅ Static file serving test PASSED")
    else:
        print("❌ Static file serving test FAILED")
    
    print("-" * 30)
    
    if test_production_readiness():
        tests_passed += 1
        print("✅ Production readiness test PASSED")
    else:
        print("❌ Production readiness test FAILED")
    
    print("-" * 30)
    
    if test_html_loads_dependencies():
        tests_passed += 1
        print("✅ HTML dependency test PASSED")
    else:
        print("❌ HTML dependency test FAILED")
    
    print("-" * 30)
    
    if test_ui_elements_present():
        tests_passed += 1
        print("✅ UI elements presence test PASSED")
    else:
        print("❌ UI elements presence test FAILED")
    
    print("-" * 30)
    
    if test_complete_page_load():
        tests_passed += 1
        print("✅ Complete page load test PASSED")
    else:
        print("❌ Complete page load test FAILED")
    
    print("=" * 50)
    print(f"🎯 Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All enhanced integration tests PASSED!")
        sys.exit(0)
    else:
        print("❌ Some tests FAILED - Production issues or functionality problems detected!")
        sys.exit(1)
