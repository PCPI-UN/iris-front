"use client";

import { usePathname } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Gradient - exact copy from landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="parallax-slow absolute top-0 left-0 w-[150%] h-[150%]"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, oklch(0.75 0.15 195 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, oklch(0.82 0.18 330 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, oklch(0.88 0.16 85 / 0.1) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-black/20 backdrop-blur-sm border-b border-white/5 sticky top-0 z-40">
            <div className="flex items-center justify-between w-full gap-2 px-4">
              {/* Simplified breadcrumb - hide on mobile */}
              <div className="hidden md:block">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/app">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              {/* Mobile: Show app name with left padding to avoid menu button */}
              <div className="md:hidden pl-18">
                <h2 className="text-lg font-semibold">Iris</h2>
              </div>
              {/* Desktop sidebar trigger */}
              <div className="hidden md:block ml-auto">
                <SidebarTrigger />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-x-auto w-[85vw] justify-center items-start self-center p-0">
            <div className="w-full p-4 sm:p- md:p-8 lg:p-12 xl:p-16 2xl:p-20 self-center">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

function Fallback({ error }: { error: Error }) {
  return <p>Error: {error.message ?? "Something went wrong!"}</p>;
}

export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  return (
    <Layout>
      <ErrorBoundary key={pathname} FallbackComponent={Fallback}>
        {children}
      </ErrorBoundary>
    </Layout>
  );
};
