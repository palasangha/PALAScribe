#!/usr/bin/env python3
"""
PALAScribe Server Tests
Comprehensive test suite for the multi-user server functionality
"""

import unittest
import json
import sqlite3
import tempfile
import shutil
from pathlib import Path
import requests
import time
import threading
import sys
import os

# Add the project directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import server modules
from palascribe_server import DatabaseManager, PALAScribeHandler, create_handler_with_db
from http.server import HTTPServer

class TestDatabaseManager(unittest.TestCase):
    """Test database operations"""
    
    def setUp(self):
        """Set up test database"""
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, "test.db")
        self.db_manager = DatabaseManager(self.db_path)
        
        # Create uploads directory
        self.uploads_dir = Path(self.temp_dir) / "uploads"
        self.uploads_dir.mkdir(exist_ok=True)
        
    def tearDown(self):
        """Clean up test files"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_database_initialization(self):
        """Test database tables are created correctly"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check projects table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'")
        self.assertTrue(cursor.fetchone())
        
        # Check audio_files table exists  
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audio_files'")
        self.assertTrue(cursor.fetchone())
        
        conn.close()
    
    def test_create_project(self):
        """Test project creation"""
        project = self.db_manager.create_project("Test Project", "Test User")
        
        self.assertIsNotNone(project)
        self.assertEqual(project['name'], "Test Project")
        self.assertEqual(project['assigned_to'], "Test User")
        self.assertEqual(project['status'], "new")
        self.assertIsNotNone(project['id'])
        self.assertIsNotNone(project['created'])
        
    def test_duplicate_name_handling(self):
        """Test automatic name deduplication"""
        # Create first project
        project1 = self.db_manager.create_project("Test Project", "User 1")
        self.assertEqual(project1['name'], "Test Project")
        
        # Create second project with same name
        project2 = self.db_manager.create_project("Test Project", "User 2")
        self.assertEqual(project2['name'], "Test Project_1")
        
        # Create third project with same base name
        project3 = self.db_manager.create_project("Test Project", "User 3")
        self.assertEqual(project3['name'], "Test Project_2")
        
    def test_get_project(self):
        """Test retrieving projects"""
        # Create project
        created = self.db_manager.create_project("Get Test", "Test User")
        
        # Retrieve project
        retrieved = self.db_manager.get_project(created['id'])
        
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved['id'], created['id'])
        self.assertEqual(retrieved['name'], created['name'])
        
        # Test non-existent project
        non_existent = self.db_manager.get_project("non-existent-id")
        self.assertIsNone(non_existent)
        
    def test_get_all_projects(self):
        """Test retrieving all projects"""
        # Initially no projects
        projects = self.db_manager.get_all_projects()
        self.assertEqual(len(projects), 0)
        
        # Create multiple projects
        self.db_manager.create_project("Project 1", "User 1")
        self.db_manager.create_project("Project 2", "User 2")
        self.db_manager.create_project("Project 3", "User 3")
        
        # Retrieve all projects
        projects = self.db_manager.get_all_projects()
        self.assertEqual(len(projects), 3)
        
        # Check ordering (newest first)
        self.assertEqual(projects[0]['name'], "Project 3")
        self.assertEqual(projects[1]['name'], "Project 2")
        self.assertEqual(projects[2]['name'], "Project 1")
        
    def test_update_project(self):
        """Test project updates"""
        # Create project
        project = self.db_manager.create_project("Update Test", "Original User")
        project_id = project['id']
        
        # Update project
        updates = {
            'name': 'Updated Project',
            'assigned_to': 'New User',
            'status': 'completed',
            'transcription': 'Test transcription text'
        }
        self.db_manager.update_project(project_id, updates)
        
        # Retrieve updated project
        updated = self.db_manager.get_project(project_id)
        
        self.assertEqual(updated['name'], 'Updated Project')
        self.assertEqual(updated['assigned_to'], 'New User')
        self.assertEqual(updated['status'], 'completed')
        self.assertEqual(updated['transcription'], 'Test transcription text')
        
    def test_delete_project(self):
        """Test project deletion"""
        # Create project
        project = self.db_manager.create_project("Delete Test", "Test User")
        project_id = project['id']
        
        # Verify project exists
        retrieved = self.db_manager.get_project(project_id)
        self.assertIsNotNone(retrieved)
        
        # Delete project
        self.db_manager.delete_project(project_id)
        
        # Verify project is deleted
        deleted = self.db_manager.get_project(project_id)
        self.assertIsNone(deleted)
        
    def test_save_audio_file(self):
        """Test audio file saving"""
        # Create project
        project = self.db_manager.create_project("Audio Test", "Test User")
        project_id = project['id']
        
        # Create test audio data
        test_audio_data = b"fake audio data for testing"
        original_name = "test_audio.mp3"
        mime_type = "audio/mpeg"
        
        # Save audio file
        file_path = self.db_manager.save_audio_file(
            project_id, test_audio_data, original_name, mime_type
        )
        
        # Verify file was saved
        self.assertTrue(Path(file_path).exists())
        
        # Verify project was updated
        updated_project = self.db_manager.get_project(project_id)
        self.assertEqual(updated_project['audio_file_name'], original_name)
        self.assertEqual(updated_project['audio_file_path'], file_path)
        
        # Verify file contents
        with open(file_path, 'rb') as f:
            saved_data = f.read()
        self.assertEqual(saved_data, test_audio_data)

class TestServerAPI(unittest.TestCase):
    """Test HTTP API endpoints"""
    
    @classmethod
    def setUpClass(cls):
        """Start test server"""
        cls.temp_dir = tempfile.mkdtemp()
        cls.db_path = os.path.join(cls.temp_dir, "test_api.db")
        cls.db_manager = DatabaseManager(cls.db_path)
        
        # Change to temp directory for uploads
        cls.original_cwd = os.getcwd()
        os.chdir(cls.temp_dir)
        
        # Start server in background thread
        cls.port = 8766  # Different port to avoid conflicts
        cls.base_url = f"http://localhost:{cls.port}"
        
        handler_class = create_handler_with_db(cls.db_manager)
        cls.server = HTTPServer(('localhost', cls.port), handler_class)
        
        cls.server_thread = threading.Thread(target=cls.server.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        
        # Wait for server to start
        time.sleep(0.5)
    
    @classmethod
    def tearDownClass(cls):
        """Stop test server and clean up"""
        cls.server.shutdown()
        cls.server.server_close()
        os.chdir(cls.original_cwd)
        shutil.rmtree(cls.temp_dir, ignore_errors=True)
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{self.base_url}/health")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'PALAScribe Multi-User Server')
        
    def test_create_project_api(self):
        """Test project creation via API"""
        project_data = {
            'name': 'API Test Project',
            'assignedTo': 'API Test User'
        }
        
        response = requests.post(
            f"{self.base_url}/projects",
            json=project_data,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 201)
        
        project = response.json()
        self.assertEqual(project['name'], 'API Test Project')
        self.assertEqual(project['assigned_to'], 'API Test User')
        self.assertIsNotNone(project['id'])
        
    def test_get_projects_api(self):
        """Test retrieving projects via API"""
        # Create test projects
        for i in range(3):
            project_data = {
                'name': f'Test Project {i+1}',
                'assignedTo': f'User {i+1}'
            }
            requests.post(
                f"{self.base_url}/projects",
                json=project_data,
                headers={'Content-Type': 'application/json'}
            )
        
        # Get all projects
        response = requests.get(f"{self.base_url}/projects")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('projects', data)
        self.assertGreaterEqual(len(data['projects']), 3)
        
    def test_get_single_project_api(self):
        """Test retrieving single project via API"""
        # Create project
        project_data = {
            'name': 'Single Project Test',
            'assignedTo': 'Single User'
        }
        
        create_response = requests.post(
            f"{self.base_url}/projects",
            json=project_data,
            headers={'Content-Type': 'application/json'}
        )
        
        created_project = create_response.json()
        project_id = created_project['id']
        
        # Retrieve project
        response = requests.get(f"{self.base_url}/projects/{project_id}")
        self.assertEqual(response.status_code, 200)
        
        project = response.json()
        self.assertEqual(project['id'], project_id)
        self.assertEqual(project['name'], 'Single Project Test')
        
    def test_update_project_api(self):
        """Test updating project via API"""
        # Create project
        project_data = {
            'name': 'Update API Test',
            'assignedTo': 'Original User'
        }
        
        create_response = requests.post(
            f"{self.base_url}/projects",
            json=project_data,
            headers={'Content-Type': 'application/json'}
        )
        
        created_project = create_response.json()
        project_id = created_project['id']
        
        # Update project
        update_data = {
            'name': 'Updated API Test',
            'assigned_to': 'Updated User',
            'status': 'completed'
        }
        
        response = requests.put(
            f"{self.base_url}/projects/{project_id}",
            json=update_data,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 200)
        
        updated_project = response.json()
        self.assertEqual(updated_project['name'], 'Updated API Test')
        self.assertEqual(updated_project['assigned_to'], 'Updated User')
        self.assertEqual(updated_project['status'], 'completed')
        
    def test_delete_project_api(self):
        """Test deleting project via API"""
        # Create project
        project_data = {
            'name': 'Delete API Test',
            'assignedTo': 'Delete User'
        }
        
        create_response = requests.post(
            f"{self.base_url}/projects",
            json=project_data,
            headers={'Content-Type': 'application/json'}
        )
        
        created_project = create_response.json()
        project_id = created_project['id']
        
        # Delete project
        response = requests.delete(f"{self.base_url}/projects/{project_id}")
        self.assertEqual(response.status_code, 200)
        
        # Verify project is deleted
        get_response = requests.get(f"{self.base_url}/projects/{project_id}")
        self.assertEqual(get_response.status_code, 404)
        
    def test_duplicate_names_api(self):
        """Test duplicate name handling via API"""
        project_data = {
            'name': 'Duplicate Test',
            'assignedTo': 'User'
        }
        
        # Create first project
        response1 = requests.post(
            f"{self.base_url}/projects",
            json=project_data,
            headers={'Content-Type': 'application/json'}
        )
        project1 = response1.json()
        self.assertEqual(project1['name'], 'Duplicate Test')
        
        # Create second project with same name
        response2 = requests.post(
            f"{self.base_url}/projects",
            json=project_data,
            headers={'Content-Type': 'application/json'}
        )
        project2 = response2.json()
        self.assertEqual(project2['name'], 'Duplicate Test_1')
        
        # Create third project with same name
        response3 = requests.post(
            f"{self.base_url}/projects",
            json=project_data,
            headers={'Content-Type': 'application/json'}
        )
        project3 = response3.json()
        self.assertEqual(project3['name'], 'Duplicate Test_2')

class TestMultiUserFunctionality(unittest.TestCase):
    """Test multi-user scenarios"""
    
    def setUp(self):
        """Set up test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, "test_multiuser.db")
        self.db_manager = DatabaseManager(self.db_path)
        
    def tearDown(self):
        """Clean up test files"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
        
    def test_concurrent_project_creation(self):
        """Test multiple users creating projects simultaneously"""
        import threading
        
        results = []
        errors = []
        
        def create_project(user_id):
            try:
                project = self.db_manager.create_project(
                    f"Concurrent Project {user_id}",
                    f"User {user_id}"
                )
                results.append(project)
            except Exception as e:
                errors.append(e)
        
        # Create projects concurrently
        threads = []
        for i in range(10):
            thread = threading.Thread(target=create_project, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Verify results
        self.assertEqual(len(errors), 0, f"Errors occurred: {errors}")
        self.assertEqual(len(results), 10)
        
        # Verify all projects were created with unique IDs
        project_ids = [p['id'] for p in results]
        self.assertEqual(len(set(project_ids)), 10)  # All unique
        
    def test_data_persistence_across_instances(self):
        """Test that data persists across database manager instances"""
        # Create project with first instance
        project = self.db_manager.create_project("Persistence Test", "Test User")
        project_id = project['id']
        
        # Create new database manager instance
        new_db_manager = DatabaseManager(self.db_path)
        
        # Verify project exists in new instance
        retrieved = new_db_manager.get_project(project_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved['name'], "Persistence Test")
        self.assertEqual(retrieved['assigned_to'], "Test User")

def run_server_tests():
    """Run all server tests"""
    print("🧪 Running PALAScribe Server Tests...")
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestDatabaseManager))
    suite.addTests(loader.loadTestsFromTestCase(TestServerAPI))
    suite.addTests(loader.loadTestsFromTestCase(TestMultiUserFunctionality))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    if result.wasSuccessful():
        print("✅ All server tests passed!")
        return True
    else:
        print(f"❌ {len(result.failures)} test failures, {len(result.errors)} test errors")
        return False

if __name__ == "__main__":
    success = run_server_tests()
    sys.exit(0 if success else 1)
