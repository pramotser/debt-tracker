import * as React from "react";

import { Input } from "@/components/ui/input";

type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode"
> & {
  /** อนุญาตจุดทศนิยม (จำนวนเงิน) · false = จำนวนเต็มล้วน — default true */
  decimal?: boolean;
};

/**
 * Input ตัวเลขกลางของแอป — drop-in แทน <Input type="number">
 * ใช้ type="text" + inputMode เพื่อ:
 * - ตัดลูกศร spinner ขึ้น/ลง ของ type="number" บน desktop
 * - mobile ขึ้นแป้นตัวเลขล้วน (decimal → มีจุดทศนิยม · numeric → จำนวนเต็ม)
 * - กันอักขระที่ไม่ใช่ตัวเลข (e, +, -, ตัวอักษร) ตั้งแต่พิมพ์
 * value / onChange ใช้แบบเดียวกับ <Input> ปกติ
 */
function NumberInput({ decimal = true, onChange, ...props }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    const valid = next === "" || (decimal ? /^\d*\.?\d*$/ : /^\d*$/).test(next);
    if (valid) onChange?.(e);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      onChange={handleChange}
    />
  );
}

export { NumberInput };
