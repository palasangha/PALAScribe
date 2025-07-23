# PALAScribe - Audio-to-Text Converter

A web-based application for converting audio files to text with specialized Pali word recognition, designed for VRI content transcription.

## Features

🎵 **Audio Transcription**
- Upload audio files (MP3, WAV, M4A, FLAC, OGG)
- Convert to text using OpenAI Whisper API
- Support for files up to 25MB

📝 **Pali Word Recognition**
- Automatic detection of Pali Buddhist terms
- Special formatting for recognized words
- Extensive built-in Pali dictionary

📊 **Project Management**
- Create and manage transcription projects
- Track project status through workflow stages
- Search and filter projects

📄 **Document Generation**
- Generate DOCX files from transcriptions
- Download generated documents
- Upload reviewed documents
- Complete review workflow

## Quick Start

1. **Open the Application**
   - Open `index.html` in a modern web browser
   - No server setup required - runs entirely in the browser

2. **Create Your First Project**
   - Click "New Project" or use Ctrl+N (Cmd+N on Mac)
   - Enter a project name
   - Optionally assign to a reviewer
   - Upload your audio file

3. **Convert Audio**
   - Click "Convert Audio" after uploading
   - Wait for transcription to complete
   - Review the generated text with highlighted Pali words

4. **Review and Download**
   - Start the review process
   - Download the generated document
   - Upload your reviewed version if needed
   - Mark review as complete

## Project Status Workflow

```
New → AudioAssigned → Text_Generation_InProgress → Ready_for_Review → In_Review → Review_Complete
```

- **New**: Project created, no audio attached
- **AudioAssigned**: Audio file uploaded, ready for conversion
- **Text_Generation_InProgress**: Audio being processed
- **Ready_for_Review**: Transcription complete, available for review
- **In_Review**: Review process started
- **Review_Complete**: Final reviewed document uploaded

## Configuration

### OpenAI API Setup (Production)

For production use with real OpenAI Whisper API:

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. In `js/config.js`, set:
   ```javascript
   CONFIG.MOCK.ENABLE_MOCK_API = false;
   CONFIG.OPENAI.API_KEY = 'your-api-key-here';
   ```

⚠️ **Security Note**: In production, API keys should be handled server-side, not in client-side code.

### Demo Mode

The application runs in demo mode by default with mock transcription:
- No API key required
- Simulated processing delay
- Sample transcription with Pali words
- Perfect for testing and demonstration

## Supported File Formats

- **MP3** (.mp3)
- **WAV** (.wav)
- **M4A** (.m4a)
- **FLAC** (.flac)
- **OGG** (.ogg)

Maximum file size: 25MB (OpenAI Whisper limit)

## Pali Dictionary

The application includes a comprehensive Pali dictionary with:

- **Core Buddhist concepts**: dukkha, nibbana, dhamma, sangha
- **Meditation terms**: vipassana, samatha, jhana, mindfulness
- **Philosophical terms**: anicca, anatta, sunyata
- **Ethical concepts**: sila, ahimsa, metta, karuna
- **Text references**: dhammapada, vinaya, sutta, abhidhamma

Recognized Pali words are automatically highlighted in the transcription.

## Keyboard Shortcuts

- **Ctrl+N** (Cmd+N): Create new project
- **Ctrl+P** (Cmd+P): Go to projects list
- **Escape**: Close modals

## Browser Compatibility

Requires a modern browser with support for:
- ES6+ JavaScript features
- Fetch API
- Local Storage
- File API
- Blob/URL APIs

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure

```
audio-text-converter/
├── index.html              # Main application page
├── css/
│   └── styles.css          # Custom styles (Tailwind CSS)
├── js/
│   ├── config.js           # Configuration and constants
│   ├── pali-dictionary.js  # Pali word dictionary and processor
│   ├── audio-processor.js  # Audio transcription handling
│   ├── project-manager.js  # Project data management
│   ├── ui-controller.js    # User interface controller
│   └── app.js              # Main application entry point
└── data/                   # Data storage directory
```

## Data Storage

- **Local Storage**: Projects, settings, and API keys stored in browser
- **Memory**: Audio files and generated documents (temporary)
- **Downloads**: Generated and reviewed documents

⚠️ **Note**: Data is stored locally in the browser. Clear browser data will reset the application.

## API Integration

### OpenAI Whisper API

```javascript
// Example API call structure
const formData = new FormData();
formData.append('file', audioFile);
formData.append('model', 'whisper-1');
formData.append('response_format', 'text');

fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
    },
    body: formData
});
```

### Mock API (Demo Mode)

When `CONFIG.MOCK.ENABLE_MOCK_API = true`:
- Simulates API delay (3 seconds)
- Returns sample transcription with Pali words
- No network requests made
- Perfect for testing and development

## Customization

### Adding Pali Words

```javascript
// Add new words to the dictionary
paliProcessor.addWord('newword', {
    meaning: 'word definition',
    category: 'category',
    pronunciation: 'pronunciation guide'
});
```

### Modifying UI Themes

Edit `css/styles.css` to customize:
- Color schemes
- Typography
- Layout spacing
- Component styling

### Configuration Options

Edit `js/config.js` to modify:
- File size limits
- Supported formats
- UI timings
- Error messages
- API endpoints

## Troubleshooting

### Common Issues

1. **Audio file won't upload**
   - Check file format is supported
   - Ensure file size is under 25MB
   - Try a different audio format

2. **Transcription fails**
   - Verify API key is correct (production mode)
   - Check internet connection
   - Ensure audio file is not corrupted

3. **Projects not saving**
   - Check browser local storage is enabled
   - Clear browser cache and try again
   - Ensure sufficient storage space

4. **Pali words not highlighted**
   - Words must be in the dictionary
   - Check spelling and diacritics
   - Case-insensitive matching

### Error Messages

- **"File size exceeds the maximum limit"**: File is larger than 25MB
- **"Unsupported audio format"**: Use MP3, WAV, M4A, FLAC, or OGG
- **"OpenAI API key is required"**: Set API key in production mode
- **"Network error"**: Check internet connection

## Development

### Local Development

1. Clone or download the project
2. Open `index.html` in a web browser
3. No build process required
4. Edit files and refresh browser to see changes

### Testing

The application includes built-in error handling and logging:
- Check browser console for detailed logs
- Use demo mode for testing without API costs
- Test with various audio file formats and sizes

### Contributing

1. Test your changes thoroughly
2. Ensure browser compatibility
3. Update documentation if needed
4. Follow existing code style

## Security Considerations

- **API Keys**: Never expose API keys in client-side code in production
- **File Uploads**: Validate file types and sizes
- **Data Storage**: Consider encryption for sensitive data
- **Network Requests**: Use HTTPS in production
- **Content Security**: Sanitize user input and file content

## Performance Tips

- **Large Files**: Consider chunking for files approaching 25MB limit
- **Memory Usage**: Application cleans up blob URLs automatically
- **Storage**: Regularly export and clear old projects
- **Network**: Use appropriate file formats for smaller sizes

## License

This project is provided as-is for educational and development purposes.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Ensure all requirements are met
4. Test in demo mode first

---

**Version**: 1.0.0  
**Last Updated**: June 2025  
**Compatibility**: Modern browsers with ES6+ support
