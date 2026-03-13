"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useModelStore } from '@/lib/store/model';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { model, setModel } = useModelStore();

  // Don't render header on login page
  if (pathname === '/login') return null;

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">
                OncoLens
                <span className="text-[10px] font-normal text-muted-foreground ml-1 align-super">FHIR</span>
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
              <Link
                href="/patients"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname.startsWith('/patients')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Pacientes FHIR
              </Link>
              <Link
                href="/how-it-works"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/how-it-works'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Cómo Funciona
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {/* Model selector */}
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 p-0.5">
              <button
                onClick={() => setModel('sonnet')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  model === 'sonnet'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sonnet
              </button>
              <button
                onClick={() => setModel('opus')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  model === 'opus'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Opus
              </button>
            </div>
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
