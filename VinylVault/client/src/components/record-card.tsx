import { FirestoreRecord } from "@/lib/firebase-service";

type RecordCardProps = {
  record: FirestoreRecord;
  onClick: () => void;
};

const defaultCoverImage = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=500&h=500";

export default function RecordCard({ record, onClick }: RecordCardProps) {
  return (
    <div 
      className="record-card bg-charcoal rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] cursor-pointer" 
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden group">
        <img 
          src={record.coverImage || defaultCoverImage} 
          alt={`${record.artist} - ${record.title}`} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultCoverImage;
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
          <button className="p-2 bg-burgundy rounded-full hover:bg-burgundy/80" title="Play">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          
          <div className="flex space-x-2">
            <button 
              className="p-2 bg-navy/80 rounded-full hover:bg-navy" 
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                // Edit functionality will be handled in detail modal
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button 
              className="p-2 bg-navy/80 rounded-full hover:bg-navy" 
              title="More Info"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-heading font-bold text-lg truncate" title={record.title}>{record.title}</h3>
        <p className="text-cream opacity-80 truncate" title={record.artist}>{record.artist}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-amber">{record.year || "Unknown year"}</span>
          {record.genre && (
            <span className="text-xs bg-burgundy/20 text-burgundy px-2 py-1 rounded-full">
              {record.genre}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
