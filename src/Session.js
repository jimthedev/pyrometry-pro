import * as React from "react";

let SessionContext = React.createContext();

function SessionProvider(props) {
  // [B]

  return (
    <SessionContext.Provider value={props.value}>
      {props.children}
    </SessionContext.Provider>
  );
}

let SessionConsumer = SessionContext.Consumer;

// [C]
export { SessionContext, SessionProvider, SessionConsumer };
