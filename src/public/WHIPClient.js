import negotiateConnectionWithClientOffer from "./negotiateConnectionWithClientOffer.js";

/**
 * Example implementation of a client that uses WHIP to broadcast video over WebRTC
 *
 * https://www.ietf.org/archive/id/draft-ietf-wish-whip-01.html
 */
export default class WHIPClient {
  constructor(endpoint, videoElement) {
    this.endpoint = endpoint;
    this.videoElement = videoElement;
    this.device;
    /**
     * Create a new WebRTC connection, using public STUN servers with ICE,
     * allowing the client to disover its own IP address.
     * https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols#ice
     */
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.cloudflare.com:3478",
        },
      ],
      bundlePolicy: "max-bundle",
    });
    /**
     * Listen for negotiationneeded events, and use WHIP as the signaling protocol to establish a connection
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/negotiationneeded_event
     * https://www.ietf.org/archive/id/draft-ietf-wish-whip-01.html
     */
    this.peerConnection.addEventListener("negotiationneeded", async (ev) => {
      console.log("[WHIPClient] Connection negotiation starting");
      await negotiateConnectionWithClientOffer(
        this.peerConnection,
        this.endpoint
      );
      console.log("[WHIPClient] Connection negotiation ended");
    });
    /**
     * While the connection is being initialized,
     * connect the video stream to the provided <video> element.
     */
    this.accessLocalMediaSources()
      .then((stream) => {
        this.localStream = stream;
        videoElement.srcObject = stream;
      })
      .catch(console.error);
  }

  /**
   * Ask for camera and microphone permissions and
   * add video and audio tracks to the peerConnection.
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
   */

  async getBackCamera() {
    // get back camera deviceId
    let devices = await navigator.mediaDevices.enumerateDevices();
    //

    let backCameraDevice = devices.find((device) => {
      return device.label == "Back Camera";
    });

    return backCameraDevice;
  }

  async getVideoTranciever() {
    let videoTranciever = this.peerConnection.getTransceivers().find((item) => {
      return item.sender.track.kind == "video";
    });

    return videoTranciever;
  }

  async switchCamera(videoRef) {
    let currentDevice = this.device;
    console.log("[WHIPClient.switchCamera] currently", currentDevice);

    // let backCamera = await this.getBackCamera();

    let constraints = { video: { height: 720, width: 1280 }, audio: true };

    if (currentDevice == "Front Camera") {
      //constraints.video.deviceId = backCamera.deviceId;
      constraints.video.facingMode = "environment";
      this.device = "Back Camera";
    } else {
      this.device = "Front Camera";
      constraints.video.facingMode = "user";
    }

    // console.log("[switchCamera] constraints", constraints);

    let stream = await navigator.mediaDevices.getUserMedia(constraints);

    // console.log("new Stream", stream);

    stream.getTracks().forEach(async (track) => {
      // console.log("getTracks track", track.label);
      let videoTranciever = await this.getVideoTranciever();

      if (track.label.indexOf("Camera") > -1) {
        // console.log("track label", track.label);
        // console.log("videoTranciever", videoTranciever);
        // const transceiver = this.peerConnection.addTransceiver(track, {
        //   /** WHIP is only for sending streaming media */
        //   direction: "sendonly",
        // });
        console.log("Replace Track", this.device);

        videoTranciever.sender.replaceTrack(track);

        videoTranciever.sender.track.applyConstraints({
          width: 1280,
          height: 720,
        });

        //this.peerConnection.removeTrack(videoTranciever.sender);
        //this.peerConnection.addTrack(track);

        // videoTranciever.sender.track.applyConstraints({
        //   deviceId: backCamera.deviceId,
        // });
      }
    });

    this.localStream = stream;

    this.videoElement = videoRef.current;
    this.videoElement.srcObject = stream;

    console.debug("[WHIPClient] Video Element", this.videoElement);
  }

  /**
   * Ask for camera and microphone permissions and
   * add video and audio tracks to the peerConnection.
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
   */

  async accessLocalMediaSources() {
    return navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => {
          // console.log(track.label);
          const transceiver = this.peerConnection.addTransceiver(track, {
            /** WHIP is only for sending streaming media */
            direction: "sendonly",
          });

          if (track.kind == "video" && transceiver.sender.track) {
            this.device = track.label;
            transceiver.sender.track.applyConstraints({
              width: 1280,
              height: 720,
            });
          }
        });
        return stream;
      });
  }
  /**
   * Terminate the streaming session
   * 1. Notify the WHIP server by sending a DELETE request
   * 2. Close the WebRTC connection
   * 3. Stop using the local camera and microphone
   *
   * Note that once you call this method, this instance of this WHIPClient cannot be reused.
   */
  async disconnectStream() {
    var _a;
    console.log("disconnectStream");
    try {
      const response = await fetch(this.endpoint, {
        method: "DELETE",
        mode: "cors",
      });
    } catch (e) {
      console.log(e);
    }

    console.log("disconnectStream before peer connection close");
    this.peerConnection.close();
    (_a = this.localStream) === null || _a === void 0
      ? void 0
      : _a.getTracks().forEach((track) => {
          console.log("disconnectStream in track");

          track.stop();
        });
  }
}
