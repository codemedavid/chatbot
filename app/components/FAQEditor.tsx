'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, MessageCircle } from 'lucide-react';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    categoryId?: string;
}

interface FAQEditorProps {
    categoryId: string;
    categoryName: string;
}

export default function FAQEditor({ categoryId, categoryName }: FAQEditorProps) {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/faq');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filter by current category
                setFaqs(data.filter((f: FAQItem) => f.categoryId === categoryId));
            }
        } catch (error) {
            console.error('Failed to fetch FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (categoryId) {
            fetchFAQs();
        }
    }, [categoryId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim()) return;

        setSaving(true);
        try {
            const res = await fetch('/api/faq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, answer, categoryId }),
            });

            if (res.ok) {
                setQuestion('');
                setAnswer('');
                await fetchFAQs();
            }
        } catch (error) {
            console.error('Failed to save FAQ:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this FAQ entry?')) return;
        try {
            await fetch(`/api/faq?id=${id}`, { method: 'DELETE' });
            setFaqs(faqs.filter(f => f.id !== id));
        } catch (error) {
            console.error('Failed to delete FAQ:', error);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                    <HelpCircle className="text-blue-600" size={20} />
                    <h2 className="text-lg font-semibold text-gray-800">FAQ Editor</h2>
                    <span className="text-sm text-gray-500">- {categoryName}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    Add question-answer pairs for better AI responses
                </p>
            </div>

            {/* FAQ Form */}
            <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200 bg-white space-y-3">
                <div>
                    <label className="block text-sm font-medium text-black mb-1">
                        <MessageCircle size={14} className="inline mr-1" />
                        Question
                    </label>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., How much is your product?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-gray-50 focus:ring-blue-500 text-sm text-black"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black mb-1">
                        Answer
                    </label>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="e.g., Our product starts at ₱1,500 po for the Premium Package..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-gray-50 focus:ring-blue-500 text-sm text-black resize-none"
                    />
                </div>
                <button
                    type="submit"
                    disabled={saving || !question.trim() || !answer.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus size={16} />
                    {saving ? 'Saving...' : 'Add FAQ Entry'}
                </button>
            </form>

            {/* FAQ List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center text-gray-500 py-8">Loading FAQs...</div>
                ) : faqs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <HelpCircle size={40} className="mx-auto mb-2 opacity-30" />
                        <p>No FAQ entries yet</p>
                        <p className="text-sm">Add your first Q&A pair above</p>
                    </div>
                ) : (
                    faqs.map((faq) => (
                        <div
                            key={faq.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="font-bold text-blue-600 text-sm">Q:</span>
                                        <p className="text-sm text-gray-800 font-medium">{faq.question}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-bold text-green-600 text-sm">A:</span>
                                        <p className="text-sm text-gray-600">{faq.answer}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(faq.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
