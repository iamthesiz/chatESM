import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useState, useEffect } from "react";

import { global as globalStyles } from "../shared/styles";
import { Global } from "@emotion/react";

const cache = createCache({ key: "next" });

const Hydrated = ({ children }) => {
  const [hydration, setHydration] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHydration(true);
    }
  }, []);
  return hydration ? children : null;
};

const App = ({ Component, pageProps }) => (
  <CacheProvider value={cache}>
    <Global styles={globalStyles} />
    <Hydrated>
      <Component {...pageProps} />
    </Hydrated>
  </CacheProvider>
);

export default App;
