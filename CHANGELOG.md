# PALAScribe Changelog

## Version 1.2.1 - Streamlined Experience (Latest)

### 🎯 User Experience Improvements
- **REMOVED**: First-time user onboarding flow (simplified startup)
- **IMPROVED**: Direct access to core functionality without setup wizards
- **ENHANCED**: Cleaner application startup without welcome modals

### 🔧 Port Configuration Fixes
- **FIXED**: Server port consistency (standardized on 8765)
- **UPDATED**: Auto-startup script to use correct port
- **IMPROVED**: Documentation accuracy for port configuration

### 🐛 Bug Fixes

- **FIXED**: "UIController is not defined" critical startup error
- **FIXED**: "this.initTableSorting is not a function" error during application initialization  
- **FIXED**: "uiController.downloadTranscription is not a function" error when clicking download buttons
- **FIXED**: "uiController.deleteProject is not a function" error when clicking delete buttons
- **FIXED**: "this.saveDraft is not a function" error when saving draft transcriptions
- **FIXED**: "this.updateWordCount is not a function" error when opening projects
- **ADDED**: Missing `initTableSorting()`, `sortTable()`, and `initRowSelection()` methods for table functionality
- **ADDED**: Missing `downloadTranscription()` method for project-specific downloads
- **ADDED**: Missing `deleteProject()` method for individual project deletion
- **ADDED**: Missing `saveDraft()`, `resetToOriginalText()`, and `updateWordCount()` methods in UIController
- **IMPROVED**: Script loading coordination between ui-controller-fixed.js and app.js
- **IMPROVED**: Transcription editing reliability and error handling
- **IMPLEMENTED**: Proper DOCX export functionality with valid XML structure
- **FIXED**: Export DOCX button now creates proper Word-compatible documents
- **ADDED**: RTF fallback format for maximum Word compatibility
- **ENHANCED**: Document export includes comprehensive project metadata

---

## Version 1.2.0 - Enhanced Documentation & Onboarding

### 📚 Documentation Improvements

- **NEW**: Comprehensive `QUICK_START_GUIDE.md` for 5-minute setup
- **ENHANCED**: `README.md` with detailed local Whisper setup instructions
- **NEW**: `SYSTEM_ARCHITECTURE_DIAGRAMS.md` with ASCII system diagrams
- **NEW**: `TECHNICAL_ARCHITECTURE.md` with detailed technical specifications
- **IMPROVED**: Installation guides for all operating systems (macOS, Windows, Linux)
- **ADDED**: Troubleshooting sections with common issues and solutions

### 🎯 Onboarding Experience
- **NEW**: Interactive first-time user onboarding modal
- **ADDED**: Setup verification and health checks
- **IMPROVED**: Welcome flow with step-by-step guidance
- **ENHANCED**: Demo mode with sample audio suggestions
- **NEW**: Progress tracking and visual indicators

### 🔧 Technical Enhancements
- **IMPROVED**: Local Whisper backend focus (no external API dependencies)
- **ENHANCED**: Privacy-first architecture documentation
- **ADDED**: Performance optimization guidelines
- **NEW**: Security model documentation
- **IMPROVED**: Deployment and scaling instructions

### 🎬 Demo & Presentation
- **MAINTAINED**: Existing `VIDEO_SCRIPT.md` for demo creation
- **ADDED**: Sample audio recommendations for testing
- **IMPROVED**: Demo workflow documentation
- **ENHANCED**: Feature showcase guidelines

---

## Version 1.1.0 - Core Features (Previous)

### 🎵 Audio Processing
- Local Whisper AI transcription
- Support for MP3, WAV, M4A, FLAC, OGG formats
- File size limit: 25MB
- Real-time processing status

### 📝 Pali Correction Engine
- 150+ Buddhist term dictionary
- Automatic diacritical mark correction
- Context-aware term recognition
- Unicode support for special characters

### 📄 Document Management
- Rich text editor with formatting
- DOCX export functionality
- Project-based organization
- Review and approval workflow

### 🎛️ User Interface
- Responsive design for all devices
- Drag-and-drop file upload
- Real-time progress indicators
- Project status management

---

## Version 1.0.0 - Initial Release

### Core Functionality
- Basic audio transcription
- Simple Pali corrections
- Document export
- Web-based interface

---

## Upgrade Instructions

### From 1.1.0 to 1.2.0
1. Pull latest changes from repository
2. Review new documentation files
3. Optional: Clear browser cache to see onboarding flow
4. No database or configuration changes required

### First-Time Setup
1. Follow the `QUICK_START_GUIDE.md` for step-by-step setup
2. Ensure Python 3.8+ and FFmpeg are installed
3. Run the automatic setup script or manual installation
4. Launch the application and complete the onboarding flow

---

## Breaking Changes
**None** - This release maintains full backward compatibility.

---

## Known Issues
- Large audio files (>100MB) may require extended processing time
- Some older browsers may not support all audio formats
- Internet connection required for initial Whisper model download

---

## Upcoming Features (Roadmap)
- [ ] Batch processing for multiple files
- [ ] Advanced audio preprocessing options
- [ ] Custom Pali dictionary management
- [ ] Export to additional formats (PDF, TXT)
- [ ] Integration with external storage services
- [ ] Mobile app version

---

## Contributors
- Development Team: VRI Tech Projects
- Documentation: Enhanced for v1.2.0
- Testing: Community feedback integration

---

## Support
- **Issues**: Create GitHub issue with detailed description
- **Documentation**: Check README.md and guide files
- **Demo**: Follow VIDEO_SCRIPT.md for feature overview
- **Technical**: Review TECHNICAL_ARCHITECTURE.md

**Last Updated**: January 2025
