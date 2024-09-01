import React, { useEffect, useRef, useState } from "react";

export const Video = (props) => {
  let [videoLink, setVideoLink] = useState<any>();
  let recorder = useRef<any>();

  let configWhep = () => {};

  useEffect(() => {
    console.debug("[Video]", "[useEffect]", "no deps");

    //props.setVideo(true);

    if (props.whep.client) {
      console.debug("[Video] Update video element");
      props.whep.client.videoElement = props.videoEl.current;
    }

    if (props.user.type == "stream") {
      let whipConfig = {
        user: props.user,
        videoRef: props.videoRef,
        disconnected: () => {
          console.log("[WHIP] Reload after disconnect");
          window.location.reload();
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
        disconnected: () => {
          props.setVideo(false);
          //props.chatRef.current.serverDisconnected();
          window.location.reload();
        },
        connected: (whep) => {
          props.setVideo(true);
          // console.log(whep.client.stream);
          if (props.videoRef.current) {
            props.videoRef.current.srcObject = whep.client.stream;
            // props.videoRef.current.play();
            recorder.current = new MediaRecorder(whep.client.stream, {
              mimeType: "video/mp4",
            });

            recorder.current.start();
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
        console.log("REcorder.ondataavailable a", url, href);
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
  console.debug("[Video] render", props);

  return (
    <>
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
