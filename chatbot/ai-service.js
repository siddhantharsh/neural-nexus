import { config, SYSTEM_PROMPT } from './config.js';

class AIService {
    constructor() {
        this.conversationHistory = [];
        this.systemPrompt = SYSTEM_PROMPT;
        this.isModelLoading = false;
    }

    async getAIResponse(userMessage) {
        try {
            console.log('Starting API request...');
            
            // Prepare the prompt with specific instruction for comparison if needed
            let fullPrompt = `${this.systemPrompt}\n\nUser: ${userMessage}\nAssistant: Let me help you understand `;
            
            if (userMessage.toLowerCase().includes('difference') || userMessage.toLowerCase().includes('compare')) {
                fullPrompt += "the comparison between these algorithms in detail.";
            }

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), config.TIMEOUT_MS);
            });

            // First, check if model is ready
            console.log('Checking model status...');
            const modelResponse = await Promise.race([
                fetch(config.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.HF_API_KEY}`
                    },
                    body: JSON.stringify({ inputs: "Test" })
                }),
                timeoutPromise
            ]);

            console.log('Model status response:', modelResponse.status);
            if (modelResponse.status === 503) {
                this.isModelLoading = true;
                throw new Error('Model is loading');
            }

            // Make the actual API call
            console.log('Making main API request...');
            const response = await Promise.race([
                fetch(config.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.HF_API_KEY}`
                    },
                    body: JSON.stringify({
                        inputs: fullPrompt,
                        parameters: {
                            max_new_tokens: 250,
                            temperature: 0.7,
                            top_p: 0.95,
                            do_sample: true
                        }
                    })
                }),
                timeoutPromise
            ]);

            console.log('Main API response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('API response data:', data);
            this.isModelLoading = false;

            if (Array.isArray(data) && data.length > 0) {
                let aiResponse = data[0].generated_text;

                // Clean up the response
                aiResponse = aiResponse.replace(/^Assistant: /, '').trim();

                // Update conversation history
                this.conversationHistory.push(
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: aiResponse }
                );

                return aiResponse;
            }

            throw new Error('Invalid response format');

        } catch (error) {
            console.error('Error in getAIResponse:', {
                message: error.message,
                stack: error.stack,
                isModelLoading: this.isModelLoading
            });

            if (error.message === 'Request timed out') {
                console.log('Request timed out, using fallback response');
                return "I apologize, but the request took too long. Here's a quick comparison:\n\n" +
                       "Depth-First Search (DFS):\n" +
                       "- Explores deep into a path first\n" +
                       "- Uses less memory\n" +
                       "- Good for maze solving\n" +
                       "- Might not find shortest path\n\n" +
                       "Breadth-First Search (BFS):\n" +
                       "- Explores all neighbors first\n" +
                       "- Guarantees shortest path\n" +
                       "- Uses more memory\n" +
                       "- Better for shortest path finding";
            }

            if (this.isModelLoading) {
                console.log('Model is loading, using fallback response');
                return "The AI model is still loading. Here's a quick answer:\n\n" +
                       "DFS goes deep into paths first, while BFS explores level by level. " +
                       "DFS is better for memory usage and maze-solving, while BFS guarantees " +
                       "shortest paths but uses more memory.";
            }

            console.log('Using local fallback response');
            return this.getLocalFallbackResponse(userMessage);
        }
    }

    getLocalFallbackResponse(message) {
        const keywords = message.toLowerCase();
        
        if (keywords.includes('difference') && 
            (keywords.includes('dfs') || keywords.includes('bfs') || 
             keywords.includes('depth') || keywords.includes('breadth'))) {
            return `Here's the key difference between DFS and BFS:

Depth-First Search (DFS):
- Explores one path completely before backtracking
- Uses less memory (O(h) where h is height)
- Better for deep solutions
- Implementation uses a stack

Breadth-First Search (BFS):
- Explores all neighbors before going deeper
- Uses more memory (O(b^d) where b is branching factor)
- Guarantees shortest path
- Implementation uses a queue`;
        }
        
        if (keywords.includes('dfs') || keywords.includes('depth first')) {
            return "Depth-First Search (DFS) is a graph traversal algorithm that explores as far as possible along each branch before backtracking. It's useful for maze solving and topological sorting.";
        }
        
        if (keywords.includes('bfs') || keywords.includes('breadth first')) {
            return "Breadth-First Search (BFS) explores all vertices at the present depth before moving on to vertices at the next depth level. It's great for finding shortest paths in unweighted graphs.";
        }
        
        if (keywords.includes('a*') || keywords.includes('a star')) {
            return "A* Search is an informed search algorithm that uses heuristics to find the shortest path. It combines the benefits of Dijkstra's algorithm and Best-First Search.";
        }

        return "I'm having trouble connecting to the AI service. For algorithm comparisons, I can provide basic differences between common algorithms like DFS vs BFS. Would you like to know about specific algorithms?";
    }

    clearConversation() {
        this.conversationHistory = [];
    }
}

export const aiService = new AIService(); 