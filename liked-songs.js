/**
 * Groove Music Player - Liked Songs and Playlists Functionality
 */

// Store for liked songs and playlists
let likedSongs = [];
let userPlaylists = [];
let currentSongElement = null; // Track the song being added to playlist

// Load data from localStorage on init
function loadUserData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        const user = JSON.parse(userData);
        
        // Load liked songs if available
        if (user.likedSongs) {
            likedSongs = user.likedSongs;
        }
        
        // Load playlists if available
        if (user.playlists) {
            userPlaylists = user.playlists;
        }
    }
}

// Save data to localStorage
function saveUserData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        const user = JSON.parse(userData);
        
        // Update with current data
        user.likedSongs = likedSongs;
        user.playlists = userPlaylists;
        
        // Save back to localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Also update in users array
        const users = getUsers();
        const userIndex = users.findIndex(u => u.username === user.username);
        if (userIndex !== -1) {
            users[userIndex].likedSongs = likedSongs;
            users[userIndex].playlists = userPlaylists;
            saveUsers(users);
        }
    }
}

// Toggle like status for a song
function toggleLikeSong(songName) {
    const index = likedSongs.findIndex(song => song === songName);
    
    if (index === -1) {
        // Add to liked songs
        likedSongs.push(songName);
    } else {
        // Remove from liked songs
        likedSongs.splice(index, 1);
    }
    
    // Save changes
    saveUserData();
    
    // Update UI
    updateSongLikeStatus();
}

// Check if a song is liked
function isSongLiked(songName) {
    return likedSongs.includes(songName);
}

// Update like status icons in the UI
function updateSongLikeStatus() {
    // Update in song list
    document.querySelectorAll('.songlist ul li').forEach(li => {
        const songName = li.querySelector('.info div').innerHTML.trim();
        const likeBtn = li.querySelector('.like-btn');
        
        if (likeBtn) {
            if (isSongLiked(songName)) {
                likeBtn.classList.add('liked');
                likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
            } else {
                likeBtn.classList.remove('liked');
                likeBtn.innerHTML = '<i class="far fa-heart"></i>';
            }
        }
    });
}

// Create a new playlist
function createPlaylist(name) {
    // Generate a unique ID
    const playlistId = 'playlist_' + Date.now();
    
    const newPlaylist = {
        id: playlistId,
        name: name,
        songs: [],
        createdAt: new Date().toISOString()
    };
    
    userPlaylists.push(newPlaylist);
    saveUserData();
    
    return newPlaylist;
}

// Add song to playlist
function addSongToPlaylist(songName, playlistId) {
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (playlist && !playlist.songs.includes(songName)) {
        playlist.songs.push(songName);
        saveUserData();
        return true;
    }
    return false;
}

// Remove song from playlist
function removeSongFromPlaylist(songName, playlistId) {
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (playlist) {
        const index = playlist.songs.indexOf(songName);
        if (index !== -1) {
            playlist.songs.splice(index, 1);
            saveUserData();
            return true;
        }
    }
    return false;
}

// Show liked songs
function showLikedSongs() {
    // Clear existing songs in the main view
    const songListContainer = document.querySelector('.songlist ul');
    songListContainer.innerHTML = '';
    
    // Update heading
    const heading = document.querySelector('.library .heading h2');
    if (heading) {
        heading.textContent = 'Liked Songs';
    }
    
    // Add each liked song
    likedSongs.forEach(song => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img class="invert" src="images/music.svg" alt="">
            <div class="info">
                <div>${song}</div>
            </div>
            <div class="song-actions">
                <button class="song-action-btn like-btn liked"><i class="fas fa-heart"></i></button>
                <button class="song-action-btn add-to-playlist-btn"><i class="fas fa-plus"></i></button>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="images/play.svg" alt="">
            </div>
        `;
        
        // Add click event for playing the song
        li.addEventListener('click', function(e) {
            // Ignore clicks on buttons
            if (e.target.closest('.song-action-btn')) return;
            
            const songName = this.querySelector('.info div').textContent.trim();
            playSong(songName);
        });
        
        // Add click event for like/unlike
        const likeBtn = li.querySelector('.like-btn');
        likeBtn.addEventListener('click', function() {
            const songName = li.querySelector('.info div').textContent.trim();
            toggleLikeSong(songName);
        });
        
        // Add click event for add to playlist
        const addToPlaylistBtn = li.querySelector('.add-to-playlist-btn');
        addToPlaylistBtn.addEventListener('click', function() {
            const songName = li.querySelector('.info div').textContent.trim();
            openAddToPlaylistModal(songName);
        });
        
        songListContainer.appendChild(li);
    });
    
    // Show message if no liked songs
    if (likedSongs.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        emptyMessage.innerHTML = `
            <div class="empty-icon"><i class="fas fa-heart"></i></div>
            <h3>Songs you like will appear here</h3>
            <p>Save songs by clicking the heart icon.</p>
        `;
        songListContainer.appendChild(emptyMessage);
    }
}

// Show all songs with like status
function enhanceSongList() {
    document.querySelectorAll('.songlist ul li').forEach(li => {
        // Check if song actions already added
        if (li.querySelector('.song-actions')) return;
        
        const songName = li.querySelector('.info div').textContent.trim();
        const isLiked = isSongLiked(songName);
        
        // Create song actions container
        const songActions = document.createElement('div');
        songActions.className = 'song-actions';
        
        // Add like button
        const likeBtn = document.createElement('button');
        likeBtn.className = `song-action-btn like-btn ${isLiked ? 'liked' : ''}`;
        likeBtn.innerHTML = isLiked ? 
            '<i class="fas fa-heart"></i>' : 
            '<i class="far fa-heart"></i>';
        
        // Add event listener for liking/unliking
        likeBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent playing the song
            toggleLikeSong(songName);
        });
        
        // Add to playlist button
        const addToPlaylistBtn = document.createElement('button');
        addToPlaylistBtn.className = 'song-action-btn add-to-playlist-btn';
        addToPlaylistBtn.innerHTML = '<i class="fas fa-plus"></i>';
        
        // Add event listener for adding to playlist
        addToPlaylistBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent playing the song
            openAddToPlaylistModal(songName);
        });
        
        // Add buttons to song actions
        songActions.appendChild(likeBtn);
        songActions.appendChild(addToPlaylistBtn);
        
        // Insert before playnow
        const playnow = li.querySelector('.playnow');
        li.insertBefore(songActions, playnow);
    });
}

// Open the create playlist modal
function openCreatePlaylistModal() {
    const modal = document.getElementById('create-playlist-modal');
    if (modal) {
        modal.classList.add('show');
        
        // Focus the input
        const nameInput = document.getElementById('playlist-name');
        if (nameInput) {
            nameInput.value = '';
            nameInput.focus();
        }
    }
}

// Close the create playlist modal
function closeCreatePlaylistModal() {
    const modal = document.getElementById('create-playlist-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Open the add to playlist modal
function openAddToPlaylistModal(songName) {
    const modal = document.getElementById('add-to-playlist-modal');
    if (modal) {
        currentSongElement = songName;
        modal.classList.add('show');
        
        // Populate playlists
        const playlistsContainer = document.getElementById('playlists-list');
        if (playlistsContainer) {
            playlistsContainer.innerHTML = '';
            
            if (userPlaylists.length === 0) {
                // No playlists message
                playlistsContainer.innerHTML = `
                    <p class="no-playlists">You don't have any playlists yet</p>
                    <button class="modal-btn create" id="create-new-playlist">
                        Create New Playlist
                    </button>
                `;
                
                // Add event listener
                const createBtn = document.getElementById('create-new-playlist');
                if (createBtn) {
                    createBtn.addEventListener('click', function() {
                        closeAddToPlaylistModal();
                        openCreatePlaylistModal();
                    });
                }
            } else {
                // List all playlists
                userPlaylists.forEach(playlist => {
                    const playlistItem = document.createElement('div');
                    playlistItem.className = 'playlist-item';
                    playlistItem.dataset.playlistId = playlist.id;
                    
                    // Check if song is already in this playlist
                    const isSongInPlaylist = playlist.songs.includes(songName);
                    
                    playlistItem.innerHTML = `
                        <div class="playlist-info">
                            <div class="playlist-icon">
                                <i class="fas fa-music"></i>
                            </div>
                            <div class="playlist-name">${playlist.name}</div>
                        </div>
                        <div class="playlist-status">
                            ${isSongInPlaylist ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                    `;
                    
                    // Add click event to add/remove song
                    playlistItem.addEventListener('click', function() {
                        const playlistId = this.dataset.playlistId;
                        
                        if (isSongInPlaylist) {
                            // Remove song from playlist
                            removeSongFromPlaylist(songName, playlistId);
                            this.querySelector('.playlist-status').innerHTML = '';
                        } else {
                            // Add song to playlist
                            addSongToPlaylist(songName, playlistId);
                            this.querySelector('.playlist-status').innerHTML = '<i class="fas fa-check"></i>';
                        }
                    });
                    
                    playlistsContainer.appendChild(playlistItem);
                });
                
                // Add "Create New Playlist" button
                const createNewBtn = document.createElement('button');
                createNewBtn.className = 'modal-btn create create-new';
                createNewBtn.id = 'create-new-playlist';
                createNewBtn.textContent = 'Create New Playlist';
                
                createNewBtn.addEventListener('click', function() {
                    closeAddToPlaylistModal();
                    openCreatePlaylistModal();
                });
                
                playlistsContainer.appendChild(createNewBtn);
            }
        }
    }
}

// Close the add to playlist modal
function closeAddToPlaylistModal() {
    const modal = document.getElementById('add-to-playlist-modal');
    if (modal) {
        modal.classList.remove('show');
        currentSongElement = null;
    }
}

// Show playlist contents
function showPlaylist(playlistId) {
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    // Clear existing songs in the main view
    const songListContainer = document.querySelector('.songlist ul');
    songListContainer.innerHTML = '';
    
    // Update heading
    const heading = document.querySelector('.library .heading h2');
    if (heading) {
        heading.textContent = playlist.name;
    }
    
    // Add each song in the playlist
    playlist.songs.forEach(song => {
        const li = document.createElement('li');
        const isLiked = isSongLiked(song);
        
        li.innerHTML = `
            <img class="invert" src="images/music.svg" alt="">
            <div class="info">
                <div>${song}</div>
            </div>
            <div class="song-actions">
                <button class="song-action-btn like-btn ${isLiked ? 'liked' : ''}">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="song-action-btn remove-from-playlist-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="images/play.svg" alt="">
            </div>
        `;
        
        // Add click event for playing the song
        li.addEventListener('click', function(e) {
            // Ignore clicks on buttons
            if (e.target.closest('.song-action-btn')) return;
            
            const songName = this.querySelector('.info div').textContent.trim();
            playSong(songName);
        });
        
        // Add click event for like/unlike
        const likeBtn = li.querySelector('.like-btn');
        likeBtn.addEventListener('click', function() {
            const songName = li.querySelector('.info div').textContent.trim();
            toggleLikeSong(songName);
        });
        
        // Add click event for removing from playlist
        const removeBtn = li.querySelector('.remove-from-playlist-btn');
        removeBtn.addEventListener('click', function() {
            const songName = li.querySelector('.info div').textContent.trim();
            if (removeSongFromPlaylist(songName, playlistId)) {
                // Refresh playlist view
                showPlaylist(playlistId);
            }
        });
        
        songListContainer.appendChild(li);
    });
    
    // Show message if no songs in playlist
    if (playlist.songs.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        emptyMessage.innerHTML = `
            <div class="empty-icon"><i class="fas fa-music"></i></div>
            <h3>This playlist is empty</h3>
            <p>Add songs by clicking the + icon when browsing songs.</p>
        `;
        songListContainer.appendChild(emptyMessage);
    }
}

// Perform search across songs and playlists
function performSearch(query) {
    // Allow empty queries to show all songs
    if (!query) {
        query = '';
    }
    
    query = query.toLowerCase().trim();
    
    // Clear existing songs in the main view
    const songListContainer = document.querySelector('.songlist ul');
    songListContainer.innerHTML = '';
    
    // Update heading
    const heading = document.querySelector('.library .heading h2');
    if (heading) {
        heading.textContent = query ? `Search Results: "${query}"` : 'All Songs';
    }
    
    // Get all available songs
    let allSongs = [];
    
    // Option 1: Try to get songs from the existing DOM
    document.querySelectorAll('.songlist ul li .info div').forEach(song => {
        const songName = song.textContent.trim();
        if (!allSongs.includes(songName)) {
            allSongs.push(songName);
        }
    });
    
    // Option 2: If no songs found in DOM, check songs array from main script
    if (allSongs.length === 0 && typeof songs !== 'undefined' && Array.isArray(songs)) {
        allSongs = [...songs];
    }
    
    // Option 3: Fallback to some common songs if needed
    if (allSongs.length === 0) {
        // Get songs from the playbar
        const currentSong = document.querySelector('.songinfo');
        if (currentSong && currentSong.textContent.trim()) {
            allSongs.push(currentSong.textContent.trim());
        }
    }
    
    // Filter songs based on query - use split to match any word in the song name
    let matchingSongs = [];
    if (query) {
        const queryWords = query.split(/\s+/);
        matchingSongs = allSongs.filter(song => {
            const songLower = song.toLowerCase();
            // Match any word in the query
            return queryWords.some(word => songLower.includes(word));
        });
    } else {
        // If no query, show all songs
        matchingSongs = allSongs;
    }
    
    // Display matching songs
    matchingSongs.forEach(song => {
        const li = document.createElement('li');
        const isLiked = isSongLiked(song);
        
        // Check if this is the currently playing song
        const currentSongInfo = document.querySelector('.songinfo');
        const isPlaying = currentSongInfo && currentSongInfo.textContent.trim() === song;
        
        if (isPlaying) {
            li.classList.add('active'); // Add active class for styling
        }
        
        li.innerHTML = `
            <img class="invert" src="images/music.svg" alt="">
            <div class="info">
                <div>${song}</div>
                ${isPlaying ? '<span class="now-playing">Now Playing</span>' : ''}
            </div>
            <div class="song-actions">
                <button class="song-action-btn like-btn ${isLiked ? 'liked' : ''}">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="song-action-btn add-to-playlist-btn">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="playnow">
                <span>${isPlaying ? 'Playing' : 'Play Now'}</span>
                <img class="invert" src="images/${isPlaying ? 'pause' : 'play'}.svg" alt="">
            </div>
        `;
        
        // Add click event for playing the song
        li.addEventListener('click', function(e) {
            // Ignore clicks on buttons
            if (e.target.closest('.song-action-btn')) return;
            
            const songName = this.querySelector('.info div').textContent.trim();
            playSong(songName);
            
            // Update all songs to show this one as playing
            document.querySelectorAll('.songlist ul li').forEach(item => {
                const itemSongName = item.querySelector('.info div').textContent.trim();
                if (itemSongName === songName) {
                    item.classList.add('active');
                    const playnowText = item.querySelector('.playnow span');
                    const playnowIcon = item.querySelector('.playnow img');
                    if (playnowText) playnowText.textContent = 'Playing';
                    if (playnowIcon) playnowIcon.src = 'images/pause.svg';
                    
                    // Add now playing indicator
                    const info = item.querySelector('.info');
                    if (info && !info.querySelector('.now-playing')) {
                        const nowPlaying = document.createElement('span');
                        nowPlaying.className = 'now-playing';
                        nowPlaying.textContent = 'Now Playing';
                        info.appendChild(nowPlaying);
                    }
                } else {
                    item.classList.remove('active');
                    const playnowText = item.querySelector('.playnow span');
                    const playnowIcon = item.querySelector('.playnow img');
                    if (playnowText) playnowText.textContent = 'Play Now';
                    if (playnowIcon) playnowIcon.src = 'images/play.svg';
                    
                    // Remove now playing indicator
                    const nowPlaying = item.querySelector('.now-playing');
                    if (nowPlaying) nowPlaying.remove();
                }
            });
        });
        
        // Add click event for like/unlike
        const likeBtn = li.querySelector('.like-btn');
        likeBtn.addEventListener('click', function() {
            const songName = li.querySelector('.info div').textContent.trim();
            toggleLikeSong(songName);
        });
        
        // Add click event for add to playlist
        const addToPlaylistBtn = li.querySelector('.add-to-playlist-btn');
        addToPlaylistBtn.addEventListener('click', function() {
            const songName = li.querySelector('.info div').textContent.trim();
            openAddToPlaylistModal(songName);
        });
        
        songListContainer.appendChild(li);
    });
    
    // Check for matching playlists too
    const matchingPlaylists = userPlaylists.filter(playlist => {
        if (!query) return true; // Show all playlists if no query
        
        const queryWords = query.split(/\s+/);
        const playlistLower = playlist.name.toLowerCase();
        // Match any word in the query
        return queryWords.some(word => playlistLower.includes(word));
    });
    
    // If we have matching playlists, show a section for them
    if (matchingPlaylists.length > 0) {
        const playlistsHeader = document.createElement('li');
        playlistsHeader.className = 'search-section-header';
        playlistsHeader.innerHTML = `<h3>${query ? 'Matching Playlists' : 'Your Playlists'}</h3>`;
        songListContainer.appendChild(playlistsHeader);
        
        matchingPlaylists.forEach(playlist => {
            const li = document.createElement('li');
            li.className = 'playlist-result';
            
            li.innerHTML = `
                <div class="playlist-icon">
                    <i class="fas fa-list"></i>
                </div>
                <div class="info">
                    <div>${playlist.name}</div>
                    <span class="song-count">${playlist.songs.length} song${playlist.songs.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="playnow">
                    <span>View</span>
                    <i class="fas fa-arrow-right"></i>
                </div>
            `;
            
            // Add click event to view playlist
            li.addEventListener('click', function() {
                showPlaylist(playlist.id);
            });
            
            songListContainer.appendChild(li);
        });
    }
    
    // Show message if no results
    if (matchingSongs.length === 0 && matchingPlaylists.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';
        emptyMessage.innerHTML = `
            <div class="empty-icon"><i class="fas fa-search"></i></div>
            <h3>No results found</h3>
            <p>We couldn't find any matches for "${query}"</p>
        `;
        songListContainer.appendChild(emptyMessage);
    }
}

// Enhanced search functionality
function enhanceSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
        // Search button click
        searchBtn.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
        
        // Real-time search as you type (after a short delay)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value);
            }, 300); // 300ms delay to avoid too many searches
        });
        
        // Enter key in search input
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
        
        // Clear search button
        const clearSearch = document.createElement('button');
        clearSearch.className = 'clear-search';
        clearSearch.innerHTML = '<i class="fas fa-times"></i>';
        clearSearch.style.display = 'none';
        
        // Insert after search input
        searchInput.parentNode.insertBefore(clearSearch, searchInput.nextSibling);
        
        // Show/hide clear button
        searchInput.addEventListener('input', function() {
            clearSearch.style.display = this.value ? 'block' : 'none';
        });
        
        // Clear search
        clearSearch.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            performSearch('');
            searchInput.focus();
        });
    }
}

// Play a song by name
function playSong(songName) {
    // Find the song in the original song list and trigger a click
    const songs = document.querySelectorAll('.songlist ul li');
    let songFound = false;
    
    for (let i = 0; i < songs.length; i++) {
        const songElement = songs[i].querySelector('.info div');
        if (songElement && songElement.textContent.trim() === songName) {
            // Simulate clicking the play button instead of the whole li
            const playNow = songs[i].querySelector('.playnow');
            if (playNow) {
                playNow.click();
                songFound = true;
                break;
            } else {
                songs[i].click();
                songFound = true;
                break;
            }
        }
    }
    
    // If song not found in current list, we need to search for it globally
    if (!songFound) {
        // Try to find it in the current songs array if available
        if (typeof songs !== 'undefined' && Array.isArray(window.songs)) {
            const songIndex = window.songs.indexOf(songName);
            if (songIndex !== -1) {
                // Use the main player's play function
                if (typeof playMusic === 'function' && typeof currentsong !== 'undefined') {
                    playMusic(songName, currentsong);
                    return;
                }
            }
        }
        
        // If we can't find a way to play it directly, we can try to
        // open a view where the song might be available
        performSearch(songName);
    }
    
    // Update all songs to show this one as playing
    document.querySelectorAll('.songlist ul li').forEach(item => {
        const itemSongName = item.querySelector('.info div').textContent.trim();
        if (itemSongName === songName) {
            item.classList.add('active');
            const playnowText = item.querySelector('.playnow span');
            const playnowIcon = item.querySelector('.playnow img');
            if (playnowText) playnowText.textContent = 'Playing';
            if (playnowIcon) playnowIcon.src = 'images/pause.svg';
            
            // Add now playing indicator
            const info = item.querySelector('.info');
            if (info && !info.querySelector('.now-playing')) {
                const nowPlaying = document.createElement('span');
                nowPlaying.className = 'now-playing';
                nowPlaying.textContent = 'Now Playing';
                info.appendChild(nowPlaying);
            }
        } else {
            item.classList.remove('active');
            const playnowText = item.querySelector('.playnow span');
            const playnowIcon = item.querySelector('.playnow img');
            if (playnowText) playnowText.textContent = 'Play Now';
            if (playnowIcon) playnowIcon.src = 'images/play.svg';
            
            // Remove now playing indicator
            const nowPlaying = item.querySelector('.now-playing');
            if (nowPlaying) nowPlaying.remove();
        }
    });
}

// Initialize functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load user data
    loadUserData();
    
    // Set up liked songs button
    const likedSongsLink = document.getElementById('liked-songs-link');
    if (likedSongsLink) {
        likedSongsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLikedSongs();
        });
    }
    
    // Set up create playlist button
    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    if (createPlaylistBtn) {
        createPlaylistBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openCreatePlaylistModal();
        });
    }
    
    // Set up modal buttons
    const cancelCreateBtn = document.getElementById('cancel-create-playlist');
    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', closeCreatePlaylistModal);
    }
    
    const confirmCreateBtn = document.getElementById('confirm-create-playlist');
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', function() {
            const nameInput = document.getElementById('playlist-name');
            if (nameInput && nameInput.value.trim() !== '') {
                createPlaylist(nameInput.value.trim());
                closeCreatePlaylistModal();
            }
        });
    }
    
    const cancelAddToPlaylistBtn = document.getElementById('cancel-add-to-playlist');
    if (cancelAddToPlaylistBtn) {
        cancelAddToPlaylistBtn.addEventListener('click', closeAddToPlaylistModal);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const createModal = document.getElementById('create-playlist-modal');
        if (e.target === createModal) {
            closeCreatePlaylistModal();
        }
        
        const addToPlaylistModal = document.getElementById('add-to-playlist-modal');
        if (e.target === addToPlaylistModal) {
            closeAddToPlaylistModal();
        }
    });
    
    // Add press escape to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCreatePlaylistModal();
            closeAddToPlaylistModal();
        }
    });
    
    // Enhance song list with like buttons
    enhanceSongList();
    
    // Setup enhanced search
    enhanceSearch();
}); 