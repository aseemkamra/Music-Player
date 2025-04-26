/**
 * Groove Music Player
 * Enhanced version with better performance and features
 */

/**
 * Converts seconds to time format (MM:SS)
 * @param {number} seconds - Time in seconds to be formatted
 * @returns {string} Formatted time string
 */
function secondsToTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad with leading zeros if needed
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0'); 

    return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Fetches songs from the server
 * @returns {Promise<string[]>} Array of song filenames
 */
async function getsongs() {
    try {
        const response = await fetch('http://127.0.0.1:5500/songs/');
        if (!response.ok) {
            throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`);
        }
        
        const htmlText = await response.text();
        const div = document.createElement("div");
        div.innerHTML = htmlText;
        
        const as = div.getElementsByTagName("a");
        const songs = [];
        
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split("/songs/")[1]);
            }
        }
        
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        // Show user-friendly error message
        document.querySelector(".songinfo").innerHTML = "Error loading songs. Please check your connection.";
        return [];
    }
}

/**
 * Plays music track
 * @param {string} track - Track filename
 * @param {HTMLAudioElement} currentsong - Audio element
 * @param {boolean} pause - Whether to start paused
 */
const playMusic = (track, currentsong, pause = false) => {
    try {
        // Store current volume to maintain it when changing tracks
        const currentVolume = currentsong.volume;
        
        // Update the song source
        currentsong.src = "songs/" + track;
        
        // Restore volume setting
        currentsong.volume = currentVolume;
        
        // Apply play/pause state
        if (!pause) {
            // Play with a promise to handle autoplay restrictions
            const playPromise = currentsong.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Playback started successfully
                    play.src = "images/pause.svg";
                }).catch(error => {
                    console.error("Playback failed:", error);
                    play.src = "images/play.svg";
                    // Handle autoplay restrictions
                    if (error.name === "NotAllowedError") {
                        alert("Please interact with the page to enable audio playback");
                    }
                });
            }
        }

        // Update UI
        document.querySelector(".songinfo").innerHTML = decodeURI(track);
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
        
        // Add active class to currently playing song in list (if exists)
        highlightCurrentSong(track);
    } catch (error) {
        console.error("Error playing music:", error);
        document.querySelector(".songinfo").innerHTML = "Error playing track: " + decodeURI(track);
    }
};

/**
 * Highlights the current song in the playlist
 * @param {string} currentTrack - Current track filename
 */
function highlightCurrentSong(currentTrack) {
    // Remove active class from all songs
    const songItems = document.querySelectorAll(".songlist li");
    songItems.forEach(item => {
        item.classList.remove("active");
    });
    
    // Find and highlight current song
    songItems.forEach(item => {
        const songName = item.querySelector(".info div").innerHTML.trim();
        if (songName === decodeURI(currentTrack)) {
            item.classList.add("active");
            // Scroll to visible if needed
            item.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    });
}

/**
 * Filters songs based on search query
 * @param {string[]} songs - Array of songs
 * @param {string} query - Search query
 * @returns {string[]} Filtered songs
 */
function filterSongs(songs, query) {
    if (!query || query.trim() === "") return songs;
    return songs.filter(song => 
        song.toLowerCase().includes(query.toLowerCase())
    );
}

// Variables scope
let songs = [];
let currentSongIndex = 0;

/**
 * Main application function
 */
async function main() {
    // Initialize player elements
    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");
    const volumeControl = document.getElementById("volumeControl");
    const searchBar = document.getElementById("searchBar");
    const repeatButton = document.getElementById("repeat") || { classList: { contains: () => false } };
    const shuffleButton = document.getElementById("shuffle") || { classList: { contains: () => false } };
    
    // Player state
    let isRepeat = false;
    let isShuffle = false;
    
    // Initialize audio with error handling
    const currentsong = new Audio();
    currentsong.volume = 0.5; // Default volume
    
    // Handle audio errors
    currentsong.addEventListener("error", (e) => {
        console.error("Audio error:", e);
        document.querySelector(".songinfo").innerHTML = "Error playing this track. Skipping...";
        // Try to play next song after error
        setTimeout(() => {
            playNextSong();
        }, 2000);
    });

    // Get songs and initialize player
    try {
        songs = await getsongs();
        
        if (songs.length === 0) {
            document.querySelector(".songinfo").innerHTML = "No songs found";
            return;
        }
        
        // Setup initial song
        playMusic(songs[0], currentsong, true);
        
        // Display songs in playlist
        updateSongList(songs);
    } catch (error) {
        console.error("Error initializing player:", error);
        document.querySelector(".songinfo").innerHTML = "Failed to initialize player";
        return;
    }

    // Function to update song list with search results
    function updateSongList(songsToDisplay) {
        const songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
        songul.innerHTML = ""; // Clear the list
        
        if (songsToDisplay.length === 0) {
            songul.innerHTML = "<li class='no-results'>No songs found</li>";
            return;
        }
        
        for (const song of songsToDisplay) {
            const decodedSong = decodeURI(song).replaceAll("%20", " ");
            songul.innerHTML += `<li ${currentsong.src.includes(song) ? 'class="active"' : ''}>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${decodedSong}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="">
                </div>
            </li>`;
        }

        // Attach event listeners to songs
        Array.from(songul.getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                const track = e.querySelector(".info").firstElementChild.innerHTML.trim();
                playMusic(track, currentsong);
                // Update current song index
                currentSongIndex = songs.indexOf(track);
            });
        });
    }

    // Play/Pause button
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play()
                .then(() => {
                    play.src = "images/pause.svg";
                })
                .catch(error => {
                    console.error("Play failed:", error);
                });
        } else {
            currentsong.pause();
            play.src = "images/play.svg";
        }
    });

    // Song timeupdate event for progress
    currentsong.addEventListener("timeupdate", () => {
        // Update time display
        document.querySelector(".songtime").innerHTML = `${secondsToTime(currentsong.currentTime)} / ${secondsToTime(currentsong.duration)}`;
        
        // Update progress circle position
        const percent = (currentsong.currentTime / currentsong.duration) * 100;
        if (!isNaN(percent)) {
            document.querySelector(".circle").style.left = percent + "%";
        }
    });

    // Song ended event
    currentsong.addEventListener("ended", () => {
        playNextSong();
    });

    // Function to play next song with respect to repeat/shuffle
    function playNextSong() {
        if (songs.length === 0) return;
        
        // Handle repeat mode
        if (isRepeat) {
            currentsong.currentTime = 0;
            currentsong.play()
                .then(() => {
                    play.src = "images/pause.svg";
                })
                .catch(error => {
                    console.error("Repeat play failed:", error);
                });
            return;
        }
        
        // Handle shuffle mode
        if (isShuffle) {
            const oldIndex = currentSongIndex;
            // Ensure we don't play the same song again in shuffle
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * songs.length);
            } while (newIndex === oldIndex && songs.length > 1);
            
            currentSongIndex = newIndex;
            playMusic(songs[currentSongIndex], currentsong);
            return;
        }
        
        // Normal sequential play
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playMusic(songs[currentSongIndex], currentsong);
    }

    // Seekbar click handler
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const seekbar = e.target.closest(".seekbar");
        if (!seekbar) return;
        
        const percent = (e.offsetX / seekbar.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        
        if (!isNaN(currentsong.duration)) {
            currentsong.currentTime = (currentsong.duration * percent) / 100;
        }
    });

    // Mobile menu handlers
    const hamburger = document.querySelector(".hamburger");
    if (hamburger) {
        hamburger.addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });
    }

    const closeBtn = document.querySelector(".close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });
    }

    // Previous button
    previous.addEventListener("click", () => {
        if (songs.length === 0) return;
        
        // If song has played for more than 3 seconds, restart it
        if (currentsong.currentTime > 3) {
            currentsong.currentTime = 0;
            return;
        }
        
        // Go to previous song
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        playMusic(songs[currentSongIndex], currentsong);
    });

    // Next button
    next.addEventListener("click", () => {
        if (songs.length === 0) return;
        playNextSong();
    });

    // Search functionality
    if (searchBar) {
        searchBar.addEventListener("input", function() {
            const query = this.value;
            const filteredSongs = filterSongs(songs, query);
            updateSongList(filteredSongs);
        });
    }

    // Volume control
    if (volumeControl) {
        volumeControl.addEventListener('input', function() {
            currentsong.volume = this.value;
            
            // Update volume icon based on level
            const volumeIcon = document.querySelector(".volume img");
            if (volumeIcon) {
                if (this.value === 0) {
                    volumeIcon.src = "images/mute.svg";
                } else if (this.value < 0.5) {
                    volumeIcon.src = "images/volume-low.svg";
                } else {
                    volumeIcon.src = "images/volume.svg";
                }
            }
        });
    }

    // Repeat button
    if (repeatButton) {
        repeatButton.addEventListener("click", () => {
            isRepeat = !isRepeat;
            repeatButton.classList.toggle("active");
        });
    }

    // Shuffle button
    if (shuffleButton) {
        shuffleButton.addEventListener("click", () => {
            isShuffle = !isShuffle;
            shuffleButton.classList.toggle("active");
        });
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        // Prevent default actions for media keys
        if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            e.preventDefault();
        }
        
        // Spacebar to toggle play/pause
        if (e.code === 'Space') {
            if (currentsong.paused) {
                currentsong.play().then(() => {
                    play.src = "images/pause.svg";
                });
            } else {
                currentsong.pause();
                play.src = "images/play.svg";
            }
        }

        // Right Arrow (Next Song)
        if (e.code === 'ArrowRight') {
            // If holding Ctrl, seek forward 10 seconds
            if (e.ctrlKey) {
                currentsong.currentTime = Math.min(currentsong.duration, currentsong.currentTime + 10);
            } else {
                // Next song
                playNextSong();
            }
        }

        // Left Arrow (Previous Song or Restart)
        if (e.code === 'ArrowLeft') {
            // If holding Ctrl, seek backward 10 seconds
            if (e.ctrlKey) {
                currentsong.currentTime = Math.max(0, currentsong.currentTime - 10);
            } else {
                // If song played for more than 3 seconds, restart it
                if (currentsong.currentTime > 3) {
                    currentsong.currentTime = 0;
                } else {
                    // Previous song
                    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
                    playMusic(songs[currentSongIndex], currentsong);
                }
            }
        }

        // Up Arrow (Volume Up)
        if (e.code === 'ArrowUp') {
            currentsong.volume = Math.min(1, currentsong.volume + 0.1);
            if (volumeControl) volumeControl.value = currentsong.volume;
        }

        // Down Arrow (Volume Down)
        if (e.code === 'ArrowDown') {
            currentsong.volume = Math.max(0, currentsong.volume - 0.1);
            if (volumeControl) volumeControl.value = currentsong.volume;
        }
        
        // M key (Mute/Unmute)
        if (e.code === 'KeyM') {
            if (currentsong.volume > 0) {
                currentsong.dataset.previousVolume = currentsong.volume;
                currentsong.volume = 0;
            } else {
                currentsong.volume = currentsong.dataset.previousVolume || 0.5;
            }
            if (volumeControl) volumeControl.value = currentsong.volume;
        }
    });

    // Preload next song for smoother playback
    function preloadNextSong() {
        if (songs.length <= 1) return;
        
        const nextIndex = (currentSongIndex + 1) % songs.length;
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = "songs/" + songs[nextIndex];
    }

    // Preload next song when current song is halfway through
    currentsong.addEventListener("timeupdate", () => {
        if (currentsong.duration > 0 && 
            currentsong.currentTime > currentsong.duration / 2 && 
            !currentsong.preloadedNext) {
            preloadNextSong();
            currentsong.preloadedNext = true;
        }
    });
}

/**
 * Handle profile navigation
 */
function initProfileNavigation() {
    // Check if user is logged in
    if (isLoggedIn()) {
        // Set up profile link in dropdown
        const profileLink = document.querySelector('.user-dropdown a[href="user-profile.html"]');
        if (profileLink) {
            profileLink.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'user-profile.html';
            });
        }
    }
}

// Call this function on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // Other initializations
    try {
        main();
    } catch (error) {
        console.error("Error initializing main player:", error);
    }
    
    // Initialize profile navigation
    try {
        initProfileNavigation();
    } catch (error) {
        console.error("Error initializing profile navigation:", error);
    }
});
	