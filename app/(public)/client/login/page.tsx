"use client";

import { Suspense } from "react";
import { ClientLoginForm } from "./client-login-form";

export default function ClientLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientLoginForm />
    </Suspense>
  );
}

