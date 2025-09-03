#!/bin/bash

# YouTube Audio Backend Server Control Script

SERVER_DIR="/Users/walterchao/youtube-vocal-extractor/backend"
SERVER_FILE="server.js"
LOG_FILE="server.log"

case "$1" in
    start)
        echo "🚀 Starting YouTube Audio Backend Server..."
        cd "$SERVER_DIR"
        nohup node "$SERVER_FILE" > "$LOG_FILE" 2>&1 &
        echo "✅ Server started in background"
        echo "📋 Logs: $SERVER_DIR/$LOG_FILE"
        echo "🔗 Health check: http://localhost:3000/api/health"
        ;;
    stop)
        echo "🛑 Stopping YouTube Audio Backend Server..."
        pkill -f "node $SERVER_FILE"
        echo "✅ Server stopped"
        ;;
    status)
        if curl -s http://localhost:3000/api/health > /dev/null; then
            echo "✅ Server is running"
            curl -s http://localhost:3000/api/health | python3 -m json.tool
        else
            echo "❌ Server is not running"
        fi
        ;;
    logs)
        echo "📋 Server logs:"
        tail -f "$SERVER_DIR/$LOG_FILE"
        ;;
    *)
        echo "Usage: $0 {start|stop|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start  - Start the server in background"
        echo "  stop   - Stop the server"
        echo "  status - Check if server is running"
        echo "  logs   - View server logs"
        exit 1
        ;;
esac
