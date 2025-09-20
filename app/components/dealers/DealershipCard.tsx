import Link from 'next/link'
import { BusinessProfile } from '@/lib/types/businessProfile'
import { Building2, MapPin, Phone, Globe, Clock, CheckCircle, MessageCircle, ChevronRight } from 'lucide-react'

interface DealershipCardProps {
  dealer: BusinessProfile
}

export default function DealershipCard({ dealer }: DealershipCardProps) {
  return (
    <Link href={`/business/${dealer.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100 hover:border-blue-200">
        <div className="flex flex-col lg:flex-row">
          {/* Left Section - Logo/Image */}
          <div className="lg:w-48 h-48 lg:h-auto flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100">
            {dealer.profile_image_url || dealer.logo_url ? (
              <img
                src={dealer.profile_image_url || dealer.logo_url}
                alt={dealer.business_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Middle Section - Business Info */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                    {dealer.business_name}
                  </h3>
                  {dealer.is_verified && (
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" aria-label="Verified" />
                  )}
                </div>

                {dealer.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {dealer.description}
                  </p>
                )}

                {/* Contact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dealer.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{dealer.address}</span>
                    </div>
                  )}

                  {dealer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{dealer.phone}</span>
                    </div>
                  )}

                  {dealer.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">WhatsApp Available</span>
                    </div>
                  )}

                  {dealer.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-blue-600 truncate">{dealer.website.replace(/^https?:\/\//, '')}</span>
                    </div>
                  )}

                  {dealer.operating_hours && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{dealer.operating_hours}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Section - CTA */}
              <div className="ml-4 flex-shrink-0 hidden lg:flex items-center">
                <div className="bg-blue-50 rounded-full p-3 group-hover:bg-blue-100 transition-colors">
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}