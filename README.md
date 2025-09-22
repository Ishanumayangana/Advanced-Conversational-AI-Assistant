# 🤖 AI Chatbot - Advanced Conversational Assistant

[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://python.org)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Google%20Gemini-orange.svg)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> An intelligent, feature-rich chatbot powered by Google Gemini AI with advanced capabilities including file uploads, voice interaction, conversation management, and a beautiful modern interface with dark/light themes.

## ✨ Key Features

### 🧠 **AI Intelligence**
- **Google Gemini 1.5 Flash**: Advanced language understanding and generation
- **Context Awareness**: Maintains conversation history and context
- **File Analysis**: Intelligent analysis of uploaded documents, images, and code files
- **Safety Features**: Built-in content moderation and safe responses

### 🎨 **Modern Interface**
- **Dual Themes**: Beautiful dark and light mode with smooth transitions
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Advanced Animations**: Smooth typing indicators, message animations, and transitions
- **File Previews**: Drag & drop file uploads with visual status indicators
- **Quick Actions**: One-click message copying, regeneration, and feedback

### �️ **Voice Features**
- **Voice Input**: Speech-to-text functionality for hands-free messaging
- **Text-to-Speech**: AI responses can be read aloud with natural voice
- **Voice Controls**: Toggle voice features with intuitive controls

### 💬 **Conversation Management**
- **Chat History**: Save, load, and manage multiple conversation sessions
- **Export Options**: Export conversations in various formats (Text, JSON, HTML)
- **Message Actions**: Copy, regenerate, and provide feedback on individual messages
- **Smart Search**: Find specific messages within conversation history

### 📁 **File Processing**
- **Multi-Format Support**: Text, PDF, images, JSON, CSV, code files, and more
- **Visual Upload**: Drag & drop interface with upload status indicators (⏳→✅/❌)
- **Content Extraction**: Automatic text extraction and intelligent analysis
- **File Context**: Uploaded files remain available for analysis throughout the conversation

### ⚙️ **Advanced Settings**
- **Customizable Interface**: Adjust theme, voice settings, and conversation preferences
- **API Configuration**: Manage Gemini AI settings and response parameters
- **User Preferences**: Persistent settings that save across sessions
- **Accessibility**: Full keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- Internet connection for AI API access
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Running

1. **Download** the project files to your computer
2. **Navigate** to the project folder in terminal/command prompt
3. **Start the server**:
   ```bash
   python run_chatbot.py
   ```
4. **Access the chatbot**: Browser opens automatically at `http://localhost:8000`

That's it! No additional dependencies or setup required.

## 📖 How to Use

### Basic Conversations
- Type your message and press Enter or click Send
- Use the microphone button for voice input
- Click the speaker icon to hear responses aloud

### File Uploads
1. Click the 📎 paperclip icon or drag files into the chat area
2. Supported formats: Text, PDF, images, JSON, CSV, code files
3. Watch for status indicators: ⏳ (uploading) → ✅ (success) / ❌ (error)
4. Ask questions about your uploaded files

### Conversation Management
- **Settings**: Click ⚙️ to access themes, voice settings, and preferences
- **History**: Use the conversation panel to save, load, and manage chats
- **Export**: Save conversations in multiple formats
- **Clear**: Reset chat while maintaining uploaded file context

### Message Actions
- **Copy**: Copy any message to clipboard
- **Regenerate**: Get a new AI response for the same question
- **Feedback**: Rate responses to help improve the experience

## 🎯 Advanced Features

### Themes
- **Dark Mode**: Modern dark interface perfect for low-light environments
- **Light Mode**: Clean, bright interface for daytime use
- **Smooth Transitions**: Animated theme switching with CSS transitions

### Voice Integration
- **Speech Recognition**: Uses Web Speech API for accurate voice input
- **Text-to-Speech**: Natural voice synthesis for AI responses
- **Voice Controls**: Easy toggle buttons for voice features

### Smart Interface
- **Responsive Design**: Adapts to any screen size automatically
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Visual Feedback**: Loading states, success/error indicators, and smooth animations
- **Accessibility**: ARIA labels and screen reader compatibility

## 🏗️ Project Structure

```
AI_Bot/
├── 📄 run_chatbot.py      # Main server with AI integration and file processing
├── 🌐 index.html          # Modern chat interface with all features
├── 🎨 style.css           # Responsive styling with themes and animations
├── ⚡ script.js           # Advanced functionality and API communication
└── 📚 README.md           # Project documentation
```

## 🔧 Technical Details

### Backend (Python)
- **HTTP Server**: Built-in Python server for lightweight operation
- **Google Gemini API**: Integration with Gemini 1.5 Flash model
- **File Processing**: Base64 encoding/decoding and content extraction
- **Context Management**: Maintains file context across conversations

### Frontend (Web Technologies)
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: Modern styling with CSS variables, gradients, and animations
- **JavaScript ES6+**: Modular code with classes, async/await, and modern APIs
- **Web APIs**: Speech Recognition, Speech Synthesis, File API

### Features Implementation
- **Dual Themes**: CSS variables system for dynamic theme switching
- **File Upload**: Drag & drop with visual feedback and status tracking
- **Voice Features**: Web Speech API integration for input/output
- **Responsive Design**: CSS Grid and Flexbox for all screen sizes
- **Animations**: Smooth transitions and loading states

## 🔒 Privacy & Security

- **Local Operation**: Runs entirely on your local machine
- **Secure Communication**: HTTPS for all external API calls
- **No Data Storage**: Conversations are not permanently stored on servers
- **Content Safety**: Built-in AI safety filters and content moderation
- **User Control**: Complete control over data and conversation history

## 🌟 What Makes This Special

- **Zero Configuration**: Works immediately without setup
- **Modern UI/UX**: Professional interface with attention to detail
- **Full Feature Set**: Voice, files, themes, conversations - everything included
- **Responsive & Accessible**: Works for everyone on any device
- **Intelligent Processing**: Advanced AI with file understanding capabilities
- **Visual Polish**: Beautiful animations and smooth interactions

## 🤝 Contributing

We welcome contributions! Whether it's bug reports, feature requests, or code improvements:

1. **Report Issues**: Found a problem? Let us know with detailed information
2. **Suggest Features**: Have ideas for improvements? Share them!
3. **Submit Code**: Pull requests welcome for enhancements
4. **Improve Docs**: Help make documentation even better

## 📝 License

This project is licensed under the MIT License - feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- **Google Gemini AI** for providing the advanced language model
- **Web Speech API** for voice recognition and synthesis capabilities
- **Font Awesome** for beautiful icons throughout the interface
- **Google Fonts** for the Inter typeface

---

<div align="center">

**Built with ❤️ for intelligent conversations**

*September 2025 - Advanced AI Chatbot with Modern Features*

</div>