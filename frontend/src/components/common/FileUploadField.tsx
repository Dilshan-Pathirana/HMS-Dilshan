import React, { useRef, useState } from "react";

interface FileUploadFieldProps {
    label: string;
    name: string;
    accept: string;
    maxSizeMB: number;
    required?: boolean;
    existingUrl?: string | null;
    error?: string;
    onFileSelect: (name: string, file: File | null) => void;
    onFileUploadPath?: (name: string, path: string | null) => void;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
    label,
    name,
    accept,
    maxSizeMB,
    required = false,
    existingUrl,
    error,
    onFileSelect,
}) => {
    const [preview, setPreview] = useState<string | null>(existingUrl || null);
    const [fileName, setFileName] = useState<string>("");
    const [dragOver, setDragOver] = useState(false);
    const [localError, setLocalError] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    const isImage = (file: File) => file.type.startsWith("image/");
    const isPdf = (file: File) => file.type === "application/pdf";

    const validateAndSet = (file: File) => {
        setLocalError("");

        // Check file size
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setLocalError(`File too large. Maximum size is ${maxSizeMB} MB`);
            return;
        }

        // Check file extension
        const allowedExts = accept.split(",").map((s) => s.trim().toLowerCase());
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        const mimeOk = allowedExts.some(
            (a) => a === ext || a === file.type || (a.endsWith("/*") && file.type.startsWith(a.replace("/*", "/")))
        );
        if (!mimeOk) {
            setLocalError(`Invalid file type. Allowed: ${accept}`);
            return;
        }

        setFileName(file.name);

        if (isImage(file)) {
            setPreview(URL.createObjectURL(file));
        } else if (isPdf(file)) {
            setPreview(null);
        }

        onFileSelect(name, file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSet(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) validateAndSet(file);
    };

    const handleRemove = () => {
        setPreview(null);
        setFileName("");
        setLocalError("");
        onFileSelect(name, null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const displayError = localError || error;
    const hasFile = preview || fileName;

    return (
        <div className="col-span-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {!hasFile ? (
                <div
                    className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                        ${dragOver ? "border-primary-500 bg-primary-50" : displayError ? "border-red-400 bg-red-50" : "border-neutral-300 hover:border-primary-400 hover:bg-neutral-50"}`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center gap-1">
                        <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-neutral-500">
                            Drag & drop or <span className="text-primary-600 font-medium">click to browse</span>
                        </p>
                        <p className="text-xs text-neutral-400">
                            {accept.replace(/\./g, "").toUpperCase()} &bull; Max {maxSizeMB} MB
                        </p>
                    </div>
                </div>
            ) : (
                <div className={`mt-1 border rounded-lg p-3 ${displayError ? "border-red-400 bg-red-50" : "border-neutral-300"}`}>
                    <div className="flex items-center gap-3">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded-md border border-neutral-200"
                            />
                        ) : (
                            <div className="w-16 h-16 flex items-center justify-center bg-neutral-100 rounded-md border border-neutral-200">
                                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-700 truncate">{fileName}</p>
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="text-xs text-primary-600 hover:text-primary-800 mr-3"
                            >
                                Change
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                name={name}
                accept={accept}
                onChange={handleChange}
                className="hidden"
            />

            {displayError && (
                <p className="text-red-500 text-sm mt-1">{displayError}</p>
            )}
        </div>
    );
};

export default FileUploadField;
