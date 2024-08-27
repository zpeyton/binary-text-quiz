import WHEPClient from "../../public/WHEPClient";
import WHIPClient from "../../public/WHIPClient";

export const VIDEO_ENABLED = process.env.VIDEO_ENABLED;

export class WHIP {
  publish;
  client;
  videoRef;

  init(config) {
    let { publish } = config.user;
    this.videoRef = config.videoRef;
    if (!this.videoRef) {
      console.log("[WHIP] No Video ref");
      return;
    }

    this.client = new WHIPClient(publish, this.videoRef.current);

    let { peerConnection } = this.client;

    let changeEvent = "connectionstatechange";

    peerConnection.addEventListener(changeEvent, async () => {
      let { connectionState: state } = peerConnection;

      console.debug("[WHIPClient.peerConnection] state", state);

      if (config[state]) {
        config[state](this);
      }
    });
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

    peerConnection.addEventListener(changeEvent, async () => {
      let { connectionState: state } = peerConnection;

      console.debug("[WHEPClient.peerConnection] state", state);

      if (config[state]) {
        config[state](this);
      }
    });

    this.client.peerConnection.addEventListener("negotiationneeded", () => {
      const offer = this.client.peerConnection.createOffer();
      this.client.peerConnection.setLocalDescription(offer);
      this.ofr = offer;
    });

    peerConnection.onicegatheringstatechange = (event) => {
      if (event.target.iceGatheringState === "complete") {
        this.loadVideo();
      }
    };
  }

  async loadVideo() {
    console.log("loadVideo");

    let response = await fetch(this.play, {
      method: "POST",
      mode: "cors",
      headers: { "content-type": "application/sdp" },
      body: this.ofr.sdp,
    });

    let answerSDP = await response.text();

    if (response.status) {
      return;
    }
    await this.client.peerConnection.setRemoteDescription(
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
