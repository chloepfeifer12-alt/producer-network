import type { Metadata } from "next";
import { InsiderFront } from "@/components/insider/insider-front";

export const metadata: Metadata = {
  title: "The Insider",
  description: "Field notes on careers, craft and leadership from across insurance and financial services. All Insider content is fictional demo editorial.",
};

export default function InsiderPage() {
  return <InsiderFront />;
}
