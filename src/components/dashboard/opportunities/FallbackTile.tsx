import { selectCoverStyle } from "./cover-styles/selectCoverStyle";
import { StyleA, StyleB, StyleC, StyleD } from "./cover-styles";

interface Props {
  type: string;
  organisation: string;
  location_country: string;
  title?: string | null;
  logoUrl?: string | null;
}

export default function FallbackTile(props: Props) {
  const style = selectCoverStyle(props.type);
  switch (style) {
    case "A": return <StyleA {...props} />;
    case "B": return <StyleB {...props} />;
    case "C": return <StyleC {...props} />;
    case "D": return <StyleD {...props} />;
    default: return <StyleA {...props} />;
  }
}
