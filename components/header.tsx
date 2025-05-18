"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()

  // Check if current page is homepage or a briefing page
  const isBriefingPage = /\/incident\/[^/]+\/briefing\/[^/]+$/.test(pathname)
  const isHomePage = pathname === "/"
  const shouldDisableLogoLink = isHomePage || isBriefingPage

  const LogoContent = () => (
    <div className="flex items-center">
      <div className="mr-2 relative w-10 h-10">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
          <rect x="4" y="4" width="16" height="16" fill="#E11B22" />
          <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="2" />
        </svg>
      </div>
      <span className="text-lg font-bold">BritishRedCross</span>
    </div>
  )

  return (
    <header className="border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
        {shouldDisableLogoLink ? (
          <div className="inline-block">
            <LogoContent />
          </div>
        ) : (
          <Link href="/" className="inline-block">
            <LogoContent />
          </Link>
        )}

        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/reset" className="text-sm text-gray-600 hover:text-red-600 flex items-center">
                Reset App State
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
