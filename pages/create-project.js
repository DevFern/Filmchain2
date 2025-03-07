// pages/create-project.js
import { useState } from 'react';
import { useWeb3 } from '../components/Web3Provider';

export default function CreateProject() {
  const { account, isConnected, connectWallet } = useWeb3();
  const [step, setStep] = useState(1);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-white mb-8">Create Project</h1>
      <p className="text-gray-300">This feature is coming soon.</p>
      
      {!isConnected ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6">Connect your wallet to create a project</p>
          <button 
            onClick={connectWallet}
            className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-6 text-center">
          <p className="text-gray-400">Project creation will be available soon</p>
        </div>
      )}
    </div>
  );
}
