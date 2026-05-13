import { FileText, Image as ImageIcon, Play, Video, X } from 'lucide-react';
import {
  getUploadedFilePreviewSource,
  inferUploadedFileKind,
  type UploadedFileItem,
} from '../lib/uploadedFiles';

interface UploadedFilesGridProps {
  files: UploadedFileItem[];
  onRemove?: (key: string) => void;
  onPreview?: (file: UploadedFileItem) => void;
  className?: string;
}

function getIcon(file: UploadedFileItem) {
  const kind = file.kind || inferUploadedFileKind(file.previewUrl || file.name || file.key);
  if (kind === 'image') return <ImageIcon className="w-6 h-6 text-gray-400" />;
  if (kind === 'video') return <Video className="w-6 h-6 text-gray-400" />;
  return <FileText className="w-6 h-6 text-gray-400" />;
}

export default function UploadedFilesGrid({ files, onRemove, onPreview, className = '' }: UploadedFilesGridProps) {
  if (files.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {files.map((file) => {
        const previewSource = getUploadedFilePreviewSource(file);
        const kind = file.kind || inferUploadedFileKind(previewSource || file.name || file.key);
        const canPreview = Boolean(previewSource && onPreview);
        const previewContent = kind === 'image' && previewSource ? (
          <img src={previewSource} alt={file.name} className="w-full h-full object-cover" />
        ) : kind === 'video' && previewSource ? (
          <>
            <video src={previewSource} className="w-full h-full object-cover" muted playsInline />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
              <Play className="w-5 h-5 fill-current" />
            </span>
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-1 px-1 text-center">
            {getIcon(file)}
            <span className="w-full truncate text-[10px] text-gray-500">{file.name}</span>
          </div>
        );

        return (
          <div
            key={file.key}
            role={canPreview ? 'button' : undefined}
            tabIndex={canPreview ? 0 : undefined}
            onClick={() => canPreview && onPreview?.(file)}
            onKeyDown={(event) => {
              if (!canPreview) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPreview?.(file);
              }
            }}
            className={`relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white ${canPreview ? 'cursor-pointer active:scale-[0.98]' : ''}`}
            title={file.name}
          >
            <div className="relative block w-full h-full text-left">
              {previewContent}
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(file.key);
                }}
                aria-label={`Удалить ${file.name}`}
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm active:scale-95 transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
