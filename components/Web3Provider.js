import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

// Import ABIs
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';
import BlockOfficeABI from '../contracts/abis/BlockOfficeABI.json';
import NFTMarketABI from '../contracts/abis/NFTMarketABI.json';
import HyreBlockABI from '../contracts/abis/HyreBlockABI.json';
import CommunityVoiceABI from '../contracts/abis/CommunityVoiceABI.json';
import IndieFundABI from '../contracts/abis/IndieFundABI.json';

// Contract addresses - you should store these in an environment variable or config file
const CONTRACT_ADDRESSES = {
  FilmToken: "0x...", // Replace with actual contract address
  BlockOffice: "0x...", // Replace with actual contract address
  NFTMarket: "0x...", // Replace with actual contract address
  HyreBlock: "0x...", // Replace with actual contract address
  CommunityVoice: "0x...", // Replace with actual contract address
  IndieFund: "0x..." // Replace with actual contract address
};

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [web3Modal, setWeb3Modal] = useState(null);
  
  // Add contract states
  const [contracts, setContracts] = useState({
    filmToken: null,
    blockOffice: null,
    nftMarket: null,
    hyreBlock: null,
    communityVoice: null,
    indieFund: null
  });

  useEffect(() => {
    // Using public RPC endpoints instead of Infura
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            1: "https://eth.llamarpc.com", // Ethereum Mainnet
            56: "https://bsc-dataseed.binance.org", // BSC Mainnet
            137: "https://polygon-rpc.com", // Polygon Mainnet
            43114: "https://api.avax.network/ext/bc/C/rpc" // Avalanche C-Chain
          },
        },
      },
    };

    const newWeb3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
      providerOptions,
    });

    setWeb3Modal(newWeb3Modal);
  }, []);

  useEffect(() => {
    if (web3Modal && web3Modal.cachedProvider) {
      connectWallet();
    }
  }, [web3Modal]);

  // Initialize contracts when provider is available
  useEffect(() => {
    if (provider && chainId) {
      initializeContracts();
    }
  }, [provider, chainId]);

  const initializeContracts = async () => {
    try {
      // Create contract instances
      const filmToken = new ethers.Contract(
        CONTRACT_ADDRESSES.FilmToken,
        FilmTokenABI,
        provider
      );
      
      const blockOffice = new ethers.Contract(
        CONTRACT_ADDRESSES.BlockOffice,
        BlockOfficeABI,
        provider
      );
      
      const nftMarket = new ethers.Contract(
        CONTRACT_ADDRESSES.NFTMarket,
        NFTMarketABI,
        provider
      );
      
      const hyreBlock = new ethers.Contract(
        CONTRACT_ADDRESSES.HyreBlock,
        HyreBlockABI,
        provider
      );
      
      const communityVoice = new ethers.Contract(
        CONTRACT_ADDRESSES.CommunityVoice,
        CommunityVoiceABI,
        provider
      );
      
      const indieFund = new ethers.Contract(
        CONTRACT_ADDRESSES.IndieFund,
        IndieFundABI,
        provider
      );
      
      // Set contracts with signer for write operations
      if (signer) {
        setContracts({
          filmToken: filmToken.connect(signer),
          blockOffice: blockOffice.connect(signer),
          nftMarket: nftMarket.connect(signer),
          hyreBlock: hyreBlock.connect(signer),
          communityVoice: communityVoice.connect(signer),
          indieFund: indieFund.connect(signer)
        });
      } else {
        // Read-only contracts
        setContracts({
          filmToken,
          blockOffice,
          nftMarket,
          hyreBlock,
          communityVoice,
          indieFund
        });
      }
      
      console.log("Contracts initialized successfully");
    } catch (error) {
      console.error("Failed to initialize contracts:", error);
    }
  };

  const connectWallet = async () => {
    try {
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(network.chainId);
      setIsConnected(true);

      // Setup listeners
      instance.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
      });

      instance.on("chainChanged", (chainId) => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const disconnectWallet = async () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider();
      setProvider(null);
      setSigner(null);
      setAccount(null);
      setChainId(null);
      setIsConnected(false);
      
      // Reset contracts
      setContracts({
        filmToken: null,
        blockOffice: null,
        nftMarket: null,
        hyreBlock: null,
        communityVoice: null,
        indieFund: null
      });
    }
  };

  const switchNetwork = async (chainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.utils.hexValue(chainId) }],
      });
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };

  const value = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    contracts // Expose contracts to components
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}
