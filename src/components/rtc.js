import React from 'react';

const configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};

export default class Rtc extends React.Component {
  state = {
    player: 0,
    status: 'waiting',
    dataChannel: null,
  };

  constructor() {
    super();
    this.member = {};
    this.drone = new window.Scaledrone("dJEZ1K9ffgeALzCw", {
      data: this.member,
    });
    this.drone.on('open', (error) => {
      console.log("OPENED");
      if (error) {
        return console.error(error);
      }
      this.member.id = this.drone.clientId;
    });
    this.roomName = `observable-${window.location.pathname}`;
    this.room = this.drone.subscribe(this.roomName);
    console.log("SUBSCRIBING", this.roomName);
    // room.on('data', ({squares, ...data}, member) => {
    //   if(member.id !== this.member.id) {
    //     console.log("SQUARES", squares);
    //     const squareObjs = squares.map(pieceReviver);
        
    //     this.setState({
    //       squares: squareObjs,
    //       status: '',
    //       ...data
    //     });
    //   }
    // });
    this.room.on('member_join', (member) => {
      console.log("MEMBER JOINED", member.id);
      this.setState({status: 'connected', player: 0});
    });
    this.room.on('members', (members) => {
      console.log("MEMBERS", members);
      this.member.player = members.length - 1;
      if (members.length > 2) {
        return alert('The room is full');
      }
      // this.setState({status: 'connected'});
      this.startWebRTC(members.length === 2);
      if (members.length > 1) {
        this.setState({status: 'connected', player: 1});
      }
    });
    this.room.on('member_leave', (member) => {
      console.log('left member', member.id);
      this.setState({status: 'disconnected'});
    });
  }

  onSuccess = () => {}

  onError = (error) => { console.error(error); }

  publish = (message) => {
    console.log("OUTGOING", message, this.roomName);
    this.drone.publish({
      room: this.roomName,
      message,
    });
  }

  startWebRTC(isOfferer) {
    const pc = new RTCPeerConnection(configuration);
    this.pc = pc;
  
    // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
    // message to the other peer through the signaling server
    pc.onicecandidate = event => {
      if (event.candidate) {
        this.publish({'candidate': event.candidate});
      }
    };
  
    // If user is offerer let the 'negotiationneeded' event create the offer
    if (isOfferer) {
      pc.onnegotiationneeded = () => {
        pc.createOffer().then(this.localDescCreated).catch(this.onError);
      }
      const dataChannel = pc.createDataChannel('videosync');
      this.setupDataChannel(dataChannel);
      this.setState({dataChannel})
    }  else {
      // If user is not the offerer let wait for a data channel
      pc.ondatachannel = event => {
        const dataChannel = event.channel;
        this.setupDataChannel(dataChannel);
        this.setState({dataChannel});
      }
    }
  
    // When a remote stream arrives display it in the #remoteVideo element
    pc.ontrack = event => {
      const stream = event.streams[0];
      this.setState({
        remoteStream: stream
      })
    };
  
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then(stream => {
      // Display your local video in #localVideo element
      // localVideo.srcObject = stream;
      this.setState({
        localStream: stream
      })
      // Add your stream to be sent to the conneting peer
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }, this.onError);
  
    // Listen to signaling data from Scaledrone
    this.room.on('data', (message, client) => {
      // Message was sent by us
      if (client.id === this.drone.clientId) {
        return;
      }
  
      if (message.sdp) {
        // This is called after receiving an offer or answer from another peer
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
          // When receiving an offer lets answer it
          if (pc.remoteDescription.type === 'offer') {
            pc.createAnswer().then(this.localDescCreated).catch(this.onError);
          }
        }, this.onError);
      } else if (message.candidate) {
        // Add the new ICE candidate to our connections remote description
        pc.addIceCandidate(
          new RTCIceCandidate(message.candidate), this.onSuccess, this.onError
        );
      }
    });
  }
  
  localDescCreated = (desc) => {
    this.pc.setLocalDescription(
      desc,
      () => this.publish({'sdp': this.pc.localDescription}),
      this.onError
    );
  }

  setupDataChannel(dataChannel) {
    console.log("setupDataChannel");
    dataChannel.onopen = this.checkDataChannelState;
    dataChannel.onclose = this.checkDataChannelState;
  }

  checkDataChannelState(event) {
    console.log('WebRTC channel state is:', event.target.readyState);
  }

  render() {
    return this.props.render({
      player: this.state.player,
      localStream: this.state.localStream,
      remoteStream: this.state.remoteStream,
      status: this.state.status,
      dataChannel: this.state.dataChannel
    });
  }
}
