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
    if (!pause) {
        currentsong.play(); // Play the song
        document.querySelector("#play").src = "images/pause.svg"; // Change play button to pause icon
    } else {
        currentsong.pause();
    }

    document.querySelector(".songinfo").innerText = decodeURIComponent(track); // Update song info
    document.querySelector(".songtime").innerText = "00:00 / 00:00"; // Reset song time display
};

let songs; // Variable to store the list of songs

async function main() {
    const play = document.querySelector("#play"); // Play button element
    const previous = document.querySelector("#previous"); // Previous button
    const next = document.querySelector("#next"); // Next button
    const currentsong = new Audio(); // Initialize the audio element

    // Get the list of all songs
    songs = await getsongs();
    if (songs.length === 0) {
        console.error("No songs found!");
        return;
    }
    playMusic(songs[0], currentsong, true); // Set the first song without playing it

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
            currentsong.play();
            play.src = "images/pause.svg";
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
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Close button to hide the playlist
    document.querySelector(".close").addEventListener("click", () => {
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
}



main(); // Initialize the player and playlist
