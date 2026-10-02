import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/giris" });

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|giris|kayit|api/auth).*)"],
};
