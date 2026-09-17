
import DashboardTransition from "@/components/DashboardTransition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      <DashboardTransition>
        {children}
      </DashboardTransition>
    </div>
  );
}
