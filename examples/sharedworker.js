const timeout = 5000;
let retrying = true;
const socket = new WebSocket('ws://127.0.0.1:8080');
var videoplayer = document.getElementById('videoplayer');
var picturedisplayer = document.getElementById('picturedisplayer');
var image = document.getElementById('image');

// Functions to handle socket events
function MakeConnection ()
{
    // Connection opened
    socket.addEventListener('open', function (event) {
        socket.send('Videoplayer: Hello Server!');
        console.log('Videoplayer: connected to palacio-display-server!');
        console.log("Videoplayer: current href: %s", window.location.href);
        retrying = false;
    });
    if (socket.readyState !== socket.OPEN) {
        console.log('Videoplayer: Connection open: failed and retry later');
        setTimeout(MakeConnection, timeout);
    }
}

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log(event.data.toString());
    let cmd_string = event.data.toString();
    let hashtag_index = cmd_string.indexOf('{');
    if (hashtag_index === 0) {
        let json = cmd_string.slice(hashtag_index);
        const obj = JSON.parse(json);
        if (obj.cmd === 'video' ) {
            picturedisplayer.style.display = "none";
            videoplayer.style.display="block";
            console.log(obj.filename);
            console.log(obj.info);
            console.log(obj.direction);
            console.log(obj.device_orientation);
            console.log(obj.display_mode);
            console.log(obj.zoom);
            let index = obj.filename.indexOf("image-uploads");
            let filename = obj.filename.substr(index);
            videoplayer.setAttribute("src", filename);
            videoplayer.play();
        }
        if (obj.cmd === 'image' || obj.cmd === 'gif') {
            videoplayer.setAttribute("src", "");
            videoplayer.style.display="none";
            picturedisplayer.style.display = "block";
            console.log(obj.filename);
            image.removeAttribute("src");
            let index = obj.filename.indexOf("image-uploads");
            let filename = obj.filename.substr(index);
            image.setAttribute("src", filename);
            image.setAttribute("width", "100%");
            image.setAttribute("height", "auto");
            image.setAttribute("alt", "Image/Gif display mode");
        }
    }
})

socket.addEventListener('close', function (event) {
    console.log('Connection closed');
    if (!retrying) {
        retrying = true;
        console.log('Reconnecting...');
    }
    setTimeout(MakeConnection, timeout);
})

socket.addEventListener('error', function (event) {
    console.log('Connection error: failed and retry later');
    if (!retrying) {
        retrying = true;
        console.log('Reconnecting...');
    }
    setTimeout(MakeConnection, timeout);
})

// Connect
console.log('Videoplayer: Connecting to ws://127.0.0.1:8080...');
MakeConnection();