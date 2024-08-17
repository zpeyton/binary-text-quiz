import { Context } from "react";
import { createStoreHook, ReactReduxContextValue, useStore } from "react-redux";
const initialState = {
  globalVariable: "Hello, global!",
};

function reducer(state = initialState, action) {
  // reducer logic...
  const getState = () => {
    return state;
  };
}

// const store = createStoreHook(
//   reducer as Context<ReactReduxContextValue<unknown | AnyAction>>
// );

// export default store;
