const rawPhone = import.meta.env.VITE_SUPPORT_PHONE || "254100619652";

export const SUPPORT_PHONE = rawPhone.replace(/\D/g, "");

export const SUPPORT_DISPLAY_PHONE =
  SUPPORT_PHONE === "254100619652"
    ? "+254 100 619652"
    : `+${SUPPORT_PHONE}`;

export const SUPPORT_TEL = `+${SUPPORT_PHONE}`;

export function whatsappSupport(message = "Hello NITUME, I need help.") {
  return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;
}
