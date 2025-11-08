export default function AnimatedHeroHeading() {
  return (
    <>
      <style jsx>{`
        @keyframes subtleShimmer {
          0%, 100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }

        .ai-powered-wrapper {
          position: relative;
          display: inline-block;
        }

        .ai-powered {
          background: linear-gradient(
            90deg,
            #1e3a8a,
            #2563eb,
            #3b82f6,
            #2563eb,
            #1e3a8a
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: subtleShimmer 10s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
        <span className="ai-powered-wrapper">
          <span className="ai-powered">AI-Powered</span>
        </span>{' '}
        Vehicle Marketplace
      </h1>
    </>
  )
}
