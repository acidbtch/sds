import { X } from 'lucide-react';

export type MediaPreviewValue = {
  src: string;
  kind: 'image' | 'video';
  title?: string;
} | null;

interface MediaPreviewModalProps {
  media: MediaPreviewValue;
  onClose: () => void;
}

export default function MediaPreviewModal({ media, onClose }: MediaPreviewModalProps) {
  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 max-w-md mx-auto w-full"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full transition-colors active:scale-95"
        onClick={onClose}
        aria-label="Закрыть просмотр"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="relative w-full h-full flex items-center justify-center">
        {media.kind === 'video' ? (
          <video
            src={media.src}
            controls
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <img
            src={media.src}
            alt={media.title || 'Просмотр файла'}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}
