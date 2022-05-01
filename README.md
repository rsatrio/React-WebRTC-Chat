# React WebRTC Chat

A simple chat application using WebRTC for p2p chat and WebSocket for signaling.

You can try the live application at:

https://glowing-creponne-b62856.netlify.app/


## Features
- E2EE Chat P2P Application
- Using WebRTC and WebSocket


## Build

- Install nodejs
- Edit the "REACT_APP_SIGNALLING_SERVER" in environment configuration to point to your signaling server (code example in [here](https://github.com/rsatrio/WebRTC-Signaling-Server) )
- Edit the "REACT_APP_GA_ID" in environment configuration with your Google Analytics Measurement ID
- This client used STUN and Turn Server from OpenRelay Project (https://www.metered.ca/tools/openrelay/). You can change it in the App.js to use your own STUN/TURN server
- Run this to install required NPM and build the application:


```shell
npm install
npm run build
```

## Explanation
You can find the detail explanation of the signaling server flow in [this medium blog](https://mrizkysatrio.medium.com/webrtc-chat-application-772539ae97b7).


## Feedback
For feedback, please raise issues in the issue section of the repository. Periodically, I will update the code. Enjoy!!.

