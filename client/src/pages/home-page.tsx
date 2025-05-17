import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Record } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";
import Header from "@/components/header";
import Footer from "@/components/footer";
import RecordCard from "@/components/record-card";
import AddRecordModal from "@/components/add-record-modal";
import RecordDetailModal from "@/components/record-detail-modal";
import { 
  DiscIcon, 
  AlbumIcon, 
  MusicIcon, 
  CalendarIcon,
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [decadeFilter, setDecadeFilter] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [viewType, setViewType] = useState("grid");

  // User is already defined at the top of the component
  
  // Fetch all records from Firebase
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const { recordsService } = await import('@/lib/firebase-service');
      return await recordsService.getRecords(user.uid);
    },
    enabled: !!user?.uid,
  });

  // Delete record mutation using Firebase
  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { recordsService } = await import('@/lib/firebase-service');
      await recordsService.deleteRecord(id);
    },
    onSuccess: () => {
      // Invalidate and refetch the records query
      queryClient.invalidateQueries({ queryKey: ['records', user?.uid] });
      toast({
        title: "Record deleted",
        description: "The record has been removed from your collection",
      });
      setSelectedRecord(null);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the record",
        variant: "destructive",
      });
    },
  });

  // Filter and sort records
  const filteredAndSortedRecords = () => {
    if (!records) return [];

    let filtered = [...records];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.title.toLowerCase().includes(query) ||
          record.artist.toLowerCase().includes(query) ||
          (record.genre && record.genre.toLowerCase().includes(query)) ||
          (record.year && record.year.includes(query))
      );
    }

    // Apply genre filter
    if (genreFilter && genreFilter !== "all") {
      filtered = filtered.filter(
        (record) => record.genre && record.genre.toLowerCase().includes(genreFilter.toLowerCase())
      );
    }

    // Apply decade filter
    if (decadeFilter && decadeFilter !== "all") {
      const decade = decadeFilter.substring(0, 3); // e.g., "197" from "1970s"
      filtered = filtered.filter(
        (record) => record.year && record.year.startsWith(decade)
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "artist":
          return a.artist.localeCompare(b.artist);
        case "title":
          return a.title.localeCompare(b.title);
        case "year-new":
          if (!a.year) return 1;
          if (!b.year) return -1;
          return b.year.localeCompare(a.year);
        case "year-old":
          if (!a.year) return 1;
          if (!b.year) return -1;
          return a.year.localeCompare(b.year);
        case "recent":
        default:
          const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
      }
    });
  };

  // Calculate stats
  const totalRecords = records.length;
  const uniqueArtists = new Set(records.map(record => record.artist)).size;
  const uniqueGenres = new Set(records.filter(r => r.genre).map(record => record.genre)).size;

  // Calculate decade span
  const years = records
    .filter(r => r.year)
    .map(r => parseInt(r.year || "0"))
    .filter(y => !isNaN(y) && y > 0);
  
  let decadeSpan = "N/A";
  if (years.length > 0) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const minDecade = Math.floor(minYear / 10) * 10;
    const maxDecade = Math.floor(maxYear / 10) * 10;
    decadeSpan = `${minDecade}s-${maxDecade}s`;
  }

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleRecordClick = (record: Record) => {
    setSelectedRecord(record);
  };

  const handleCloseDetailModal = () => {
    setSelectedRecord(null);
  };

  const handleDeleteRecord = async (id: string) => {
    console.log("Delete function called with ID:", id);
    
    // The confirmation is now handled in the modal component
    try {
      const { recordsService } = await import('@/lib/firebase-service');
      await recordsService.deleteRecord(id);
      
      console.log("Record deleted successfully");
      
      // Update local state
      const updatedRecords = records.filter(record => record.id !== id);
      console.log(`Filtered records from ${records.length} to ${updatedRecords.length}`);
      
      // Close the modal and show success message
      setSelectedRecord(null);
      
      toast({
        title: "Record deleted",
        description: "The record has been removed from your collection",
      });
      
      // Force a refresh to update the UI
      queryClient.invalidateQueries({ queryKey: ['records', user?.uid] });
      
    } catch (error) {
      console.error("Error during delete operation:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get unique genres for filter dropdown
  const genres = Array.from(
    new Set(records.filter(r => r.genre).map(r => r.genre))
  ).filter(Boolean) as string[];

  // Get unique decades for filter dropdown
  const decades = Array.from(
    new Set(
      records
        .filter(r => r.year && r.year.length >= 3)
        .map(r => {
          const year = parseInt(r.year || "0");
          if (!isNaN(year)) {
            const decade = Math.floor(year / 10) * 10;
            return `${decade}s`;
          }
          return null;
        })
    )
  ).filter(Boolean) as string[];

  return (
    <div className="flex flex-col min-h-screen bg-navy text-cream">
      <Header 
        user={user} 
        onSearch={setSearchQuery} 
        searchQuery={searchQuery}
      />

      <main className="flex-grow pb-20">
        <div className="container mx-auto px-4 py-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold">Your Collection</h2>
              <p className="text-cream opacity-70">Manage and explore your vinyl records</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <button 
                className="bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-2 rounded-md font-medium flex items-center"
                onClick={handleOpenAddModal}
              >
                <span className="mr-2">+</span> Add New Record
              </button>
            </div>
          </div>
          
          {/* Collection Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-charcoal rounded-lg p-4 shadow-lg">
              <div className="flex items-center">
                <div className="bg-burgundy/20 p-3 rounded-full mr-4">
                  <DiscIcon className="h-6 w-6 text-burgundy" />
                </div>
                <div>
                  <h3 className="text-amber text-2xl font-bold">{totalRecords}</h3>
                  <p className="text-sm text-cream opacity-70">Total Records</p>
                </div>
              </div>
            </div>
            
            <div className="bg-charcoal rounded-lg p-4 shadow-lg">
              <div className="flex items-center">
                <div className="bg-amber/20 p-3 rounded-full mr-4">
                  <AlbumIcon className="h-6 w-6 text-amber" />
                </div>
                <div>
                  <h3 className="text-amber text-2xl font-bold">{uniqueArtists}</h3>
                  <p className="text-sm text-cream opacity-70">Artists</p>
                </div>
              </div>
            </div>
            
            <div className="bg-charcoal rounded-lg p-4 shadow-lg">
              <div className="flex items-center">
                <div className="bg-cream/20 p-3 rounded-full mr-4">
                  <MusicIcon className="h-6 w-6 text-cream" />
                </div>
                <div>
                  <h3 className="text-amber text-2xl font-bold">{uniqueGenres}</h3>
                  <p className="text-sm text-cream opacity-70">Genres</p>
                </div>
              </div>
            </div>
            
            <div className="bg-charcoal rounded-lg p-4 shadow-lg">
              <div className="flex items-center">
                <div className="bg-burgundy/20 p-3 rounded-full mr-4">
                  <CalendarIcon className="h-6 w-6 text-burgundy" />
                </div>
                <div>
                  <h3 className="text-amber text-2xl font-bold">{decadeSpan}</h3>
                  <p className="text-sm text-cream opacity-70">Decade Span</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter & Controls */}
          <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-[150px] bg-navy border-amber/30">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-navy border-amber/30">
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={decadeFilter} onValueChange={setDecadeFilter}>
                <SelectTrigger className="w-[150px] bg-navy border-amber/30">
                  <SelectValue placeholder="All Decades" />
                </SelectTrigger>
                <SelectContent className="bg-navy border-amber/30">
                  <SelectItem value="all">All Decades</SelectItem>
                  {decades.map((decade) => (
                    <SelectItem key={decade} value={decade}>
                      {decade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-cream opacity-70">Sort by:</span>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[150px] bg-navy border-amber/30">
                  <SelectValue placeholder="Recently Added" />
                </SelectTrigger>
                <SelectContent className="bg-navy border-amber/30">
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="artist">Artist (A-Z)</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="year-new">Year (Newest)</SelectItem>
                  <SelectItem value="year-old">Year (Oldest)</SelectItem>
                </SelectContent>
              </Select>
              
              <button 
                className={`p-2 border border-amber/30 rounded-md ${viewType === 'grid' ? 'bg-charcoal' : 'hover:bg-charcoal'}`} 
                title="Grid View"
                onClick={() => setViewType('grid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              
              <button 
                className={`p-2 border border-amber/30 rounded-md ${viewType === 'list' ? 'bg-charcoal' : 'hover:bg-charcoal'}`} 
                title="List View"
                onClick={() => setViewType('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber" />
              <span className="ml-2 text-amber">Loading your collection...</span>
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && filteredAndSortedRecords().length === 0 && (
            <div className="text-center py-12 bg-charcoal/50 rounded-lg">
              {searchQuery || genreFilter || decadeFilter ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-burgundy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-heading font-bold">No matching records found</h3>
                  <p className="text-cream/70 mt-2">Try adjusting your search or filters</p>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/20 flex items-center justify-center mb-4">
                    <DiscIcon className="h-8 w-8 text-burgundy" />
                  </div>
                  <h3 className="text-xl font-heading font-bold">Your collection is empty</h3>
                  <p className="text-cream/70 mt-2">Add your first record to get started</p>
                  <button 
                    className="mt-4 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-2 rounded-md font-medium"
                    onClick={handleOpenAddModal}
                  >
                    Add New Record
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Records Grid */}
          {!isLoading && filteredAndSortedRecords().length > 0 && (
            viewType === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedRecords().map((record) => (
                  <RecordCard 
                    key={record.id} 
                    record={record} 
                    onClick={() => handleRecordClick(record)}
                  />
                ))}
                
                {/* Add New Record card */}
                <div 
                  className="bg-charcoal/50 border-2 border-dashed border-amber/30 rounded-lg overflow-hidden shadow-lg flex items-center justify-center h-full min-h-[300px] hover:border-amber transition-colors duration-300 cursor-pointer"
                  onClick={handleOpenAddModal}
                >
                  <div className="text-center p-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-burgundy/20 flex items-center justify-center mb-4">
                      <span className="text-3xl text-burgundy">+</span>
                    </div>
                    <h3 className="font-heading font-bold text-lg text-amber">Add New Record</h3>
                    <p className="text-cream opacity-70 text-sm mt-2">Expand your collection</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-charcoal rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 p-4 font-medium text-amber border-b border-amber/10">
                  <div className="col-span-5 md:col-span-4">Title / Artist</div>
                  <div className="col-span-3 md:col-span-2 text-center">Year</div>
                  <div className="hidden md:block md:col-span-2 text-center">Genre</div>
                  <div className="col-span-3 md:col-span-3 text-center">Custom Fields</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                
                {filteredAndSortedRecords().map((record) => (
                  <div 
                    key={record.id} 
                    className="grid grid-cols-12 p-4 hover:bg-navy/30 cursor-pointer border-b border-amber/10"
                    onClick={() => handleRecordClick(record)}
                  >
                    <div className="col-span-5 md:col-span-4">
                      <div className="font-bold truncate">{record.title}</div>
                      <div className="text-sm text-cream/70">{record.artist}</div>
                    </div>
                    <div className="col-span-3 md:col-span-2 text-center self-center">
                      {record.year || "-"}
                    </div>
                    <div className="hidden md:block md:col-span-2 text-center self-center">
                      {record.genre ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-burgundy/20 text-burgundy">
                          {record.genre}
                        </span>
                      ) : "-"}
                    </div>
                    <div className="col-span-3 md:col-span-3 text-center self-center">
                      {record.customFields && Object.keys(record.customFields).length > 0 
                        ? `${Object.keys(record.customFields).length} fields` 
                        : "-"}
                    </div>
                    <div className="col-span-1 text-right self-center">
                      <button 
                        className="text-amber hover:text-burgundy"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecordClick(record);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
      />

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={handleCloseDetailModal}
          onDelete={handleDeleteRecord}
        />
      )}
    </div>
  );
}
