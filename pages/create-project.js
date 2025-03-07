// pages/create-project.js
import { useState } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import { create } from 'ipfs-http-client';

export default function CreateProject() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fundingGoal: '',
    minFundingGoal: '',
    startDate: '',
    endDate: '',
    milestones: [],
    files: []
  });
  
  // Multi-step form with IPFS integration for media uploads
}
