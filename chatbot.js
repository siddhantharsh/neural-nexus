class VirtualLabChatbot {
    constructor() {
        this.container = null;
        this.isOpen = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests
        this.messages = [];
        this.initialize();
        this.loadChatHistory();
    }

    initialize() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'vl-chatbot-container';
        
        // Create button
        const button = document.createElement('button');
        button.className = 'vl-chatbot-button';
        const img = document.createElement('img');
        img.src = '/resources/neuron.gif';
        img.alt = 'Neuron';
        button.appendChild(img);
        
        // Create window
        const window = document.createElement('div');
        window.className = 'vl-chatbot-window';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'vl-chatbot-header';
        
        // Add GIF to header
        const headerImg = document.createElement('img');
        headerImg.src = '/resources/neuron.gif';
        headerImg.alt = 'Neuron';
        headerImg.className = 'vl-chatbot-header-gif';
        header.appendChild(headerImg);
        
        // Title and online tag container
        const titleContainer = document.createElement('div');
        titleContainer.className = 'vl-chatbot-title-container';
        
        const title = document.createElement('div');
        title.className = 'vl-chatbot-title';
        title.textContent = 'Neuron';
        
        const onlineTag = document.createElement('span');
        onlineTag.className = 'vl-chatbot-online';
        onlineTag.textContent = 'Online';
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(onlineTag);
        header.appendChild(titleContainer);
        
        const close = document.createElement('button');
        close.className = 'vl-chatbot-close';
        close.textContent = '×';
        header.appendChild(close);
        
        // Create messages container
        const messages = document.createElement('div');
        messages.className = 'vl-chatbot-messages';
        
        // Create input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'vl-chatbot-input-container';
        const input = document.createElement('input');
        input.className = 'vl-chatbot-input';
        input.type = 'text';
        input.placeholder = 'Ask Neuron...';
        const send = document.createElement('button');
        send.className = 'vl-chatbot-send';
        send.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/></svg>';
        inputContainer.appendChild(input);
        inputContainer.appendChild(send);
        
        // Assemble window
        window.appendChild(header);
        window.appendChild(messages);
        window.appendChild(inputContainer);
        
        // Assemble container
        this.container.appendChild(button);
        this.container.appendChild(window);
        
        // Add to document
        document.body.appendChild(this.container);
        
        // Add event listeners
        button.addEventListener('click', () => this.toggleWindow());
        close.addEventListener('click', () => this.toggleWindow());
        send.addEventListener('click', () => this.handleSend(input));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSend(input);
            }
        });

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .vl-chatbot-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            }

            .vl-chatbot-button {
                width: 60px;
                height: 60px;
                border: none;
                background: transparent;
                cursor: pointer;
                padding: 0;
                transition: none;
                box-shadow: none;
            }

            .vl-chatbot-button:hover {
                transform: none;
                box-shadow: none;
            }

            .vl-chatbot-button img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                border-radius: 0;
                background: none;
                transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .vl-chatbot-button:hover img {
                transform: scale(1.15);
            }

            .vl-chatbot-window {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 380px;
                height: 600px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                flex-direction: column;
                overflow: hidden;
                transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transform: scaleY(0.95);
                display: flex;
            }
            .vl-chatbot-window.active {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
                transform: scaleY(1);
                animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .vl-chatbot-header {
                padding: 20px;
                background: rgba(248, 249, 250, 0.8);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(233, 236, 239, 0.5);
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .vl-chatbot-header-gif {
                width: 36px;
                height: 36px;
                object-fit: contain;
                margin-right: 8px;
                border-radius: 0;
                background: none;
            }
            .vl-chatbot-title-container {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .vl-chatbot-title {
                font-weight: 600;
                color: #1a1a1a;
                font-size: 18px;
                letter-spacing: 0.5px;
            }
            .vl-chatbot-online {
                background: #e6fbe6;
                color: #27ae60;
                font-size: 12px;
                font-weight: 500;
                border-radius: 8px;
                padding: 2px 8px;
                margin-left: 4px;
                border: 1px solid #b2f2b2;
            }
            .vl-chatbot-close {
                width: 36px;
                height: 36px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: none;
                border: none;
                font-size: 24px;
                color: #6c757d;
                cursor: pointer;
                border-radius: 50%;
                transition: all 0.2s ease;
                margin-left: auto;
            }
            .vl-chatbot-close:hover {
                background: rgba(0, 0, 0, 0.05);
                color: #1a1a1a;
            }
            .vl-chatbot-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                scrollbar-width: thin;
                scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
            }
            .vl-chatbot-messages::-webkit-scrollbar {
                width: 6px;
            }
            .vl-chatbot-messages::-webkit-scrollbar-track {
                background: transparent;
            }
            .vl-chatbot-messages::-webkit-scrollbar-thumb {
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }
            .vl-chatbot-message {
                max-width: 85%;
                padding: 14px 18px;
                border-radius: 16px;
                font-size: 15px;
                line-height: 1.5;
                animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(15px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .vl-chatbot-message.user {
                background: #007bff;
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
            }
            .vl-chatbot-message.bot {
                background: rgba(248, 249, 250, 0.8);
                backdrop-filter: blur(10px);
                color: #1a1a1a;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .vl-chatbot-input-container {
                padding: 20px;
                background: rgba(248, 249, 250, 0.8);
                backdrop-filter: blur(10px);
                border-top: 1px solid rgba(233, 236, 239, 0.5);
                display: flex;
                gap: 12px;
            }
            .vl-chatbot-input {
                flex: 1;
                padding: 14px 18px;
                border: 1px solid rgba(222, 226, 230, 0.8);
                border-radius: 12px;
                font-size: 15px;
                outline: none;
                transition: all 0.3s ease;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
            }
            .vl-chatbot-input:focus {
                border-color: #007bff;
                box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
            }
            .vl-chatbot-send {
                background: #007bff;
                color: white;
                border: none;
                border-radius: 12px;
                width: 48px;
                height: 48px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
            }
            .vl-chatbot-send:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
            }
            .vl-chatbot-send:active {
                transform: translateY(0);
            }
            .vl-chatbot-send svg {
                width: 20px;
                height: 20px;
                transition: transform 0.3s ease;
            }
            .vl-chatbot-send:hover svg {
                transform: translateX(2px);
            }
            .vl-chatbot-typing {
                display: flex;
                gap: 6px;
                padding: 14px 18px;
                background: rgba(248, 249, 250, 0.8);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                align-self: flex-start;
                margin-top: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .vl-chatbot-typing-dot {
                width: 8px;
                height: 8px;
                background: #6c757d;
                border-radius: 50%;
                animation: typingDot 1.4s infinite ease-in-out;
            }
            .vl-chatbot-typing-dot:nth-child(1) { animation-delay: 0s; }
            .vl-chatbot-typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .vl-chatbot-typing-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typingDot {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
            }
            @media (max-width: 480px) {
                .vl-chatbot-window {
                    width: 100%;
                    height: 100%;
                    bottom: 0;
                    right: 0;
                    border-radius: 0;
                }
                .vl-chatbot-button {
                    width: 50px;
                    height: 50px;
                }
            }
            .vl-chatbot-message-content {
                background: none !important;
                border-radius: 0 !important;
                padding: 0 !important;
            }
        `;
        document.head.appendChild(style);
        
        // Load existing chat history first
        const savedMessages = localStorage.getItem('vl-chatbot-messages');
        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
            this.messages.forEach(msg => {
                this.addMessage(msg.text, msg.sender, false);
            });
        } else {
            // Only add welcome message if there's no existing chat history
            this.addMessage('Hello! I\'m Neuron, your AI assistant. How can I help you today?', 'bot');
        }
    }

    toggleWindow() {
        this.isOpen = !this.isOpen;
        const window = this.container.querySelector('.vl-chatbot-window');
        window.classList.toggle('active', this.isOpen);
    }

    async handleSend(input) {
        const message = input.value.trim();
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTyping();
        
        try {
            // Ensure minimum time between requests
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.minRequestInterval) {
                await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
            }
            
            // Call OpenAI API with retry logic
            const response = await this.getAIResponse(message);
            this.hideTyping();
            this.addMessage(response, 'bot');
            this.lastRequestTime = Date.now();
        } catch (error) {
            this.hideTyping();
            let errorMessage = 'Sorry, I couldn\'t fetch a response right now.';
            
            if (error.status === 429) {
                errorMessage = 'I\'m getting too many requests. Please wait a moment and try again.';
            } else if (error.status === 401) {
                errorMessage = 'There\'s an issue with the API authentication.';
            }
            
            this.addMessage(errorMessage, 'bot');
            console.error('Error:', error);
        }
    }

    async getAIResponse(message, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            console.log(`Attempt ${retryCount + 1} to get response...`);

            const response = await fetch('/.netlify/functions/openrouter-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-r1:free',
                    messages: [
                        {
                            role: 'system',
                            content: `You are Neuron, an AI assistant designed for a Virtual Lab project. Your responses must be under 100 words.

Key rules:
- Give extremely concise, clear explanations
- Focus on the most important information only
- Use simple language
- Avoid unnecessary details
- Skip examples unless specifically requested
- Never exceed 100 words
- Be accurate and helpful despite being brief
- No jokes or random facts
- Focus only on AI, algorithms, and CS topics
- If you start an example, you MUST complete it
- If you start a list, you MUST complete it
- If you start a comparison, you MUST complete it
- NEVER leave any explanation incomplete

If a topic is complex, focus on the most fundamental aspects that a beginner needs to know.`
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                    top_p: 0.9,
                    frequency_penalty: 0.5,
                    presence_penalty: 0.5,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error('API Error Status:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw API Response:', data);

            if (data.error) {
                console.error('API Error:', data.error);
                throw new Error(data.error.message || 'API returned an error');
            }

            if (!data.choices || !data.choices.length) {
                console.error('Empty choices in response');
                if (retryCount < 2) {
                    console.log('Retrying...');
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    return this.getAIResponse(message, retryCount + 1);
                }
                throw new Error('Empty response from API after retries');
            }

            const choice = data.choices[0];
            console.log('First choice:', choice);

            if (!choice.message || !choice.message.content) {
                console.error('Invalid response format');
                if (retryCount < 2) {
                    console.log('Retrying...');
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    return this.getAIResponse(message, retryCount + 1);
                }
                throw new Error('Invalid response format after retries');
            }

            const rawResponse = choice.message.content.trim();
            console.log('Raw response content:', rawResponse);

            if (!rawResponse) {
                if (retryCount < 2) {
                    console.log('Retrying...');
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    return this.getAIResponse(message, retryCount + 1);
                }
                throw new Error('Empty response content after retries');
            }

            // Check for incomplete responses
            if (rawResponse.includes('Example') && !rawResponse.includes('Example:') && !rawResponse.includes('Example -')) {
                console.log('Response has incomplete example, retrying...');
                if (retryCount < 2) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    return this.getAIResponse(message, retryCount + 1);
                }
            }

            // Check for incomplete lists
            if (rawResponse.includes('1.') && !rawResponse.includes('2.')) {
                console.log('Response has incomplete list, retrying...');
                if (retryCount < 2) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    return this.getAIResponse(message, retryCount + 1);
                }
            }

            // Check for incomplete comparisons
            if (rawResponse.includes('vs') && !rawResponse.includes(':')) {
                console.log('Response has incomplete comparison, retrying...');
                if (retryCount < 2) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    return this.getAIResponse(message, retryCount + 1);
                }
            }

            return this.formatResponse(rawResponse);
        } catch (error) {
            console.error('Detailed error:', error);
            if (error.name === 'AbortError') {
                return "The request took too long to process. Please try again with a shorter question.";
            }
            if (error.message.includes('429')) {
                return "I've reached my rate limit. Please try again in a few moments.";
            }
            if (error.message.includes('400')) {
                return "I couldn't understand your question. Please try rephrasing it.";
            }
            if (retryCount < 2) {
                console.log('Retrying after error...');
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return this.getAIResponse(message, retryCount + 1);
            }
            return `I'm sorry, I couldn't process your request: ${error.message}`;
        }
    }

    formatResponse(text) {
        // Count words in the response
        const wordCount = text.split(/\s+/).length;
        if (wordCount > 100) {
            return "I apologize, but I need to provide a shorter response. Please ask your question again for a more concise answer.";
        }

        // Remove markdown formatting
        text = text.replace(/\*\*/g, '');
        text = text.replace(/#{1,6}\s/g, ''); // Remove markdown headers
        text = text.replace(/###/g, ''); // Remove triple hashtags
        text = text.replace(/\|/g, ''); // Remove table pipes
        text = text.replace(/-{3,}/g, ''); // Remove horizontal lines
        
        // Split into paragraphs
        const paragraphs = text.split('\n\n');
        
        // Format each paragraph
        return paragraphs.map(paragraph => {
            // If it's a list item, format it properly
            if (paragraph.startsWith('- ')) {
                return paragraph;
            }
            // If it's a heading, make it bold and add a newline
            if (paragraph.includes(':')) {
                const [heading, content] = paragraph.split(':');
                return `<strong>${heading}:</strong> ${content}`;
            }
            return paragraph;
        }).join('\n\n');
    }

    saveMessage(text, sender) {
        this.messages.push({ text, sender });
        localStorage.setItem('vl-chatbot-messages', JSON.stringify(this.messages));
    }

    loadChatHistory() {
        const savedMessages = localStorage.getItem('vl-chatbot-messages');
        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
            const messagesContainer = this.container.querySelector('.vl-chatbot-messages');
            messagesContainer.innerHTML = ''; // Clear existing messages
            this.messages.forEach(msg => {
                this.addMessage(msg.text, msg.sender, false);
            });
        }
    }

    addMessage(text, sender, save = true) {
        const messagesContainer = this.container.querySelector('.vl-chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `vl-chatbot-message ${sender}`;
        
        const content = document.createElement('div');
        content.className = 'vl-chatbot-message-content';
        content.innerHTML = text;
        
        messageDiv.appendChild(content);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (save) {
            this.saveMessage(text, sender);
        }
    }

    showTyping() {
        const messages = this.container.querySelector('.vl-chatbot-messages');
        const typing = document.createElement('div');
        typing.className = 'vl-chatbot-typing';

        // Create chase animation container
        const chaseContainer = document.createElement('div');
        chaseContainer.className = 'vl-chase-animation';

        // Add police robot
        const policeRobo = document.createElement('img');
        policeRobo.src = '/resources/policerobo.gif';
        policeRobo.className = 'vl-police-robo';
        policeRobo.alt = 'Police Robot';

        // Add thief robot
        const thiefRobo = document.createElement('img');
        thiefRobo.src = '/resources/thiefrobo.gif';
        thiefRobo.className = 'vl-thief-robo';
        thiefRobo.alt = 'Thief Robot';

        // Add robots to chase container
        chaseContainer.appendChild(policeRobo);
        chaseContainer.appendChild(thiefRobo);

        // Add catching text
        const catchingText = document.createElement('div');
        catchingText.className = 'vl-catching-text';
        catchingText.textContent = 'Catching your answer...';

        // Assemble typing indicator
        typing.appendChild(chaseContainer);
        typing.appendChild(catchingText);
        
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
    }

    hideTyping() {
        const typing = this.container.querySelector('.vl-chatbot-typing');
        if (typing) {
            typing.remove();
        }
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VirtualLabChatbot();
}); 