import { createTheme } from "@aws-amplify/ui-react";

export const theme = createTheme({
  name: "purpleTheme",
  tokens: {
    colors: {
      brand: {
        primary: {
          100: "#7A0081",
          80: "#8d3f92",
          60: "#b35cb7",
          10: "#f9e3fb",
        },
      },
      font: {
        interactive: {
          value: "#{colors.brand.primary.80}",
        },
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: "{colors.brand.primary.100}" },
          color: { value: "white" },
          _hover: {
            backgroundColor: { value: "{colors.brand.primary.80}" },
          },
          _active: {
            backgroundColor: { value: "{colors.brand.primary.60}" },
          },
        },
        link: {
          color: { value: "{colors.brand.primary.80}" },
          _hover: {
            color: { value: "{colors.brand.primary.100}" },
            backgroundColor: { value: "{colors.brand.primary.10}" },
          },
          _active: {
            color: { value: "{colors.brand.primary.100}" },
            backgroundColor: { value: "transparent" },
          },
        },
      },
    },
  },
});
