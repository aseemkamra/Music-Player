// User Profile Functionality

// Elements
const userProfileContainer = document.querySelector('.user-profile-container');
const profileDropdown = document.querySelector('.user-dropdown');
const usernameLarge = document.querySelector('.username-large');
const userEmail = document.querySelector('.user-email');
const logoutButton = document.querySelector('.logout-btn');
const recentActivityContainer = document.querySelector('.recent-activity-container');

// Toggle profile dropdown
function toggleProfileDropdown(e) {
    e.stopPropagation();
    if (profileDropdown) {
        profileDropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (profileDropdown && 
        profileDropdown.classList.contains('show') && 
        !userProfileContainer.contains(event.target)) {
        profileDropdown.classList.remove('show');
    }
});

// Update user profile info
function updateUserProfileInfo() {
    const currentUser = getCurrentUser();
    
    if (currentUser) {
        // Update username and email in dropdown
        if (usernameLarge) usernameLarge.textContent = currentUser.username;
        if (userEmail) userEmail.textContent = currentUser.email;
        
        // Update avatar initial in both profile icon and large icon
        const profileIcon = document.querySelector('.profile-icon');
        const profileIconLarge = document.querySelector('.profile-icon-large');
        
        if (profileIcon) {
            profileIcon.textContent = currentUser.username.charAt(0).toUpperCase();
        }
        
        if (profileIconLarge) {
            profileIconLarge.textContent = currentUser.username.charAt(0).toUpperCase();
        }
    }
}

// Load recent activity
function loadRecentActivity() {
    const currentUser = getCurrentUser();
    
    if (!currentUser || !recentActivityContainer) return;
    
    // Clear existing content
    recentActivityContainer.innerHTML = '';
    
    if (currentUser.recentlyPlayed && currentUser.recentlyPlayed.length > 0) {
        // Sort by most recent first
        const recentSongs = [...currentUser.recentlyPlayed].reverse().slice(0, 5);
        
        recentSongs.forEach(song => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const songIcon = document.createElement('div');
            songIcon.className = 'song-icon';
            songIcon.innerHTML = '<i class="fas fa-music"></i>';
            
            const songDetails = document.createElement('div');
            songDetails.className = 'song-details';
            
            const songName = document.createElement('div');
            songName.className = 'song-name';
            songName.textContent = song.title || 'Unknown Song';
            
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            
            // Format timestamp
            const playedDate = new Date(song.playedAt);
            const now = new Date();
            const diffTime = Math.abs(now - playedDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            
            let timeString = '';
            if (diffDays > 0) {
                timeString = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            } else if (diffHours > 0) {
                timeString = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            } else if (diffMinutes > 0) {
                timeString = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
            } else {
                timeString = 'Just now';
            }
            
            timestamp.textContent = timeString;
            
            songDetails.appendChild(songName);
            songDetails.appendChild(timestamp);
            
            activityItem.appendChild(songIcon);
            activityItem.appendChild(songDetails);
            
            recentActivityContainer.appendChild(activityItem);
        });
    } else {
        // No recent activity
        const noActivity = document.createElement('div');
        noActivity.className = 'no-activity';
        noActivity.textContent = 'No recent activity';
        recentActivityContainer.appendChild(noActivity);
    }
}

// Add a song to recent activity
function addToRecentActivity(song) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const users = getUsers();
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    
    if (userIndex === -1) return;
    
    // Add song to recent activity with timestamp
    const songWithTimestamp = {
        ...song,
        playedAt: new Date().toISOString()
    };
    
    // Initialize recentlyPlayed array if it doesn't exist
    if (!users[userIndex].recentlyPlayed) {
        users[userIndex].recentlyPlayed = [];
    }
    
    // Check if song already exists in recently played
    const existingIndex = users[userIndex].recentlyPlayed.findIndex(
        item => item.title === song.title && item.artist === song.artist
    );
    
    if (existingIndex !== -1) {
        // Remove existing entry
        users[userIndex].recentlyPlayed.splice(existingIndex, 1);
    }
    
    // Add new entry at the end
    users[userIndex].recentlyPlayed.push(songWithTimestamp);
    
    // Limit to last 20 songs
    if (users[userIndex].recentlyPlayed.length > 20) {
        users[userIndex].recentlyPlayed.shift();
    }
    
    // Update localStorage
    saveUsers(users);
    
    // Update current user in localStorage
    const updatedUser = { ...currentUser };
    updatedUser.recentlyPlayed = users[userIndex].recentlyPlayed;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Refresh recent activity display
    loadRecentActivity();
}

// Add to favorite artists
function addToFavoriteArtists(artist) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const users = getUsers();
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    
    if (userIndex === -1) return;
    
    // Initialize favoriteArtists array if it doesn't exist
    if (!users[userIndex].favoriteArtists) {
        users[userIndex].favoriteArtists = [];
    }
    
    // Check if artist is already in favorites
    if (!users[userIndex].favoriteArtists.includes(artist)) {
        users[userIndex].favoriteArtists.push(artist);
        
        // Update localStorage
        saveUsers(users);
        
        // Update current user in localStorage
        const updatedUser = { ...currentUser };
        updatedUser.favoriteArtists = users[userIndex].favoriteArtists;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return true;
    }
    
    return false;
}

// Remove from favorite artists
function removeFromFavoriteArtists(artist) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const users = getUsers();
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    
    if (userIndex === -1) return;
    
    // Check if favoriteArtists exists and artist is in the list
    if (users[userIndex].favoriteArtists && users[userIndex].favoriteArtists.includes(artist)) {
        users[userIndex].favoriteArtists = users[userIndex].favoriteArtists.filter(
            item => item !== artist
        );
        
        // Update localStorage
        saveUsers(users);
        
        // Update current user in localStorage
        const updatedUser = { ...currentUser };
        updatedUser.favoriteArtists = users[userIndex].favoriteArtists;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return true;
    }
    
    return false;
}

// Init function
function initUserProfile() {
    // Add event listeners
    if (userProfileContainer) {
        userProfileContainer.addEventListener('click', toggleProfileDropdown);
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
    
    // Update profile info and load activity
    updateUserProfileInfo();
    loadRecentActivity();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initUserProfile); 