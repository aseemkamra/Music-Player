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

    if (!pause) {
        currentSong.play();
        play.src = "images/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

let songs;

async function main() {
    const playButton = document.getElementById("play");
    const previousButton = document.getElementById("previous");
    const nextButton = document.getElementById("next");
    const volumeControl = document.getElementById("volumeControl");

    let currentSong = new Audio();
    currentSong.volume = 0.5; // Set default volume

    // Get the list of all songs
    songs = await getSongs();
    if (songs.length === 0) {
        console.error("No songs found!");
        return;
    }

    playMusic(songs[0], currentSong, true);

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
            currentSong.play();
            playButton.src = "images/pause.svg";
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
            playMusic(songs[index - 1], currentSong, true);
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
}

main();
