import React from "react";
import { Providers } from "@/store/providers";
import MyApp from "./app";
import "./global.css";
import { DynamicRouter } from "./components/navigation/DynamicRouter";


export const metadata = {
  title: "MaterialPro StarterKit",
  description: "MaterialPro  kit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <MyApp>
            <DynamicRouter />
            {children}
          </MyApp>
        </Providers>
      </body>
    </html>
  );
}
