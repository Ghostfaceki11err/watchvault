import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getEpisodeDetails } from "../services/tmdbApi";

function VaultItem({ item, onUpdateStatus, onUpdateType, onUpdateProgress, onRemove, onClick }) {
    const [episodeName, setEpisodeName] = useState(null);

    useEffect(() => {
        const fetchEpisode = async () => {
            if ((item.type === 'tv' || item.type === 'anime') && item.tmdbId && item.season > 0 && item.episode > 0) {
                const data = await getEpisodeDetails(item.tmdbId, item.season, item.episode);
                if (data && data.name) {
                    setEpisodeName(data.name);
                } else {
                    setEpisodeName(null);
                }
            } else {
                setEpisodeName(null);
            }
        };

        // Add a slight debounce to avoid spamming the API if the user clicks '+' fast
        const timeoutId = setTimeout(() => {
            fetchEpisode();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [item.type, item.tmdbId, item.season, item.episode]);
    const posterUrl = item.poster
        ? `https://image.tmdb.org/t/p/w500${item.poster}`
        : null;

    return (
        <div className="vault-item" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            {posterUrl ? (
                <img src={posterUrl} alt={item.title} className="vault-poster" />
            ) : (
                <div className="vault-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1d24' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No Image</span>
                </div>
            )}
            <div className="vault-info">
                <div className="vault-details">
                    <h3 className="vault-title">{item.title}</h3>
                    {episodeName && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                            {`S${item.season} E${item.episode}: ${episodeName}`}
                        </span>
                    )}
                </div>
                <div className="vault-actions">
                    <select 
                        className="status-select"
                        value={item.type}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateType(item.id, e.target.value)}
                        style={{ borderColor: 'rgba(229, 9, 20, 0.4)' }}
                    >
                        <option value="movie">Movie</option>
                        <option value="tv">TV Series</option>
                        <option value="anime">Anime</option>
                    </select>

                    <select 
                        className="status-select"
                        value={item.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                    >
                        <option value="Plan to Watch">Plan to Watch</option>
                        <option value="Watching">Watching</option>
                        <option value="Completed">Completed</option>
                    </select>

                    {/* Progress tracking moved to MediaModal */}
                    
                    <button 
                        className="remove-btn" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item.id);
                        }} 
                        title="Remove from Vault"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VaultItem;
