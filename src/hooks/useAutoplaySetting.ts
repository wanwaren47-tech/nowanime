import { useEffect, useState } from "react";
import { getAutoplayEnabled, setAutoplayEnabled } from "@/lib/autoplay";

export function useAutoplaySetting(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState<boolean>(() => getAutoplayEnabled());
  useEffect(() => {
    const handler = () => setOn(getAutoplayEnabled());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  const update = (v: boolean) => {
    setAutoplayEnabled(v);
    setOn(v);
  };
  return [on, update];
}
