class ChatBot {
    constructor() {
        // Server configuration for localhost:8000
        this.serverUrl = 'http://localhost:8000';
        
        // DOM elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.clearButton = document.getElementById('clearButton');
        
        // New feature elements
        this.themeToggle = document.getElementById('themeToggle');
        this.settingsButton = document.getElementById('settingsButton');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettings = document.getElementById('closeSettings');
        this.voiceButton = document.getElementById('voiceButton');
        this.quickActions = document.getElementById('quickActions');
        this.conversationsButton = document.getElementById('conversationsButton');
        this.conversationsPanel = document.getElementById('conversationsPanel');
        this.closeConversations = document.getElementById('closeConversations');
        this.saveConversationBtn = document.getElementById('saveConversationBtn');
        this.conversationList = document.getElementById('conversationList');
        
        // File upload elements
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileSelectButton = document.getElementById('fileSelectButton');
        this.attachButton = document.getElementById('attachButton');
        this.uploadedFiles = document.getElementById('uploadedFiles');
        
        // File storage
        this.selectedFiles = [];
        
        // Voice recognition
        this.recognition = null;
        this.isRecording = false;
        
        // Settings
        this.settings = {
            theme: 'auto',
            fontSize: 15,
            temperature: 0.7,
            voiceEnabled: false
        };
        
        // Initialize
        this.init();
    }

    init() {
        this.loadSettings();
        this.applyTheme();
        this.setupEventListeners();
        this.setWelcomeTime();
        this.focusInput();
        this.initVoiceRecognition();
        this.createScrollToBottomButton();
        this.addMessageActions();
    }

    loadSettings() {
        const saved = localStorage.getItem('chatbot-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.updateSettingsUI();
    }

    saveSettings() {
        localStorage.setItem('chatbot-settings', JSON.stringify(this.settings));
    }

    updateSettingsUI() {
        if (document.getElementById('themeSelect')) {
            document.getElementById('themeSelect').value = this.settings.theme;
        }
        if (document.getElementById('fontSizeRange')) {
            document.getElementById('fontSizeRange').value = this.settings.fontSize;
            document.getElementById('fontSizeValue').textContent = this.settings.fontSize + 'px';
        }
        if (document.getElementById('temperatureRange')) {
            document.getElementById('temperatureRange').value = this.settings.temperature;
            document.getElementById('temperatureValue').textContent = this.settings.temperature;
        }
        if (document.getElementById('voiceEnabled')) {
            document.getElementById('voiceEnabled').checked = this.settings.voiceEnabled;
        }
        
        // Apply font size
        document.documentElement.style.setProperty('--message-font-size', this.settings.fontSize + 'px');
    }

    applyTheme() {
        const theme = this.settings.theme;
        let effectiveTheme = theme;
        
        if (theme === 'auto') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Update theme toggle icon
        const icon = this.themeToggle.querySelector('i');
        if (effectiveTheme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    setupEventListeners() {
        // Existing listeners
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.clearButton.addEventListener('click', () => this.clearChatHistory());
        
        // New feature listeners
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.settingsButton.addEventListener('click', () => this.toggleSettings());
        this.closeSettings.addEventListener('click', () => this.toggleSettings());
        this.conversationsButton.addEventListener('click', () => this.toggleConversations());
        this.closeConversations.addEventListener('click', () => this.toggleConversations());
        this.saveConversationBtn.addEventListener('click', () => this.saveCurrentConversation());
        this.voiceButton.addEventListener('click', () => this.toggleVoiceRecording());
        
        // Settings panel listeners
        if (document.getElementById('themeSelect')) {
            document.getElementById('themeSelect').addEventListener('change', (e) => {
                this.settings.theme = e.target.value;
                this.applyTheme();
                this.saveSettings();
            });
        }
        
        if (document.getElementById('fontSizeRange')) {
            document.getElementById('fontSizeRange').addEventListener('input', (e) => {
                this.settings.fontSize = parseInt(e.target.value);
                this.updateSettingsUI();
                this.saveSettings();
            });
        }
        
        if (document.getElementById('temperatureRange')) {
            document.getElementById('temperatureRange').addEventListener('input', (e) => {
                this.settings.temperature = parseFloat(e.target.value);
                this.updateSettingsUI();
                this.saveSettings();
            });
        }
        
        if (document.getElementById('voiceEnabled')) {
            document.getElementById('voiceEnabled').addEventListener('change', (e) => {
                this.settings.voiceEnabled = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (document.getElementById('exportChatBtn')) {
            document.getElementById('exportChatBtn').addEventListener('click', () => this.exportChat());
        }
        
        // Quick actions
        this.quickActions.addEventListener('click', (e) => {
            const button = e.target.closest('.quick-action-btn');
            if (button) {
                this.handleQuickAction(button.dataset.action);
            }
        });
        
        // Enter key to send message
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Prevent empty message submission
        this.messageInput.addEventListener('input', () => {
            const isEmpty = this.messageInput.value.trim() === '';
            this.sendButton.disabled = isEmpty;
        });

        // File upload event listeners
        this.setupFileUploadListeners();
        
        // Theme system preference listener
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.settings.theme === 'auto') {
                this.applyTheme();
            }
        });
        
        // Scroll detection for scroll-to-bottom button
        this.chatMessages.addEventListener('scroll', () => {
            this.updateScrollToBottomButton();
        });
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.settings.theme = themes[nextIndex];
        this.applyTheme();
        this.saveSettings();
        this.updateSettingsUI();
        
        this.showToast(`Theme switched to ${this.settings.theme}`, 'success');
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('active');
        // Close conversations panel if open
        this.conversationsPanel.classList.remove('active');
    }

    toggleConversations() {
        this.conversationsPanel.classList.toggle('active');
        // Close settings panel if open
        this.settingsPanel.classList.remove('active');
        // Load conversations list
        if (this.conversationsPanel.classList.contains('active')) {
            this.loadConversationsList();
        }
    }

    handleQuickAction(action) {
        const prompts = {
            translate: 'Please translate the following text to English: ',
            summarize: 'Please provide a concise summary of: ',
            explain: 'Please explain this code: ',
            creative: 'Write a creative story about: ',
            math: 'Help me solve this math problem: '
        };
        
        const prompt = prompts[action];
        if (prompt) {
            this.messageInput.value = prompt;
            this.messageInput.focus();
            this.messageInput.setSelectionRange(prompt.length, prompt.length);
        }
    }

    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.autoResizeTextarea();
                this.sendButton.disabled = false;
            };
            
            this.recognition.onend = () => {
                this.isRecording = false;
                this.voiceButton.classList.remove('recording');
            };
            
            this.recognition.onerror = (event) => {
                this.isRecording = false;
                this.voiceButton.classList.remove('recording');
                this.showToast('Voice recognition error: ' + event.error, 'error');
            };
        } else {
            this.voiceButton.style.display = 'none';
        }
    }

    toggleVoiceRecording() {
        if (!this.recognition) return;
        
        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
            this.isRecording = true;
            this.voiceButton.classList.add('recording');
        }
    }

    createScrollToBottomButton() {
        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-to-bottom';
        scrollBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        scrollBtn.title = 'Scroll to bottom';
        scrollBtn.addEventListener('click', () => this.scrollToBottom());
        
        this.chatMessages.parentElement.appendChild(scrollBtn);
        this.scrollToBottomBtn = scrollBtn;
    }

    updateScrollToBottomButton() {
        const isAtBottom = this.chatMessages.scrollTop + this.chatMessages.clientHeight >= this.chatMessages.scrollHeight - 10;
        
        if (isAtBottom) {
            this.scrollToBottomBtn.classList.remove('show');
        } else {
            this.scrollToBottomBtn.classList.add('show');
        }
    }

    addMessageActions() {
        // This method will be called to add action buttons to messages
        // Implementation will be added when messages are created
    }

    setupFileUploadListeners() {
        // Attach button toggle
        this.attachButton.addEventListener('click', () => {
            this.toggleFileUploadArea();
        });

        // File select button
        this.fileSelectButton.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Drag and drop events
        this.fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.add('dragover');
        });

        this.fileUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.remove('dragover');
        });

        this.fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });
    }

    toggleFileUploadArea() {
        const isActive = this.fileUploadArea.classList.contains('active');
        if (isActive) {
            this.fileUploadArea.classList.remove('active');
            this.attachButton.classList.remove('active');
        } else {
            this.fileUploadArea.classList.add('active');
            this.attachButton.classList.add('active');
        }
    }

    handleFileSelect(files) {
        Array.from(files).forEach(file => {
            if (this.isFileTypeSupported(file)) {
                this.selectedFiles.push(file);
                this.addFilePreview(file);
            } else {
                this.showToast(`File type not supported: ${file.name}`, 'error');
            }
        });
        
        // Hide upload area after file selection
        this.fileUploadArea.classList.remove('active');
        this.attachButton.classList.remove('active');
        
        // Clear file input
        this.fileInput.value = '';
    }

    isFileTypeSupported(file) {
        const supportedTypes = [
            'text/plain', 'text/markdown', 'text/html', 'text/css', 'text/javascript',
            'application/json', 'application/pdf', 
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'
        ];
        
        const supportedExtensions = [
            '.txt', '.md', '.py', '.js', '.html', '.css', '.json',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp'
        ];
        
        return supportedTypes.includes(file.type) || 
               supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }

    addFilePreview(file) {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.setAttribute('data-filename', file.name);
        
        if (file.type.startsWith('image/')) {
            preview.classList.add('image');
        }
        
        const icon = this.getFileIcon(file);
        const fileName = file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name;
        const fileSize = this.formatFileSize(file.size);
        
        preview.innerHTML = `
            <div class="file-preview-content">
                <i class="${icon}"></i>
                <div class="file-info">
                    <span class="file-name">${fileName}</span>
                    <small class="file-size">${fileSize}</small>
                </div>
                <div class="file-status">
                    <i class="fas fa-clock file-pending"></i>
                    <i class="fas fa-check file-success" style="display: none;"></i>
                    <i class="fas fa-times file-error" style="display: none;"></i>
                </div>
            </div>
            <button class="file-remove" onclick="this.parentElement.remove(); chatBot.removeFile('${file.name}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.uploadedFiles.appendChild(preview);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(file) {
        if (file.type.startsWith('image/')) return 'fas fa-image';
        if (file.type === 'application/pdf') return 'fas fa-file-pdf';
        if (file.type.includes('word')) return 'fas fa-file-word';
        if (file.type.includes('excel')) return 'fas fa-file-excel';
        if (file.type.startsWith('text/') || file.name.endsWith('.txt')) return 'fas fa-file-alt';
        if (file.name.endsWith('.py')) return 'fab fa-python';
        if (file.name.endsWith('.js')) return 'fab fa-js';
        if (file.name.endsWith('.html')) return 'fab fa-html5';
        if (file.name.endsWith('.css')) return 'fab fa-css3';
        return 'fas fa-file';
    }

    removeFile(fileName) {
        this.selectedFiles = this.selectedFiles.filter(file => file.name !== fileName);
    }

    setWelcomeTime() {
        const welcomeTimeElement = document.getElementById('welcomeTime');
        if (welcomeTimeElement) {
            welcomeTimeElement.textContent = this.getCurrentTime();
        }
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    focusInput() {
        this.messageInput.focus();
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message && this.selectedFiles.length === 0) return;

        // Handle file uploads first if any files are selected
        if (this.selectedFiles.length > 0) {
            await this.handleFileUploads();
        }

        // Handle text message if provided
        if (message) {
            // Add user message to chat
            this.addMessage(message, 'user');
            
            // Clear input and reset height
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            this.sendButton.disabled = true;
            
            // Show typing indicator
            this.showTypingIndicator();
            
            try {
                // Check if user wants web search
                if (message.toLowerCase().startsWith('/search ')) {
                    const searchQuery = message.substring(8);
                    const searchResults = await this.performWebSearch(searchQuery);
                    this.hideTypingIndicator();
                    this.addMessage(searchResults, 'bot');
                } else if (message.toLowerCase().startsWith('/wiki ')) {
                    const wikiQuery = message.substring(6);
                    const wikiResults = await this.performWikipediaSearch(wikiQuery);
                    this.hideTypingIndicator();
                    this.addMessage(wikiResults, 'bot');
                } else {
                    // Get response from Python server
                    const response = await this.getServerResponse(message);
                    this.hideTypingIndicator();
                    this.addMessage(response, 'bot');
                    
                    // Text-to-speech if enabled
                    if (this.settings.voiceEnabled) {
                        this.speakText(response);
                    }
                }
                
            } catch (error) {
                console.error('Error getting response:', error);
                this.hideTypingIndicator();
                const errorMessage = this.getErrorMessage(error);
                this.addMessage(errorMessage, 'bot');
            }
        }
        
        this.focusInput();
    }

    speakText(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            speechSynthesis.cancel();
            
            // Create new utterance
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            speechSynthesis.speak(utterance);
        }
    }

    async handleFileUploads() {
        for (const file of this.selectedFiles) {
            const filePreview = document.querySelector(`[data-filename="${file.name}"]`);
            
            try {
                // Show uploading status
                if (filePreview) {
                    const pendingIcon = filePreview.querySelector('.file-pending');
                    const successIcon = filePreview.querySelector('.file-success');
                    const errorIcon = filePreview.querySelector('.file-error');
                    
                    pendingIcon.style.display = 'inline-block';
                    pendingIcon.className = 'fas fa-spinner fa-spin file-pending';
                    successIcon.style.display = 'none';
                    errorIcon.style.display = 'none';
                }
                
                this.showTypingIndicator();
                
                const fileData = await this.fileToBase64(file);
                
                const response = await fetch(`${this.serverUrl}/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileData: fileData,
                        fileName: file.name,
                        fileType: file.type
                    })
                });

                this.hideTypingIndicator();

                if (response.ok) {
                    const result = await response.json();
                    
                    // Show success status
                    if (filePreview) {
                        const pendingIcon = filePreview.querySelector('.file-pending');
                        const successIcon = filePreview.querySelector('.file-success');
                        
                        pendingIcon.style.display = 'none';
                        successIcon.style.display = 'inline-block';
                        successIcon.style.color = '#22c55e';
                        
                        // Add success class to preview
                        filePreview.classList.add('upload-success');
                    }
                    
                    // Add bot response with enhanced formatting
                    this.addMessage(result.content, 'bot');
                    this.showToast(`✅ ${file.name} uploaded successfully!`, 'success');
                    
                } else {
                    const error = await response.json();
                    
                    // Show error status
                    if (filePreview) {
                        const pendingIcon = filePreview.querySelector('.file-pending');
                        const errorIcon = filePreview.querySelector('.file-error');
                        
                        pendingIcon.style.display = 'none';
                        errorIcon.style.display = 'inline-block';
                        errorIcon.style.color = '#ef4444';
                        
                        // Add error class to preview
                        filePreview.classList.add('upload-error');
                    }
                    
                    this.addMessage(`❌ Upload failed for ${file.name}: ${error.error}`, 'bot');
                    this.showToast(`❌ Failed to upload ${file.name}`, 'error');
                }
                
            } catch (error) {
                this.hideTypingIndicator();
                
                // Show error status
                if (filePreview) {
                    const pendingIcon = filePreview.querySelector('.file-pending');
                    const errorIcon = filePreview.querySelector('.file-error');
                    
                    pendingIcon.style.display = 'none';
                    errorIcon.style.display = 'inline-block';
                    errorIcon.style.color = '#ef4444';
                    
                    filePreview.classList.add('upload-error');
                }
                
                this.addMessage(`❌ Error uploading ${file.name}: ${error.message}`, 'bot');
                this.showToast(`❌ Error uploading ${file.name}`, 'error');
            }
        }
        
        // Clear selected files after a delay to show status
        setTimeout(() => {
            this.selectedFiles = [];
            this.uploadedFiles.innerHTML = '';
        }, 3000); // Keep the status visible for 3 seconds
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    async getServerResponse(message) {
        const response = await fetch(`${this.serverUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: message,
                temperature: this.settings.temperature 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.response) {
            throw new Error('Invalid response format from server');
        }

        return data.response;
    }

    async performWebSearch(query) {
        try {
            const response = await fetch(`${this.serverUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query })
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            
            let resultsText = `🔍 **Web Search Results for:** "${query}"\n\n`;
            
            if (data.results && data.results.length > 0) {
                data.results.forEach((result, index) => {
                    resultsText += `**${index + 1}. ${result.title}**\n`;
                    resultsText += `${result.snippet}\n`;
                    if (result.url) {
                        resultsText += `🔗 ${result.url}\n\n`;
                    }
                });
            } else {
                resultsText += "No results found for your search query.";
            }
            
            resultsText += "\n💡 *Tip: This is a demo search. In a real implementation, this would show actual web results.*";
            
            return resultsText;
            
        } catch (error) {
            return `❌ Search failed: ${error.message}. Please try again.`;
        }
    }

    async performWikipediaSearch(query) {
        try {
            const response = await fetch(`${this.serverUrl}/wikipedia`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query })
            });

            if (!response.ok) {
                throw new Error(`Wikipedia search failed: ${response.status}`);
            }

            const data = await response.json();
            
            let resultsText = `📚 **Wikipedia Results for:** "${query}"\n\n`;
            
            if (data.results && data.results.length > 0) {
                data.results.forEach((result, index) => {
                    resultsText += `**${index + 1}. ${result.title}**\n`;
                    resultsText += `${result.summary}\n`;
                    if (result.url && result.url !== '#') {
                        resultsText += `🔗 Read more: ${result.url}\n\n`;
                    } else {
                        resultsText += '\n';
                    }
                });
            } else {
                resultsText += "No Wikipedia articles found for your search query.";
            }
            
            resultsText += "\n💡 *Tip: Use `/wiki [topic]` to search Wikipedia for any topic.*";
            
            return resultsText;
            
        } catch (error) {
            return `❌ Wikipedia search failed: ${error.message}. Please try again.`;
        }
    }

    getErrorMessage(error) {
        if (error.message.includes('Server Error: 400')) {
            return "I'm sorry, but I couldn't process your request. Please try rephrasing your message.";
        } else if (error.message.includes('Server Error: 403')) {
            return "I'm sorry, but there seems to be an issue with the API configuration. Please check with the administrator.";
        } else if (error.message.includes('Server Error: 429')) {
            return "I'm currently receiving too many requests. Please wait a moment and try again.";
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Server Error: 503')) {
            return "I'm sorry, but I'm having trouble connecting to the server. Please check your connection and try again.";
        } else {
            return `I'm sorry, but I encountered an error: ${error.message}. Please try again later.`;
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        if (sender === 'bot') {
            avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        
        // Handle text formatting and convert markdown-like syntax
        const formattedText = this.formatMessage(text);
        textDiv.innerHTML = formattedText;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();
        
        // Add message actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        if (sender === 'bot') {
            actionsDiv.innerHTML = `
                <button class="action-btn copy-btn" onclick="chatBot.copyMessage(this)" title="Copy">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="action-btn regenerate-btn" onclick="chatBot.regenerateMessage(this)" title="Regenerate">
                    <i class="fas fa-redo"></i>
                </button>
                <button class="action-btn speak-btn" onclick="chatBot.speakMessage(this)" title="Speak">
                    <i class="fas fa-volume-up"></i>
                </button>
            `;
        } else {
            actionsDiv.innerHTML = `
                <button class="action-btn copy-btn" onclick="chatBot.copyMessage(this)" title="Copy">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="action-btn edit-btn" onclick="chatBot.editMessage(this)" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="chatBot.deleteMessage(this)" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);
        contentDiv.appendChild(actionsDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        
        // Highlight code blocks
        if (typeof hljs !== 'undefined') {
            messageDiv.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
        
        this.scrollToBottom();
    }

    copyMessage(button) {
        const messageText = button.closest('.message-content').querySelector('.message-text').innerText;
        navigator.clipboard.writeText(messageText).then(() => {
            this.showToast('Message copied to clipboard', 'success');
        });
    }

    regenerateMessage(button) {
        // Get the previous user message and regenerate response
        const messages = Array.from(this.chatMessages.querySelectorAll('.message'));
        const currentIndex = messages.indexOf(button.closest('.message'));
        
        if (currentIndex > 0) {
            const prevMessage = messages[currentIndex - 1];
            if (prevMessage.classList.contains('user-message')) {
                const userText = prevMessage.querySelector('.message-text').innerText;
                this.getServerResponse(userText).then(response => {
                    button.closest('.message-text').innerHTML = this.formatMessage(response);
                    // Re-highlight code
                    if (typeof hljs !== 'undefined') {
                        button.closest('.message').querySelectorAll('pre code').forEach(block => {
                            hljs.highlightElement(block);
                        });
                    }
                });
            }
        }
    }

    speakMessage(button) {
        const messageText = button.closest('.message-content').querySelector('.message-text').innerText;
        this.speakText(messageText);
    }

    editMessage(button) {
        const messageTextDiv = button.closest('.message-content').querySelector('.message-text');
        const currentText = messageTextDiv.innerText;
        
        const newText = prompt('Edit your message:', currentText);
        if (newText && newText !== currentText) {
            messageTextDiv.innerHTML = this.formatMessage(newText);
        }
    }

    deleteMessage(button) {
        if (confirm('Are you sure you want to delete this message?')) {
            button.closest('.message').remove();
        }
    }

    formatMessage(text) {
        // Convert basic markdown-like formatting
        let formatted = text
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks with language detection
            .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang || 'plaintext';
                return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
            })
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Line breaks
            .replace(/\n/g, '<br>');
        
        return formatted;
    }

    showTypingIndicator() {
        this.typingIndicator.classList.add('show');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.remove('show');
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            const welcomeMessage = this.chatMessages.querySelector('.message.bot-message');
            this.chatMessages.innerHTML = '';
            
            if (welcomeMessage) {
                this.chatMessages.appendChild(welcomeMessage.cloneNode(true));
                const welcomeTimeElement = this.chatMessages.querySelector('#welcomeTime');
                if (welcomeTimeElement) {
                    welcomeTimeElement.textContent = this.getCurrentTime();
                }
            }
            
            // Clear file previews
            const filePreviewContainer = document.getElementById('file-preview-container');
            if (filePreviewContainer) {
                filePreviewContainer.innerHTML = '';
            }
            
            // Send clear context request to server
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: '',
                    clear_context: true
                })
            }).catch(() => {
                // Silently handle clear context request failure
            });
            
            this.focusInput();
            this.showToast('Chat history cleared', 'success');
        }
    }

    exportChat() {
        const messages = Array.from(this.chatMessages.querySelectorAll('.message'));
        
        let content = `# Chat Export - ${new Date().toLocaleString()}\n\n`;
        
        messages.forEach(message => {
            const isBot = message.classList.contains('bot-message');
            const sender = isBot ? 'Assistant' : 'User';
            const text = message.querySelector('.message-text').innerText;
            const time = message.querySelector('.message-time').textContent;
            
            content += `## ${sender} (${time})\n\n${text}\n\n---\n\n`;
        });
        
        // Create download link
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Chat exported successfully', 'success');
    }

    // Conversation Management Methods
    async saveCurrentConversation() {
        const messages = Array.from(this.chatMessages.querySelectorAll('.message'));
        if (messages.length <= 1) { // Only welcome message
            this.showToast('No conversation to save', 'warning');
            return;
        }

        const conversationName = prompt('Enter a name for this conversation:', 
            `Conversation_${new Date().toLocaleDateString()}`);
        
        if (!conversationName) return;

        const conversationData = [];
        messages.forEach(message => {
            if (!message.querySelector('#welcomeTime')) { // Skip welcome message
                const isBot = message.classList.contains('bot-message');
                const text = message.querySelector('.message-text').innerText;
                const time = message.querySelector('.message-time').textContent;
                
                conversationData.push({
                    sender: isBot ? 'bot' : 'user',
                    text: text,
                    time: time
                });
            }
        });

        try {
            const response = await fetch(`${this.serverUrl}/save-conversation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: conversationName,
                    messages: conversationData
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showToast(result.message, 'success');
                this.loadConversationsList();
            } else {
                this.showToast('Failed to save conversation: ' + result.error, 'error');
            }
        } catch (error) {
            this.showToast('Error saving conversation: ' + error.message, 'error');
        }
    }

    async loadConversationsList() {
        try {
            const response = await fetch(`${this.serverUrl}/list-conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const result = await response.json();
            if (result.success) {
                this.renderConversationsList(result.conversations);
            } else {
                this.showToast('Failed to load conversations: ' + result.error, 'error');
            }
        } catch (error) {
            this.showToast('Error loading conversations: ' + error.message, 'error');
        }
    }

    renderConversationsList(conversations) {
        if (conversations.length === 0) {
            this.conversationList.innerHTML = '<p class="no-conversations">No saved conversations yet</p>';
            return;
        }

        this.conversationList.innerHTML = conversations.map(conv => `
            <div class="conversation-item" onclick="chatBot.loadConversation('${conv.filename}')">
                <h4>${conv.name}</h4>
                <div class="conversation-meta">
                    <span>${new Date(conv.created).toLocaleDateString()}</span>
                    <span>${conv.message_count} messages</span>
                </div>
                <div class="conversation-actions">
                    <button class="conversation-action" onclick="event.stopPropagation(); chatBot.deleteConversation('${conv.filename}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadConversation(filename) {
        try {
            const response = await fetch(`${this.serverUrl}/load-conversation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: filename })
            });

            const result = await response.json();
            if (result.success) {
                this.clearChatHistoryImmediate();
                
                // Load messages
                result.conversation.messages.forEach(msg => {
                    this.addMessage(msg.text, msg.sender);
                });
                
                this.conversationsPanel.classList.remove('active');
                this.showToast(`Loaded conversation: ${result.conversation.name}`, 'success');
            } else {
                this.showToast('Failed to load conversation: ' + result.error, 'error');
            }
        } catch (error) {
            this.showToast('Error loading conversation: ' + error.message, 'error');
        }
    }

    async deleteConversation(filename) {
        if (!confirm('Are you sure you want to delete this conversation?')) return;

        try {
            const response = await fetch(`${this.serverUrl}/delete-conversation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: filename })
            });

            const result = await response.json();
            if (result.success) {
                this.showToast(result.message, 'success');
                this.loadConversationsList();
            } else {
                this.showToast('Failed to delete conversation: ' + result.error, 'error');
            }
        } catch (error) {
            this.showToast('Error deleting conversation: ' + error.message, 'error');
        }
    }

    clearChatHistoryImmediate() {
        // Clear without confirmation (used for loading conversations)
        const welcomeMessage = this.chatMessages.querySelector('.message.bot-message');
        this.chatMessages.innerHTML = '';
        
        if (welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage.cloneNode(true));
            const welcomeTimeElement = this.chatMessages.querySelector('#welcomeTime');
            if (welcomeTimeElement) {
                welcomeTimeElement.textContent = this.getCurrentTime();
            }
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize the chatbot when the page loads
let chatBot;
document.addEventListener('DOMContentLoaded', () => {
    chatBot = new ChatBot();
    
    // Add entrance animation
    const container = document.querySelector('.container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        container.style.transition = 'all 0.5s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('messageInput').focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            chatBot.toggleSettings();
        }
        if (e.key === 'Escape') {
            chatBot.settingsPanel.classList.remove('active');
            chatBot.conversationsPanel.classList.remove('active');
        }
    });
});

// Connection status monitor
class ConnectionStatus {
    constructor() {
        this.isOnline = navigator.onLine;
        this.init();
    }
    
    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateStatus();
        });
        
        this.createIndicator();
    }
    
    createIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'connection-indicator';
        indicator.id = 'connectionIndicator';
        document.querySelector('.chat-header').appendChild(indicator);
        this.updateStatus();
    }
    
    updateStatus() {
        const statusElement = document.querySelector('.status');
        const indicator = document.getElementById('connectionIndicator');
        
        if (statusElement) {
            if (this.isOnline) {
                statusElement.textContent = 'Powered by Google Gemini';
                statusElement.style.color = 'rgba(255, 255, 255, 0.9)';
                if (indicator) indicator.classList.remove('offline');
            } else {
                statusElement.textContent = 'Offline - Check your connection';
                statusElement.style.color = '#fbbf24';
                if (indicator) indicator.classList.add('offline');
            }
        }
    }
}

// Initialize connection status monitor
document.addEventListener('DOMContentLoaded', () => {
    new ConnectionStatus();
});