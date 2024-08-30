import WHEPClient from "../../public/WHEPClient";
import WHIPClient from "../../public/WHIPClient";

export const VIDEO_ENABLED = process.env.VIDEO_ENABLED;

export class WHIP {
  publish;
  client;
  videoRef;
  loaded;
  recorder;

  init(config) {
    let { publish } = config.user;
    this.videoRef = config.videoRef;
    this.publish = publish;

    if (!this.videoRef) {
      console.log("[WHIP] No Video ref");
      return;
    }

    if (this.loaded) {
      return;
    }

    this.loaded = true;
    this.client = new WHIPClient(publish, this.videoRef.current);

    this.loaded = true;

    let { peerConnection } = this.client;

    let changeEvent = "connectionstatechange";

    peerConnection.addEventListener(changeEvent, async () => {
      let { connectionState: state } = peerConnection;

      console.debug("[WHIPClient.peerConnection] state", state);

      if (config[state]) {
        config[state](this);
      }
    });

    console.debug("[WHIP.init]");

    this.client
      .accessLocalMediaSources()
      .then((stream) => {
        this.client.localStream = stream;
        this.videoRef.current.srcObject = stream;
        this.recorder = new MediaRecorder(stream, {
          mimeType: "video/mp4",
        });
        this.recorder.start();
        console.log("[WHIP] Recorder state", this.recorder.state);
      })
      .catch(console.error);

    peerConnection.addEventListener("negotiationneeded", async () => {
      console.log("[WHEP.peerConnection]", "negotiationneeded");

      await this.negotiate();
    });

    // peerConnection.onicegatheringstatechange = (event) => {
    //   let { iceGatheringState: state } = event.target;
    //   console.log(
    //     "[WHEP.init]",
    //     "onicegatheringstatechange",
    //     event.target.iceGatheringState
    //   );

    //   if (state === "complete") {
    //     console.log("[WHEP.init]", "iceGatheringState", state);
    //   }
    // };
  }

  async negotiate() {
    console.log("[Whip.negotiate]");
    await this.setLocalDescription();
    await this.waitToCompleteICEGathering();
    await this.connect();
  }

  async setLocalDescription() {
    console.log("[Whip.setLocalDescription"); //peerConnection.localDescription.sdp
    const offer = await this.client.peerConnection.createOffer();
    await this.client.peerConnection.setLocalDescription(offer);
  }

  async waitToCompleteICEGathering() {
    return new Promise((resolve) => {
      this.client.peerConnection.onicegatheringstatechange = (evt) => {
        // console.log("test", evt.target.iceGatheringState);
        evt.target.iceGatheringState === "complete" && resolve("Done");
      };
    });
  }

  async connect() {
    let { peerConnection } = this.client;

    console.log("[Whip.connect]"); //peerConnection.localDescription.sdp

    let response = await fetch(this.publish, {
      method: "POST",
      mode: "cors",
      headers: { "content-type": "application/sdp" },
      body: peerConnection.localDescription.sdp,
    });

    let answerSDP = await response.text();

    if (response.status == 400) {
      console.log("answerSDP 400", answerSDP);
      return;
    }

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: "answer", sdp: answerSDP })
    );
  }

  update(config) {
    for (let i in config) {
      this[i] = config[i];
    }
  }
}

export class WHEP {
  play;
  client;
  videoRef;
  ofr;

  init(config) {
    console.debug("[WHEP.init]");

    let { play } = config.user;
    this.videoRef = config.videoRef;
    this.play = play;

    this.client = new WHEPClient(play, this.videoRef.current);

    let { peerConnection } = this.client;

    let changeEvent = "connectionstatechange";

    this.client.peerConnection.addEventListener(changeEvent, async () => {
      let { connectionState: state } = peerConnection;

      console.debug("[WHEPClient.peerConnection][Video] state", state);

      if (config[state]) {
        config[state](this);
      }
    });

    this.client.peerConnection.addEventListener(
      "negotiationneeded",
      async () => {
        console.log("[WHEP.init][Video]", "negotiationneeded");
        const offer = await this.client.peerConnection.createOffer();
        await this.client.peerConnection.setLocalDescription(offer);
      }
    );

    this.client.peerConnection.onicegatheringstatechange = (event) => {
      if (event.target.iceGatheringState === "complete") {
        this.connect();
      }
    };
  }

  async connect() {
    let { peerConnection } = this.client;

    console.log("[WHEP.connect][Video]");

    let response = await fetch(this.play, {
      method: "POST",
      mode: "cors",
      headers: { "content-type": "application/sdp" },
      body: peerConnection.localDescription.sdp,
    });

    let answerSDP = await response.text();
    if (response.status == 400) {
      console.log("[WHEP.connect]", 400);
      return;
    }

    console.log("[WHEP.connect][Video]", "OK");

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: "answer", sdp: answerSDP })
    );
  }

  update(config) {
    for (let i in config) {
      this[i] = config[i];
    }
  }
}

// export const setupWHIP = async (config) => {
//   console.log("[setupWHIP]");
//   let { publish } = config.user;

//   let streamClient = new WHIPClient(publish, config.videoRef.current);
//   (window as any).streamClient = streamClient;
// };
