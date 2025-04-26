// Global audio object to maintain playback state
let globalAudio = null;

// Converts seconds to a time format (MM:SS)
function secondsToTime(seconds) {
    if (isNaN(seconds) || seconds <= 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad with leading zeros if needed
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

// Fetches the list of songs from the "songs" directory
async function getsongs() {
    try {
        let response = await fetch('http://127.0.0.1:5500/happy123/');
        let html = await response.text();
        let div = document.createElement("div");
        div.innerHTML = html;

        // Extract links to songs with ".mp3" extension
        let songElements = div.getElementsByTagName("a");
        let songs = [];
        for (let element of songElements) {
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split("/happy123/")[1])); // decodeURI for better display
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
    currentsong.src = "happy123/" + track; // Set the audio source to the selected song
    
    // Update the global audio reference
    globalAudio = currentsong;
    
    if (!pause) {
        currentsong.play() // Play the song
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

let songs; // Variable to store the list of songs

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

async function main() {
    const play = document.querySelector("#play"); // Play button element
    const previous = document.querySelector("#previous"); // Previous button
    const next = document.querySelector("#next"); // Next button
    const currentsong = new Audio(); // Initialize the audio element
    
    // Set the global audio reference
    globalAudio = currentsong;
    
    // Update all playlist links to use the navigate function
    document.querySelectorAll('.menu ul a').forEach(link => {
        const href = link.getAttribute('href');
        link.href = "javascript:void(0);";
        link.onclick = function() { navigateWithoutStopping(href); };
    });

    // Get the list of all songs
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
            if (savedSongSrc.includes("/happy123/")) {
                // Extract the song name from the saved path
                const trackName = decodeURIComponent(savedSongSrc.split("/happy123/")[1]);
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
    
    // Clear the localStorage after restoring to prevent issues with repeated use
    // Don't clear to allow continuous playback across pages
    // localStorage.removeItem('currentSongSrc');
    // localStorage.removeItem('currentSongTime');
    // localStorage.removeItem('isPlaying');

    // Display all songs in the playlist
    const songul = document.querySelector(".songlist ul");
    songul.innerHTML = ""; // Clear any existing content
    songs.forEach((song) => {
        songul.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                </div>
                <div class="playnow">
                    <span>
                    <img class="invert play-icon" src="images/play.svg" alt="Play Now">
                    </span>
                </div>
            </li>`;
    });

    // Attach event listeners to each song in the playlist
    Array.from(songul.getElementsByTagName("li")).forEach((li, index) => {
        li.addEventListener("click", () => {
            playMusic(songs[index], currentsong);
        });
    });

    // Play/Pause functionality
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

    // Update song time and progress
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = `${secondsToTime(currentsong.currentTime)} / ${secondsToTime(currentsong.duration)}`;
        const progress = (currentsong.currentTime / currentsong.duration) * 100 || 0;
        document.querySelector(".circle").style.left = `${progress}%`;
    });

    // Seek functionality (click on the seekbar to jump to a specific part of the song)
    const seekbar = document.querySelector(".seekbar");
    seekbar.addEventListener("click", (e) => {
        const percent = (e.offsetX / seekbar.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = `${percent}%`;
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    // Hamburger menu to show the playlist
    document.querySelector(".hamburger")?.addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Close button to hide the playlist
    document.querySelector(".close")?.addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous song functionality
    previous.addEventListener("click", () => {
        const index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index > 0) {
            playMusic(songs[index - 1], currentsong);
        }
    });

    // Next song functionality
    next.addEventListener("click", () => {
        const index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index < songs.length - 1) {
            playMusic(songs[index + 1], currentsong);
        }
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
