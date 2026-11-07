import { ViewTransition } from "react";

/**
 * Myke overganger mellom sider, hentet fra Spotter. Malen (template) lages på nytt ved hvert sidebytte,
 * så den gamle siden tones ut og den nye glir inn. Selve animasjonene står i globals.css (::view-transition).
 * Nettlesere som ikke støtter dette, bytter side helt vanlig.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
