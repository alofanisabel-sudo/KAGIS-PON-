"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Package, Users, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/reunions", label: "Réunions", icon: Users },
  { href: "/parametres", label: "Réglages", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#111113] border-t border-border flex justify-around py-3 pb-5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-1">
            <Icon size={19} color={active ? "#C9A227" : "#5A5A60"} />
            <span
              className="font-mono text-[9px] tracking-wide"
              style={{ color: active ? "#C9A227" : "#5A5A60" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
   }
