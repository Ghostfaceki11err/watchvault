import { Plus, Check } from "lucide-react";

function MediaCard({ item, onAdd, onClick, isAdded }) {
    const posterUrl = item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null;

    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || "").substring(0, 4);

    return (
        <div className="media-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="media-poster-container">
                {posterUrl ? (
                    <img src={posterUrl} alt={title} className="media-poster" />
                ) : (
                    <div className="no-poster">
                        <span>No Image Available</span>
                    </div>
                )}
            </div>
            <div className="media-info">
                <div className="media-meta">
                    <span className="media-type">{item.media_type === "tv" ? "TV Series" : item.media_type}</span>
                    <span>{year}</span>
                </div>
                <h3 className="media-title">{title}</h3>
                
                {onAdd && (
                    <button 
                        className="btn add-btn" 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isAdded) onAdd(item);
                        }}
                        style={isAdded ? { background: '#22c55e', borderColor: '#22c55e', color: 'white', cursor: 'default' } : {}}
                    >
                        {isAdded ? <><Check size={16} /> In Vault</> : <><Plus size={16} /> Add to Vault</>}
                    </button>
                )}
            </div>
        </div>
    );
}

export default MediaCard;
