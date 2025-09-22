#!/usr/bin/env python3
"""
Simple AI Chatbot HTTP Server
Run this file to start the chatbot on http://localhost:8000
"""

import http.server
import socketserver
import json
import urllib.parse
import requests
from datetime import datetime
import os
import webbrowser
import threading
import time
import sys
import base64
import mimetypes
from pathlib import Path

# Gemini API configuration
GEMINI_API_KEY = "Enter your api key"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

class ChatBotHandler(http.server.SimpleHTTPRequestHandler):
    # Class variable to store uploaded file contexts
    uploaded_files_context = {}
    
    def log_message(self, format, *args):
        """Override to suppress HTTP request logs and add custom messages"""
        # Suppress default HTTP logs and add custom messages
        if "GET" in args[0]:
            if "favicon.ico" not in args[0]:
                print(f"🌐 User accessed the chatbot interface")
        elif "POST" in args[0]:
            if "/chat" in args[0]:
                print(f"💬 AI conversation in progress...")
            elif "/search" in args[0]:
                print(f"🔍 Web search request received...")
            elif "/wikipedia" in args[0]:
                print(f"📚 Wikipedia search request received...")
            elif "/upload" in args[0]:
                print(f"📁 File upload in progress...")
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/chat':
            self.handle_chat()
        elif self.path == '/search':
            self.handle_search()
        elif self.path == '/upload':
            self.handle_file_upload()
        elif self.path == '/wikipedia':
            self.handle_wikipedia_search()
        elif self.path == '/save-conversation':
            self.handle_save_conversation()
        elif self.path == '/load-conversation':
            self.handle_load_conversation()
        elif self.path == '/list-conversations':
            self.handle_list_conversations()
        elif self.path == '/delete-conversation':
            self.handle_delete_conversation()
        else:
            self.send_error(404)
    
    def handle_chat(self):
        """Handle chat API requests"""
        try:
            # Get request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            user_message = data.get('message', '')
            clear_context = data.get('clear_context', False)
            
            if not user_message:
                self.send_json_response({'error': 'No message provided'}, 400)
                return
            
            # Clear file context if requested
            if clear_context:
                self.uploaded_files_context.clear()
            
            # Get response from Gemini API
            response_text = self.get_gemini_response(user_message)
            self.send_json_response({'response': response_text})
            
        except Exception as e:
            self.send_json_response({'error': f'Server error: {str(e)}'}, 500)
    
    def handle_search(self):
        """Handle search API requests with real Google search"""
        try:
            # Get request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            query = data.get('query', '')
            if not query:
                self.send_json_response({'error': 'No search query provided'}, 400)
                return
            
            # Real web search using requests
            search_results = self.perform_web_search(query)
            self.send_json_response(search_results)
            
        except Exception as e:
            self.send_json_response({'error': f'Search error: {str(e)}'}, 500)
    
    def perform_web_search(self, query):
        """Perform actual web search"""
        try:
            # Use DuckDuckGo instant answers API (free and no API key required)
            search_url = f"https://api.duckduckgo.com/"
            params = {
                'q': query,
                'format': 'json',
                'no_html': '1',
                'skip_disambig': '1'
            }
            
            response = requests.get(search_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract relevant information
                results = []
                
                # Add instant answer if available
                if data.get('AbstractText'):
                    results.append({
                        'title': data.get('Heading', 'Instant Answer'),
                        'snippet': data.get('AbstractText'),
                        'url': data.get('AbstractURL', '#')
                    })
                
                # Add related topics
                for topic in data.get('RelatedTopics', [])[:3]:
                    if isinstance(topic, dict) and 'Text' in topic:
                        results.append({
                            'title': topic.get('Text', '').split(' - ')[0] if ' - ' in topic.get('Text', '') else 'Related Topic',
                            'snippet': topic.get('Text', ''),
                            'url': topic.get('FirstURL', '#')
                        })
                
                # If no results from DuckDuckGo, provide a helpful response
                if not results:
                    results.append({
                        'title': f'Search: {query}',
                        'snippet': f'I searched for "{query}" but couldn\'t find specific instant answers. You might want to search directly on Google, Bing, or other search engines for more comprehensive results.',
                        'url': f'https://www.google.com/search?q={urllib.parse.quote(query)}'
                    })
                
                return {
                    'query': query,
                    'results': results,
                    'status': 'success'
                }
            
            else:
                return {
                    'query': query,
                    'results': [{
                        'title': 'Search Error',
                        'snippet': 'Unable to perform web search at the moment. Please try again later.',
                        'url': '#'
                    }],
                    'status': 'error'
                }
                
        except Exception as e:
            return {
                'query': query,
                'results': [{
                    'title': 'Search Error',
                    'snippet': f'Search temporarily unavailable: {str(e)}',
                    'url': f'https://www.google.com/search?q={urllib.parse.quote(query)}'
                }],
                'status': 'error'
            }
    
    def handle_file_upload(self):
        """Handle file upload requests"""
        try:
            # Get request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse multipart form data (simplified version)
            # In a production environment, you'd use a proper multipart parser
            data = json.loads(post_data.decode('utf-8'))
            
            file_data = data.get('fileData', '')
            file_name = data.get('fileName', 'unknown')
            file_type = data.get('fileType', 'application/octet-stream')
            
            if not file_data:
                self.send_json_response({'error': 'No file data provided'}, 400)
                return
            
            # Process the file
            file_content = self.process_uploaded_file(file_data, file_name, file_type)
            
            # Store file context for future reference
            self.uploaded_files_context[file_name] = {
                'content': file_content,
                'file_type': file_type,
                'file_name': file_name,
                'upload_time': datetime.now().isoformat(),
                'raw_content': self.extract_raw_content(file_data, file_name, file_type)
            }
            
            # Send response
            self.send_json_response({
                'message': f'File "{file_name}" uploaded successfully!',
                'content': file_content,
                'fileName': file_name,
                'fileType': file_type
            })
            
        except Exception as e:
            self.send_json_response({'error': f'Upload error: {str(e)}'}, 500)
    
    def extract_raw_content(self, file_data, file_name, file_type):
        """Extract raw content for AI analysis"""
        try:
            file_bytes = base64.b64decode(file_data.split(',')[1] if ',' in file_data else file_data)
            
            # For text files, return the actual content
            if file_type.startswith('text/') or file_name.endswith(('.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml', '.csv')):
                try:
                    content = file_bytes.decode('utf-8')
                    return content
                except UnicodeDecodeError:
                    try:
                        content = file_bytes.decode('utf-8-sig')
                        return content
                    except UnicodeDecodeError:
                        try:
                            content = file_bytes.decode('cp1252')
                            return content
                        except UnicodeDecodeError:
                            content = file_bytes.decode('utf-8', errors='ignore')
                            return content
            
            # For other files, return metadata
            return f"Binary file: {file_name}, Type: {file_type}, Size: {len(file_bytes)} bytes"
            
        except Exception as e:
            return f"Error extracting content: {str(e)}"
    
    def process_uploaded_file(self, file_data, file_name, file_type):
        """Process uploaded file and extract content"""
        try:
            # Decode base64 file data
            file_bytes = base64.b64decode(file_data.split(',')[1] if ',' in file_data else file_data)
            file_size = len(file_bytes)
            
            # Text files with proper encoding detection
            if file_type.startswith('text/') or file_name.endswith(('.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml', '.csv')):
                try:
                    # Try UTF-8 first
                    content = file_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    try:
                        # Try UTF-8 with BOM
                        content = file_bytes.decode('utf-8-sig')
                    except UnicodeDecodeError:
                        try:
                            # Try Windows encoding
                            content = file_bytes.decode('cp1252')
                        except UnicodeDecodeError:
                            # Last resort - ignore errors
                            content = file_bytes.decode('utf-8', errors='ignore')
                
                # Clean up content
                content = content.strip()
                content_preview = content[:3000] if len(content) > 3000 else content
                
                result = f"✅ **{file_name}** ({self.format_file_size(file_size)}) - Content extracted successfully!\n\n"
                
                # Add file type specific analysis
                if file_name.endswith('.py'):
                    result += f"**Python File Analysis:**\n"
                    lines = content.split('\n')
                    functions = [line.strip() for line in lines if line.strip().startswith('def ')]
                    classes = [line.strip() for line in lines if line.strip().startswith('class ')]
                    imports = [line.strip() for line in lines if line.strip().startswith(('import ', 'from '))]
                    
                    if imports:
                        result += f"📦 **Imports ({len(imports)}):** {', '.join(imports[:5])}{'...' if len(imports) > 5 else ''}\n"
                    if classes:
                        result += f"🏗️ **Classes ({len(classes)}):** {', '.join([c.split('(')[0].replace('class ', '') for c in classes[:3]])}{'...' if len(classes) > 3 else ''}\n"
                    if functions:
                        result += f"⚙️ **Functions ({len(functions)}):** {', '.join([f.split('(')[0].replace('def ', '') for f in functions[:5]])}{'...' if len(functions) > 5 else ''}\n"
                    result += f"📝 **Total Lines:** {len(lines)}\n\n"
                
                elif file_name.endswith('.json'):
                    try:
                        import json
                        json_data = json.loads(content)
                        result += f"**JSON File Analysis:**\n"
                        result += f"📊 **Structure:** {type(json_data).__name__}\n"
                        if isinstance(json_data, dict):
                            result += f"🔑 **Keys ({len(json_data)}):** {', '.join(list(json_data.keys())[:10])}{'...' if len(json_data) > 10 else ''}\n"
                        elif isinstance(json_data, list):
                            result += f"📋 **Items:** {len(json_data)}\n"
                        result += "\n"
                    except:
                        pass
                
                elif file_name.endswith('.csv'):
                    lines = content.split('\n')
                    if lines:
                        headers = lines[0].split(',')
                        result += f"**CSV File Analysis:**\n"
                        result += f"📊 **Columns ({len(headers)}):** {', '.join(headers[:8])}{'...' if len(headers) > 8 else ''}\n"
                        result += f"📋 **Rows:** {len(lines) - 1}\n\n"
                
                result += f"**📄 Content Preview:**\n```\n{content_preview}\n```"
                if len(content) > 3000:
                    result += f"\n\n*Note: Showing first 3000 characters of {len(content)} total characters.*"
                
                return result
            
            elif file_type.startswith('image/'):
                # Enhanced image analysis
                result = f"✅ **{file_name}** ({self.format_file_size(file_size)}) - Image uploaded successfully!\n\n"
                result += f"🖼️ **Image Details:**\n"
                result += f"📁 **Format:** {file_type}\n"
                result += f"📏 **Size:** {self.format_file_size(file_size)}\n\n"
                result += f"**Analysis Ready!** I can help you with:\n"
                result += f"• Describe what you see in the image\n"
                result += f"• Identify objects, text, or patterns\n"
                result += f"• Extract text if it contains any (OCR)\n"
                result += f"• Suggest improvements or modifications\n"
                result += f"• Answer questions about the image content\n\n"
                result += f"💡 *Ask me: \"What do you see in this image?\" or \"Extract text from this image\"*"
                return result
            
            elif file_name.endswith('.pdf'):
                # Enhanced PDF handling
                result = f"✅ **{file_name}** ({self.format_file_size(file_size)}) - PDF uploaded successfully!\n\n"
                result += f"📄 **PDF Details:**\n"
                result += f"📏 **Size:** {self.format_file_size(file_size)}\n\n"
                
                # Try to extract basic PDF info
                try:
                    # Simple PDF header check
                    if file_bytes.startswith(b'%PDF'):
                        pdf_version = file_bytes[:20].decode('ascii', errors='ignore')
                        result += f"📋 **Version:** {pdf_version}\n"
                except:
                    pass
                
                result += f"**Analysis Ready!** I can help you with:\n"
                result += f"• Summarize document content\n"
                result += f"• Extract key information\n"
                result += f"• Answer questions about the document\n"
                result += f"• Identify document structure\n\n"
                result += f"💡 *Ask me: \"Summarize this PDF\" or \"What is this document about?\"*\n"
                result += f"⚠️ *Note: For full text extraction, please describe the content or ask specific questions.*"
                return result
            
            elif file_name.endswith(('.doc', '.docx')):
                # Enhanced Word document handling
                result = f"✅ **{file_name}** ({self.format_file_size(file_size)}) - Word document uploaded successfully!\n\n"
                result += f"📄 **Document Details:**\n"
                result += f"📁 **Format:** {'Word Document (DOCX)' if file_name.endswith('.docx') else 'Word Document (DOC)'}\n"
                result += f"📏 **Size:** {self.format_file_size(file_size)}\n\n"
                result += f"**Analysis Ready!** I can help you with:\n"
                result += f"• Document structure analysis\n"
                result += f"• Content summarization\n"
                result += f"• Key points extraction\n"
                result += f"• Format and style suggestions\n\n"
                result += f"💡 *Ask me: \"Analyze this document\" or \"What are the main topics?\"*\n"
                result += f"⚠️ *Note: Please describe the content for detailed analysis.*"
                return result
            
            elif file_name.endswith(('.xls', '.xlsx')):
                # Enhanced Excel handling
                result = f"✅ **{file_name}** ({self.format_file_size(file_size)}) - Excel spreadsheet uploaded successfully!\n\n"
                result += f"📊 **Spreadsheet Details:**\n"
                result += f"📁 **Format:** {'Excel Workbook (XLSX)' if file_name.endswith('.xlsx') else 'Excel Workbook (XLS)'}\n"
                result += f"📏 **Size:** {self.format_file_size(file_size)}\n\n"
                result += f"**Analysis Ready!** I can help you with:\n"
                result += f"• Data analysis and insights\n"
                result += f"• Chart and graph suggestions\n"
                result += f"• Formula recommendations\n"
                result += f"• Data cleaning strategies\n"
                result += f"• Statistical analysis\n\n"
                result += f"💡 *Ask me: \"Analyze this spreadsheet\" or \"What patterns do you see?\"*\n"
                result += f"⚠️ *Note: Please describe the data structure for detailed analysis.*"
                return result
            
            else:
                # Generic file handling with better analysis
                result = f"✅ **{file_name}** ({self.format_file_size(file_size)}) - File uploaded successfully!\n\n"
                result += f"📁 **File Details:**\n"
                result += f"📄 **Type:** {file_type}\n"
                result += f"📏 **Size:** {self.format_file_size(file_size)}\n\n"
                
                # Try to detect file content
                try:
                    sample = file_bytes[:1000]
                    if sample.startswith((b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08')):
                        result += f"🗜️ **Archive/Compressed file detected**\n"
                    elif b'<html' in sample.lower() or b'<!doctype' in sample.lower():
                        result += f"🌐 **HTML content detected**\n"
                    elif sample.startswith(b'\x89PNG') or sample.startswith(b'\xff\xd8\xff'):
                        result += f"🖼️ **Image file detected**\n"
                    elif sample.startswith(b'%PDF'):
                        result += f"📄 **PDF document detected**\n"
                except:
                    pass
                
                result += f"\n**Analysis Ready!** I can help you with:\n"
                result += f"• File format identification\n"
                result += f"• Content analysis based on description\n"
                result += f"• Usage recommendations\n"
                result += f"• Processing suggestions\n\n"
                result += f"💡 *Ask me: \"What type of file is this?\" or describe what it contains.*"
                return result
                
        except Exception as e:
            return f"❌ **Error processing {file_name}:** {str(e)}\n\nPlease try uploading the file again or contact support if the issue persists."
    
    def format_file_size(self, bytes_size):
        """Format file size in human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_size < 1024.0:
                return f"{bytes_size:.1f} {unit}"
            bytes_size /= 1024.0
        return f"{bytes_size:.1f} TB"
    
    def handle_wikipedia_search(self):
        """Handle Wikipedia search requests"""
        try:
            # Get request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            query = data.get('query', '')
            if not query:
                self.send_json_response({'error': 'No search query provided'}, 400)
                return
            
            # Search Wikipedia
            wikipedia_results = self.search_wikipedia(query)
            self.send_json_response(wikipedia_results)
            
        except Exception as e:
            self.send_json_response({'error': f'Wikipedia search error: {str(e)}'}, 500)
    
    def search_wikipedia(self, query):
        """Search Wikipedia for articles"""
        try:
            # Wikipedia API endpoint
            wikipedia_api = "https://en.wikipedia.org/api/rest_v1/page/summary/"
            search_api = "https://en.wikipedia.org/w/api.php"
            
            # First, search for the article
            search_params = {
                'action': 'query',
                'format': 'json',
                'list': 'search',
                'srsearch': query,
                'srlimit': 3
            }
            
            search_response = requests.get(search_api, params=search_params, timeout=10)
            
            if search_response.status_code == 200:
                search_data = search_response.json()
                
                results = []
                
                if 'query' in search_data and 'search' in search_data['query']:
                    for item in search_data['query']['search'][:3]:
                        title = item['title']
                        
                        # Get detailed summary for each article
                        try:
                            summary_url = f"{wikipedia_api}{urllib.parse.quote(title)}"
                            summary_response = requests.get(summary_url, timeout=5)
                            
                            if summary_response.status_code == 200:
                                summary_data = summary_response.json()
                                
                                results.append({
                                    'title': summary_data.get('title', title),
                                    'summary': summary_data.get('extract', 'No summary available'),
                                    'url': summary_data.get('content_urls', {}).get('desktop', {}).get('page', '#'),
                                    'thumbnail': summary_data.get('thumbnail', {}).get('source', '') if summary_data.get('thumbnail') else ''
                                })
                            else:
                                results.append({
                                    'title': title,
                                    'summary': item.get('snippet', 'No summary available').replace('<span class="searchmatch">', '').replace('</span>', ''),
                                    'url': f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title)}",
                                    'thumbnail': ''
                                })
                                
                        except Exception as e:
                            # Fallback to basic info
                            results.append({
                                'title': title,
                                'summary': item.get('snippet', 'No summary available').replace('<span class="searchmatch">', '').replace('</span>', ''),
                                'url': f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title)}",
                                'thumbnail': ''
                            })
                
                if not results:
                    results.append({
                        'title': 'No Wikipedia articles found',
                        'summary': f'No Wikipedia articles were found for "{query}". Try rephrasing your search or checking the spelling.',
                        'url': f'https://en.wikipedia.org/wiki/Special:Search?search={urllib.parse.quote(query)}',
                        'thumbnail': ''
                    })
                
                return {
                    'query': query,
                    'results': results,
                    'source': 'Wikipedia',
                    'status': 'success'
                }
            
            else:
                return {
                    'query': query,
                    'results': [{
                        'title': 'Wikipedia Search Error',
                        'summary': 'Unable to search Wikipedia at the moment. Please try again later.',
                        'url': '#',
                        'thumbnail': ''
                    }],
                    'source': 'Wikipedia',
                    'status': 'error'
                }
                
        except Exception as e:
                return {
                    'query': query,
                    'results': [{
                        'title': 'Wikipedia Search Error',
                        'summary': f'Wikipedia search temporarily unavailable: {str(e)}',
                        'url': f'https://en.wikipedia.org/wiki/Special:Search?search={urllib.parse.quote(query)}',
                        'thumbnail': ''
                    }],
                    'source': 'Wikipedia',
                    'status': 'error'
                }
    
    def handle_save_conversation(self):
        """Handle conversation save requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            conversation_name = data.get('name', f'Conversation_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
            messages = data.get('messages', [])
            
            # Create conversations directory if it doesn't exist
            conversations_dir = Path('conversations')
            conversations_dir.mkdir(exist_ok=True)
            
            # Save conversation to file
            conversation_file = conversations_dir / f"{conversation_name}.json"
            conversation_data = {
                'name': conversation_name,
                'created': datetime.now().isoformat(),
                'messages': messages
            }
            
            with open(conversation_file, 'w', encoding='utf-8') as f:
                json.dump(conversation_data, f, indent=2, ensure_ascii=False)
            
            self.send_json_response({
                'success': True,
                'message': f'Conversation saved as "{conversation_name}"',
                'filename': conversation_name
            })
            
        except Exception as e:
            self.send_json_response({'error': f'Save error: {str(e)}'}, 500)
    
    def handle_load_conversation(self):
        """Handle conversation load requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            filename = data.get('filename', '')
            if not filename:
                self.send_json_response({'error': 'No filename provided'}, 400)
                return
            
            conversation_file = Path('conversations') / f"{filename}.json"
            
            if not conversation_file.exists():
                self.send_json_response({'error': 'Conversation not found'}, 404)
                return
            
            with open(conversation_file, 'r', encoding='utf-8') as f:
                conversation_data = json.load(f)
            
            self.send_json_response({
                'success': True,
                'conversation': conversation_data
            })
            
        except Exception as e:
            self.send_json_response({'error': f'Load error: {str(e)}'}, 500)
    
    def handle_list_conversations(self):
        """Handle conversation list requests"""
        try:
            conversations_dir = Path('conversations')
            conversations = []
            
            if conversations_dir.exists():
                for conversation_file in conversations_dir.glob('*.json'):
                    try:
                        with open(conversation_file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        
                        conversations.append({
                            'filename': conversation_file.stem,
                            'name': data.get('name', conversation_file.stem),
                            'created': data.get('created', ''),
                            'message_count': len(data.get('messages', []))
                        })
                    except Exception as e:
                        # Skip corrupted files
                        continue
            
            # Sort by creation date (newest first)
            conversations.sort(key=lambda x: x['created'], reverse=True)
            
            self.send_json_response({
                'success': True,
                'conversations': conversations
            })
            
        except Exception as e:
            self.send_json_response({'error': f'List error: {str(e)}'}, 500)
    
    def handle_delete_conversation(self):
        """Handle conversation delete requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            filename = data.get('filename', '')
            if not filename:
                self.send_json_response({'error': 'No filename provided'}, 400)
                return
            
            conversation_file = Path('conversations') / f"{filename}.json"
            
            if not conversation_file.exists():
                self.send_json_response({'error': 'Conversation not found'}, 404)
                return
            
            conversation_file.unlink()
            
            self.send_json_response({
                'success': True,
                'message': f'Conversation "{filename}" deleted successfully'
            })
            
        except Exception as e:
            self.send_json_response({'error': f'Delete error: {str(e)}'}, 500)
    
    def get_gemini_response(self, message):
        """Get response from Gemini API with file context"""
        try:
            # Prepare the message with file context if available
            enhanced_message = message
            
            # Add file context if there are uploaded files
            if self.uploaded_files_context:
                context_info = "\n\n=== UPLOADED FILE CONTEXT ===\n"
                for filename, file_info in self.uploaded_files_context.items():
                    context_info += f"\nFile: {filename} ({file_info['file_type']})\n"
                    
                    # Add raw content for text files
                    raw_content = file_info.get('raw_content', '')
                    if raw_content and len(raw_content) < 5000:  # Only include if not too long
                        context_info += f"Content: {raw_content[:2000]}{'...' if len(raw_content) > 2000 else ''}\n"
                    else:
                        context_info += f"Content: [Binary file or content too large]\n"
                
                context_info += "=== END FILE CONTEXT ===\n\n"
                enhanced_message = context_info + "User Question: " + message
            
            headers = {
                'Content-Type': 'application/json',
            }
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": enhanced_message
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,  # Increased for better file analysis
                },
                "safetySettings": [
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            }
            
            response = requests.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        return candidate['content']['parts'][0]['text']
                    else:
                        return "❌ Invalid response format from Gemini API"
                else:
                    return "❌ No response from Gemini API"
            else:
                return f"❌ Gemini API error: {response.status_code}"
                
        except requests.exceptions.Timeout:
            return "❌ Request timeout. Please try again."
        except requests.exceptions.ConnectionError:
            return "❌ Connection error. Please check your internet connection."
        except Exception as e:
            return f"❌ Error: {str(e)}"
    
    def send_json_response(self, data, status_code=200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_json = json.dumps(data)
        self.wfile.write(response_json.encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def open_browser():
    """Open browser after a short delay"""
    time.sleep(1.5)  # Wait for server to start
    webbrowser.open('http://localhost:8000')

def main():
    PORT = 8000
    
    print("🤖 Starting Simple AI Chatbot Server...")
    print(f"📡 Server will be available at: http://localhost:{PORT}")
    print(f"🔗 Open http://localhost:{PORT} in your browser to use the chatbot")
    print("⚡ Press Ctrl+C to stop the server")
    print("-" * 50)
    
    # Change to the script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Start browser in a separate thread
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    with socketserver.TCPServer(("", PORT), ChatBotHandler) as httpd:
        try:
            print("✅ Server started successfully!")
            print("🌐 Opening browser automatically...")
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped. Thanks for using AI Chatbot!")
        except OSError as e:
            if "10048" in str(e):
                print(f"❌ Port {PORT} is already in use. Please close any other servers and try again.")
            else:
                print(f"❌ Server error: {e}")

if __name__ == "__main__":
    main()