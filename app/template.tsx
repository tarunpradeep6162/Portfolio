import { RouteTransition } from "@/components/shared/RouteTransition";

export default function Template({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}
