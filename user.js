// User Management System

// User data structure
class User {
    constructor(username, email, password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.createdAt = new Date();
        this.playlists = [];
        this.favoriteArtists = [];
        this.recentlyPlayed = [];
        this.favorites = [];
        this.following = [];
        this.profilePhoto = null;
    }
}

// Store users in localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Get users from localStorage
function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

// Check if a user is currently logged in
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

// Get the current logged in user
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// Register a new user
function registerUser(username, email, password) {
    // Get existing users
    const users = getUsers();
    
    // Check if username or email already exists
    if (users.some(user => user.email === email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    if (users.some(user => user.username === username)) {
        return { success: false, message: 'Username already taken' };
    }
    
    // Create new user
    const newUser = new User(username, email, password);
    users.push(newUser);
    
    // Save updated users array
    saveUsers(users);
    
    return { success: true, message: 'Registration successful!' };
}

// Login a user
function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(user => user.email === email && user.password === password);
    
    if (!user) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    // Store current user in localStorage (exclude password for security)
    const userToStore = { ...user };
    delete userToStore.password;
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    
    return { success: true, message: 'Login successful!', user: userToStore };
}

// Logout the current user
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Update the UI based on user login status
function updateUserInterface() {
    const loginElements = document.querySelectorAll('.login-signup-area');
    const authButtons = document.getElementById('authButtons');
    const userProfileElements = document.querySelectorAll('.user-section');
    
    if (isLoggedIn()) {
        const currentUser = getCurrentUser();
        
        // Hide login/signup buttons
        loginElements.forEach(el => el.style.display = 'none');
        if (authButtons) authButtons.style.display = 'none';
        
        // Show user profile
        userProfileElements.forEach(el => {
            el.style.display = 'block';
            
            // Update username
            const usernameSpan = el.querySelector('.username');
            if (usernameSpan) {
                usernameSpan.textContent = currentUser.username;
            }
            
            // Update profile initial or photo in icon
            const profileIcon = el.querySelector('.profile-icon');
            if (profileIcon) {
                if (currentUser.profilePhoto) {
                    // If user has a profile photo
                    profileIcon.textContent = '';
                    profileIcon.style.backgroundImage = `url(${currentUser.profilePhoto})`;
                    profileIcon.style.backgroundSize = 'cover';
                    profileIcon.style.backgroundPosition = 'center';
                } else {
                    // Use initial
                    profileIcon.style.backgroundImage = 'none';
                    const initial = currentUser.username.charAt(0).toUpperCase();
                    profileIcon.textContent = initial;
                }
            }
            
            // Update dropdown details if they exist
            const usernameLarge = el.querySelector('.username-large');
            const userEmail = el.querySelector('.user-email');
            const profileIconLarge = el.querySelector('.profile-icon-large');
            
            if (usernameLarge) usernameLarge.textContent = currentUser.username;
            if (userEmail && currentUser.email) userEmail.textContent = currentUser.email;
            
            if (profileIconLarge) {
                if (currentUser.profilePhoto) {
                    // If user has a profile photo
                    profileIconLarge.textContent = '';
                    profileIconLarge.style.backgroundImage = `url(${currentUser.profilePhoto})`;
                    profileIconLarge.style.backgroundSize = 'cover';
                    profileIconLarge.style.backgroundPosition = 'center';
                } else {
                    // Use initial
                    profileIconLarge.style.backgroundImage = 'none';
                    profileIconLarge.textContent = currentUser.username.charAt(0).toUpperCase();
                }
            }
        });
    } else {
        // Show login/signup buttons
        loginElements.forEach(el => el.style.display = 'flex');
        if (authButtons) authButtons.style.display = 'flex';
        
        // Hide user profile
        userProfileElements.forEach(el => {
            el.style.display = 'none';
        });
    }
}

// Function to toggle profile dropdown
function toggleProfileDropdown(event) {
    event.stopPropagation();
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Event listener to close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.user-dropdown');
    const profileContainer = document.querySelector('.user-profile-container');
    
    if (dropdown && dropdown.classList.contains('show') && 
        profileContainer && !profileContainer.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Add event listener to user profile container
document.addEventListener('DOMContentLoaded', function() {
    const profileContainer = document.querySelector('.user-profile-container');
    if (profileContainer) {
        profileContainer.addEventListener('click', toggleProfileDropdown);
    }
    
    // Add event listener to logout button
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
    
    // Initialize the user interface
    updateUserInterface();
}); 