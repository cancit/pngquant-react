import * as React from "react";
import { createMuiTheme, ThemeProvider, colors } from "@material-ui/core";
import App from "./App";

export default function () {
  const theme = createMuiTheme({
    palette: {
      type: "dark",
      primary: colors.green,
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
}
