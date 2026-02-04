import React, { useState, useRef } from 'react';
import {
    X, Printer, Download, Edit3, Save, FileText,
    Loader2, Calendar, User
} from 'lucide-react';
import { toast } from 'react-toastify';

interface LetterPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    letterContent: string;
    letterDetails: {
        reference_number: string;
        template_name: string;
        letter_type: string;
        employee_name: string;
        designation: string;
        purpose: string;
        date?: string;
    };
    isEditable?: boolean;
    onSave?: (content: string) => Promise<void>;
    companyInfo?: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logo?: string;
    };
}

const LetterPreviewModal: React.FC<LetterPreviewModalProps> = ({
    isOpen,
    onClose,
    letterContent,
    letterDetails,
    isEditable = false,
    onSave,
    companyInfo = {
        name: 'CURE Hospital',
        address: '123 Medical Avenue, Health City',
        phone: '+94 11 234 5678',
        email: 'hr@curehospital.com'
    }
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(letterContent);
    const [isSaving, setIsSaving] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to print');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${letterDetails.reference_number} - ${letterDetails.template_name}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        line-height: 1.6;
                        color: #1a1a1a;
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    .letter-container {
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 0;
                    }
                    .letterhead {
                        text-align: center;
                        border-bottom: 2px solid #0066cc;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .company-name {
                        font-size: 28px;
                        font-weight: bold;
                        color: #0066cc;
                        margin-bottom: 5px;
                    }
                    .company-details {
                        font-size: 12px;
                        color: #666;
                    }
                    .letter-meta {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                        font-size: 14px;
                    }
                    .letter-content {
                        text-align: justify;
                        font-size: 14px;
                        line-height: 1.8;
                        white-space: pre-wrap;
                    }
                    .letter-footer {
                        margin-top: 60px;
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                        text-align: center;
                        font-size: 11px;
                        color: #888;
                    }
                    .signature-section {
                        margin-top: 60px;
                    }
                    .signature-line {
                        border-top: 1px solid #333;
                        width: 200px;
                        margin-top: 60px;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="letter-container">
                    <div class="letterhead">
                        <div class="company-name">${companyInfo.name}</div>
                        <div class="company-details">
                            ${companyInfo.address}<br/>
                            Tel: ${companyInfo.phone} | Email: ${companyInfo.email}
                        </div>
                    </div>
                    <div class="letter-meta">
                        <div><strong>Ref:</strong> ${letterDetails.reference_number}</div>
                        <div><strong>Date:</strong> ${letterDetails.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div class="letter-content">
                        ${isEditing ? editedContent : letterContent}
                    </div>
                    <div class="signature-section">
                        <div class="signature-line"></div>
                        <p><strong>Authorized Signatory</strong></p>
                        <p>Human Resources Department</p>
                    </div>
                    <div class="letter-footer">
                        This is a computer-generated document. For verification, please contact HR department.
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const handleDownloadPDF = () => {
        // Using browser's print to PDF functionality
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to download PDF');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${letterDetails.reference_number} - ${letterDetails.template_name}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        line-height: 1.6;
                        color: #1a1a1a;
                        background: white;
                        margin: 0;
                        padding: 40px;
                    }
                    .letter-container {
                        max-width: 210mm;
                        margin: 0 auto;
                    }
                    .letterhead {
                        text-align: center;
                        border-bottom: 3px solid #0066cc;
                        padding-bottom: 25px;
                        margin-bottom: 35px;
                    }
                    .company-name {
                        font-size: 32px;
                        font-weight: bold;
                        color: #0066cc;
                        margin-bottom: 8px;
                        letter-spacing: 2px;
                    }
                    .company-details {
                        font-size: 13px;
                        color: #555;
                    }
                    .letter-title {
                        text-align: center;
                        font-size: 18px;
                        font-weight: bold;
                        text-decoration: underline;
                        margin: 30px 0;
                        text-transform: uppercase;
                    }
                    .letter-meta {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 35px;
                        font-size: 14px;
                    }
                    .letter-content {
                        text-align: justify;
                        font-size: 15px;
                        line-height: 2;
                        white-space: pre-wrap;
                    }
                    .signature-section {
                        margin-top: 80px;
                    }
                    .signature-line {
                        border-top: 1px solid #333;
                        width: 220px;
                        margin-top: 70px;
                    }
                    .letter-footer {
                        margin-top: 60px;
                        border-top: 1px solid #ccc;
                        padding-top: 15px;
                        text-align: center;
                        font-size: 10px;
                        color: #888;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="letter-container">
                    <div class="letterhead">
                        <div class="company-name">${companyInfo.name}</div>
                        <div class="company-details">
                            ${companyInfo.address}<br/>
                            Tel: ${companyInfo.phone} | Email: ${companyInfo.email}
                        </div>
                    </div>
                    <div class="letter-meta">
                        <div><strong>Ref:</strong> ${letterDetails.reference_number}</div>
                        <div><strong>Date:</strong> ${letterDetails.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div class="letter-title">${letterDetails.template_name}</div>
                    <div class="letter-content">
                        ${isEditing ? editedContent : letterContent}
                    </div>
                    <div class="signature-section">
                        <div class="signature-line"></div>
                        <p><strong>Authorized Signatory</strong></p>
                        <p>Human Resources Department</p>
                    </div>
                    <div class="letter-footer">
                        This is a computer-generated document. For verification, contact HR at ${companyInfo.email}
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        toast.info('Use "Save as PDF" in the print dialog to download');
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const handleSave = async () => {
        if (!onSave) return;
        
        setIsSaving(true);
        try {
            await onSave(editedContent);
            setIsEditing(false);
            toast.success('Letter content saved successfully');
        } catch (error) {
            toast.error('Failed to save letter content');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">{letterDetails.template_name}</h2>
                            <p className="text-sm text-gray-500">Ref: {letterDetails.reference_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditable && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </button>
                        )}
                        {isEditing && (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedContent(letterContent);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save
                                </button>
                            </>
                        )}
                        {!isEditing && (
                            <>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Letter Info Bar */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{letterDetails.employee_name}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">{letterDetails.designation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{letterDetails.date || new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    <div ref={printRef} className="max-w-3xl mx-auto">
                        {/* Letterhead Preview */}
                        <div className="text-center border-b-2 border-blue-600 pb-6 mb-8">
                            <h1 className="text-3xl font-bold text-blue-700 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                                {companyInfo.name}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                {companyInfo.address}<br />
                                Tel: {companyInfo.phone} | Email: {companyInfo.email}
                            </p>
                        </div>

                        {/* Meta Info */}
                        <div className="flex justify-between text-sm text-gray-600 mb-8">
                            <div>
                                <span className="font-semibold">Ref:</span> {letterDetails.reference_number}
                            </div>
                            <div>
                                <span className="font-semibold">Date:</span> {letterDetails.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        {/* Letter Title */}
                        <h2 className="text-center text-lg font-bold underline mb-8 uppercase">
                            {letterDetails.template_name}
                        </h2>

                        {/* Letter Content */}
                        {isEditing ? (
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 leading-relaxed"
                                style={{ fontFamily: 'Georgia, serif', fontSize: '15px' }}
                            />
                        ) : (
                            <div 
                                className="text-gray-800 leading-relaxed whitespace-pre-wrap text-justify"
                                style={{ fontFamily: 'Georgia, serif', fontSize: '15px', lineHeight: '2' }}
                            >
                                {letterContent}
                            </div>
                        )}

                        {/* Signature Section */}
                        <div className="mt-16">
                            <div className="w-48 border-t border-gray-400 mt-16 pt-2">
                                <p className="font-semibold text-gray-800">Authorized Signatory</p>
                                <p className="text-sm text-gray-600">Human Resources Department</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                            This is a computer-generated document. For verification, please contact HR department.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LetterPreviewModal;
