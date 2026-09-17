import type { Metadata } from "next";
import ValidateSearchClient from "./ValidateSearchClient";

export const metadata: Metadata = {
  title: "Verify Credential",
  description: "Verify the authenticity of a digital certificate.",
};

export default function ValidatePage() {
  return <ValidateSearchClient />;
}
