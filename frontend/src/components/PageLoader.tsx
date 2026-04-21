import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/logo1.jpg";

export default function PageLoader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    if (timerRef.current) clearTimeout(timerRef.current);

    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="page-loader">
      <div className="page-loader-ring">
        <svg viewBox="0 0 148 148" xmlns="http://www.w3.org/2000/svg">
          <circle cx="74" cy="74" r="70" />
        </svg>
        <img src={logo} alt="The Slow Bean" />
      </div>
      <span className="page-loader-brand">The Slow Bean</span>
    </div>
  );
}
