import { supabase } from './supabase';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const EMBEDDING_MODEL = 'nvidia/nv-embedqa-e5-v5';

async function getEmbedding(text: string, inputType: 'query' | 'passage'): Promise<number[]> {
    const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: [text],
            input_type: inputType,
            encoding_format: 'float',
            truncate: 'END',
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Embedding error:', errorText);
        throw new Error(`Embedding API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addDocument(content: string, metadata: any = {}) {
    try {
        // Extract categoryId from metadata if provided
        const categoryId = metadata.categoryId;

        // 1. Chunk the text
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const chunks = await splitter.createDocuments([content]);

        console.log(`[RAG] Adding document with ${chunks.length} chunks, categoryId: ${categoryId || 'none'}`);

        // 2. Generate embeddings and store in Supabase
        for (const chunk of chunks) {
            const embedding = await getEmbedding(chunk.pageContent, 'passage');

            // First try with category_id (if column exists)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const insertData: any = {
                content: chunk.pageContent,
                metadata: { ...metadata, ...chunk.metadata },
                embedding: embedding,
            };

            // Try insert with category_id first
            if (categoryId) {
                insertData.category_id = categoryId;
            }

            let { error } = await supabase.from('documents').insert(insertData);

            // If category_id column doesn't exist, retry without it
            if (error && error.message?.includes('category_id')) {
                console.log('[RAG] category_id column not found, retrying without it...');
                delete insertData.category_id;
                const retryResult = await supabase.from('documents').insert(insertData);
                error = retryResult.error;
            }

            if (error) {
                console.error('Error inserting chunk:', error);
                throw error;
            }

            console.log(`[RAG] Inserted chunk: "${chunk.pageContent.substring(0, 50)}..."`);
        }

        return true;
    } catch (error) {
        console.error('Error adding document:', error);
        return false;
    }
}

/**
 * Multi-Vector Retrieval with Query Expansion
 * 
 * Strategy:
 * 1. Original query search
 * 2. Expanded query variations (rephrased questions)
 * 3. Keyword extraction search
 * 4. Combine and dedupe results
 */
export async function searchDocuments(query: string, limit: number = 5) {
    try {
        console.log(`[RAG] Multi-vector search for: "${query}"`);

        // Generate embedding for the original query
        const queryEmbedding = await getEmbedding(query, 'query');

        // Strategy 1: Direct semantic search with original query
        const { data: semanticResults, error: semanticError } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.30, // Lowered threshold for better recall
            match_count: limit,
        });

        if (semanticError) {
            console.error('Semantic search error:', semanticError);
        }

        // Strategy 2: Extract key terms and do keyword-based search
        const keyTerms = extractKeyTerms(query);
        let keywordResults: any[] = [];

        if (keyTerms.length > 0) {
            // Search for documents containing key terms
            const { data: kwResults, error: kwError } = await supabase
                .from('documents')
                .select('id, content, metadata')
                .or(keyTerms.map(term => `content.ilike.%${term}%`).join(','))
                .limit(limit);

            if (!kwError && kwResults) {
                keywordResults = kwResults.map(doc => ({
                    ...doc,
                    similarity: 0.5, // Assign moderate similarity for keyword matches
                    matchType: 'keyword'
                }));
            }
        }

        // Strategy 3: Question variation search (for Q&A format)
        let qaResults: any[] = [];
        const questionVariations = generateQuestionVariations(query);

        for (const variation of questionVariations.slice(0, 2)) { // Limit to 2 variations
            const varEmbedding = await getEmbedding(variation, 'query');
            const { data: varResults, error: varError } = await supabase.rpc('match_documents', {
                query_embedding: varEmbedding,
                match_threshold: 0.30,
                match_count: 3,
            });

            if (!varError && varResults) {
                qaResults.push(...varResults.map((doc: any) => ({
                    ...doc,
                    matchType: 'variation'
                })));
            }
        }

        // Combine and deduplicate results
        const allResults = [
            ...(semanticResults || []).map((doc: any) => ({ ...doc, matchType: 'semantic' })),
            ...keywordResults,
            ...qaResults
        ];

        // Dedupe by content, keeping highest similarity
        const seenContent = new Map<string, any>();
        for (const doc of allResults) {
            const existing = seenContent.get(doc.content);
            if (!existing || (doc.similarity || 0) > (existing.similarity || 0)) {
                seenContent.set(doc.content, doc);
            }
        }

        // Sort by similarity and take top results
        const uniqueResults = Array.from(seenContent.values())
            .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
            .slice(0, limit);

        // Log results for debugging
        console.log(`[RAG] Multi-vector search results: ${uniqueResults.length} documents`);
        uniqueResults.forEach((doc: any, i: number) => {
            console.log(`[RAG] Doc ${i + 1} [${doc.matchType}] sim: ${doc.similarity?.toFixed(3) || 'N/A'}, preview: ${doc.content?.substring(0, 80)}...`);
        });

        if (uniqueResults.length === 0) {
            console.log('[RAG] No documents found');
            return '';
        }

        return uniqueResults.map((doc: any) => doc.content).join('\n\n');
    } catch (error) {
        console.error('Error in RAG search:', error);
        return '';
    }
}

/**
 * Extract key terms from query for keyword search
 */
function extractKeyTerms(query: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
        'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am',
        'your', 'you', 'how', 'much', 'many', 'po', 'ba', 'na', 'ng', 'sa', 'ang',
        'yung', 'mo', 'ko', 'nyo', 'nila', 'ka', 'ako', 'siya', 'kami', 'tayo', 'sila',
        'magkano', 'ano', 'paano', 'saan', 'kailan', 'bakit', 'ilan'
    ]);

    const words = query.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)].slice(0, 5); // Max 5 key terms
}

/**
 * Generate question variations for better Q&A matching
 */
function generateQuestionVariations(query: string): string[] {
    const variations: string[] = [];
    const lowerQuery = query.toLowerCase();

    // If asking about price
    if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('magkano') || lowerQuery.includes('presyo')) {
        variations.push('What is the price?');
        variations.push('How much does it cost?');
        variations.push('Magkano?');
    }

    // If asking about product
    if (lowerQuery.includes('product') || lowerQuery.includes('produkto') || lowerQuery.includes('item')) {
        variations.push('What products do you have?');
        variations.push('Tell me about your products');
    }

    // If asking about delivery
    if (lowerQuery.includes('deliver') || lowerQuery.includes('shipping') || lowerQuery.includes('padala')) {
        variations.push('Do you deliver?');
        variations.push('How much is shipping?');
        variations.push('Nagdedeliver ba kayo?');
    }

    // If asking about payment
    if (lowerQuery.includes('pay') || lowerQuery.includes('bayad') || lowerQuery.includes('gcash') || lowerQuery.includes('bank')) {
        variations.push('What payment methods do you accept?');
        variations.push('How can I pay?');
    }

    return variations;
}
