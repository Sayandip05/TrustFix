#!/usr/bin/env python
"""
Test Runner for TrustFix Project
Run all tests or specific app tests
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test.utils import get_runner
from django.conf import settings


def run_tests(test_labels=None, verbosity=2):
    """
    Run Django tests
    
    Usage:
        python run_tests.py                    # Run all tests
        python run_tests.py users              # Run users app tests
        python run_tests.py users bookings     # Run multiple apps
    """
    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=verbosity)
    
    if test_labels:
        # Run specific tests
        failures = test_runner.run_tests(test_labels)
    else:
        # Run all tests
        failures = test_runner.run_tests([
            'apps.users',
            'apps.technicians',
            'apps.bookings',
            'apps.bookings.test_websocket',
            'apps.bookings.test_integration',
            'apps.payments',
            'apps.ai_engine',
            'apps.services',
            'apps.notifications',
            'apps.core',
            'apps.core.test_tasks',
        ])
    
    return failures


if __name__ == '__main__':
    # Get test labels from command line arguments
    test_labels = sys.argv[1:] if len(sys.argv) > 1 else None
    
    print("=" * 70)
    print("TRUSTFIX TEST RUNNER")
    print("=" * 70)
    
    if test_labels:
        print(f"Running tests for: {', '.join(test_labels)}")
    else:
        print("Running all tests...")
    
    print("-" * 70)
    
    failures = run_tests(test_labels)
    
    print("-" * 70)
    if failures:
        print(f"❌ Tests failed with {failures} failures")
        sys.exit(1)
    else:
        print("✅ All tests passed!")
        sys.exit(0)
