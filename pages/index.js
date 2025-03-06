import Link from 'next/link';
import { useWeb3 } from '../components/Web3Provider';

export default function Home() {
  const { connectWallet } = useWeb3();

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-black to-gray-900 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            FILM CHAIN
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl">
            Every filmmaker's got a shot! A blockchain solution for sustainable financing for indie films.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/whitepaper" className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-8 py-3 rounded-md text-lg font-medium">
              Whitepaper
            </Link>
            <Link href="/roadmap" className="bg-transparent border border-teal-500 text-teal-500 px-8 py-3 rounded-md text-lg font-medium">
              Roadmap
            </Link>
          </div>
        </div>
      </section>

      {/* ICO Countdown */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">ICO Starts In</h2>
          <div className="flex justify-center space-x-4">
            <div className="bg-black p-4 rounded-lg w-24">
              <div className="text-4xl font-bold text-teal-400">00</div>
              <div className="text-gray-400">Days</div>
            </div>
            <div className="bg-black p-4 rounded-lg w-24">
              <div className="text-4xl font-bold text-teal-400">00</div>
              <div className="text-gray-400">Hours</div>
            </div>
            <div className="bg-black p-4 rounded-lg w-24">
              <div className="text-4xl font-bold text-teal-400">00</div>
              <div className="text-gray-400">Minutes</div>
            </div>
            <div className="bg-black p-4 rounded-lg w-24">
              <div className="text-4xl font-bold text-teal-400">00</div>
              <div className="text-gray-400">Seconds</div>
            </div>
          </div>
          <p className="text-gray-400 mt-6">ICO will start soon</p>
        </div>
      </section>

      {/* Ecosystem Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">FILM Chain in a Glance</h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              FILM Chain consists of IndieFund, a blockchain-based fundraising platform, Community Voice, a voting smart contract that enables the community to vote on the creation or continuation of a motion picture based on their stake in IndieFund, NFTpurge a platform to help filmmakers market and sell their art-related NFTs, Block Office, a streaming platform for films supported by the FILM Chain community, and HyreBlok a professional networking platform where filmmakers can find the right talent for their projects, or simply network and expand their professional circle.
            </p>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-8 text-center">FILM Chain Ecosystem</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h4 className="text-xl font-bold text-teal-400 mb-4">IndieFund</h4>
              <p className="text-gray-400">
                The goal of the project is to support indie filmmakers to raise funds necessary for the realization of their projects.
              </p>
              <Link href="/indie-fund" className="text-teal-400 mt-4 inline-block">
                Learn more →
              </Link>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
              <h4 className="text-xl font-bold text-teal-400 mb-4">Community Voice</h4>
              <p className="text-gray-400">
                FILM Chain enables community involvement in the development of motion pictures that they want to see and support.
              </p>
              <Link href="/community-voice" className="text-teal-400 mt-4 inline-block">
                Learn more →
              </Link>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
              <h4 className="text-xl font-bold text-teal-400 mb-4">Block Office</h4>
              <p className="text-gray-400">
                FILM Chain provides a utility for the distribution of projects supported by the community through streaming on our platform.
              </p>
              <Link href="/block-office" className="text-teal-400 mt-4 inline-block">
                Learn more →
              </Link>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
              <h4 className="text-xl font-bold text-teal-400 mb-4">NFT Market</h4>
              <p className="text-gray-400">
                The marketplace where filmmakers could market and sell their project-related NFTs in order to tokenize and monetize their creation.
              </p>
              <Link href="/nft-market" className="text-teal-400 mt-4 inline-block">
                Learn more →
              </Link>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg">
              <h4 className="text-xl font-bold text-teal-400 mb-4">HyreBlock</h4>
              <p className="text-gray-400">
                Networking part of the platform where industry professionals can showcase their talents, network with other peers, or find partners and crews.
              </p>
              <Link href="/hyre-block" className="text-teal-400 mt-4 inline-block">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Token Information */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">FILM Token</h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              The FILM token is the native utility token of the FILM Chain ecosystem, powering all transactions and interactions within the platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Token Distribution</h3>
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-teal-500 rounded-full mr-3"></div>
                    <span className="text-white">40% Public Sale</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-white">20% Team & Advisors</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-indigo-500 rounded-full mr-3"></div>
                    <span className="text-white">15% Marketing & Partnerships</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-white">16% Development</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-pink-500 rounded-full mr-3"></div>
                    <span className="text-white">9% Reserve</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Token Information</h3>
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Name</p>
                      <p className="text-white">FILM Chain</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Symbol</p>
                      <p className="text-white">FILM</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Standard</p>
                      <p className="text-white">ERC-20</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Platform</p>
                      <p className="text-white">Ethereum</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Supply</p>
                      <p className="text-white">100,000,000 FILM</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Min. Investment</p>
                      <p className="text-white">0.1 ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Price</p>
                      <p className="text-white">1 FILM = 0.0001 ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Accepted Currencies</p>
                      <p className="text-white">ETH, BNB, USDT</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
