const CHAT_API_ENDPOINT =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080/chat'
    : `${process.env.NEXT_PUBLIC_AGENTBOARD_API_URL}/chat`
export { CHAT_API_ENDPOINT }
