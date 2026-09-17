import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Create an institutional account to start issuing certificates.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
