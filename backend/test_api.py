#!/usr/bin/env python3
"""
Test script for Win GATE Study Tracker API
This script tests the main API endpoints to ensure they work correctly.
"""

import asyncio
import httpx
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

async def test_health_endpoint():
    """Test the health check endpoint"""
    print("Testing health endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print("✓ Health endpoint working")
                return True
            else:
                print(f"✗ Health endpoint failed: {response.status_code}")
                return False
    except Exception as e:
        print(f"✗ Health endpoint error: {e}")
        return False

async def test_visitor_registration():
    """Test visitor registration"""
    print("Testing visitor registration...")
    try:
        async with httpx.AsyncClient() as client:
            visitor_data = {"visitor_id": "test_visitor_123"}
            response = await client.post(
                f"{BASE_URL}/api/visitor/register",
                json=visitor_data
            )
            if response.status_code == 200:
                print("✓ Visitor registration working")
                return True
            else:
                print(f"✗ Visitor registration failed: {response.status_code}")
                return False
    except Exception as e:
        print(f"✗ Visitor registration error: {e}")
        return False

async def test_study_hours_visitor():
    """Test visitor study hours endpoints"""
    print("Testing visitor study hours...")
    try:
        async with httpx.AsyncClient() as client:
            # Test saving study hours
            study_data = {
                "visitor_id": "test_visitor_123",
                "month": 11,
                "year": 2024,
                "day": 15,
                "hours": 6.5
            }
            response = await client.post(
                f"{BASE_URL}/api/visitor/study-hours/save",
                json=study_data
            )
            if response.status_code == 200:
                print("✓ Visitor study hours saving working")
                return True
            else:
                print(f"✗ Visitor study hours saving failed: {response.status_code}")
                return False
    except Exception as e:
        print(f"✗ Visitor study hours error: {e}")
        return False

async def test_curriculum_visitor():
    """Test visitor curriculum endpoints"""
    print("Testing visitor curriculum...")
    try:
        async with httpx.AsyncClient() as client:
            # Test saving curriculum topic
            curriculum_data = {
                "visitor_id": "test_visitor_123",
                "subject": "Engineering Mathematics",
                "topic": "Discrete Mathematics",
                "watched": True,
                "revised": False,
                "tested": False
            }
            response = await client.post(
                f"{BASE_URL}/api/visitor/curriculum/save",
                json=curriculum_data
            )
            if response.status_code == 200:
                print("✓ Visitor curriculum saving working")
                return True
            else:
                print(f"✗ Visitor curriculum saving failed: {response.status_code}")
                return False
    except Exception as e:
        print(f"✗ Visitor curriculum error: {e}")
        return False

async def test_api_docs():
    """Test API documentation endpoint"""
    print("Testing API documentation endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/docs-info")
            if response.status_code == 200:
                print("✓ API documentation endpoint working")
                return True
            else:
                print(f"✗ API documentation endpoint failed: {response.status_code}")
                return False
    except Exception as e:
        print(f"✗ API documentation endpoint error: {e}")
        return False

async def run_all_tests():
    """Run all API tests"""
    print("Starting Win GATE API Tests...")
    print("=" * 50)
    
    tests = [
        test_health_endpoint,
        test_visitor_registration,
        test_study_hours_visitor,
        test_curriculum_visitor,
        test_api_docs
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if await test():
                passed += 1
            print("-" * 30)
        except Exception as e:
            print(f"Test failed with error: {e}")
            print("-" * 30)
    
    print("=" * 50)
    print(f"Tests completed: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the API configuration.")

if __name__ == "__main__":
    # Check if server is running
    print("Make sure the FastAPI server is running on http://localhost:8000")
    print("You can start it with: python main.py")
    print()
    
    asyncio.run(run_all_tests())
