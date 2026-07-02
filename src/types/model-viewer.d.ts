import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        "camera-controls"?: boolean | "";
        "touch-action"?: string;
        "auto-rotate"?: boolean | "";
        "shadow-intensity"?: string;
        exposure?: string;
        "environment-image"?: string;
      };
    }
  }
}
