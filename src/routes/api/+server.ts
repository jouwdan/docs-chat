import { json, type RequestHandler } from '@sveltejs/kit';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { Ollama } from '@langchain/community/llms/ollama';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { formatDocumentsAsString } from 'langchain/util/document';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';

const DOCUMENTS_DIR = path.resolve(process.cwd(), 'documents');
const DB_DIR = path.resolve(process.cwd(), 'db');

function calculateMD5(filePath: fs.PathOrFileDescriptor) {
	const content = fs.readFileSync(filePath);
	return crypto.createHash('md5').update(content).digest('hex');
}

function getLoader(ext: string) {
	switch (ext) {
		case '.pdf':
			return PDFLoader;
		case '.docx':
			return DocxLoader;
		case '.txt':
			return TextLoader;
		case '.csv':
			return CSVLoader;
		default:
			return null;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { question } = await request.json();
		const readFiles = fs.readdirSync(DOCUMENTS_DIR);

		for (const file of readFiles) {
			const ext = path.extname(file);
			const fileMD5 = calculateMD5(path.resolve(DOCUMENTS_DIR, file));
			if (['.pdf', '.docx', '.txt', '.csv'].includes(ext)) {
				const index = path.resolve(DB_DIR, 'index.json');
				if (!fs.existsSync(index)) {
					fs.writeFileSync(index, '{}');
				}
				const indexData = fs.readFileSync(index, 'utf8');
				const indexObj = JSON.parse(indexData);
				if (!indexObj[file] || indexObj[file].md5 !== fileMD5) {
					if (fs.existsSync(`${DB_DIR}/vectorstore`)) {
						const vectorstore = await HNSWLib.load(
							`${DB_DIR}/vectorstore`,
							new HuggingFaceTransformersEmbeddings()
						);
						const filePath = path.resolve(DOCUMENTS_DIR, file);
						const fileLoader = getLoader(ext);
						if (!fileLoader) {
							continue;
						} else {
							const loader = new fileLoader(filePath);
							const docs = await loader.load();
							const splitter = new RecursiveCharacterTextSplitter();
							const formattedDocs = await splitter.transformDocuments(docs);
							await vectorstore.addDocuments(formattedDocs);
							await vectorstore.save(`${DB_DIR}/vectorstore`);
						}
					} else {
						const filePath = path.resolve(DOCUMENTS_DIR, file);
						const fileLoader = getLoader(ext);
						if (!fileLoader) {
						} else {
							const loader = new fileLoader(filePath);
							const docs = await loader.load();
							const splitter = new RecursiveCharacterTextSplitter();
							const formattedDocs = await splitter.transformDocuments(docs);
							const embeddings = new HuggingFaceTransformersEmbeddings();
							const vectorstore = await HNSWLib.fromDocuments(formattedDocs, embeddings);
							await vectorstore.save(`${DB_DIR}/vectorstore`);
						}
					}
					indexObj[file] = {
						file: file,
						md5: fileMD5
					};
					fs.writeFileSync(index, JSON.stringify(indexObj, null, 2));
				}
			} else {
			}
		}

		const vectorstore = await HNSWLib.load(
			`${DB_DIR}/vectorstore`,
			new HuggingFaceTransformersEmbeddings()
		);

		const retriever = vectorstore.asRetriever();

		const promptTemplate = `Answer the question based on the following context. Try to use just the context, only using other sources if absolutely necessary. Provide evidence for any claims where needed.
{context}
Question: {question}`;
		const prompt = PromptTemplate.fromTemplate(promptTemplate);

		const model = new Ollama({
			baseUrl: 'http://localhost:11434',
			model: 'llama3'
		});

		const chain = RunnableSequence.from([
			{
				context: retriever.pipe(formatDocumentsAsString),
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
