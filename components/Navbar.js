import { useState } from 'react';
import Link from 'next/link';
import { useWeb3 } from './Web3Provider';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon as MenuIcon, XMarkIcon as XIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'CommunityVoice', href: '/community-voice' },
  { name: 'IndieFund', href: '/indie-fund' },
  { name: 'HyreBlock', href: '/hyre-block' },
  { name: 'BlockOffice', href: '/block-office' },
  { name: 'NFTMarket', href: '/nft-market' },
  { name: 'Tokenomics', href: '/tokenomics' },
];

export default function Navbar() {
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3();
  
  return (
    <Disclosure as="nav" className="bg-black border-b border-gray-800">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/">
                    <span className="text-2xl font-bold text-teal-400">FILM CHAIN</span>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {isConnected ? (
                  <div className="flex items-center">
                    <Link href="/profile" className="text-gray-300 hover:text-white mr-4">
                      Profile
                    </Link>
                    <Link href="/wallet" className="text-gray-300 hover:text-white mr-4">
                      Wallet
                    </Link>
                    <button
                      onClick={disconnectWallet}
                      className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                >
                  {item.name}
                </Link>
              ))}
              {isConnected ? (
                <>
                  <Link href="/profile" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Profile
                  </Link>
                  <Link href="/wallet" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Wallet
                  </Link>
                  <button
                    onClick={disconnectWallet}
                    className="w-full text-left bg-gradient-to-r from-teal-500 to-blue-500 text-white px-3 py-2 rounded-md text-base font-medium mt-2"
                  >
                    Disconnect: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="w-full text-left bg-gradient-to-r from-teal-500 to-blue-500 text-white px-3 py-2 rounded-md text-base font-medium mt-2"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
