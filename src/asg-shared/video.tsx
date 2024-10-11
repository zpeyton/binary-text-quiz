import { faVolumeHigh, faVolumeMute } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";

export const Video = (props) => {
  let [videoLink, setVideoLink] = useState<any>();
  let recorder = useRef<any>();
  let [byteRate, setByteRate] = useState(0);
  let [muted, setMuted] = useState<any>(true);

  let configWhep = () => {};

  const toggleVolume = (event) => {
    event.preventDefault();

    if (!props.videoRef.current) {
      return;
    }
    console.log("props.videoRef.current", props.videoRef.current);
    // event.currentTarget = text;

    props.videoRef.current.muted = props.videoRef.current.muted ? false : true;
    setMuted(props.videoRef.current.muted);
  };

  const toggleCamera = (event) => {
    props.whip.client.switchCamera(props.videoRef);
  };

  useEffect(() => {
    console.debug("[Video]", "[useEffect]", "no deps");

    //props.setVideo(true);

    if (props.whep.client) {
      console.debug("[Video] Update video element");
      props.whep.client.videoElement = props.videoRef.current;
    }

    if (props.user.type == "stream") {
      let whipConfig = {
        user: props.user,
        videoRef: props.videoRef,
        disconnected: (whip) => {
          console.log("[WHIP] Reload after disconnect");
          //window.location.reload();
          whip.negotiate();
        },
        connected: (whip) => {
          console.debug("[Whip] connected");
          props.setVideo(true);
          let { api } = props.webSocket.current;
          api.Video.send({ live: true });
        },
      };

      props.whip.init(whipConfig);

      // done with Whip!
    } else {
      let whepConfig = {
        user: props.user,
        videoRef: props.videoRef,
        disconnected: (whep) => {
          props.setVideo(false);
          //props.chatRef.current.serverDisconnected();
          whep.init();
        },
        connected: (whep) => {
          props.setVideo(true);
          // console.log(whep.client.stream);
          if (props.videoRef.current) {
            props.videoRef.current.srcObject = whep.client.stream;
            //props.videoRef.current.play();
            recorder.current = new MediaRecorder(whep.client.stream, {
              mimeType: "video/mp4",
            });
            recorder.current.start();
            // @ts-ignore
            window.whep = whep;
            // whep.startTime = new Date();
            // clearInterval(whep.byteRateInterval);
            // whep.byteRateInterval = setInterval(async () => {
            //   let stats = await whep.client.peerConnection.getStats();
            //   let totalBytesReceived = stats.get("T01").bytesReceived;
            //   let totalTimeElapsed =
            //     moment(new Date()).diff(whep.startTime) / 1000;
            //   let byteRate = totalBytesReceived / totalTimeElapsed;
            //   let bytRateRound = Math.round(byteRate / 1000);
            //   // console.log("byteRate", Math.round(byteRate / 1000), "KB/s");
            //   setByteRate(bytRateRound);
            // }, 1000);
          }
        },
      };
      props.whep.init(whepConfig);
    }
  }, []);

  const saveVideo = (event) => {
    event?.preventDefault();
    console.debug("[Video] saveVideo");
    let { current: videoRecorder } = recorder;

    videoRecorder.stop();

    videoRecorder.ondataavailable = (e) => {
      console.log("Recorder.ondataavailable");
      let a = () => {
        let url = ["video_", (new Date() + "").slice(4, 28), ".mp4"].join("");
        let href = URL.createObjectURL(e.data);
        console.log("Recorder.ondataavailable a", url, href);
        videoRecorder.start();
        return (
          <a download={url} href={href}>
            {url}
          </a>
        );
      };

      setVideoLink(a());
    };
  };
  // console.debug("[Video] render", props);

  return (
    <>
      {/* {byteRate} KB/s
      <br /> */}
      {props.user.type != "stream" ? (
        <a className="volume-toggle" onClick={toggleVolume}>
          {muted ? (
            <FontAwesomeIcon icon={faVolumeMute} />
          ) : (
            <FontAwesomeIcon icon={faVolumeHigh} />
          )}
        </a>
      ) : (
        <button className="camera-toggle" onClick={toggleCamera}>
          Switch Camera
        </button>
      )}
      <video
        ref={props.videoRef as any}
        id="watch"
        autoPlay={true}
        // controls={true}
        playsInline={true}
        style={props.user.type == "stream" ? { transform: "scale(-1, 1)" } : {}}
        muted={true}
      ></video>
      {props.user.username == "testuser" ? (
        <>
          <a onClick={saveVideo} href="#">
            Record Stop
          </a>{" "}
          Link: {videoLink}
        </>
      ) : null}
      <img
        className="water-mark"
        src="https://alohasurfgirls.com/alohasurfgirls.png"
      />
      {props.video ? null : (
        <>
          <div className="loading-video">
            <h2 className="payment">Loading video...</h2>
          </div>
        </>
      )}
    </>
  );
};
