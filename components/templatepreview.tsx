// pages/components/templatepreview.tsx
"use client";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

type Props = {
  id: string;
  title: string;
  description?: string;
  features?: string[];
  category?: string;
  selected: boolean;
  onSelect: (id: string) => void;
  children: React.ReactNode;
};

/** Simple portal modal (no external deps) */
function Modal({
  open,
  onClose,
  title,
  description,
  features,
  category,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  features?: string[];
  category?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  // Inject small style override scoped to the modal to force dark readable text.
  const overrideCSS = `
    /* Force dark text inside modal preview for readability */
    .resumator-modal-override * {
      color: #111827 !important; /* tailwind text-gray-900 */
    }
    /* Keep links visible (blue) */
    .resumator-modal-override a {
      color: #1d4ed8 !important; /* tailwind blue-700 */
    }
    /* Ensure bullets and small text are dark too */
    .resumator-modal-override li, 
    .resumator-modal-override p, 
    .resumator-modal-override h1, 
    .resumator-modal-override h2, 
    .resumator-modal-override h3, 
    .resumator-modal-override span {
      color: #111827 !important;
    }
  `;

  return ReactDOM.createPortal(
    <>
      <style>{overrideCSS}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden
        />

        {/* modal panel */}
        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-[95vw] sm:w-[90vw] lg:w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-lg bg-gray-100 shadow-xl mx-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b bg-white p-3 sm:p-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>
              {description && <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="mt-2 sm:mt-0 sm:ml-4 rounded px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 self-start"
              aria-label="Close preview"
            >
              Close
            </button>
          </div>

          <div className="py-4 sm:py-6 lg:py-8 bg-gray-50 overflow-auto max-h-[calc(95vh-80px)]">
            {/* Mobile/Tablet: Scaled down resume */}
            <div className="block lg:hidden px-2 sm:px-4">
              <div className="w-full flex justify-center" style={{ height: '520px', overflow: 'hidden' }}>
                <div 
                  className="bg-white shadow-lg border border-gray-200 resumator-modal-override"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    transform: 'scale(0.45)',
                    transformOrigin: 'top center',
                    marginTop: '0'
                  }}
                >
                  <div className="p-8">
                    {children}
                  </div>
                </div>
              </div>

              {/* Mobile Helper */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 px-4">
                  💡 Pinch to zoom for better reading
                </p>
              </div>
            </div>

            {/* Desktop: Full size preview */}
            <div className="hidden lg:block px-4">
              <div className="flex justify-center">
            <div
              className="w-full max-w-[794px] bg-white shadow-lg rounded-lg overflow-hidden resumator-modal-override border border-gray-200"
              style={{ aspectRatio: '210/297', maxHeight: '80vh' }}
              aria-hidden={false}
            >
              <div className="w-full h-full p-6 md:p-8 overflow-auto">
                <div className="w-full h-full min-h-[1123px]" style={{ width: '210mm', minHeight: '297mm' }}>
                  {children}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

const TemplatePreview: React.FC<Props> = ({ 
  id, 
  title, 
  description, 
  features, 
  category, 
  selected, 
  onSelect, 
  children 
}) => {
  const [open, setOpen] = useState(false);

  // clicking the thumbnail card selects the template
  const handleCardClick = () => onSelect(id);

  // View Full should not trigger selection — stop propagation
  const handleViewFullClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group w-full max-w-[280px]"
    >
      {/* Thumbnail / preview box with proper A4 aspect ratio */}
      <div
        className={`relative w-full aspect-[210/297] overflow-hidden rounded-xl shadow-lg border-2 transition-all duration-300 ${
          selected 
            ? "ring-4 ring-blue-500 ring-offset-2 border-blue-300 shadow-blue-200/50 bg-blue-50/30" 
            : "border-gray-200 hover:border-blue-200 hover:shadow-xl group-hover:shadow-blue-100/50"
        } bg-white`}
        style={{ aspectRatio: '210/297' }}
        aria-hidden
      >
        {/* Render the full template scaled down with responsive scaling */}
        <div className="pointer-events-none origin-top-left scale-[0.32] w-[800px] h-[1133px] text-gray-900 p-2">
          {children}
        </div>
        
        {/* Subtle gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Selection indicator */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className="mt-4 text-center w-full px-3">
        <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{description}</p>
        )}
        
        <div className="flex items-center justify-center gap-2 mb-3">
          {category && (
            <span className="px-3 py-1 text-xs bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full capitalize font-medium border border-gray-200">
              {category}
            </span>
          )}
          {selected && (
            <span className="px-3 py-1 text-xs bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-full font-semibold border border-blue-200">
              ✓ Selected
            </span>
          )}
      </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
      <button
        onClick={handleViewFullClick}
            className="flex-1 max-w-[100px] text-xs bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        aria-label={`View full ${title}`}
      >
        👁️ Preview
      </button>
          
          {selected ? (
            <div className="flex-1 max-w-[100px] text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-medium shadow-sm flex items-center justify-center">
              ✓ Selected
            </div>
          ) : (
            <button
              onClick={handleCardClick}
              className="flex-1 max-w-[100px] text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Modal showing full-size preview inside same page */}
      <Modal 
        open={open} 
        onClose={() => setOpen(false)} 
        title={title}
        description={description}
        features={features}
        category={category}
      >
        {/* Render the same component as full-size (no scaling) */}
        <div className="w-full h-full">{children}</div>
      </Modal>
    </div>
  );
};

export default TemplatePreview;
