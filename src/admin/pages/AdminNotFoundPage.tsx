import { ComingSoon } from "../components/ComingSoon";

export default function AdminNotFoundPage() {
  return (
    <ComingSoon
      title="Page not found"
      phase="404"
      description="That admin page doesn't exist."
      backTo="/admin"
      backLabel="Back to dashboard"
    />
  );
}
