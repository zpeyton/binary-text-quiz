import React, {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { LegacyRef, useEffect, useRef, useState } from "react";
import {
  addFundsAPI,
  createPaymentAPI,
  getPaySessionAPI,
  sendTipAPI,
  STRIPE_PUBLISHABLE_KEY,
} from "./api";

import { Elements as StripeElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || "");

export const StripePaymentForm = (props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState();

  const handleError = (error) => {
    console.log("handleError", error);
    setErrorMessage(error);
  };

  const goback = (event) => {
    event.preventDefault();
    props.resetAddFunds();
  };

  const stripeSubmit = async (event) => {
    event.preventDefault();
    console.log("stripeSubmit");

    if (!elements || !stripe) {
      console.log("missing stripe hooks");
      return;
    }

    const { error: submitError } = await elements.submit();

    if (submitError) {
      handleError(submitError);
      return;
    }

    console.log("form is valid", props.amount);

    const { error, confirmationToken } = await stripe.createConfirmationToken({
      elements,
    });

    if (error) {
      handleError(error);
      setErrorMessage(error.toString() as any);
      return;
    }

    console.log("got token", confirmationToken);

    // send token to server to create payment intent

    let postBody = {
      confirmationToken: confirmationToken.id,
      customer: props.session.customerId,
      amount: props.amount * 100,
    };

    let res = await createPaymentAPI(postBody);
    if (res.status == "fail") {
      console.log(res.message);
      setErrorMessage(res.message);
      return;
    }

    console.log("[StripePaymentForm] payment intent", res.data.intent);
    console.log("[StripePaymentForm] payment new balance", res.data.newBalance);
    // success
    if (res.data.intent.status == "succeeded") {
      alert("Thank you for your order. Your account balance has been updated.");
      props.resetAddFunds(res.data.newBalance);
    }
  };

  return (
    <form className="stripe-form" onSubmit={stripeSubmit}>
      <h2 className="payment">Aloha {props.user.email}!</h2>
      <p className="amount">Let's add ${props.amount} to your account.</p>
      <PaymentElement />
      <button className="stripe-form-submit">Pay</button>{" "}
      <button className="" onClick={goback}>
        Back
      </button>
      {errorMessage && <div>{errorMessage}</div>}
    </form>
  );
};

export const PaymentUI = (props) => {
  let [stripeSession, setStripeSession] = useState<any>();
  let [stripeOptions, setStripeOptions] = useState<any>();

  let getPaymentSession = async () => {
    let res = await getPaySessionAPI();
    setStripeSession(res.data);
  };

  useEffect(() => {
    if (!props.user.type) {
      return; // user not set yet
    }
    // console.log("Use Effect PaymentUI");
    getPaymentSession();
  }, []);

  useEffect(() => {
    if (stripeSession) {
      console.log(stripeSession);
      const options = {
        mode: "payment",
        amount: props.amount * 100 || 2000,
        currency: "usd",
        paymentMethodCreation: "manual",
        customerSessionClientSecret:
          stripeSession.customerSession.client_secret,
        // Fully customizable with appearance API.
        appearance: {
          theme: "night",
          rules: {
            ".Error": {
              color: "#fff",
            },
          },
        },
      };
      setStripeOptions(options);
    }
  }, [stripeSession]);

  return (
    <>
      {stripeOptions ? (
        <StripeElements stripe={stripePromise} options={stripeOptions}>
          <StripePaymentForm
            amount={props.amount || 20}
            user={props.user}
            session={stripeSession}
            resetAddFunds={props.resetAddFunds}
          />
        </StripeElements>
      ) : null}
    </>
  );
};

export const AddFundsUI = (props) => {
  let inputAmountRef = useRef<HTMLInputElement>();
  let btnAddMoney = useRef<HTMLAnchorElement>();
  let [errors, setErrors] = useState<any>([]);
  let [updateCreditCard, setUpdateCreditCard] = useState<any>(false);

  const resetAddFunds = (balance) => {
    setErrors([]);
    setUpdateCreditCard(false);
    if (balance) {
      props.resetTips(balance);
    }
  };

  const amountKeyDown = async (event) => {
    let amount = event.currentTarget.value.replace(/\D/g, "");
    event.currentTarget.value = amount;

    if (event.keyCode == 13) {
      addMoney();
    }
  };

  useEffect(() => {
    if (btnAddMoney.current) {
      //btnAddMoney.current.click();
    }
  }, []);

  const addMoney = async () => {
    console.log("Add Money", inputAmountRef.current?.value);
    let amount = parseInt(
      inputAmountRef.current?.value.replace(/\D/g, "") || ""
    );
    console.log("Add Money", amount);
    if (!amount) {
      return;
    }

    let res = await addFundsAPI({ amount });

    if (res.status == "fail") {
      console.log("Add money failed");

      if (res.message == "Credit card failed") {
        setUpdateCreditCard(true);
        return;
      }
      setErrors([res]);
      return;
    }

    console.log("Add funds success");
    setErrors([]);
    // TODO: if they have a payment method
    // we can reset the amount here props.resetTips();

    // update tips UI
    //chatRef.current.get();
  };

  return (
    <>
      {updateCreditCard ? (
        <PaymentUI
          resetAddFunds={resetAddFunds}
          user={props.user}
          amount={inputAmountRef.current?.value}
        />
      ) : null}
      {!updateCreditCard &&
        errors.map((error, index) => {
          return <span key="index">! {error.message}</span>;
        })}{" "}
      {errors.length ? null : (
        <>
          <input
            name="amount"
            placeholder="Enter an amount, say $20"
            // defaultValue="20"
            onKeyDown={amountKeyDown}
            maxLength={3}
            ref={inputAmountRef as LegacyRef<HTMLInputElement> | undefined}
          />{" "}
          <a
            ref={btnAddMoney as LegacyRef<HTMLAnchorElement> | undefined}
            onClick={addMoney}
          >
            $
          </a>
        </>
      )}
    </>
  );
};

export const TipUI = (props) => {
  let btnSendTip = useRef<HTMLAnchorElement>();
  let inputAmountRef = useRef<HTMLInputElement>();
  let [errors, setErrors] = useState<any>([]);
  let [noMoney, setNoMoney] = useState<any>();
  let [balance, setBalance] = useState<any>(props.user.balance);

  const resetTips = (balance) => {
    setErrors([]);
    setNoMoney(false);
    setBalance(balance);
  };

  const amountKeyDown = async (event) => {
    let amount = event.currentTarget.value.replace(/\D/g, "");
    event.currentTarget.value = amount;

    if (event.keyCode == 13) {
      sendTip();
    }
  };

  useEffect(() => {
    if (btnSendTip.current) {
      //btnSendTip.current.click();
    }
    if (!balance) {
      // setNoMoney(true);
      // setErrors([{}]);
    }
  }, []);

  const sendTip = async () => {
    console.debug("Send Tip!");
    // chatRef.current.get();
    if (!props.user.balance) {
      setNoMoney(true);
      setErrors([{}]);
      props.chatRef.current.toggleTwoevencols();
      return;
    }
    if (!inputAmountRef.current) {
      console.log("No inputAmountRef");
      return;
    }

    let amount = parseInt(inputAmountRef.current?.value);

    if (!amount) {
      console.log("Invalid amount");
      return;
    }

    inputAmountRef.current.value = amount.toString();

    let res = await sendTipAPI({ amount });

    if (res.status == "fail") {
      console.log("Send Tip failed");
      if (res.message == "No money") {
        setNoMoney(true);
        props.chatRef.current.toggleTwoevencols();
      }

      setErrors([res]);
      return;
    }

    if (res.status == "OK") {
      // reload chat
      setBalance(res.data.newBalance);
      props.chatRef.current.get();
      return;
    }
  };

  return (
    <div>
      {!noMoney &&
        errors.map((error, index) => {
          return <span key="index">! {error.message}</span>;
        })}
      {noMoney ? <AddFundsUI resetTips={resetTips} user={props.user} /> : null}
      {errors.length ? null : (
        <>
          <a
            ref={btnSendTip as LegacyRef<HTMLAnchorElement> | undefined}
            onClick={sendTip}
          >
            $
          </a>
          <input
            name="tip-amount"
            placeholder={"Tip $1 " + `/ $${balance || 0}`}
            // defaultValue="1"
            // type="number"
            maxLength={3}
            onKeyDown={amountKeyDown}
            ref={inputAmountRef as LegacyRef<HTMLInputElement> | undefined}
          />
        </>
      )}
    </div>
  );
};
