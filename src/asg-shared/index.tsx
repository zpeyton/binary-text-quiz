import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { LoginUI, SignupUI } from "./auth";
import { Video } from "../asg-shared/video";
import * as Icons from "./icons";
import WS from "./websocket/websocket";
import { Routes } from "./routes";
import { WHIP, WHEP } from "./webrtc";
import { WebSocketChat } from "./websocket-chat";
import { TipUI } from "./tips";

import { loadStripe } from "@stripe/stripe-js";

import {
  PaymentElement,
  useElements,
  useStripe,
  Elements as StripeElements,
} from "@stripe/react-stripe-js";

const whip = new WHIP();
const whep = new WHEP();

let dev = process.env.STRIPE_PUBLISHABLE_KEY_DEV;
let prod = process.env.STRIPE_PUBLISHABLE_KEY_PROD;

let PROD = process.env.NODE_ENV == "production";

const STRIPE_PUBLISHABLE_KEY = PROD ? prod : dev;

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || "");

export {
  React,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  WS,
  Routes,
  whip,
  whep,
  Icons,
  LoginUI,
  SignupUI,
  Video,
  WebSocketChat,
  TipUI,
  stripePromise,
  PaymentElement,
  useElements,
  useStripe,
  StripeElements,
};
