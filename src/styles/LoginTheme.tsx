import { createTheme } from "@aws-amplify/ui-react";

export const theme = createTheme({
  name: "purpleTheme",
  tokens: {
    colors: {
      brand: {
        primary: {
          100: { value: "#7A0081" },
          80: { value: "#8d3f92" },
          60: { value: "#b35cb7" },
          10: { value: "#f9e3fb" },
        },
      },
      font: {
        interactive: {
          value: "{colors.brand.primary.80.value}",
        },
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: "{colors.brand.primary.100.value}" },
          color: { value: "white" },
          _hover: {
            backgroundColor: { value: "{colors.brand.primary.80.value}" },
          },
          _active: {
            backgroundColor: { value: "{colors.brand.primary.60.value}" },
          },
        },
        link: {
          color: { value: "{colors.brand.primary.80.value}" },
          _hover: {
            color: { value: "{colors.brand.primary.100.value}" },
            backgroundColor: { value: "{colors.brand.primary.10.value}" },
          },
          _active: {
            color: { value: "{colors.brand.primary.100.value}" },
            backgroundColor: { value: "transparent" },
          },
        },
      },
    },
  },
  overrides: [
    {
      mediaQuery: "(prefers-color-scheme: dark)",
      tokens: {
        colors: {
          background: {
            primary: { value: "#2e2c33" },
            secondary: { value: "#1c1827" },
          },
          font: {
            primary: { value: "{colors.white.value}" },
            secondary: { value: "{colors.neutral.40.value}" },
          },
          border: {
            primary: { value: "{colors.neutral.80.value}" },
          },
          field: {
            control: {
              background: { value: "{colors.neutral.90.value}" },
              color: { value: "{colors.white.value}" },
              border: { value: "{colors.neutral.70.value}" },
            },
          },
        },
      },
    },
  ],
});
