import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import moment from "moment";
import { LoginUI, SignupUI, AuthUI } from "./auth";
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

let PRODUCTION = process.env.NODE_ENV == "production";

const STRIPE_PUBLISHABLE_KEY = PRODUCTION ? prod : dev;

const DEFAULT_EMAIL = PRODUCTION ? "" : "test@user.com";
const DEFAULT_USERNAME = PRODUCTION ? "" : "testuser";
const DEFAULT_PASSWORD = PRODUCTION ? "" : "1234";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || "");

const bundleUrl = `${document.location.href}asg.bundle-${process.env.VERSION}.js`;

const cloudflareSubDomain = "customer-aria4pdgkvgu9z0v.cloudflarestream.com";

const fetchLastModified = async (url) => {
  try {
    const res = await fetch(url, { method: "GET" });
    let lastModified = res.headers.get("Last-Modified") || 0;
    return new Date(lastModified);
  } catch (e) {
    console.log("Could not get last modified header");
    return 0;
  }
  // console.log("lastModifiedHeader", lastModified);
};

const shouldUpdate = async (url, loadDate) => {
  let lastModified = await fetchLastModified(url);
  let momentLM = moment(lastModified);
  let shouldUpdate = momentLM.isSameOrAfter(loadDate);
  if (shouldUpdate) {
    console.log("shouldUpdate", shouldUpdate);
    return true;
  }

  return false;
};

const reloadNoCache = () => {
  // @ts-ignore this depricated but works still
  // who knows why it is depricated because caches doesn't work
  window.location.reload(true);
};

const checkBundleUpdate = async (loadDate) => {
  let updateBundle = await shouldUpdate(bundleUrl, loadDate);
  if (updateBundle) {
    reloadNoCache();
    return true;
  }
  return false;
};

const logout = async () => {
  localStorage.removeItem("authToken");
  window.location.reload();
};

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
  AuthUI,
  Video,
  WebSocketChat,
  TipUI,
  stripePromise,
  PaymentElement,
  useElements,
  useStripe,
  StripeElements,
  PRODUCTION,
  shouldUpdate,
  bundleUrl,
  reloadNoCache,
  checkBundleUpdate,
  logout,
  DEFAULT_EMAIL,
  DEFAULT_USERNAME,
  DEFAULT_PASSWORD,
  cloudflareSubDomain,
};
