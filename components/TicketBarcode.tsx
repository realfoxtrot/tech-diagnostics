"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

/** Штрих-код (Code128) по номеру обращения — инженер сканирует. */
export default function TicketBarcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        displayValue: false,
        width: 1.6,
        height: 48,
        margin: 0,
        background: "transparent",
        lineColor: "currentColor",
      });
    } catch {
      // невалидный номер — тихо пропускаем
    }
  }, [value]);

  return <svg ref={ref} className="max-w-full" role="img" aria-label={`Штрих-код ${value}`} />;
}
