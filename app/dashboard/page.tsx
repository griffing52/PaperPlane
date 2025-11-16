// // app/dashboard/page.tsx
// "use client";
// import { useAuth } from "@/context/AuthContext";

// export default function DashboardPage() {
  
//     const { user, loading } = useAuth();
//     if (loading) return <div>Loading…</div>;
//     if (!user) return <div>Please sign in</div>;

  
//     return (
//       <div>Secret dashboard content</div>
//   );
// }

"use client";
import { useAuth } from "@/context/AuthContext";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading…</div>;
  if (!user) return <div>Not signed in</div>; // or redirect with your Protected wrapper

  return (
    <main className="p-6">
      <h1 className="text-xl mb-4" >Welcome, {user.email}</h1>
      <LogoutButton />
    </main>
  );
}



