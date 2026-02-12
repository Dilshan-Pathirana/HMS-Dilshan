import React, { useRef, useState } from 'react';

interface FileUploadFieldProps {
  label: string;
  name: string;
  accept?: string;
  maxSizeMB?: number;
  error?: string;
  onFileSelect: (name: string, file: File) => void;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  name,
  accept = '.jpg,.jpeg,.png',
  maxSizeMB = 2,
  error,
  onFileSelect,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setSizeError(`File exceeds ${maxSizeMB} MB limit`);
      return;
    }
    setSizeError(null);
    setFileName(file.name);
    onFileSelect(name, file);
  };

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        {fileName ? (
          <p className="text-sm text-neutral-700">{fileName}</p>
        ) : (
          <p className="text-sm text-neutral-400">Click to upload ({accept})</p>
        )}
      </div>
      {(error || sizeError) && (
        <p className="text-xs text-red-500 mt-1">{sizeError || error}</p>
      )}
    </div>
  );
};

export default FileUploadField;
