// Global audio object to maintain playback state
let globalAudio = null;

// Speech recognition variables
let recognition = null;
let isListening = false;

function secondsToTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs() {
    try {
        const response = await fetch('http://127.0.0.1:5500/songs/');
        const html = await response.text();
        const div = document.createElement("div");
        div.innerHTML = html;

        const anchors = div.getElementsByTagName("a");
        const songs = [];

        for (const anchor of anchors) {
            if (anchor.href.endsWith(".mp3")) {
                songs.push(anchor.href.split("/songs/")[1]);
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

function playMusic(track, currentSong, pause = false) {
    currentSong.src = "songs/" + track;
    
    // Update global audio reference
    globalAudio = currentSong;

    if (!pause) {
        currentSong.play()
            .then(() => {
                play.src = "images/pause.svg";
            })
            .catch(err => {
                console.error("Error playing song:", err);
                play.src = "images/play.svg";
            });
    } else {
        play.src = "images/play.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// Function to navigate without stopping music
function navigateWithoutStopping(url) {
    if (globalAudio && globalAudio.src) {
        localStorage.setItem('currentSongSrc', globalAudio.src);
        localStorage.setItem('currentSongTime', globalAudio.currentTime.toString());
        localStorage.setItem('isPlaying', (!globalAudio.paused).toString());
        localStorage.setItem('currentVolume', globalAudio.volume.toString());
        console.log("Saved playback state:", {
            src: globalAudio.src,
            time: globalAudio.currentTime,
            isPlaying: !globalAudio.paused
        });
    } else {
        console.log("No audio playing to save");
    }
    window.location.href = url;
}

let songs;

// Speech recognition setup
function setupSpeechRecognition() {
    try {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (window.SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            
            // When speech is recognized
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                const searchInput = document.getElementById('search-input');
                searchInput.value = transcript;
                
                // Trigger search if needed
                if (document.getElementById('search-btn')) {
                    // Auto-trigger search after voice input
                    document.getElementById('search-btn').click();
                }
                
                // Visual feedback when done
                toggleMicrophoneState(false);
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error', event.error);
                toggleMicrophoneState(false);
            };
            
            recognition.onend = function() {
                toggleMicrophoneState(false);
            };
            
            // Set up mic button click event
            const micContainer = document.querySelector('.mic-container');
            if (micContainer) {
                micContainer.style.cursor = 'pointer';
                micContainer.addEventListener('click', toggleSpeechRecognition);
            }
        } else {
            console.error('Speech recognition not supported in this browser');
            // Hide microphone if not supported
            const micContainer = document.querySelector('.mic-container');
            if (micContainer) {
                micContainer.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error setting up speech recognition:', error);
        // Hide microphone on error
        const micContainer = document.querySelector('.mic-container');
        if (micContainer) {
            micContainer.style.display = 'none';
        }
    }
}

function toggleSpeechRecognition() {
    if (!recognition) return;
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
            toggleMicrophoneState(true);
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            toggleMicrophoneState(false);
        }
    }
}

function toggleMicrophoneState(listening) {
    isListening = listening;
    const micIcon = document.querySelector('.mic-ico');
    
    if (micIcon) {
        if (listening) {
            micIcon.classList.add('listening');
        } else {
            micIcon.classList.remove('listening');
        }
    }
}

async function main() {
    const playButton = document.getElementById("play");
    const previousButton = document.getElementById("previous");
    const nextButton = document.getElementById("next");
    const volumeControl = document.getElementById("volumeControl");

    // Setup speech recognition
    setupSpeechRecognition();
    
    let currentSong = new Audio();
    currentSong.volume = 0.5; // Set default volume
    
    // Set global audio reference
    globalAudio = currentSong;
    
    // Update playlist links to use continuous playback
    document.querySelectorAll('.card .play a').forEach(link => {
        const href = link.getAttribute('href');
        link.href = "javascript:void(0);";
        link.onclick = function(e) { 
            e.preventDefault();
            navigateWithoutStopping(href); 
        };
    });

    // Get the list of all songs
    songs = await getSongs();
    if (songs.length === 0) {
        console.error("No songs found!");
        return;
    }
    
    // Check if there's a previously playing song from localStorage
    const savedSongSrc = localStorage.getItem('currentSongSrc');
    const savedSongTime = localStorage.getItem('currentSongTime');
    const wasPlaying = localStorage.getItem('isPlaying') === 'true';
    const savedVolume = localStorage.getItem('currentVolume');
    
    console.log("Retrieved playback state:", {
        src: savedSongSrc,
        time: savedSongTime,
        isPlaying: wasPlaying
    });
    
    if (savedSongSrc) {
        try {
            // Extract the song name from the saved path
            let trackName = "";
            let fromHomePlaylist = false;
            
            // Determine which playlist the song is from
            if (savedSongSrc.includes("/songs/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/songs/")[1]);
                fromHomePlaylist = true;
            } else if (savedSongSrc.includes("/happy123/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/happy123/")[1]);
            } else if (savedSongSrc.includes("/play2/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/play2/")[1]);
            } else if (savedSongSrc.includes("/play3/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/play3/")[1]);
            } else if (savedSongSrc.includes("/play4/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/play4/")[1]);
            }
            
            // If song is from home songs directory and exists in our list
            if (fromHomePlaylist && songs.includes(trackName)) {
                // Play from home playlist
                playMusic(trackName, currentSong, true);
            } else {
                // Direct setting of audio source for cross-playlist playback
                currentSong.src = savedSongSrc;
                document.querySelector(".songinfo").innerHTML = trackName || "Playing from another playlist";
            }
            
            // Set the time to where it was
            if (savedSongTime) {
                currentSong.currentTime = parseFloat(savedSongTime);
            }
            
            // Set volume if available
            if (savedVolume) {
                currentSong.volume = parseFloat(savedVolume);
                volumeControl.value = parseFloat(savedVolume);
            }
            
            // Resume playing if it was playing before
            if (wasPlaying) {
                currentSong.play()
                    .then(() => {
                        playButton.src = "images/pause.svg";
                    })
                    .catch(err => {
                        console.error("Error resuming playback:", err);
                        playButton.src = "images/play.svg";
                    });
            }
        } catch (error) {
            console.error("Error restoring playback:", error);
            // Fallback to first song
            playMusic(songs[0], currentSong, true);
        }
    } else {
        // No saved song, set the first song without playing it
        playMusic(songs[0], currentSong, true);
    }

    // Display all songs in the playlist
    const songList = document.querySelector(".songlist ul");
    for (const song of songs) {
        songList.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")} </div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="">
                </div>
            </li>`;
    }

    // Attach event listeners to each song
    const songItems = Array.from(songList.getElementsByTagName("li"));
    songItems.forEach((item) => {
        item.addEventListener("click", () => {
            const track = item.querySelector(".info div").innerText.trim();
            playMusic(track, currentSong);
        });
    });

    // Play/Pause button functionality
    playButton.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
                .then(() => {
                    playButton.src = "images/pause.svg";
                })
                .catch(err => {
                    console.error("Error playing on button click:", err);
                });
        } else {
            currentSong.pause();
            playButton.src = "images/play.svg";
        }
    });

    // Handle playback progress
    currentSong.addEventListener("timeupdate", () => {
        const currentTime = secondsToTime(currentSong.currentTime);
        const duration = secondsToTime(currentSong.duration);

        document.querySelector(".songtime").innerHTML = `${currentTime} / ${duration}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar functionality
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const percent = e.offsetX / e.target.getBoundingClientRect().width;
        currentSong.currentTime = currentSong.duration * percent;
    });

    // Hamburger menu toggle
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous and Next buttons
    previousButton.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) {
            playMusic(songs[index - 1], currentSong);
        }
    });

    nextButton.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index < songs.length - 1) {
            playMusic(songs[index + 1], currentSong);
        }
    });

    // Volume control
    volumeControl.value = currentSong.volume;
    volumeControl.addEventListener("input", () => {
        currentSong.volume = volumeControl.value;
    });

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
        switch (e.code) {
            case "Space":
                if (currentSong.paused) {
                    currentSong.play();
                    playButton.src = "images/pause.svg";
                } else {
                    currentSong.pause();
                    playButton.src = "images/play.svg";
                }
                break;
            case "ArrowRight":
                nextButton.click();
                break;
            case "ArrowLeft":
                previousButton.click();
                break;
            case "ArrowUp":
                currentSong.volume = Math.min(1, currentSong.volume + 0.1);
                volumeControl.value = currentSong.volume;
                break;
            case "ArrowDown":
                currentSong.volume = Math.max(0, currentSong.volume - 0.1);
                volumeControl.value = currentSong.volume;
                break;
        }
    });
    
    // Add beforeunload event to save current playback state when leaving
    window.addEventListener('beforeunload', function() {
        if (globalAudio && globalAudio.src) {
            localStorage.setItem('currentSongSrc', globalAudio.src);
            localStorage.setItem('currentSongTime', globalAudio.currentTime.toString());
            localStorage.setItem('isPlaying', (!globalAudio.paused).toString());
            localStorage.setItem('currentVolume', globalAudio.volume.toString());
        }
    });

    // Add search button functionality
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        
        // Also trigger search on Enter key
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;
    
    console.log('Searching for:', query);
    
    // Filter songs based on the search query
    const filteredSongs = songs.filter(song => 
        song.toLowerCase().includes(query)
    );
    
    // Update the song list with filtered results
    displaySearchResults(filteredSongs);
}

function displaySearchResults(filteredSongs) {
    const songList = document.querySelector(".songlist ul");
    
    // Clear existing song list
    songList.innerHTML = '';
    
    if (filteredSongs.length === 0) {
        songList.innerHTML = '<li class="no-results">No songs found matching your search</li>';
        return;
    }
    
    // Display filtered songs
    for (const song of filteredSongs) {
        songList.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")} </div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="">
                </div>
            </li>`;
    }
    
    // Reattach event listeners to the filtered songs
    const songItems = Array.from(songList.getElementsByTagName("li"));
    songItems.forEach((item) => {
        if (!item.classList.contains('no-results')) {
            item.addEventListener("click", () => {
                const track = item.querySelector(".info div").innerText.trim();
                playMusic(track, globalAudio);
            });
        }
    });
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', main);
