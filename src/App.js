
import './App.css';
import { Button, Card, Grid } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.js';

import './chat.css';
import pic1 from './pic1.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactGA from "react-ga4";


import { useEffect, useState } from 'react';


var channels = [];
var channelUsers = new Map();
var friendToName = new Map();


var rtcPeers = new Map();
var ws1;
var reactGA;

function App() {

  
  const [userId, setUserId] = useState("");
  const [rtcPeers2, setRtcPeers2] = useState("");


  var signal1 = {
    userId: null,
    type: null,
    data: null,
    toUid: null,
  };

  var chatData = {
    userId: null,
    data: null,
    type: null,
  }

 
  var userId2 = "";



  useEffect(() => {    
    ReactGA.initialize(process.env.REACT_APP_GA_ID);
    ReactGA.send({ hitType: "pageview", page: "/" });
    document.getElementById('toSend').onkeydown = (event) => {
      

      if (event.key == 'Enter') {
        event.preventDefault();
        sendChat();
        
      }
    };
   


    document.getElementById('toSend').setAttribute('disabled', 'true');
    document.getElementById('btnSend').setAttribute('disabled', 'true');
    document.getElementById('status-online').style.display = 'none';
    document.getElementById('btnShowLogin').click();


  }, []);

  function addUserOnChat(pengirim: string, join1: boolean) {
    let chatWindow = document.getElementById('chat');
    let child1 = document.createElement("p");;
    if (join1) {
      child1.className = "text-white text-center m-2 bg-success";
      child1.innerText = pengirim + " joined";
    }
    else {
      child1.className = "text-white text-center m-2 bg-danger";
      child1.innerText = pengirim + " leaved";
    }

    chatWindow.appendChild(child1);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function addChatLine(data1: String, listClass: string, pengirim: string) {
    let list = document.createElement('li');
    list.className = listClass;
    let entete = document.createElement('div');
    entete.className = 'entete';
    let span1 = document.createElement('span');
    let h2 = document.createElement('h2');
    let h3 = document.createElement('h3');
    h2.innerText = pengirim;
    h2.className = "m-2";
    h3.innerText = new Date().toLocaleTimeString();
    entete.appendChild(h3);
    entete.appendChild(h2);


    let triangle = document.createElement('div');
    triangle.className = 'triangle';
    let message = document.createElement('message');
    message.className = 'message';
    message.innerHTML = data1;
    list.appendChild(entete);
    if (listClass == 'you') {
      list.appendChild(triangle);
    }
    list.appendChild(message);

    let chatWindow = document.getElementById('chat');
    chatWindow.appendChild(list);
    chatWindow.scrollTop = chatWindow.scrollHeight;


  }

  function login() {
    let inputName = document.getElementById('myUsername');
    if (inputName.value.length < 1) {
      toast.error("Username cannot be blank");
      return;
    }
    startWebSocket();
    ReactGA.event({action:'login',category:'login'});
  }

  function startWebSocket() {

    // ws1 = new WebSocket('ws://localhost:3030/socket1');
    let socketAddr = process.env.REACT_APP_SIGNALLING_SERVER;
    ws1 = new WebSocket(socketAddr);
    ws1.onopen = event => {

      signal1.userId = '';
      signal1.type = 'Login';
      signal1.data = '';
      console.log(JSON.stringify(signal1));
      ws1.send(JSON.stringify(signal1));

    }

    ws1.onerror = (error) => {
      toast.error("Error connecting to signalling server, please try login again");
    };

    ws1.onclose = event => {
      document.getElementById('status-offline').style.display = 'block';
      document.getElementById('status-online').style.display = 'none';
      document.getElementById('myUsername').removeAttribute('readOnly');
      let myStatus = document.getElementById('myStatus');
      myStatus.className = 'status orange';

      document.getElementById('h3-myStatus').innerText = 'offline';
      document.getElementById('h3-myStatus').appendChild(myStatus);
      document.getElementById('btnLogin').style.display = 'block';


      document.getElementById('toSend').setAttribute('disabled', 'true');
      document.getElementById('btnSend').setAttribute('disabled', 'true');
    }

    ws1.onmessage = event => {
      var data1 = JSON.parse(event.data);
      console.log(event);
      console.log(data1);
      console.log(data1.type);

      var data2 = null;


      console.log("Data from server:" + JSON.stringify(data1));
      if (data1.userId == userId2 || data1.userId.length < 2) {

        return;
      }
      else if (data1.type == 'NewMember') {
        handleNewMemberAndOffer(data1);
      }
      else if (data1.type == "UserId") {

        setUserId(data1.data);

        userId2 = data1.data;
        document.getElementById('status-offline').style.display = 'none';
        document.getElementById('status-online').style.display = 'block';
        document.getElementById('toSend').removeAttribute('disabled');
        document.getElementById('btnSend').removeAttribute('disabled');
        document.getElementById('btnLogin').style.display = 'none';
        document.getElementById('myUsername').setAttribute('readOnly', 'true');

        let myStatus = document.getElementById('myStatus');
        myStatus.className = 'status green';

        document.getElementById('h3-myStatus').innerText = 'online';
        document.getElementById('h3-myStatus').appendChild(myStatus);
        // document.getElementById('btnShowLogin').click();
        toast.success("Connected to Signalling Server. Please click the Show Login/Chat button");
        newMember(userId2);

        console.log("Set userId2:" + userId2);
        // sendOffer();
      }
      else if (data1.type == "Offer") {

        data2 = JSON.parse(data1.data);
        console.log("Receive offer:" + JSON.stringify(data2));
        handleNewMemberAndOffer(data1);

      }
      else if (data1.type == "Ice") {
        data2 = JSON.parse(data1.data);
        if (data2) {

          let peer1 = rtcPeers.get(data1.userId);

          if (peer1) {
            console.log("Tambah Ice Candidate");
            peer1.addIceCandidate(new RTCIceCandidate(data2)).catch(error => {
              console.log(data2);
              console.log("Error ICE:" + error);
            });
          }
        }
      }
      else if (data1.type == "Answer") {
        data2 = JSON.parse(data1.data);
        let peer1 = rtcPeers.get(data1.userId);
        peer1.setRemoteDescription(new RTCSessionDescription(data2));

      }

      // console.log("Message:"+event.data);
    };

  }

  function errorHandler(error) {
    console.log('Error:' + error);
  }


  function addUser(data1: String, friendId: string) {
    let newUser = document.createElement("li");
    let img1 = document.createElement("img");
    img1.src = pic1;
    img1.width = 55;
    img1.height = 55;
    let div1 = document.createElement('div');
    let h2 = document.createElement('h2');
    h2.innerText = data1;
    let h3 = document.createElement('h3');
    h3.innerText = 'online';
    let span1 = document.createElement('span');
    span1.className = 'status green';
    h3.appendChild(span1);
    div1.appendChild(h2);
    div1.appendChild(h3);
    newUser.appendChild(img1);
    newUser.appendChild(div1);
    newUser.id = friendId;
    
    document.getElementById("user-list").appendChild(newUser);

    addUserOnChat(friendToName.get(friendId), true);
  }

  function addTerminalLine(data1: String) {

    let new1 = document.createElement("p");

    new1.classNameName = "console";
    new1.textContent = data1;
    // document.getElementById("terminal-home1").appendChild(new1);
  }

  function handleNewMemberAndOffer(data1) {
    let data3 = JSON.parse(data1.data);
    let peerId = data1.userId;
    let rtcPeer = new RTCPeerConnection({
      iceServers: [{
        urls: "stun:openrelay.metered.ca:80",
      },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      ]
    });
    console.log('Add peer:' + peerId + "-" + JSON.stringify(rtcPeer));

    setRtcPeers2(rtcPeers2);



    if (data1.type == "NewMember") {
      let channel1 = rtcPeer.createDataChannel(Math.floor(Math.random() * 10000000000));
      channelConfig(channel1);

      //create offer
      rtcPeer.createOffer().then(a => {
        console.log('Sending offer');
        // console.log('UserId:' + userId2);
        console.log('UserId:' + userId);
        signal1.userId = userId2;
        signal1.type = 'Offer';
        signal1.data = JSON.stringify(a);
        signal1.toUid = data1.userId;
        console.log(JSON.stringify(signal1));
        ws1.send(JSON.stringify(signal1));
        rtcPeer.setLocalDescription(a);
        // rtcPeer.currentLocalDescription=offer;
      }).then(() => {

      }).
        catch(err => {
          console.log('Error Offer:' + err);
        });


    }
    //when not new member
    else {
      let data2 = JSON.parse(data1.data);
      console.log('Sending answer');
      rtcPeer.setRemoteDescription(data2).then(() => {

        rtcPeer.createAnswer().then(a => {

          signal1.userId = userId2;
          signal1.type = 'Answer';
          signal1.data = JSON.stringify(a);
          signal1.toUid = data1.userId;
          rtcPeer.setLocalDescription(a);
          ws1.send(JSON.stringify(signal1));
          console.log('answer:' + JSON.stringify(a));
        });
      });

    }
    rtcPeer.ondatachannel = event => {
      let channel2 = event.channel;
      channelConfig(channel2);
    }


    rtcPeer.onicecandidate = event => {
      console.log('Got ice candidate');
      if (event.candidate) {
        console.log('ice candidate:' + JSON.stringify(event.candidate));
        signal1.userId = userId2;
        signal1.type = 'Ice';
        signal1.data = JSON.stringify(event.candidate);
        signal1.toUid = data1.userId;
      }
      console.log('ice candidate2:' + JSON.stringify(event));
      if (event.candidate) {

        if (Object.keys(event.candidate.candidate).length > 1) {
          console.log("Kirim candidate ke server");
          ws1.send(JSON.stringify(signal1));
        }
      }
    };
    rtcPeer.onicecandidateerror = event => {
      console.log('ice candidate error');
      // ws1.send(JSON.stringify(event));
    };

    rtcPeer.onicegatheringstatechange = event => {
      console.log('ice gathering');

      console.log('Ice gathering:' + JSON.stringify(event));
      // ws1.send(JSON.stringify(event));
    };

    rtcPeer.oniceconnectionstatechange = event => {
      console.log('ice connection change');
      // ws1.send(JSON.stringify(event));
    };

    rtcPeers.set(peerId, rtcPeer);

  }

  function channelConfig(channel1: RTCDataChannel) {
    channel1.onclose = event => {
      console.log("Close channel:");
      let friendId = channelUsers.get(channel1);
      document.getElementById(friendId).remove();

      addUserOnChat(friendToName.get(friendId), false);
      friendToName.delete(friendId);
    }
    channel1.onmessage = event => {
      console.log("Receive msg datachannel:" + event.data);
      let dataChat1 = JSON.parse(event.data);
      if (dataChat1.type == 'message') {
        addChatLine(dataChat1.data, 'you', dataChat1.userId);
      }
      else {
        friendToName.set(dataChat1.userId, dataChat1.data);
        addUser(dataChat1.data, dataChat1.userId);
        channelUsers.set(channel1, dataChat1.userId);
      }



    };

    channel1.onopen = () => {
      console.log("Now it's open");
      chatData.userId = userId2;
      chatData.type = 'handshake';
      chatData.data = document.getElementById('myUsername').value;
      channel1.send(JSON.stringify(chatData));
    }
    channels.push(channel1);


  }

  function updateView() {
    // console.log("State" + rtcPeer.connectionState);
    // console.log("State" + rtcPeer.iceConnectionState);
    // ws1.send("oke1");
    let msg1 = document.getElementById('msg1').value;

    channels.forEach(a => {
      console.log('channel is' + a.readyState);
      if (a.readyState == 'open') {
        a.send(msg1);
      }
    });
    // channel2.send(msg1);

    // document.getElementById
  }

  function sendOffer() {
    addUser(document.getElementById('myUsername').value, Math.floor(Math.random() * 100000000));
    addChatLine('TestAja', 'me');
  }

  function newMember(data1: String) {
    signal1.userId = data1;
    signal1.type = 'NewMember';
    signal1.toUid = 'signaling';
    signal1.data = 'Join';
    ws1.send(JSON.stringify(signal1));
  }

  function sendChat() {
    channels.forEach(a => {
      let dataToSend = document.getElementById('toSend').value;
      chatData.userId = document.getElementById('myUsername').value;
      chatData.type = 'message';
      chatData.data = dataToSend;
      console.log("Send chat:" + JSON.stringify(chatData));
      if (a.readyState == 'open') {
        a.send(JSON.stringify(chatData));
      }

    });
    addChatLine(document.getElementById('toSend').value, 'me', 'Me');
    document.getElementById('toSend').value = '';
    
  }

  function clickShowChat() {
    
    document.getElementById('btnShowLogin').click();
  }

  function disconnectAll() {
    ws1.close();
    rtcPeers.forEach((a, b) => {
      a.close();
    });
    rtcPeers.clear();
    channels = [];
    channelUsers.forEach((a, b) => document.getElementById(a).remove());
    channelUsers.clear();
    ReactGA.event({action:'logout',category:'logout'});
  }


  const renderMyWeb = () => {
    try {

      return (

        <div className="container" className='h-100'>
          <ToastContainer />
          <div id="container1" >
            <div className="row">
              <button id="btnShowLogin" className="btn btn-primary" type="button" data-bs-toggle="collapse"
                data-bs-target="#multiCollapseExample1" aria-expanded="false"
                aria-controls="multiCollapseExample1">Show Login/Chat</button>
            </div>
            <div className="row">
              <div className='col-3  col-xs-2'>
                <div className="collapse collapse-horizontal multi-collapse" id="multiCollapseExample1">
                  <div className='card card-body'>
                    <aside >

                      <header>
                        <input type="text" id="myUsername" placeholder="Put Username" />
                        <div className="row">

                          <Button variant="contained" id="btnLogin" color="success" className='mt-3 col'
                            type='button' onClick={() => login()}>Login</Button>
                        </div>
                        <div className="row">
                          <Button variant="contained" id="btnDisconnect" color="success" className='mt-3 mr-1 col'
                            type='button' onClick={() => disconnectAll()}>Disconnect</Button>
                        </div>
                      </header>
                      <div id="chatDiv" onClick={() => clickShowChat()}>
                        <ul id="user-list">
                          <li >
                            <img id="imageUnknown" width={55} height={55} src={pic1} alt="" />
                            <div>
                              <h2 >Myself</h2>
                              <h3 id="h3-myStatus">

                                offline
                                <span id="myStatus" className="status orange"></span>
                              </h3>
                            </div>
                          </li>


                        </ul>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
              <div className='col-lg-6 col-sm-10'>
                <main>

                  <header >
                    <div>
                      <p className="text-success " id="status-online">You are online</p>
                      <p className="text-danger" id="status-offline">You are offline</p>
                    </div>

                  </header>

                  <ul id="chat" className='border' >

                    {/* <li className="you">
                  <div className="entete">
                    <span className="status green"></span>
                    <h2>Vincent</h2>
                    <h3>10:12AM, Today</h3>
                  </div>
                  <div className="triangle"></div>
                  <div className="message">
                    Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.
                  </div>
                </li> */}
                    {/* <li className="me">
                  <div className="entete">
                    <h3 >10:12AM, Today</h3>
                    <h2 className='m-2'>Vincent</h2>
                    
                  </div>
                  <div className="triangle"></div>
                  <div className="message">
                    Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.
                  </div>
                </li> */}


                  </ul>

                  <footer>
                    <textarea placeholder="Type your message" id="toSend"></textarea>
                    <Button variant="contained" color="success" id='btnSend'
                      className='float-right'
                      type='button' onClick={() => sendChat()}>Send</Button><br /><br />
                    <div className="col-md-12 text-center bg-black text-white">
                      <p>
                        Copyright ©<script>document.write(new Date().getFullYear());</script>2022 Rizky Satrio All rights reserved
                      </p>
                    </div>
                  </footer>
                </main>
              </div>
            </div>
          </div>
        </div>

      )

    }
    catch (e) {
      console.log('error1:' + e);
      return (
        <div><h1>Error Loading</h1></div>
      )
    }
  }

  return (
    <div>

      {
        renderMyWeb()
      }


    </div>

  );
}

export default App;
