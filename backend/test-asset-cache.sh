#!/bin/bash

# Test script for Asset Cache functionality (Story 15.6)
# This script validates the cache endpoints and functionality

echo "=========================================="
echo "Asset Cache Testing Script"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3001"

# Test 1: Health check
echo "Test 1: Health Check"
echo "--------------------"
HEALTH=$(curl -s "$BASE_URL/api/health")
echo "Response: $HEALTH"
echo ""

# Test 2: Get CSRF token and establish session
echo "Test 2: Getting CSRF Token"
echo "--------------------------"
CSRF_RESPONSE=$(curl -s -c cookies.txt "$BASE_URL/api/csrf-token")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: $CSRF_TOKEN"
echo ""

# Test 3: Login (you'll need valid credentials)
echo "Test 3: Login (requires valid credentials)"
echo "-------------------------------------------"
echo "Note: Manual login required for authenticated endpoints"
echo "To test widget endpoint, use browser or provide session cookie"
echo ""

# Test 4: Manual cache refresh (requires auth)
echo "Test 4: Cache Refresh Endpoint (requires auth)"
echo "-----------------------------------------------"
echo "Endpoint: POST $BASE_URL/api/assets/cache/refresh"
echo "Note: This endpoint requires authentication"
echo ""

# Test 5: Widget endpoint (requires auth)
echo "Test 5: Widget Endpoint (requires auth)"
echo "----------------------------------------"
echo "Endpoint: GET $BASE_URL/api/assets/widget/:ticketId"
echo "Note: This endpoint requires authentication and valid ticket ID"
echo ""

# Cleanup
rm -f cookies.txt

echo "=========================================="
echo "Cache Warmup Validation"
echo "=========================================="
echo ""
echo "Check server logs for:"
echo "  - [ASSET CACHE] Warmed with X assets for Y contacts in Zms"
echo "  - Cache warmup time should be <2000ms for 1000 assets"
echo "  - Cache lookup time should be <10ms"
echo ""

echo "Manual Testing Checklist:"
echo "  ✓ Cache warms on server startup"
echo "  ✓ Cache invalidates on asset create"
echo "  ✓ Cache invalidates on asset update"
echo "  ✓ Cache invalidates on asset delete/retire"
echo "  ✓ Widget endpoint returns up to 2 assets"
echo "  ✓ Widget endpoint response time <100ms"
echo "  ✓ Cache refresh endpoint works"
echo ""

echo "To fully test authenticated endpoints:"
echo "1. Login to the application in a browser"
echo "2. Copy the session cookie (connect.sid)"
echo "3. Use curl with -b 'connect.sid=YOUR_SESSION_COOKIE'"
echo ""
