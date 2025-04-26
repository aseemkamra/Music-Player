// User Profile Functionality

// Elements
const userProfileContainer = document.querySelector('.user-profile-container');
const profileDropdown = document.querySelector('.user-dropdown');
const usernameLarge = document.querySelector('.username-large');
const userEmail = document.querySelector('.user-email');
const logoutButton = document.querySelector('.logout-btn');
const activityList = document.querySelector('.activity-list');
const profileAvatar = document.getElementById('profileAvatar');
const profilePhotoInput = document.getElementById('profilePhotoInput');
const profileName = document.getElementById('profileName');
const editNameBtn = document.getElementById('editNameBtn');
const saveNameBtn = document.getElementById('saveNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');
const nameInput = document.getElementById('nameInput');
const editNameContainer = document.querySelector('.edit-name-container');
const profileNameContainer = document.querySelector('.profile-name-container');
const memberSince = document.getElementById('memberSince');
const playlistsCount = document.querySelector('.playlists-count');
const favoritesCount = document.querySelector('.favorites-count');
const followingCount = document.querySelector('.following-count');
const playlistGrid = document.getElementById('playlistGrid');

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

// Format date to display member since
function formatMemberSince(date) {
    if (!date) return "Unknown";
    
    const dateObj = new Date(date);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

// Update user profile info
function updateUserProfileInfo() {
    const currentUser = getCurrentUser();
    
    if (currentUser) {
        // Update username and email in dropdown
        if (usernameLarge) usernameLarge.textContent = currentUser.username;
        if (userEmail) userEmail.textContent = currentUser.email || '';
        
        // Update profile name
        if (profileName) profileName.textContent = currentUser.username;
        
        // Update member since date
        if (memberSince && currentUser.createdAt) {
            memberSince.textContent = formatMemberSince(currentUser.createdAt);
        }
        
        // Update profile avatar with photo or initial
        updateProfileAvatar(currentUser);
        
        // Update stats
        updateUserStats(currentUser);
    }
}

// Update profile avatar (photo or initial)
function updateProfileAvatar(user) {
    if (!profileAvatar) return;
    
    if (user.profilePhoto) {
        // If user has a profile photo, display it
        profileAvatar.innerHTML = '';
        profileAvatar.style.backgroundColor = 'transparent';
        profileAvatar.style.backgroundImage = `url(${user.profilePhoto})`;
        profileAvatar.style.backgroundSize = 'cover';
        profileAvatar.style.backgroundPosition = 'center';
    } else {
        // Otherwise display initial
        profileAvatar.style.backgroundImage = 'none';
        profileAvatar.style.backgroundColor = '#2d3748';
        profileAvatar.textContent = user.username.charAt(0).toUpperCase();
    }
    
    // Also update avatar in navbar
    const navProfileIcon = document.querySelector('.profile-icon');
    const navProfileIconLarge = document.querySelector('.profile-icon-large');
    
    if (navProfileIcon) {
        if (user.profilePhoto) {
            navProfileIcon.innerHTML = '';
            navProfileIcon.style.backgroundImage = `url(${user.profilePhoto})`;
            navProfileIcon.style.backgroundSize = 'cover';
            navProfileIcon.style.backgroundPosition = 'center';
        } else {
            navProfileIcon.style.backgroundImage = 'none';
            navProfileIcon.textContent = user.username.charAt(0).toUpperCase();
        }
    }
    
    if (navProfileIconLarge) {
        if (user.profilePhoto) {
            navProfileIconLarge.innerHTML = '';
            navProfileIconLarge.style.backgroundImage = `url(${user.profilePhoto})`;
            navProfileIconLarge.style.backgroundSize = 'cover';
            navProfileIconLarge.style.backgroundPosition = 'center';
        } else {
            navProfileIconLarge.style.backgroundImage = 'none';
            navProfileIconLarge.textContent = user.username.charAt(0).toUpperCase();
        }
    }
}

// Update user stats
function updateUserStats(user) {
    if (playlistsCount) {
        const playlists = user.playlists ? user.playlists.length : 0;
        playlistsCount.textContent = playlists;
    }
    
    if (favoritesCount) {
        const favorites = user.favorites ? user.favorites.length : 0;
        favoritesCount.textContent = favorites;
    }
    
    if (followingCount) {
        const following = user.following ? user.following.length : 0;
        followingCount.textContent = following;
    }
}

// Load recent activity
function loadRecentActivity() {
    const currentUser = getCurrentUser();
    
    if (!currentUser || !activityList) return;
    
    // Clear existing content
    activityList.innerHTML = '';
    
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
            
            activityList.appendChild(activityItem);
        });
    } else {
        // No recent activity
        const noActivity = document.createElement('div');
        noActivity.className = 'no-activity';
        noActivity.textContent = 'No recent activity';
        activityList.appendChild(noActivity);
    }
}

// Load playlists from homepage
function loadPlaylists() {
    if (!playlistGrid) return;
    
    // Clear existing content
    playlistGrid.innerHTML = '';
    
    // Sample playlists from homepage
    const playlists = [
        { name: 'Happy Hits!', description: 'Hits to boost your mood and fill you with happiness!', image: 'images/arijitshingh.jpeg', url: 'test1.html' },
        { name: 'Today\'s Top Hits', description: 'Jack Harlow is on top of the hottest 50!', image: 'images/justinbeiber.jpeg', url: 'play2.html' },
        { name: 'Hit Songs of 2024', description: 'Enjoy the Playlist!', image: 'images/00f56557183915.59cbcc586d5b8.jpg', url: 'play3.html' },
        { name: 'Top 50 of 2010', description: 'Enjoy the Playlist!', image: 'images/fb0750fdb84a67d0cd67f4a176dfae84.jpg', url: 'play4.html' },
        { name: 'Top of the world', description: 'Enjoy the Playlist!', image: 'images/OIP (1).jpeg', url: 'play5.html' },
        { name: '100 hits of 2016-18', description: 'Enjoy the Playlist!', image: 'images/OIP.jpeg', url: 'play6.html' }
    ];
    
    // Create playlist cards
    playlists.forEach(playlist => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        
        const playlistImage = document.createElement('div');
        playlistImage.className = 'playlist-image';
        if (playlist.image) {
            const img = document.createElement('img');
            img.src = playlist.image;
            img.alt = playlist.name;
            playlistImage.appendChild(img);
        } else {
            playlistImage.innerHTML = '<i class="fas fa-music"></i>';
        }
        
        const title = document.createElement('h3');
        title.textContent = playlist.name;
        
        const description = document.createElement('p');
        description.textContent = playlist.description;
        
        card.appendChild(playlistImage);
        card.appendChild(title);
        card.appendChild(description);
        
        // Make the entire card clickable
        card.addEventListener('click', () => {
            window.location.href = playlist.url;
        });
        
        card.style.cursor = 'pointer';
        
        playlistGrid.appendChild(card);
    });
    
    // Update playlists count
    const currentUser = getCurrentUser();
    if (currentUser && playlistsCount) {
        if (!currentUser.playlists) {
            currentUser.playlists = [];
        }
        
        // Add these playlists to user's playlists if not already there
        playlists.forEach(playlist => {
            const exists = currentUser.playlists.some(p => p.name === playlist.name);
            if (!exists) {
                currentUser.playlists.push({
                    name: playlist.name,
                    url: playlist.url,
                    songCount: Math.floor(Math.random() * 20) + 10 // Random number of songs between 10-30
                });
            }
        });
        
        // Update localStorage
        const users = getUsers();
        const userIndex = users.findIndex(user => user.username === currentUser.username);
        if (userIndex !== -1) {
            users[userIndex].playlists = currentUser.playlists;
            saveUsers(users);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // Update stats
        updateUserStats(currentUser);
    }
}

// Handle profile photo upload
function handleProfilePhotoUpload() {
    const file = profilePhotoInput.files[0];
    if (!file) return;
    
    // Check file type and size
    if (!file.type.match('image.*')) {
        alert('Please select an image file');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('Image file is too large. Please select a file smaller than 5MB');
        return;
    }
    
    // Convert image to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        
        // Save to user profile
        saveProfilePhoto(base64Image);
        
        // Update UI
        if (profileAvatar) {
            profileAvatar.innerHTML = '';
            profileAvatar.style.backgroundColor = 'transparent';
            profileAvatar.style.backgroundImage = `url(${base64Image})`;
            profileAvatar.style.backgroundSize = 'cover';
            profileAvatar.style.backgroundPosition = 'center';
        }
    };
    
    reader.readAsDataURL(file);
}

// Save profile photo to user data
function saveProfilePhoto(photoData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const users = getUsers();
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    
    if (userIndex === -1) return;
    
    // Update photo URL
    users[userIndex].profilePhoto = photoData;
    
    // Save to localStorage
        saveUsers(users);
        
    // Update current user
    currentUser.profilePhoto = photoData;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// Handle profile name editing
function startEditingName() {
    // Hide name display and show edit form
    profileNameContainer.style.display = 'none';
    editNameContainer.style.display = 'flex';
    
    // Set current name in input
    nameInput.value = profileName.textContent;
    
    // Focus the input
    nameInput.focus();
}

function cancelEditingName() {
    // Hide edit form and show name display
    profileNameContainer.style.display = 'flex';
    editNameContainer.style.display = 'none';
}

function saveNewName() {
    const newName = nameInput.value.trim();
    
    if (!newName) {
        alert('Please enter a valid name');
        return;
    }
    
    // Save new name
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const users = getUsers();
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    
    if (userIndex === -1) return;
    
    // Update username
    users[userIndex].username = newName;
    
    // Save to localStorage
        saveUsers(users);
        
    // Update current user
    currentUser.username = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    profileName.textContent = newName;
    
    // Update nav username too
    if (usernameLarge) usernameLarge.textContent = newName;
    
    const navUsername = document.querySelector('.username');
    if (navUsername) navUsername.textContent = newName;
    
    // Update profile icons
    updateProfileAvatar(currentUser);
    
    // Hide edit form and show name display
    profileNameContainer.style.display = 'flex';
    editNameContainer.style.display = 'none';
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
    
    // Profile photo upload
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', handleProfilePhotoUpload);
    }
    
    // Profile name editing
    if (editNameBtn) {
        editNameBtn.addEventListener('click', startEditingName);
    }
    
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', saveNewName);
    }
    
    if (cancelNameBtn) {
        cancelNameBtn.addEventListener('click', cancelEditingName);
    }
    
    // Enter key to save name
    if (nameInput) {
        nameInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                saveNewName();
            } else if (e.key === 'Escape') {
                cancelEditingName();
            }
        });
    }
    
    // Update profile info and load data
    updateUserProfileInfo();
    loadRecentActivity();
    loadPlaylists();
}

// Execute initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initUserProfile); 