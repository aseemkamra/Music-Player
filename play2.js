// Global audio object to maintain playback state
let globalAudio = null;

// Converts seconds to a time format (MM:SS)
function secondsToTime(seconds) {
    if (isNaN(seconds) || seconds <= 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Fetches the list of songs from the "play2" directory
async function getsongs() {
    try {
        const response = await fetch('play2/');
        const html = await response.text();
        const div = document.createElement("div");
        div.innerHTML = html;

        const songElements = div.getElementsByTagName("a");
        const songs = [];
        for (let element of songElements) {
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split("play2/")[1])); // Decode URI
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Function to play or pause the music
const playMusic = (track, currentsong, pause = false) => {
    currentsong.src = `play2/${track}`; // Set the audio source
    
    // Update the global audio reference
    globalAudio = currentsong;
    
    if (!pause) {
        currentsong.play()
            .then(() => {
                document.querySelector("#play").src = "images/pause.svg"; // Change play button to pause icon
            })
            .catch(err => {
                console.error("Error playing audio:", err);
                document.querySelector("#play").src = "images/play.svg";
            });
    } else {
        currentsong.pause();
        document.querySelector("#play").src = "images/play.svg";
    }
    document.querySelector(".songinfo").innerText = decodeURIComponent(track); // Update song info
    document.querySelector(".songtime").innerText = "00:00 / 00:00"; // Reset song time display
};

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

let songs = []; // Variable to store the list of songs

// Main function
async function main() {
    const play = document.querySelector("#play");
    const previous = document.querySelector("#previous");
    const next = document.querySelector("#next");
    const currentsong = new Audio();
    currentsong.volume = 0.5; // Set default volume
    
    // Set the global audio reference
    globalAudio = currentsong;
    
    // Update the home button to use the navigation function
    const homeButton = document.querySelector('.home-button');
    if (homeButton) {
        homeButton.href = "javascript:void(0);";
        homeButton.onclick = function() { navigateWithoutStopping('index.html'); };
    }

    // Update all playlist links to use the navigate function
    document.querySelectorAll('.menu ul a').forEach(link => {
        const href = link.getAttribute('href');
        link.href = "javascript:void(0);";
        link.onclick = function() { navigateWithoutStopping(href); };
    });

    // Fetch the list of songs
    songs = await getsongs();
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
            // If from this playlist
            if (savedSongSrc.includes("/play2/")) {
                // Extract the song name from the saved path
                const trackName = decodeURIComponent(savedSongSrc.split("/play2/")[1]);
                if (songs.includes(trackName)) {
                    // Set the song but don't play it yet
                    playMusic(trackName, currentsong, true);
                    
                    // Set the time to where it was
                    if (savedSongTime) {
                        currentsong.currentTime = parseFloat(savedSongTime);
                    }
                    
                    // Set volume if available
                    if (savedVolume) {
                        currentsong.volume = parseFloat(savedVolume);
                    }
                    
                    // Resume playing if it was playing before
                    if (wasPlaying) {
                        currentsong.play()
                            .then(() => {
                                play.src = "images/pause.svg";
                            })
                            .catch(err => {
                                console.error("Error resuming playback:", err);
                                play.src = "images/play.svg";
                            });
                    }
                } else {
                    // Song not found in this playlist
                    playMusic(songs[0], currentsong, true);
                }
            } else {
                // If the song is from a different playlist, handle direct audio source
                currentsong.src = savedSongSrc;
                
                // Set song info based on filename
                const filename = savedSongSrc.split('/').pop();
                document.querySelector(".songinfo").innerText = decodeURIComponent(filename);
                
                // Set the time where it was
                if (savedSongTime) {
                    currentsong.currentTime = parseFloat(savedSongTime);
                }
                
                // Set volume if available
                if (savedVolume) {
                    currentsong.volume = parseFloat(savedVolume);
                }
                
                // Resume if it was playing
                if (wasPlaying) {
                    currentsong.play()
                        .then(() => {
                            play.src = "images/pause.svg";
                        })
                        .catch(err => {
                            console.error("Error playing from other playlist:", err);
                            // Fallback to first song in current playlist
                            playMusic(songs[0], currentsong, true);
                        });
                }
            }
        } catch (error) {
            console.error("Error restoring playback:", error);
            // Fallback to first song
            playMusic(songs[0], currentsong, true);
        }
    } else {
        // No saved song, set the first song without playing it
        playMusic(songs[0], currentsong, true);
    }

    // Display songs in the playlist
    const songul = document.querySelector(".songlist ul");
    songul.innerHTML = ""; // Clear existing content
    songs.forEach((song, index) => {
        songul.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="Music Icon">
                <div class="info">${song.replaceAll("%20", " ")}</div>
                <div class="playnow">
                    <img class="invert play-icon" src="images/play.svg" alt="Play Now">
                </div>
            </li>`;
    });

    // Attach click events to the playlist
    Array.from(songul.getElementsByTagName("li")).forEach((li, index) => {
        li.addEventListener("click", () => {
            playMusic(songs[index], currentsong);
        });
    });

    // Play/Pause button functionality
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play()
                .then(() => {
                    play.src = "images/pause.svg";
                })
                .catch(err => {
                    console.error("Error playing on click:", err);
                });
        } else {
            currentsong.pause();
            play.src = "images/play.svg";
        }
    });

    // Previous and Next button functionality
    previous.addEventListener("click", () => {
        const index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index > 0) {
            playMusic(songs[index - 1], currentsong);
        }
    });

    next.addEventListener("click", () => {
        const index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index < songs.length - 1) {
            playMusic(songs[index + 1], currentsong);
        }
    });

    // Update song time and progress bar
    currentsong.addEventListener("timeupdate", () => {
        const currentTime = secondsToTime(currentsong.currentTime);
        const duration = secondsToTime(currentsong.duration);
        document.querySelector(".songtime").innerText = `${currentTime} / ${duration}`;
        const progress = (currentsong.currentTime / currentsong.duration) * 100 || 0;
        document.querySelector(".circle").style.left = `${progress}%`;
    });

    // Seekbar functionality
    const seekbar = document.querySelector(".seekbar");
    seekbar.addEventListener("click", (e) => {
        const percent = (e.offsetX / seekbar.offsetWidth) * 100;
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });
    
    // Volume control
    if (document.querySelector("#volumeControl")) {
        document.querySelector("#volumeControl").addEventListener("input", (e) => {
            currentsong.volume = e.target.value;
        });
    }
    
    // Add beforeunload event to save current playback state when leaving
    window.addEventListener('beforeunload', function() {
        if (globalAudio && globalAudio.src) {
            localStorage.setItem('currentSongSrc', globalAudio.src);
            localStorage.setItem('currentSongTime', globalAudio.currentTime.toString());
            localStorage.setItem('isPlaying', (!globalAudio.paused).toString());
            localStorage.setItem('currentVolume', globalAudio.volume.toString());
        }
    });
}

// Initialize the player and playlist
document.addEventListener('DOMContentLoaded', main);
