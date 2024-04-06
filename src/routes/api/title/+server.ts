import { json, type RequestHandler } from '@sveltejs/kit';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Ollama } from '@langchain/community/llms/ollama';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { question } = await request.json();
		const promptTemplate = `In less than 25 characters create a shortened version for a title of this question.
Do not answer the question, just create a title. Do not use special characters, quote marks or punctuation.
---------------------------------------------
Question: {question}`;
		const prompt = PromptTemplate.fromTemplate(promptTemplate);

		const model = new Ollama({
			baseUrl: 'http://localhost:11434',
			model: 'llama3'
		});

		const chain = RunnableSequence.from([
			{
				question: new RunnablePassthrough()
			},
			prompt,
			model,
			new StringOutputParser()
		]);

		const response = await chain.invoke(question);
		return json(response);
	} catch (error) {
		console.error('Error processing request:', error);
		return json({ error: 'An error occurred while processing the request.' }, { status: 500 });
	}
};
