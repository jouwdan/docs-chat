export interface Conversation {
	id: number;
	title?: string;
	messages: Message[];
}

export interface Message {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: string;
}
