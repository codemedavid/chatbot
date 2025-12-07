'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, CreditCard, Trash2, Upload, ToggleLeft, ToggleRight, Edit2, X, Check, GripVertical, Image } from 'lucide-react';

interface PaymentMethod {
    id: string;
    name: string;
    account_name: string | null;
    account_number: string | null;
    qr_code_url: string | null;
    instructions: string | null;
    is_active: boolean;
    display_order: number;
}

interface PaymentMethodEditorProps {
    categoryId: string;
    categoryName: string;
}

export default function PaymentMethodEditor({ categoryId, categoryName }: PaymentMethodEditorProps) {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formAccountName, setFormAccountName] = useState('');
    const [formAccountNumber, setFormAccountNumber] = useState('');
    const [formQrCodeUrl, setFormQrCodeUrl] = useState('');
    const [formInstructions, setFormInstructions] = useState('');

    useEffect(() => {
        fetchMethods();
    }, [categoryId]);

    const fetchMethods = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/payment-methods?categoryId=${categoryId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setMethods(data);
            }
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormName('');
        setFormAccountName('');
        setFormAccountNumber('');
        setFormQrCodeUrl('');
        setFormInstructions('');
        setIsAdding(false);
        setEditingId(null);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success && data.url) {
                setFormQrCodeUrl(data.url);
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formName.trim()) return;

        try {
            if (editingId) {
                // Update existing
                const res = await fetch('/api/payment-methods', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingId,
                        name: formName,
                        accountName: formAccountName,
                        accountNumber: formAccountNumber,
                        qrCodeUrl: formQrCodeUrl,
                        instructions: formInstructions,
                    }),
                });
                if (res.ok) {
                    await fetchMethods();
                    resetForm();
                }
            } else {
                // Create new
                const res = await fetch('/api/payment-methods', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        categoryId,
                        name: formName,
                        accountName: formAccountName,
                        accountNumber: formAccountNumber,
                        qrCodeUrl: formQrCodeUrl,
                        instructions: formInstructions,
                        displayOrder: methods.length,
                    }),
                });
                if (res.ok) {
                    await fetchMethods();
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Error saving payment method:', error);
        }
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingId(method.id);
        setFormName(method.name);
        setFormAccountName(method.account_name || '');
        setFormAccountNumber(method.account_number || '');
        setFormQrCodeUrl(method.qr_code_url || '');
        setFormInstructions(method.instructions || '');
        setIsAdding(true);
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            await fetch('/api/payment-methods', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentActive }),
            });
            setMethods(prev =>
                prev.map(m => m.id === id ? { ...m, is_active: !currentActive } : m)
            );
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this payment method?')) return;

        try {
            await fetch(`/api/payment-methods?id=${id}`, { method: 'DELETE' });
            setMethods(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting payment method:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-xl">
                        <CreditCard size={20} className="text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">{categoryName}</h2>
                        <p className="text-sm text-gray-500">{methods.length} payment method{methods.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
                    >
                        <Plus size={16} />
                        Add Payment Method
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">
                            {editingId ? 'Edit Payment Method' : 'New Payment Method'}
                        </h3>
                        <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg">
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method Name *
                            </label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="e.g., GCash, Maya, BDO"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Holder Name
                            </label>
                            <input
                                type="text"
                                value={formAccountName}
                                onChange={(e) => setFormAccountName(e.target.value)}
                                placeholder="e.g., Juan Dela Cruz"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account / Phone Number
                            </label>
                            <input
                                type="text"
                                value={formAccountNumber}
                                onChange={(e) => setFormAccountNumber(e.target.value)}
                                placeholder="e.g., 09123456789"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                QR Code Image
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formQrCodeUrl}
                                    onChange={(e) => setFormQrCodeUrl(e.target.value)}
                                    placeholder="Image URL or upload"
                                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                    ) : (
                                        <Upload size={18} className="text-gray-600" />
                                    )}
                                </button>
                            </div>
                            {formQrCodeUrl && (
                                <div className="mt-2 relative w-24 h-24">
                                    <img
                                        src={formQrCodeUrl}
                                        alt="QR Preview"
                                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        onClick={() => setFormQrCodeUrl('')}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Instructions
                            </label>
                            <textarea
                                value={formInstructions}
                                onChange={(e) => setFormInstructions(e.target.value)}
                                placeholder="e.g., Please send the payment and include your order number in the message."
                                rows={3}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formName.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={16} />
                            {editingId ? 'Update' : 'Save'}
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Methods List */}
            <div className="flex-1 overflow-auto">
                {methods.length === 0 && !isAdding ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <CreditCard size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods yet</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Add your first payment method to display to customers
                        </p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
                        >
                            <Plus size={16} />
                            Add Payment Method
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {methods.map((method) => (
                            <div
                                key={method.id}
                                className={`bg-white rounded-2xl border ${method.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
                                    } p-4 shadow-sm hover:shadow-md transition-shadow`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-teal-50 rounded-lg">
                                            <CreditCard size={16} className="text-teal-600" />
                                        </div>
                                        <h4 className="font-medium text-gray-900">{method.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggleActive(method.id, method.is_active)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg"
                                            title={method.is_active ? 'Disable' : 'Enable'}
                                        >
                                            {method.is_active ? (
                                                <ToggleRight size={20} className="text-teal-600" />
                                            ) : (
                                                <ToggleLeft size={20} className="text-gray-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(method)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} className="text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(method.id)}
                                            className="p-1.5 hover:bg-red-50 rounded-lg"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} className="text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {method.qr_code_url && (
                                    <div className="mb-3 flex justify-center">
                                        <img
                                            src={method.qr_code_url}
                                            alt={`${method.name} QR Code`}
                                            className="w-32 h-32 object-contain rounded-lg border border-gray-100"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5 text-sm">
                                    {method.account_name && (
                                        <p className="text-gray-600">
                                            <span className="text-gray-400">Name:</span> {method.account_name}
                                        </p>
                                    )}
                                    {method.account_number && (
                                        <p className="text-gray-600">
                                            <span className="text-gray-400">Number:</span> {method.account_number}
                                        </p>
                                    )}
                                    {method.instructions && (
                                        <p className="text-gray-500 text-xs mt-2 italic line-clamp-2">
                                            {method.instructions}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
