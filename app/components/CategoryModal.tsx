'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, type: 'general' | 'qa', color: string) => Promise<void>;
}

const COLORS = [
    { name: 'gray', bg: 'bg-gray-100', dot: 'bg-gray-500' },
    { name: 'blue', bg: 'bg-blue-100', dot: 'bg-blue-500' },
    { name: 'green', bg: 'bg-green-100', dot: 'bg-green-500' },
    { name: 'purple', bg: 'bg-purple-100', dot: 'bg-purple-500' },
    { name: 'orange', bg: 'bg-orange-100', dot: 'bg-orange-500' },
    { name: 'pink', bg: 'bg-pink-100', dot: 'bg-pink-500' },
];

export default function CategoryModal({ isOpen, onClose, onSave }: CategoryModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'general' | 'qa'>('general');
    const [color, setColor] = useState('gray');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSaving(true);
        await onSave(name, type, color);
        setSaving(false);
        setName('');
        setType('general');
        setColor('gray');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">New Category</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., General Information"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-gray-50"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('general')}
                                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${type === 'general'
                                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                General Docs
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('qa')}
                                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${type === 'qa'
                                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Q&A / FAQ
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Color Theme
                        </label>
                        <div className="flex items-center gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setColor(c.name)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${c.bg} ${color === c.name ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                                        }`}
                                >
                                    {color === c.name && <Check size={14} className="text-gray-700" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!name.trim() || saving}
                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {saving ? 'Creating...' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
