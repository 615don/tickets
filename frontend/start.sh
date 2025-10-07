#!/bin/sh
# Start the frontend server with Railway's PORT or fallback to 8080
serve -s dist -l ${PORT:-8080}
