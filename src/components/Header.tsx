"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't render header on login page
  if (pathname === '/login') return null;

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">
                OncoFHIR Lens
              </Link>
            </div>
            <nav className="ml-6 flex space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Inicio
              </Link>
              <Link
                href="/cases"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname.startsWith('/cases')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Casos
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {session?.user && (
              <>
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-8 w-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="text-sm text-gray-700">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
