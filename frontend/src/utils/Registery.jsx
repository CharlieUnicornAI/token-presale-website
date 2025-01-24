import React, { useState, useEffect } from "react";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

const StyledComponentsRegistry = ({ children }) => {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useEffect(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    document.head.appendChild(styles);

    return () => {
      document.head.removeChild(styles);
    };
  }, [styledComponentsStyleSheet]);

  if (typeof window !== "undefined") return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
};

export default StyledComponentsRegistry;
