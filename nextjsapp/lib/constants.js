const CHAT_API_ENDPOINT = process.env.NODE_ENV === 'development' ? "http://localhost:8080/chat" : "https://api.agentboard.dev/chat"
export { CHAT_API_ENDPOINT };
