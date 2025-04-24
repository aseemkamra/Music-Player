const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const songResults = document.getElementById('songResults');

// Example list of songs (make sure the list is valid)
const songs = [
    "Song 1 - Artist 1",
    "Song 2 - Artist 2",
    "Song 3 - Artist 3",
    "Song 4 - Artist 4"
];

// Function to filter and display search results
function searchSongs() {
    const query = searchInput.value.toLowerCase(); // Convert to lowercase for case-insensitive comparison
    const filteredSongs = songs.filter(song => song.toLowerCase().includes(query));

    console.log(filteredSongs); // Debugging: Check filtered songs in console

    if (query.length > 0 && filteredSongs.length > 0) {
        songResults.style.display = 'block'; // Show results container
        songResults.innerHTML = ''; // Clear previous results
        const ul = document.createElement('ul');
        
        filteredSongs.forEach(song => {
            const li = document.createElement('li');
            li.textContent = song;
            ul.appendChild(li);
        });
        
        songResults.appendChild(ul);
    } else {
        songResults.style.display = 'none'; // Hide results if no matching songs
    }
}

// Event listener for search input
searchInput.addEventListener('input', searchSongs);

// Optional: Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar')) {
        songResults.style.display = 'none';
    }
});
