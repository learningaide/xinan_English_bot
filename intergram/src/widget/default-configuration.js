
export const defaultConfiguration = {
    titleClosed: 'Click to chat!',
    titleOpen: 'Let\'s chat!',
    closedStyle: 'chat', // button or chat
    closedChatAvatarUrl: '', // only used if closedStyle is set to 'chat'
    cookieExpiration: 1, // in days. Once opened, closed chat title will be shown as button (when closedStyle is set to 'chat')
    introMessage: 'Hello! Welcome to AI chatbot bingo. If the AI says the words "apple", "tree", "Eiffel", "Germany" and "excellent" then you win! You cannot say these words. 你好！ 欢迎来到 AI 聊天机器人宾果游戏。 如果人工智能说出“苹果”、“树”、“埃菲尔”、“德国”和“优秀”这些词，那么你就赢了！ 你不能说这些话。',
    autoResponse: 'The AI is thinking... AI在思考',
    autoNoResponse: 'It seems that the AI is busy right now. Please tell us how we can ' +
    'contact you, and we will get back to you as soon as we can.',
    placeholderText: 'Send a message...',
    displayMessageTime: true,
    mainColor: '#1f8ceb',
    alwaysUseFloatingButton: false,
    desktopHeight: 450,
    desktopWidth: 370
};
