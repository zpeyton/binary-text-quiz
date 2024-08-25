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
  publish;
  client;
  videoRef;

  init(config) {
    console.debug("[WHEP.init]");

    let { play } = config.user;
    this.videoRef = config.videoRef;
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
