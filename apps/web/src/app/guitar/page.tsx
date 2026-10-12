import { permanentRedirect } from "next/navigation";

export default function GuitarHomePage() {
  permanentRedirect("/songs");
}
