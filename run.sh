#!/bin/bash

# LEGv8 Simulator Docker Runner
# Simple script to run the LEGv8 CPU simulator with Docker

echo "🚀 LEGv8 CPU Architecture Simulator"
echo "====================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Function to show help
show_help() {
    echo "Usage: ./run.sh [mode]"
    echo ""
    echo "Available modes:"
    echo "  dev     - Development mode with hot reload (default)"
    echo "  demo    - Demo mode for sharing (no volume mounting)"
    echo "  prod    - Production mode with nginx"
    echo "  stop    - Stop all running containers"
    echo "  help    - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh dev     # Start development server"
    echo "  ./run.sh demo    # Start demo server"
    echo "  ./run.sh prod    # Start production server"
    echo "  ./run.sh stop    # Stop all containers"
}

# Get the mode from command line argument
MODE=${1:-demo}

case $MODE in
    "dev")
        echo "🔧 Starting LEGv8 Simulator in DEVELOPMENT mode..."
        echo "   → Hot reload enabled"
        echo "   → Volume mounting enabled"
        echo "   → Access at: http://localhost:3000"
        echo ""
        docker-compose --profile dev up
        ;;
    "demo")
        echo "🎯 Starting LEGv8 Simulator in DEMO mode..."
        echo "   → Perfect for sharing and demos"
        echo "   → Faster startup (no volume mounting)"
        echo "   → Access at: http://localhost:3000"
        echo ""
        docker-compose --profile demo up
        ;;
    "prod")
        echo "🏭 Starting LEGv8 Simulator in PRODUCTION mode..."
        echo "   → Optimized build with nginx"
        echo "   → Gzip compression enabled"
        echo "   → Access at: http://localhost"
        echo ""
        docker-compose --profile prod up
        ;;
    "stop")
        echo "🛑 Stopping all LEGv8 Simulator containers..."
        docker-compose down
        echo "✅ All containers stopped."
        ;;
    "help" | "--help" | "-h")
        show_help
        ;;
    *)
        echo "❌ Unknown mode: $MODE"
        echo ""
        show_help
        exit 1
        ;;
esac 