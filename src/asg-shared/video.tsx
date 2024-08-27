import React, {
  forwardRef,
  LegacyRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { WHEP, WHIP } from "./webrtc";

export const Video = (props) => {
  useEffect(() => {
    // console.debug("[Video]", "[useEffect]", "no deps");

    //props.setVideo(true);

    if (props.whep.client) {
      console.debug("[Video] Update video element");
      props.whep.client.videoElement = props.videoEl.current;
    }

    if (props.user.type == "stream") {
      let whipConfig = {
        user: props.user,
        videoRef: props.videoRef,
        // disconnected: () => {
        //   props.setVideo(false);
        // },
        connected: (whip) => {
          console.debug("[Whip] connected");
          props.setVideo(true);
          props.webSocket.current.send({ live: true });
        },
      };

      props.whip.init(whipConfig);

      // done with Whip
    } else {
      let whepConfig = {
        user: props.user,
        videoRef: props.videoRef,
        disconnected: () => {
          // setVideo(false);
          window.location.reload();
        },
        connected: (whep) => {
          props.setVideo(true);
          if (props.videoRef.current) {
            props.videoRef.current.srcObject = whep.client.stream;
            props.videoRef.current.play();
          }
        },
      };
      props.whep.init(whepConfig);
    }
  }, []);

  // console.debug("[Video] render", props);

  return (
    <>
      <video
        ref={props.videoRef as LegacyRef<HTMLVideoElement> | undefined}
        id="watch"
        autoPlay={true}
        // controls={true}
        playsInline={true}
        style={props.user.type == "stream" ? { transform: "scale(-1, 1)" } : {}}
        muted={true}
      ></video>
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
