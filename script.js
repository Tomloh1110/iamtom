// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    const messageDisplay = document.getElementById('messageDisplay');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const targetLanguageSelect = document.getElementById('targetLanguage');
    const historyList = document.getElementById('historyList');
    const newChatButton = document.getElementById('newChatButton');
    const chatTitleContainer = document.getElementById('chatTitleContainer');
    const chatTitleInput = document.getElementById('chatTitleInput');
    const saveTitleButton = document.getElementById('saveTitleButton');
    const cancelTitleButton = document.getElementById('cancelTitleButton');
    const currentChatTitle = document.getElementById('currentChatTitle');
    const editCurrentTitle = document.getElementById('editCurrentTitle');

    // 存储聊天历史
    let chatHistory = [];
    let currentChatId = null;
    let editingTitleForId = null;

    // 从localStorage加载历史记录
    loadChatHistory();

    // 添加发送消息的事件监听器
    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // 创建新聊天
    newChatButton.addEventListener('click', () => {
        createNewChat();
    });

    // 标题输入相关事件
    saveTitleButton.addEventListener('click', saveChatTitle);
    cancelTitleButton.addEventListener('click', hideTitleInput);
    chatTitleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveChatTitle();
        }
    });

    // 添加当前聊天标题编辑功能
    editCurrentTitle.addEventListener('click', () => {
        const chat = chatHistory.find(c => c.id === currentChatId);
        if (chat) {
            showTitleInput(currentChatId);
        }
    });

    function showTitleInput(chatId = null) {
        editingTitleForId = chatId;
        chatTitleInput.value = '';
        chatTitleInput.placeholder = chatId ? 'Enter new title...' : 'Enter title for new translation...';
        chatTitleContainer.style.display = 'block';
        chatTitleInput.focus();
    }

    function hideTitleInput() {
        chatTitleContainer.style.display = 'none';
        editingTitleForId = null;
        chatTitleInput.value = '';
    }

    function saveChatTitle() {
        const title = chatTitleInput.value.trim();
        if (!title) {
            chatTitleInput.focus();
            return;
        }

        if (editingTitleForId) {
            // 编辑现有聊天标题
            const chat = chatHistory.find(c => c.id === editingTitleForId);
            if (chat) {
                chat.title = title;
                if (editingTitleForId === currentChatId) {
                    currentChatTitle.textContent = title;
                }
                saveChatHistory();
                updateHistoryList();
            }
        } else {
            // 创建新聊天
            createNewChat(title);
        }

        hideTitleInput();
    }

    function createNewChat(title = 'New Chat') {
        const chatId = Date.now().toString();
        const chat = {
            id: chatId,
            title: title,
            messages: [],
            language: targetLanguageSelect.value,
            timestamp: new Date().toISOString()
        };

        chatHistory.unshift(chat);
        currentChatId = chatId;
        
        // 清空消息显示
        messageDisplay.innerHTML = '';
        messageInput.value = '';
        
        // 更新当前聊天标题
        currentChatTitle.textContent = title;
        
        // 更新历史记录显示
        updateHistoryList();
        
        // 保存到localStorage
        saveChatHistory();

        return chatId;
    }

    function loadChatHistory() {
        try {
            const saved = localStorage.getItem('translationChatHistory');
            if (saved) {
                chatHistory = JSON.parse(saved);
                updateHistoryList();
                
                // 如果有聊天记录，加载最新的一个
                if (chatHistory.length > 0) {
                    loadChat(chatHistory[0].id);
                } else {
                    currentChatId = createNewChat();
                }
            } else {
                currentChatId = createNewChat();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            currentChatId = createNewChat();
        }
    }

    function saveChatHistory() {
        try {
            // 限制历史记录数量，只保留最新的50条
            if (chatHistory.length > 50) {
                chatHistory = chatHistory.slice(0, 50);
            }
            localStorage.setItem('translationChatHistory', JSON.stringify(chatHistory));
            console.log('Chat history saved:', chatHistory);
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    function updateHistoryList() {
        historyList.innerHTML = '';
        chatHistory.forEach(chat => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            
            // 格式化时间
            const date = new Date(chat.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            historyItem.innerHTML = `
                <div class="history-item-content">
                    <span class="chat-icon">💬</span>
                    <div class="chat-info">
                        <span class="chat-title">${chat.title}</span>
                        <span class="chat-date">${formattedDate}</span>
                    </div>
                    <button class="edit-title-button" title="Edit title">✎</button>
                    <button class="delete-chat" title="Delete chat">🗑️</button>
                </div>
            `;
            
            // 添加点击事件
            historyItem.querySelector('.history-item-content').onclick = (e) => {
                if (!e.target.classList.contains('delete-chat') && 
                    !e.target.classList.contains('edit-title-button')) {
                    loadChat(chat.id);
                }
            };
            
            // 添加编辑标题按钮事件
            historyItem.querySelector('.edit-title-button').onclick = (e) => {
                e.stopPropagation();
                showTitleInput(chat.id);
            };
            
            // 添加删除按钮事件
            historyItem.querySelector('.delete-chat').onclick = (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            };
            
            historyList.appendChild(historyItem);
        });
    }

    function deleteChat(chatId) {
        const index = chatHistory.findIndex(c => c.id === chatId);
        if (index !== -1) {
            chatHistory.splice(index, 1);
            saveChatHistory();
            
            // 如果删除的是当前聊天，加载新的聊天
            if (chatId === currentChatId) {
                if (chatHistory.length > 0) {
                    loadChat(chatHistory[0].id);
                } else {
                    createNewChat();
                }
            } else {
                updateHistoryList();
            }
        }
    }

    function loadChat(chatId) {
        const chat = chatHistory.find(c => c.id === chatId);
        if (chat) {
            currentChatId = chatId;
            messageDisplay.innerHTML = '';
            targetLanguageSelect.value = chat.language;
            
            // 更新当前聊天标题
            currentChatTitle.textContent = chat.title;
            
            // 重新显示所有消息
            chat.messages.forEach(msg => {
                addMessageToChat(msg.text, msg.className, msg.lang, msg.addSpeechButton, false);
            });
            
            updateHistoryList();
            scrollToBottom();
        }
    }

    async function handleSendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // 确保有一个有效的聊天ID
        if (!currentChatId || !chatHistory.find(c => c.id === currentChatId)) {
            currentChatId = createNewChat();
        }

        // Get selected language
        const targetLanguage = targetLanguageSelect.value;

        try {
            // Display original message
            addMessageToChat(message, 'user-message', null, false, true);
            messageInput.value = '';

            // Show loading indicator
            const loadingMessage = addMessageToChat('Translating...', 'system-message', null, false, true);

            // Translate the message
            const translatedText = await translateMessage(message, targetLanguage);
            
            // Remove loading message and its history entry
            loadingMessage.remove();
            removeLoadingMessageFromHistory();

            // Display translated message with speech button
            if (translatedText) {
                addMessageToChat(translatedText, 'translated-message', targetLanguage, true, true);
            } else {
                throw new Error('Translation failed');
            }
        } catch (error) {
            console.error('Translation error:', error);
            console.log('Current chat ID:', currentChatId);
            console.log('Chat history:', chatHistory);
            addMessageToChat('Error: Could not translate message. Please try again.', 'error-message', null, false, true);
        }

        // Scroll to latest message
        scrollToBottom();
    }

    function addMessageToChat(message, className, lang = null, addSpeechButton = false, saveToHistory = true) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${className}`;
        
        if (lang) {
            const langIndicator = document.createElement('span');
            langIndicator.className = 'language-indicator';
            langIndicator.textContent = `[${lang.toUpperCase()}]`;
            messageElement.appendChild(langIndicator);
        }

        const textElement = document.createElement('span');
        textElement.className = 'message-text';
        textElement.textContent = message;
        messageElement.appendChild(textElement);

        if (addSpeechButton) {
            const speechButton = document.createElement('button');
            speechButton.className = 'speech-button';
            speechButton.innerHTML = '🎧';
            speechButton.title = 'Play/Pause pronunciation';
            
            let isPlaying = false;
            speechButton.onclick = () => {
                if (!isPlaying) {
                    // 开始播放
                    isPlaying = true;
                    speechButton.innerHTML = '⏸️';
                    playTranslation(message, lang, () => {
                        isPlaying = false;
                        speechButton.innerHTML = '🎧';
                    });
                } else {
                    // 暂停播放
                    isPlaying = false;
                    speechButton.innerHTML = '🎧';
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio = null;
                    }
                    if (currentSpeechUtterance) {
                        window.speechSynthesis.cancel();
                        currentSpeechUtterance = null;
                    }
                }
            };
            messageElement.appendChild(speechButton);
        }

        messageDisplay.appendChild(messageElement);

        if (saveToHistory) {
            updateChatHistory(className, message, lang, addSpeechButton);
        }

        return messageElement;
    }

    function updateChatHistory(className, message, lang, addSpeechButton, save = true) {
        const currentChat = chatHistory.find(c => c.id === currentChatId);
        if (!currentChat) {
            // 如果没有当前聊天，创建一个新的
            currentChatId = createNewChat();
            return updateChatHistory(className, message, lang, addSpeechButton, save);
        }

        currentChat.messages.push({
            text: message,
            className,
            lang,
            addSpeechButton
        });

        // 如果是用户消息且聊天标题还是默认的，用第一条消息作为标题
        if (currentChat.title === 'New Chat' && className === 'user-message') {
            currentChat.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            currentChatTitle.textContent = currentChat.title;
            updateHistoryList();
        }

        if (save) {
            saveChatHistory();
        }
    }

    function scrollToBottom() {
        messageDisplay.scrollTop = messageDisplay.scrollHeight;
    }

    // 添加全局音频控制
    let currentAudio = null;
    let currentSpeechUtterance = null;

    async function playTranslation(text, lang, onEnd) {
        // 如果有正在播放的音频，先停止
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        if (currentSpeechUtterance) {
            window.speechSynthesis.cancel();
            currentSpeechUtterance = null;
        }

        try {
            // TTSMaker API配置
            const apiKey = 'YOUR_TTSMAKER_API_KEY';
            const url = 'https://api.ttsmaker.com/v1/speech';
            
            // 根据语言选择合适的声音ID
            let voiceId;
            switch(lang) {
                case 'zh':
                    voiceId = 'zh-CN-1';
                    break;
                case 'en':
                    voiceId = 'en-US-1';
                    break;
                case 'ja':
                    voiceId = 'ja-JP-1';
                    break;
                default:
                    voiceId = 'en-US-1';
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    text: text,
                    voice_id: voiceId,
                    audio_format: 'mp3',
                    sample_rate: 24000,
                    speed: 1.0,
                    pitch: 1.0,
                    volume: 1.0
                })
            });

            if (!response.ok) {
                throw new Error('TTS API request failed');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudio = audio;
            
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                currentAudio = null;
                onEnd();
            };

            audio.play();
        } catch (error) {
            console.error('TTS Error:', error);
            fallbackToWebSpeech(text, lang, onEnd);
        }
    }

    function fallbackToWebSpeech(text, lang, onEnd) {
        // 停止任何正在播放的语音
        window.speechSynthesis.cancel();

        // 创建新的语音实例
        const utterance = new SpeechSynthesisUtterance(text);
        currentSpeechUtterance = utterance;
        
        // 设置语音参数
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // 选择最佳声音
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.lang.startsWith(lang) && 
            (voice.name.includes('Google') || voice.name.includes('Natural'))
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
            currentSpeechUtterance = null;
            onEnd();
        };

        window.speechSynthesis.speak(utterance);
    }

    async function translateMessage(text, targetLang) {
        try {
            // 使用Google翻译API的替代端点
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&dj=1&q=${encodeURIComponent(text)}`;
            
                    const response = await fetch(url);
                    const data = await response.json();
                    
            if (data && data.sentences) {
                        // 合并所有翻译片段
                const translatedText = data.sentences
                    .map(sentence => sentence.trans)
                    .join('');
                        
                        if (translatedText) {
                            return translatedText;
                        }
                    }
            
            throw new Error('Translation failed');
        } catch (error) {
            console.error('Translation Error:', error);
            
            // 尝试使用备用API
            try {
                const backupUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`;
                const backupResponse = await fetch(backupUrl);
                const backupData = await backupResponse.json();
                
                if (backupData.responseStatus === 200 && backupData.responseData.translatedText) {
                    return backupData.responseData.translatedText;
                }
            } catch (backupError) {
                console.error('Backup Translation Error:', backupError);
            }
            
            throw new Error('Translation service is currently unavailable');
        }
    }

    function removeLoadingMessageFromHistory() {
        const currentChat = chatHistory.find(c => c.id === currentChatId);
        if (currentChat) {
            // 移除最后一条"Translating..."消息
            const loadingIndex = currentChat.messages.findIndex(msg => 
                msg.text === 'Translating...' && msg.className === 'system-message'
            );
            if (loadingIndex !== -1) {
                currentChat.messages.splice(loadingIndex, 1);
                saveChatHistory();
            }
        }
    }

    // 预加载语音列表
    window.speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}); 