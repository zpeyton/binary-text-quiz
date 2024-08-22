import React, { LegacyRef, useEffect, useRef, useState } from "react";
import { Quiz } from "./components/quiz";
// import WHEPClient from "./components/WHEPClient";
//import WHIPClient from "./components/WHIPClient";

const waitVideoState = async () => {
  return await new Promise((resolve, reject) => {
    let interval = setInterval(() => {
      let videoState = localStorage.getItem("videoState");
      if (videoState && videoState === "connected") {
        clearInterval(interval);
        resolve(true);
      }
    }, 100);
  });
};

export const App = () => {
  let publishURL =
    "https://customer-aria4pdgkvgu9z0v.cloudflarestream.com/c29c3af7da2b64a561ccffac37aedbeek0dbe52278517838e32dbff6f59cc3e82/webRTC/publish";
  let videoElementStream = useRef<HTMLVideoElement>();
  let videoElementView = useRef<HTMLVideoElement>();
  //let videoState = localStorage.removeItem("videoState");
  const playbackURL =
    "https://customer-aria4pdgkvgu9z0v.cloudflarestream.com/0dbe52278517838e32dbff6f59cc3e82/webRTC/play";

  // console.log("video stream");
  let [video, setVideo] = useState(false);
  let getVideoState = async () => {
    let videoState: any = localStorage.getItem("videoState");
    if (videoState !== "connected") {
      videoState = await waitVideoState();
    }
    console.log("APP", videoState);
    setVideo(true);
    localStorage.removeItem("videoState");
    return videoState;
  };
  useEffect(() => {
    getVideoState();

    //   if (videoElementStream.current) {
    //     console.log("video stream current");
    //     let whip = new WHIPClient(publishURL, videoElementStream.current);
    //   }
    // const videoElementView = document.getElementById("remote-video");
    // if (videoElementView.current) {
    //   (window as any).whepClient = new WHEPClient(
    //     playbackURL,
    //     videoElementView.current
    //   );
    // }
  }, []);

  return (
    <>
      <Quiz />
      {/* <h4>Broadcasting video using WHIP</h4> */}
      {/* <video ref={videoElementStream as LegacyRef<HTMLVideoElement>}></video> */}
      {/* <video ref={videoElementView as LegacyRef<HTMLVideoElement>}></video> */}
    </>
  );
};
