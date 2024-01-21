const timeout = 5000;
let retrying = true;
const socket = new WebSocket('ws://127.0.0.1:8080');

// Functions to handle socket events
function MakeConnection ()
{
    // Connection opened
    socket.addEventListener('open', function (event) {
        socket.send('Hello Server!');
        console.log('connected to palacio-display-server!');
        retrying = false;
    });
    if (socket.readyState !== socket.OPEN) {
    console.log('Connection open: failed and retry later');
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
    if (obj.cmd === 'model' ) {
        console.log(obj.filename);
        console.log(obj.info);
        console.log(obj.direction);
        console.log(obj.device_orientation);
        console.log(obj.display_mode);
        console.log(obj.zoom);
        //do choosing 3d model template html file here 
        //set obj.filename to template file html
        //selectFile( file );
    }
    }
    else {
        console.log('received invalid string from palacio-display-server');
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
console.log('Connecting to ws://127.0.0.1:8080...');
MakeConnection();
	