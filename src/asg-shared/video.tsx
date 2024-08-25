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
  let [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.debug("[Video] useEffect no deps", loaded);

    if (props.whep.client) {
      console.debug("[Video] Update video element");
      props.whep.client.videoElement = props.videoEl.current;
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    console.debug("[Video][useEffect] Loaded", loaded);
    //props.setVideo(true);
    if (loaded) {
      if (props.user.type == "stream") {
        //setupWHIPClient();
        let whipConfig = {
          user: props.user,
          videoRef: props.videoRef,
          disconnected: () => {
            props.setVideo(false);
          },
          connected: (whip) => {
            props.setVideo(true);
            if (props.videoRef.current) {
              props.videoRef.current.srcObject = whip.client.localStream;
              //videoEl.current.play();
            }
          },
        };
        props.whip.init(whipConfig);
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
    }
  }, [loaded]);

  console.debug("[Video] render", props);

  return (
    <>
      <video
        ref={props.videoRef as LegacyRef<HTMLVideoElement> | undefined}
        id="watch"
        autoPlay={true}
        // controls={true}
        playsInline={true}
        // style={video ? {} : { height: "1px" }}
        muted={props.user.type == "stream" ? true : false}
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
