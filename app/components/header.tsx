import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">AutoTrader.lk</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link href="/listings" className="text-gray-700 hover:text-blue-600 font-medium">
              Browse Vehicles
            </Link>
            <Link href="/wanted" className="text-gray-700 hover:text-blue-600 font-medium">
              Wanted Requests
            </Link>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/wanted/post" 
              className="hidden sm:inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Post Wanted
            </Link>
            <Link 
              href="/post" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Sell Vehicle
            </Link>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden py-3 border-t">
          <div className="flex flex-col space-y-2">
            <Link href="/" className="text-gray-700 hover:text-blue-600 py-2">
              Home
            </Link>
            <Link href="/listings" className="text-gray-700 hover:text-blue-600 py-2">
              Browse Vehicles
            </Link>
            <Link href="/wanted" className="text-gray-700 hover:text-blue-600 py-2">
              Wanted Requests
            </Link>
            <Link href="/wanted/post" className="text-gray-700 hover:text-blue-600 py-2">
              Post Wanted Request
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
