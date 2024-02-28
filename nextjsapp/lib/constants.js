const CHAT_API_ENDPOINT = process.env.NODE_ENV === 'development' ?
  (process.env.NEXT_PUBLIC_BACKEND === 'local' ? "http://localhost:8080/chat" : "https://api.agentboard.dev/chat") :
  "https://api.agentboard.dev/chat";

export { CHAT_API_ENDPOINT };
