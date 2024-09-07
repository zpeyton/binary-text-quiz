import WHEPClient from "../../public/WHEPClient";
import WHIPClient from "../../public/WHIPClient";

export const VIDEO_ENABLED = process.env.VIDEO_ENABLED;

export class WHIP {
  publish;
  client;
  videoRef;
  loaded;
  recorder;
  negotiateTimeout;
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

    let constraints = {
      video: {
        width: 1280,
        height: 720,
        // frameRate: { min: 20, ideal: 24, max: 24 },
      },
      audio: true,
    };

    // console.debug("[WHIP.init]", constraints);

    this.client
      .accessLocalMediaSources(constraints)
      .then((stream) => {
        this.client.localStream = stream;
        console.debug("[WHIP.init] stream", stream);

        this.videoRef.current.srcObject = stream;
        // this.recorder = new MediaRecorder(stream, {
        //   mimeType: "video/mp4",
        // });
        // this.recorder.start();
        // console.log("[WHIP] Recorder state", this.recorder.state);
      })
      .catch(console.error);

    peerConnection.addEventListener("negotiationneeded", async () => {
      console.log("[WHEP.peerConnection]", "negotiationneeded");

      await this.negotiate();
    });
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
      setTimeout(() => {
        if (this.client.peerConnection.connectionState == "connected") {
          return;
        }
        console.log(
          "[WHIP] There appears to be a problem communicating with the video server"
        );

        this.negotiateTimeout = setTimeout(() => {
          this.negotiate();
        }, 5000);
      }, 2000);

      this.client.peerConnection.onicegatheringstatechange = (evt) => {
        // console.log("test", evt.target.iceGatheringState);
        evt.target.iceGatheringState === "complete" && resolve("Done");
      };
    });
  }

  async connect() {
    let { peerConnection } = this.client;

    // console.debug("[Whip.connect]"); //peerConnection.localDescription.sdp
    let response;
    try {
      response = await fetch(this.publish, {
        method: "POST",
        mode: "cors",
        headers: { "content-type": "application/sdp" },
        body: peerConnection.localDescription.sdp,
      });
    } catch (e) {
      setTimeout(() => {
        this.connect();
      }, 6000);
    }

    let answerSDP = await response.text();

    if (response.status == 400) {
      console.log("answerSDP 400", answerSDP);
      return;
    }
    clearTimeout(this.negotiateTimeout);
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
  config;
  onstatechange;
  init(config?) {
    console.debug("[WHEP.init]");
    if (!config) {
      // this is a reload
      config = this.config;
      this.client.peerConnection.removeEventListener(
        "connectionstatechange",
        this.onstatechange
      );
    }

    this.config = config;
    let { play } = config.user;

    if (document.location.href.includes("test")) {
      play =
        "https://customer-aria4pdgkvgu9z0v.cloudflarestream.com/341f971987242898666f88c9bdd75cad/webRTC/play";
    }

    this.videoRef = config.videoRef;
    this.play = play;

    if (!play) {
      console.log("Awaiting play url");
      return;
    }

    this.client = new WHEPClient(play, this.videoRef.current);

    let { peerConnection } = this.client;

    let changeEvent = "connectionstatechange";

    this.onstatechange = async () => {
      let { connectionState: state } = peerConnection;

      console.debug("[WHEPClient.peerConnection][Video] state", state);

      if (config[state]) {
        config[state](this);
      }
    };

    this.client.peerConnection.addEventListener(
      changeEvent,
      this.onstatechange
    );

    this.client.peerConnection.addEventListener(
      "negotiationneeded",
      async () => {
        console.debug("[WHEP.init][Video]", "negotiationneeded");
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

    console.debug("[WHEP.connect][Video]");

    let response = await fetch(this.play, {
      method: "POST",
      mode: "cors",
      headers: { "content-type": "application/sdp" },
      body: peerConnection.localDescription.sdp,
    });

    let answerSDP = await response.text();
    if (response.status == 400) {
      console.debug("[WHEP.connect]", 400);
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
  live(playUrl) {
    this.play = playUrl;
    this.init();
  }
}

// export const setupWHIP = async (config) => {
//   console.log("[setupWHIP]");
//   let { publish } = config.user;

//   let streamClient = new WHIPClient(publish, config.videoRef.current);
//   (window as any).streamClient = streamClient;
// };
