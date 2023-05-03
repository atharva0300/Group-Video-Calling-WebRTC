let localStream;
// localstream -> local cameras local feed and audio 

let remoteStream;
// remoteStream -> remote users camera and audio

let peerConnection;
// interface that stores all the info between us and the remote user




let APP_ID = "e50d4ffad390463fb2ccc1d454f45af6"

let token = null;  
let uid = String(Math.floor(Math.random()*10000))               // user id for each user

let client; // client object 
let channel;    // channel for the user to join




const servers = {
    iceServers : [
        {
            urls : ['stun:stun1.1.google.com:19302' , 'stun:stun2.1.google.com:19302']
            // setting the urls of the stun servers
        }
    ]
}

let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID)
    // creating an instance of Agora real time messaging ( RTM ) 
    // this connects the instance with the application on agora

    // login
    await client.login({uid , token})

    // channel 
    // index.html?roomID=123
    channel = client.createChannel('main')
    // creaitng a channel with the data in teh roomID
    // join the channel
    await channel.join()


    // event listnerrs 
    channel.on('MemberJoined', handleUserJoined)
    // calls the handleUserJoined function. the event name is -> MemberJoined

    client.on('MessageFromPeer' , handleMessageFromPeer)    // new event , event name -> MessageFromPeer
    // when a message is received
    // call the handler -> handleMessageFromPeer


    // asking for permissions for video and audio 
    localStream = await navigator.mediaDevices.getUserMedia({video : true , audio : false})
    // needing the permissios for video and audio

    document.getElementById('user-1').srcObject = localStream
    // applying the localStream media permission to the user-1 ( the self )

    // calling teh createOffer function
    createOffer()
}


let handleMessageFromPeer =  async (message, memberId) => {
    // getting the message and teh memberId 
    message = JSON.parse(message.text)
    console.log('Message : ' , message)
}

let handleUserJoined = async (memberId) => {
    // gets called when a new user has joined the channel
    console.log('A new user joined the channel : ' , memberId)

    // when the new user has joined, create an offer
    createOffer(memberId)
}

// creating a function to offer 
let createOffer = async (memberId) => {
    peerConnection = new RTCPeerConnection(servers)// passing the servers object to provide the info about the stun servers
    // creaitng an object of RTCPeerConnection

    // creating a video stream for the other user
    remoteStream = new MediaStream()

    // applyin the MediaStream for the other user
    document.getElementById('user-2').srcObject = remoteStream

    // if localStream is not created then
    if(!localStream){
        // asking for permissions for video and audio 
        localStream = await navigator.mediaDevices.getUserMedia({video : true , audio : false})
        // needing the permissios for video and audio

        document.getElementById('user-1').srcObject = localStream
        // applying the localStream media permission to the user-1 ( the self )
    }

    // looping through all the audio and video tracks and then adding to the localstream
    localStream.getTracks().forEach((track) => {
        // adding all the tracks to remote Peer
        peerConnection.addTrack(track , localStream)
    })

    // listen when the remote user also adds tracks 
    // when remote user adds tracks, then 
    peerConnection.ontrack = (event) => {
        // when remote Peer adds tracks
        // iterating through all the tracks of the remoteStream
        event.streams[0].getTracks().forEach((track) => {
            // setting to the remoteStream
            remoteStream.addTrack()
        })
    }

    // creating an event listener which activates every time when we create an ice candidate
    peerConnection.onicecandidate = async (event) =>{
        if(event.candidate){
            // if a new candidate is created, display it 
            console.log('New ice candidate : ' , event.candidate)
        }
    } 


    let offer = await peerConnection.createOffer()
    // creating an offer

    await peerConnection.setLocalDescription(offer)
    // initializin the localocnnection

    console.log('offer : ' , offer)

    // acccessing the client object 
    client.sendMessageToPeer({text : 'Hey!!!'} , memberId)
    // this send teh message to the user with the memberId given 

    // sending the message to the peer 
    client.sendMessageToPeer({text : JSON.stringify({'type' : 'offer' , 'offer' : offer})} , memberId)
    // sending the offer to the memberId, instead of all 



}




init()