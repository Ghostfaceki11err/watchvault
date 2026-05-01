import { Trash2 } from "lucide-react";

function VaultItem({ item, onUpdateStatus, onUpdateType, onRemove, onClick }) {
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
