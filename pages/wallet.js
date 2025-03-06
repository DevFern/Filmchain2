import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';

export default function Wallet() {
  const { account, provider, isConnected, connectWallet, chainId, switchNetwork } = useWeb3();
  const [balance, setBalance] = useState({
    eth: '0',
    film: '0'
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendForm, setSendForm] = useState({
    recipient: '',
    amount: '',
    token: 'film'
  });
  
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchBalances();
      fetchTransactions();
    }
  }, [isConnected, provider, chainId]);
  
  const fetchBalances = async () => {
    try {
      const ethBalance = await provider.getBalance(account);
      
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      const filmBalance = await tokenContract.balanceOf(account);
      
      setBalance({
        eth: ethers.utils.formatEther(ethBalance),
        film: ethers.utils.formatEther(filmBalance)
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // For a real app, you would use an indexer or API to get transaction history
      // This is a simplified example
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      
      // Get transfer events where the user is sender or recipient
      const sentFilter = tokenContract.filters.Transfer(account, null);
      const receivedFilter = tokenContract.filters.Transfer(null, account);
      
      const sentEvents = await tokenContract.queryFilter(sentFilter, -1000);
      const receivedEvents = await tokenContract.queryFilter(receivedFilter, -1000);
      
      const events = [...sentEvents, ...receivedEvents].sort((a, b) => b.blockNumber - a.blockNumber);
      
      const txs = await Promise.all(events.map(async (event) => {
        const block = await provider.getBlock(event.blockNumber);
        return {
          hash: event.transactionHash,
          from: event.args[0],
          to: event.args[1],
          value: ethers.utils.formatEther(event.args[2]),
          timestamp: block.timestamp * 1000,
          type: event.args[0].toLowerCase() === account.toLowerCase() ? 'sent' : 'received',
          token: 'FILM'
        };
      }));
      
      setTransactions(txs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setLoading(false);
    }
  };
  
  const handleSendFormChange = (e) => {
    const { name, value } = e.target;
    setSendForm({
      ...sendForm,
      [name]: value
    });
  };
  
  const handleSendTokens = async () => {
    if (!sendForm.recipient || !sendForm.amount) return;
    
    try {
      const signer = provider.getSigner();
      
      if (sendForm.token === 'eth') {
        const tx = await signer.sendTransaction({
          to: sendForm.recipient,
          value: ethers.utils.parseEther(sendForm.amount)
        });
        await tx.wait();
      } else {
        const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, signer);
        const tx = await tokenContract.transfer(
          sendForm.recipient,
          ethers.utils.parseEther(sendForm.amount)
        );
        await tx.wait();
      }
      
      alert("Transaction sent successfully!");
      setSendForm({
        recipient: '',
        amount: '',
        token: 'film'
      });
      fetchBalances();
      fetchTransactions();
    } catch (error) {
      console.error("Error sending tokens:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const truncateAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Wallet</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Manage your crypto assets, view transaction history, and send tokens to other users.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">Connect your wallet to view your balance and transactions</p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Your Wallet</h2>
                    <p className="text-gray-400">{account}</p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <button
                      onClick={() => switchNetwork()}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-md text-sm"
                    >
                      Network: {chainId === 1 ? 'Ethereum' : chainId === 56 ? 'BSC' : chainId === 137 ? 'Polygon' : 'Unknown'}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">ETH Balance</span>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-1">ETH</span>
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 12l-8-8 1.5-1.5L10 9l6.5-6.5L18 4z"></path>
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{parseFloat(balance.eth).toFixed(6)}</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">FILM Balance</span>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-1">FILM</span>
                        <svg className="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 12l-8-8 1.5-1.5L10 9l6.5-6.5L18 4z"></path>
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{parseFloat(balance.film).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
                
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">No transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hash</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {transactions.map((tx, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tx.type === 'received' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                              }`}>
                                {tx.type === 'received' ? 'Received' : 'Sent'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">
                              {parseFloat(tx.value).toFixed(2)} {tx.token}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                              {tx.type === 'received' ? truncateAddress(tx.from) : truncateAddress(tx.to)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                              {formatDate(tx.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                              <a 
                                href={`https://etherscan.io/tx/${tx.hash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-teal-400 hover:underline"
                              >
                                {truncateAddress(tx.hash)}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="bg-gray-900 rounded-lg p-6 sticky top-4">
                <h2 className="text-2xl font-bold text-white mb-6">Send Tokens</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-400 mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      id="recipient"
                      name="recipient"
                      value={sendForm.recipient}
                      onChange={handleSendFormChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="0x..."
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={sendForm.amount}
                      onChange={handleSendFormChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Token
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setSendForm({ ...sendForm, token: 'eth' })}
                        className={`flex-1 py-2 rounded-md ${
                          sendForm.token === 'eth'
                            ? 'bg-blue-900 text-blue-300 border border-blue-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        ETH
                      </button>
                      <button
                        type="button"
                        onClick={() => setSendForm({ ...sendForm, token: 'film' })}
                        className={`flex-1 py-2 rounded-md ${
                          sendForm.token === 'film'
                            ? 'bg-teal-900 text-teal-300 border border-teal-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        FILM
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      onClick={handleSendTokens}
                      disabled={!sendForm.recipient || !sendForm.amount}
                      className={`w-full py-3 rounded-md font-medium ${
                        !sendForm.recipient || !sendForm.amount
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                      }`}
                    >
                      Send
                    </button>
                  </div>
                  
                  {sendForm.token === 'eth' && parseFloat(sendForm.amount) > parseFloat(balance.eth) && (
                    <p className="text-red-500 text-sm">
                      Insufficient ETH balance. You have {parseFloat(balance.eth).toFixed(6)} ETH.
                    </p>
                  )}
                  
                  {sendForm.token === 'film' && parseFloat(sendForm.amount) > parseFloat(balance.film) && (
                    <p className="text-red-500 text-sm">
                      Insufficient FILM balance. You have {parseFloat(balance.film).toFixed(2)} FILM.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
