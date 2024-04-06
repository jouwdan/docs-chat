import { writable } from 'svelte/store';
import type { Conversation, Message } from './types';

function getInitialConversations(): Conversation[] {
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('conversations');
		return saved ? JSON.parse(saved) : [];
	} else {
		return [];
	}
}

function createConversationsStore() {
	const initialConversations = getInitialConversations();
	const { subscribe, update } = writable<Conversation[]>(initialConversations);

	let nextId = initialConversations.reduce((maxId, convo) => Math.max(maxId, convo.id), 0) + 1;

	function persist(conversations: Conversation[]) {
		if (typeof window !== 'undefined') {
			localStorage.setItem('conversations', JSON.stringify(conversations));
		}
	}

	return {
		subscribe,
		addConversation: () => {
			const newConversation = { id: nextId++, messages: [] };
			update((conversations) => {
				const updatedConversations = [...conversations, newConversation];
				persist(updatedConversations);
				return updatedConversations;
			});
			return newConversation.id;
		},
		addMessageToConversation: (conversationId: number, newMessage: Message) => {
			update((conversations) => {
				const updatedConversations = conversations.map((convo) =>
					convo.id === conversationId
						? { ...convo, messages: [...convo.messages, newMessage] }
						: convo
				);
				persist(updatedConversations);
				return updatedConversations;
			});
		},
		addTitleToConversation: (conversationId: number, title: { title: string }) => {
			update((conversations) => {
				const updatedConversations = conversations.map((convo) =>
					convo.id === conversationId ? { ...convo, title: title.title } : convo
				);
				persist(updatedConversations);
				return updatedConversations;
			});
		},
		removeConversation: (conversationId: number) => {
			update((conversations) => {
				const updatedConversations = conversations.filter((convo) => convo.id !== conversationId);
				persist(updatedConversations);
				return updatedConversations;
			});
		},
		reset: () => {
			const resetConversations: Conversation[] = [];
			update(() => {
				persist(resetConversations);
				return resetConversations;
			});
		}
	};
}

export const conversations = createConversationsStore();
