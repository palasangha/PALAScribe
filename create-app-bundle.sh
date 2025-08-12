#!/bin/bash
# Create a macOS .app bundle for PALAScribe

PROJECT_DIR="./"
APP_NAME="Audio-Text-Converter"
APP_DIR="$PROJECT_DIR/$APP_NAME.app"

# Create app bundle structure
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Audio-Text-Converter</string>
    <key>CFBundleIdentifier</key>
    <string>com.local.audio-text-converter</string>
    <key>CFBundleName</key>
    <string>Audio-Text-Converter</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleDisplayName</key>
    <string>PALAScribe</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
</dict>
</plist>
EOF

# Create the executable script
cat > "$APP_DIR/Contents/MacOS/Audio-Text-Converter" << 'EOF'
#!/bin/bash
# PALAScribe Launcher

PROJECT_DIR="./"
cd "$PROJECT_DIR"

# Function to start backend
start_backend() {
    echo "Starting Whisper backend..."
    ./auto-whisper.sh start > /dev/null 2>&1 &
    sleep 3
}

# Function to open application
open_app() {
    echo "Opening PALAScribe..."
    open "launcher.html"
}

# Main execution
echo "🎵 PALAScribe Starting..."

# Start the backend
start_backend

# Open the application
open_app

echo "✅ PALAScribe launched!"

# Keep the script running for a moment
sleep 2
EOF

# Make the executable script runnable
chmod +x "$APP_DIR/Contents/MacOS/Audio-Text-Converter"

echo "✅ Created macOS app bundle: $APP_DIR"
echo "📱 You can now double-click $APP_NAME.app to launch the application with auto-backend startup"
