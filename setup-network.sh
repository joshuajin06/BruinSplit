#!/bin/bash

# BruinSplit Network Setup Script
# This script helps configure the frontend to connect to a remote backend server

echo "🌐 BruinSplit Network Configuration"
echo "===================================="
echo ""

# Check if running on host or client
read -p "Are you the HOST (running the backend)? (y/n): " is_host

if [ "$is_host" = "y" ] || [ "$is_host" = "Y" ]; then
    echo ""
    echo "📡 You are the HOST"
    echo ""
    echo "Your IP addresses:"
    ifconfig | grep "inet " | grep -v 127.0.0.1
    echo ""
    echo "Share one of these IP addresses with your friends."
    echo ""
    echo "Your .env.local file will use localhost (default)"
    
    # Create .env.local for host
    cat > frontend/bruinsplit/.env.local << EOF
# Backend API Configuration
# Using localhost because you're running the backend
VITE_API_URL=http://localhost:8080/api
EOF
    
    echo "✅ Configuration complete!"
    echo ""
    echo "Next steps:"
    echo "1. Start your backend: cd backend && node server.js"
    echo "2. Start your frontend: cd frontend/bruinsplit && npm run dev"
    
else
    echo ""
    echo "👥 You are a CLIENT"
    echo ""
    read -p "Enter the HOST's IP address (e.g., 192.168.1.100): " host_ip
    
    # Validate IP format (basic)
    if [[ ! $host_ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ Invalid IP address format"
        exit 1
    fi
    
    # Create .env.local for client
    cat > frontend/bruinsplit/.env.local << EOF
# Backend API Configuration
# Connecting to host at $host_ip
VITE_API_URL=http://$host_ip:8080/api
EOF
    
    echo "✅ Configuration complete!"
    echo ""
    echo "Your frontend will connect to: http://$host_ip:8080/api"
    echo ""
    echo "Next steps:"
    echo "1. DON'T start the backend (host is running it)"
    echo "2. Start your frontend: cd frontend/bruinsplit && npm run dev"
    echo "3. Make sure you're on the same network as the host"
fi

echo ""
echo "🎉 Setup complete! Restart your frontend if it's already running."
