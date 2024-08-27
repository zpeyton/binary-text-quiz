import React from "react";

export class Timer {
  timeout;
  delay = 2000;
  count = 0;
  name;
  callback = () => {
    console.log("Tick");
  };

  constructor(config) {
    for (let i in config) {
      this[i] = config[i];
    }

    let tick = () => {
      console.debug(this.name, "tick", this.count);
      this.count++;
      this.callback();
      this.timeout = setTimeout(tick, this.delay);
    };

    tick();
  }

  clear() {
    clearTimeout(this.timeout);
  }
}

export const TimerEl = (props) => {
  // console.log("Timer El");

  if (window[props.name + "Timer"]) {
    window[props.name + "Timer"].clear();
  }

  window[props.name + "Timer"] = new Timer(props);

  return <></>;
};
