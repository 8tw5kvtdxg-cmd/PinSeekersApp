import { LogOut } from "lucide-react";

export function AdminLogoutForm() {
  return (
    <form action="/api/admin/logout" method="post">
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-5 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
        type="submit"
      >
        <LogOut size={18} /> Logout
      </button>
    </form>
  );
}

