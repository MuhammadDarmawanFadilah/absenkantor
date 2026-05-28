import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function ServerPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ServerPaginationProps) {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  // Generate page numbers to show
  const generatePageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(0, currentPage - 2);
      const end = Math.min(totalPages - 1, start + maxPagesToShow - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Results Info */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{startItem}</span> hingga{" "}
            <span className="font-medium text-foreground">{endItem}</span> dari{" "}
            <span className="font-medium text-foreground">{totalElements}</span> hasil
          </div>
          
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tampilkan:</span>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Halaman pertama</span>
          </Button>
          
          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Halaman sebelumnya</span>
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum + 1}
              </Button>
            ))}
            
            {totalPages > 5 && currentPage < totalPages - 3 && (
              <>
                <span className="px-2 text-muted-foreground">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(totalPages - 1)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Halaman selanjutnya</span>
          </Button>
          
          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Halaman terakhir</span>
          </Button>
        </div>
      </div>
      
      {/* Page Info - Mobile */}
      <div className="sm:hidden px-4 pb-3">
        <div className="text-center text-sm text-muted-foreground">
          Halaman {currentPage + 1} dari {totalPages}
        </div>
      </div>
    </div>
  )
}

export default ServerPagination
