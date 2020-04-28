import React from 'react';

export default class VidoChat extends React.Component {
  constructor() {

  }

  startWebRTC = (isOfferer) => {
    pc = new RTCPeerConnection(configuration);
  
    // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
    // message to the other peer through the signaling server
    pc.onicecandidate = event => {
      if (event.candidate) {
        sendSignalingMessage({'candidate': event.candidate});
      }
    };
  
    // If user is offerer let the 'negotiationneeded' event create the offer
    if (isOfferer) {
      pc.onnegotiationneeded = () => {
        pc.createOffer().then(localDescCreated).catch(onError);
      }
      dataChannel = pc.createDataChannel('videosync');
      setupDataChannel();
    }  else {
      // If user is not the offerer let wait for a data channel
      pc.ondatachannel = event => {
        dataChannel = event.channel;
        setupDataChannel();
      }
    }
  
    // When a remote stream arrives display it in the #remoteVideo element
    pc.ontrack = event => {
      const stream = event.streams[0];
      if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== stream.id) {
        remoteVideo.srcObject = stream;
      }
    };
  
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then(stream => {
      // Display your local video in #localVideo element
      localVideo.srcObject = stream;
      // Add your stream to be sent to the conneting peer
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }, onError);
  
    // Listen to signaling data from Scaledrone
    room.on('data', (message, client) => {
      // Message was sent by us
      if (client.id === drone.clientId) {
        return;
      }
  
      if (message.sdp) {
        // This is called after receiving an offer or answer from another peer
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
          // When receiving an offer lets answer it
          if (pc.remoteDescription.type === 'offer') {
            pc.createAnswer().then(localDescCreated).catch(onError);
          }
        }, onError);
      } else if (message.candidate) {
        // Add the new ICE candidate to our connections remote description
        pc.addIceCandidate(
          new RTCIceCandidate(message.candidate), onSuccess, onError
        );
      }
    });
  }
  
  localDescCreated = (desc) => {
    pc.setLocalDescription(
      desc,
      () => sendSignalingMessage({'sdp': pc.localDescription}),
      onError
    );
  }
}
