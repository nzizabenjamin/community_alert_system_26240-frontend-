import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const Pagination = ({ currentPage, totalPages, onPageChange, loading = false }) => {
  const pages = [];
  const maxVisiblePages = 5;

  // Calculate which pages to show
  let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

  // Adjust start if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(0, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || loading}
          icon={ChevronLeft}
        >
          Previous
        </Button>

        <div className="hidden sm:flex gap-1">
          {startPage > 0 && (
            <>
              <button
                onClick={() => onPageChange(0)}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 1 && <span className="px-2 py-1">...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={loading}
              className={`
                px-3 py-1 text-sm border rounded transition-colors
                ${currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'hover:bg-gray-50'
                }
              `}
            >
              {page + 1}
            </button>
          ))}

          {endPage < totalPages - 1 && (
            <>
              {endPage < totalPages - 2 && <span className="px-2 py-1">...</span>}
              <button
                onClick={() => onPageChange(totalPages - 1)}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <span className="text-sm text-gray-700 sm:hidden">
          Page {currentPage + 1} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || loading}
          icon={ChevronRight}
        >
          Next
        </Button>
      </div>

      <div className="hidden sm:block text-sm text-gray-700">
        Page <span className="font-medium">{currentPage + 1}</span> of{' '}
        <span className="font-medium">{totalPages}</span>
      </div>
    </div>
  );
};