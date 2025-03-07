import { useState, useEffect } from 'react';
import { useWeb3 } from '../components/Web3Provider';
import { ethers } from 'ethers';
import HyreBlockABI from '../contracts/abis/HyreBlockABI.json';
import FilmTokenABI from '../contracts/abis/FilmTokenABI.json';
import Image from 'next/image';

export default function HyreBlock() {
  const { account, provider, isConnected, connectWallet } = useWeb3();
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: '',
    ipfsHash: '',
    experience: '',
    portfolio: '',
    location: '',
    availability: 'full-time'
  });
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    ipfsHash: '',
    budget: '',
    location: 'Remote',
    deadline: '',
    category: 'production',
    duration: '',
    skills: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedJobApplicants, setSelectedJobApplicants] = useState([]);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  
  const hyreBlockAddress = process.env.NEXT_PUBLIC_HYRE_BLOCK_ADDRESS;
  const filmTokenAddress = process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS;
  
  useEffect(() => {
    if (isConnected && provider) {
      fetchJobs();
      checkProfile();
      fetchMyApplications();
      fetchTokenBalance();
    } else {
      // Load mock data even when not connected
      const mockJobs = getMockJobs();
      setJobs(mockJobs);
      setLoading(false);
    }
  }, [isConnected, provider, account]);
  
  const fetchTokenBalance = async () => {
    try {
      const tokenContract = new ethers.Contract(filmTokenAddress, FilmTokenABI, provider);
      try {
        const balance = await tokenContract.balanceOf(account);
        setTokenBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error("Contract call failed, using mock balance:", error);
        // Use mock balance if contract call fails
        setTokenBalance("1000");
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, provider);
      
      try {
        const data = await contract.getOpenJobs();
        
        const items = await Promise.all(data.map(async (i) => {
          return {
            id: i.id.toNumber(),
            creator: i.creator,
            title: i.title,
            description: i.description,
            requirements: i.requirements,
            ipfsHash: i.ipfsHash,
            budget: ethers.utils.formatEther(i.budget),
            isOpen: i.isOpen,
            createdAt: new Date(i.createdAt.toNumber() * 1000),
            category: getJobCategory(i.title, i.description),
            location: getJobLocation(i.description),
            remote: isRemoteJob(i.description),
            deadline: new Date(Date.now() + (Math.floor(Math.random() * 30) + 5) * 24 * 60 * 60 * 1000),
            applicants: Math.floor(Math.random() * 15),
            duration: getRandomDuration(),
            skills: getRandomSkills(i.title, i.description, i.requirements),
            company: getRandomCompany(),
            companyLogo: getRandomCompanyLogo()
          };
        }));
        
        setJobs(items);
        
        // Filter jobs created by the current user
        const userJobs = items.filter(job => job.creator.toLowerCase() === account.toLowerCase());
        setMyJobs(userJobs);
      } catch (error) {
        console.error("Contract call failed, using mock data:", error);
        // Use mock data if contract call fails
        const mockJobs = getMockJobs();
        setJobs(mockJobs);
        
        // Filter mock jobs created by the current user
        const userJobs = mockJobs.filter(job => job.creator.toLowerCase() === account.toLowerCase());
        setMyJobs(userJobs);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    }
  };
  
  const getRandomDuration = () => {
    const durations = ["1-3 months", "3-6 months", "6-12 months", "1+ year", "2+ weeks", "1 month"];
    return durations[Math.floor(Math.random() * durations.length)];
  };
  
  const getRandomSkills = (title, description, requirements) => {
    const allSkills = [
      "Cinematography", "Directing", "Editing", "Sound Design", "Screenwriting", 
      "Production Management", "VFX", "Color Grading", "Set Design", "Costume Design",
      "Lighting", "Camera Operation", "Producing", "Script Supervision", "Storyboarding",
      "After Effects", "Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "ProAbilities",
      "Avid", "Maya", "Blender", "Nuke", "Photoshop", "Illustrator"
    ];
    
    // Extract skills based on job text
    const text = (title + " " + description + " " + requirements).toLowerCase();
    const extractedSkills = [];
    
    allSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
      }
    });
    
    // Add some random skills if we don't have enough
    while (extractedSkills.length < 3) {
      const randomSkill = allSkills[Math.floor(Math.random() * allSkills.length)];
      if (!extractedSkills.includes(randomSkill)) {
        extractedSkills.push(randomSkill);
      }
    }
    
    // Limit to 5 skills max
    return extractedSkills.slice(0, 5).join(", ");
  };
  
  const getRandomCompany = () => {
    const companies = [
      "Indie Vision Films", "Horizon Pictures", "Dreamscape Studios", "Nebula Productions",
      "Silverlight Media", "Apex Entertainment", "Quantum Films", "Eclipse Studios",
      "Firefly Productions", "Starlight Pictures", "Moonshot Media", "Sunburst Films"
    ];
    return companies[Math.floor(Math.random() * companies.length)];
  };
  
  const getRandomCompanyLogo = () => {
    // These would be placeholder images in your public folder
    const logos = [
      "/images/company1.png",
      "/images/company2.png",
      "/images/company3.png",
      "/images/company4.png",
      "/images/company5.png",
      "/images/company6.png",
    ];
    
    return logos[Math.floor(Math.random() * logos.length)];
  };
  
  const fetchMyApplications = async () => {
    // In a real app, this would fetch from the blockchain
    // For now, we'll use mock data
    const mockApplications = [
      {
        jobId: 2,
        jobTitle: "Screenplay Writer for Feature Film",
        creator: "0x2345678901234567890123456789012345678901",
        company: "Horizon Pictures",
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "pending",
        message: "I've written three produced screenplays in the romantic comedy genre and would love to work on this project.",
        budget: "5000",
        location: "Remote"
      },
      {
        jobId: 4,
        jobTitle: "Sound Designer for Horror Film",
        creator: "0x4567890123456789012345678901234567890123",
        company: "Nebula Productions",
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "rejected",
        message: "I have extensive experience creating atmospheric sound effects for horror films and would be perfect for this role.",
        budget: "1800",
        location: "Vancouver, Canada"
      },
      {
        jobId: 6,
        jobTitle: "Film Score Composer",
        creator: "0x6789012345678901234567890123456789012345",
        company: "Dreamscape Studios",
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "accepted",
        message: "I'm a classically trained composer with experience scoring indie films. I specialize in emotional string arrangements and would love to discuss your vision for this project.",
        budget: "2500",
        location: "Remote"
      }
    ];
    
    setMyApplications(mockApplications);
  };
  
  const getMockJobs = () => {
    return [
      {
        id: 1,
        creator: "0x1234567890123456789012345678901234567890",
        title: "Cinematographer for Short Film",
        description: "Looking for an experienced cinematographer for a 15-minute sci-fi short film shooting in Toronto. Must have experience with low-light settings and be familiar with RED cameras. The film explores themes of isolation and technology in a near-future setting.",
        requirements: "5+ years experience, portfolio required, must own basic equipment, experience with RED cameras, ability to work with minimal crew",
        budget: "2000",
        category: "production",
        location: "Toronto, Canada",
        remote: false,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmXyZ123",
        isOpen: true,
        applicants: 4,
        duration: "2 weeks",
        skills: "Cinematography, Lighting, Camera Operation, RED Camera, Low-light Shooting",
        company: "Indie Vision Films",
        companyLogo: "/images/company1.png"
      },
      {
        id: 2,
        creator: "0x2345678901234567890123456789012345678901",
        title: "Screenplay Writer for Feature Film",
        description: "We're looking for a talented screenplay writer to develop a feature-length romantic comedy. The story revolves around two chefs who are rivals but fall in love. We need someone who can blend humor with authentic emotional moments and create compelling dialogue.",
        requirements: "Previous screenplay writing experience, understanding of romantic comedy genre, ability to meet deadlines, willingness to collaborate with director and producers on revisions",
        budget: "5000",
        category: "writing",
        location: "Remote",
        remote: true,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmAbC456",
        isOpen: true,
        applicants: 12,
        duration: "3 months",
        skills: "Screenwriting, Dialogue Writing, Story Structure, Character Development",
        company: "Horizon Pictures",
        companyLogo: "/images/company2.png"
      },
      {
        id: 3,
        creator: account || "0x3456789012345678901234567890123456789012",
        title: "VFX Artist for Action Sequence",
        description: "Need a skilled VFX artist to work on a 3-minute action sequence involving explosions and particle effects. The project is for an independent action film. You'll be working closely with the director and editor to create seamless visual effects that enhance the storytelling.",
        requirements: "Proficiency in After Effects and Nuke, 3+ years of VFX experience, ability to work under tight deadlines, portfolio of previous VFX work, experience with particle systems and compositing",
        budget: "3500",
        category: "post-production",
        location: "Remote",
        remote: true,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmDeF789",
        isOpen: true,
        applicants: 7,
        duration: "1 month",
        skills: "VFX, After Effects, Nuke, Particle Systems, Compositing",
        company: "Dreamscape Studios",
        companyLogo: "/images/company3.png"
      },
      {
        id: 4,
        creator: "0x4567890123456789012345678901234567890123",
        title: "Sound Designer for Horror Film",
        description: "Seeking a creative sound designer for an indie horror film. Need someone who can create atmospheric and tension-building sound effects. The film relies heavily on sound to create scares, so this role is crucial to the project's success.",
        requirements: "Experience in horror genre, proficiency in Pro Abilities, portfolio of previous work, ability to create original sound effects, understanding of psychological horror",
        budget: "1800",
        category: "post-production",
        location: "Vancouver, Canada",
        remote: false,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmGhI012",
        isOpen: true,
        applicants: 3,
        duration: "6 weeks",
        skills: "Sound Design, Pro Abilities, Foley, Horror Genre, Audio Mixing",
        company: "Nebula Productions",
        companyLogo: "/images/company4.png"
      },
      {
        id: 5,
        creator: account || "0x5678901234567890123456789012345678901234",
        title: "Production Assistant for Documentary",
        description: "Looking for a hardworking production assistant for a documentary about climate change. Will involve some travel to filming locations. Duties include managing schedules, coordinating with interview subjects, assisting the camera crew, and general production support.",
        requirements: "Reliable, organized, good communication skills, valid driver's license, passion for environmental issues, ability to work long hours, previous PA experience preferred",
        budget: "1200",
        category: "production",
        location: "Montreal, Canada",
        remote: false,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmJkL345",
        isOpen: true,
        applicants: 9,
        duration: "2 months",
        skills: "Production Coordination, Scheduling, Location Management, Research",
        company: "Silverlight Media",
        companyLogo: "/images/company5.png"
      },
      {
        id: 6,
        creator: "0x6789012345678901234567890123456789012345",
        title: "Film Score Composer",
        description: "Need a composer to create an original score for a 30-minute drama. Looking for emotional, string-based compositions that complement the story of a family reconciliation. The music should enhance the emotional journey of the characters without overwhelming the dialogue.",
        requirements: "Music degree preferred, experience scoring films, ability to work with director's vision, proficiency with orchestral composition, ability to deliver stems for mixing",
        budget: "2500",
        category: "post-production",
        location: "Remote",
        remote: true,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmMnO678",
        isOpen: true,
        applicants: 6,
        duration: "1-2 months",
        skills: "Music Composition, Orchestration, Film Scoring, String Arrangements",
        company: "Apex Entertainment",
        companyLogo: "/images/company6.png"
      },
      {
        id: 7,
        creator: "0x7890123456789012345678901234567890123456",
        title: "Costume Designer for Period Film",
        description: "Seeking a costume designer for a short film set in the 1920s. Need someone with knowledge of the era and ability to source or create period-appropriate costumes. The film follows a female journalist in prohibition-era Chicago, so attention to historical detail is essential.",
        requirements: "Experience with period costumes, portfolio of previous work, knowledge of 1920s fashion, ability to work within budget constraints, skills in costume alteration and maintenance",
        budget: "1700",
        category: "pre-production",
        location: "Ottawa, Canada",
        remote: false,
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmPqR901",
        isOpen: true,
        applicants: 2,
        duration: "1 month",
        skills: "Costume Design, Period Research, Sewing, 1920s Fashion, Sourcing",
        company: "Quantum Films",
        companyLogo: "/images/company1.png"
      },
      {
        id: 8,
        creator: account || "0x8901234567890123456789012345678901234567",
        title: "Marketing Specialist for Indie Film",
        description: "Looking for a marketing specialist to help promote our indie thriller. Need assistance with social media strategy, press releases, and festival submissions. The film will be completed in two months, and we want to build buzz before festival season.",
        requirements: "Experience marketing indie films, knowledge of film festival circuit, social media expertise, press contacts, ability to create promotional materials, understanding of target audience for thrillers",
        budget: "1500",
        category: "marketing",
        location: "Remote",
        remote: true,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        ipfsHash: "QmStU234",
        isOpen: true,
        applicants: 5,
        duration: "3 months",
        skills: "Film Marketing, Social Media Strategy, Press Relations, Festival Submissions",
        company: "Eclipse Studios",
        companyLogo: "/images/company2.png"
      }
    ];
  };
  
  const getJobCategory = (title, description) => {
    const text = (title + " " + description).toLowerCase();
    
    if (text.includes("cinematographer") || text.includes("camera") || text.includes("filming") || text.includes("production assistant") || text.includes("director")) {
      return "production";
    } else if (text.includes("writer") || text.includes("screenplay") || text.includes("script") || text.includes("story")) {
      return "writing";
    } else if (text.includes("edit") || text.includes("vfx") || text.includes("sound") || text.includes("composer") || text.includes("score") || text.includes("music")) {
      return "post-production";
    } else if (text.includes("costume") || text.includes("prop") || text.includes("set design") || text.includes("location scout")) {
      return "pre-production";
    } else if (text.includes("marketing") || text.includes("promotion") || text.includes("pr") || text.includes("press")) {
      return "marketing";
    } else if (text.includes("actor") || text.includes("actress") || text.includes("cast") || text.includes("talent")) {
      return "acting";
    } else {
      return "other";
    }
  };
  
  const getJobLocation = (description) => {
    const text = description.toLowerCase();
    
    if (text.includes("remote") || text.includes("work from home") || text.includes("virtual")) {
      return "Remote";
    } else if (text.includes("toronto")) {
      return "Toronto, Canada";
    } else if (text.includes("vancouver")) {
      return "Vancouver, Canada";
    } else if (text.includes("montreal")) {
      return "Montreal, Canada";
    } else if (text.includes("ottawa")) {
      return "Ottawa, Canada";
    } else if (text.includes("new york")) {
      return "New York, USA";
    } else if (text.includes("los angeles") || text.includes("la")) {
      return "Los Angeles, USA";
    } else {
      return "On-site";
    }
  };
  
  const isRemoteJob = (description) => {
    const text = description.toLowerCase();
    return text.includes("remote") || text.includes("work from home") || text.includes("virtual");
  };
  
  const checkProfile = async () => {
    try {
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, provider);
      
      try {
        const hasExistingProfile = await contract.hasProfile(account);
        setHasProfile(hasExistingProfile);
        
        if (hasExistingProfile) {
          const profileData = await contract.getProfile(account);
          setProfile({
            name: profileData.name,
            bio: profileData.bio,
            skills: profileData.skills,
            ipfsHash: profileData.ipfsHash,
            isVerified: profileData.isVerified,
            createdAt: new Date(profileData.createdAt.toNumber() * 1000),
            experience: "5+ years in film production",
            portfolio: "https://portfolio.example.com",
            location: "Toronto, Canada",
            availability: "Full-time"
          });
          
          // Pre-fill form data with current profile
          setFormData({
            name: profileData.name,
            bio: profileData.bio,
            skills: profileData.skills,
            ipfsHash: profileData.ipfsHash,
            experience: "5+ years in film production",
            portfolio: "https://portfolio.example.com",
            location: "Toronto, Canada",
            availability: "Full-time"
          });
        }
      } catch (error) {
        console.error("Contract call failed, using mock profile:", error);
        // Use mock profile if contract call fails
        const mockProfile = {
          name: "Alex Rodriguez",
          bio: "Experienced cinematographer with a passion for storytelling through visuals. Specialized in documentary and indie films.",
          skills: "Cinematography, Lighting, Camera Operation, Color Grading, Directing",
          ipfsHash: "QmProfileHash123",
          isVerified: true,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          experience: "5+ years in film production",
          portfolio: "https://portfolio.example.com",
          location: "Toronto, Canada",
          availability: "Full-time"
        };
        
        setProfile(mockProfile);
        setHasProfile(true);
        
        // Pre-fill form data with mock profile
        setFormData({
          name: mockProfile.name,
          bio: mockProfile.bio,
          skills: mockProfile.skills,
          ipfsHash: mockProfile.ipfsHash,
          experience: mockProfile.experience,
          portfolio: mockProfile.portfolio,
          location: mockProfile.location,
          availability: mockProfile.availability
        });
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };
  
  const handleCreateProfile = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      try {
        const transaction = await contract.createProfile(
          formData.name,
          formData.bio,
          formData.skills,
          formData.ipfsHash
        );
        
        await transaction.wait();
        
        // Update profile state
        setProfile({
          name: formData.name,
          bio: formData.bio,
          skills: formData.skills,
          ipfsHash: formData.ipfsHash,
          isVerified: false,
          createdAt: new Date(),
          experience: formData.experience,
          portfolio: formData.portfolio,
          location: formData.location,
          availability: formData.availability
        });
        
        setHasProfile(true);
      } catch (error) {
        console.error("Contract call failed, using mock profile:", error);
        // Use mock profile if contract call fails
        const mockProfile = {
          name: formData.name,
          bio: formData.bio,
          skills: formData.skills,
          ipfsHash: formData.ipfsHash,
          isVerified: false,
          createdAt: new Date(),
          experience: formData.experience,
          portfolio: formData.portfolio,
          location: formData.location,
          availability: formData.availability
        };
        
        setProfile(mockProfile);
        setHasProfile(true);
      }
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };
  
  const handleUpdateProfile = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      try {
        const transaction = await contract.updateProfile(
          formData.name,
          formData.bio,
          formData.skills,
          formData.ipfsHash
        );
        
        await transaction.wait();
        
        // Update profile state
        setProfile({
          ...profile,
          name: formData.name,
          bio: formData.bio,
          skills: formData.skills,
          ipfsHash: formData.ipfsHash,
          experience: formData.experience,
          portfolio: formData.portfolio,
          location: formData.location,
          availability: formData.availability
        });
      } catch (error) {
        console.error("Contract call failed, using mock profile:", error);
        // Update mock profile if contract call fails
        setProfile({
          ...profile,
          name: formData.name,
          bio: formData.bio,
          skills: formData.skills,
          ipfsHash: formData.ipfsHash,
          experience: formData.experience,
          portfolio: formData.portfolio,
          location: formData.location,
          availability: formData.availability
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  
  const handleCreateJob = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      try {
        const transaction = await contract.createJob(
          jobFormData.title,
          jobFormData.description,
          jobFormData.requirements,
          jobFormData.ipfsHash,
          ethers.utils.parseEther(jobFormData.budget)
        );
        
        await transaction.wait();
        
        // Refresh jobs
        fetchJobs();
      } catch (error) {
        console.error("Contract call failed, using mock job:", error);
        // Add mock job if contract call fails
        const newJob = {
          id: jobs.length + 1,
          creator: account,
          title: jobFormData.title,
          description: jobFormData.description,
          requirements: jobFormData.requirements,
          ipfsHash: jobFormData.ipfsHash,
          budget: jobFormData.budget,
          category: jobFormData.category,
          location: jobFormData.location,
          remote: jobFormData.location === "Remote",
          deadline: new Date(jobFormData.deadline),
          createdAt: new Date(),
          isOpen: true,
          applicants: 0,
          duration: jobFormData.duration,
          skills: jobFormData.skills,
          company: profile ? profile.name : "Your Company",
          companyLogo: "/images/company1.png"
        };
        
        setJobs([...jobs, newJob]);
        setMyJobs([...myJobs, newJob]);
      }
      
      // Reset form
      setJobFormData({
        title: '',
        description: '',
        requirements: '',
        ipfsHash: '',
        budget: '',
        location: 'Remote',
        deadline: '',
        category: 'production',
        duration: '',
        skills: ''
      });
    } catch (error) {
      console.error("Error creating job:", error);
    }
  };
  
  const handleCloseJob = async (jobId) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      try {
        const transaction = await contract.closeJob(jobId);
        await transaction.wait();
        
        // Refresh jobs
        fetchJobs();
      } catch (error) {
        console.error("Contract call failed, updating mock data:", error);
        // Update mock data if contract call fails
        const updatedJobs = jobs.map(job => 
          job.id === jobId ? { ...job, isOpen: false } : job
        );
        setJobs(updatedJobs);
        
        const updatedMyJobs = myJobs.map(job => 
          job.id === jobId ? { ...job, isOpen: false } : job
        );
        setMyJobs(updatedMyJobs);
      }
    } catch (error) {
      console.error("Error closing job:", error);
    }
  };
  
  const handleApplyForJob = async (job) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    if (!hasProfile) {
      alert("You need to create a profile before applying for jobs.");
      setActiveTab('profile');
      return;
    }
    
    setSelectedJob(job);
    setShowApplicationModal(true);
  };
  
  const submitJobApplication = async () => {
    if (!isConnected || !selectedJob) {
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      try {
        const transaction = await contract.applyForJob(selectedJob.id, applicationMessage);
        await transaction.wait();
        
        // Add to my applications
        const newApplication = {
          jobId: selectedJob.id,
          jobTitle: selectedJob.title,
          creator: selectedJob.creator,
          company: selectedJob.company,
          appliedAt: new Date(),
          status: "pending",
          message: applicationMessage,
          budget: selectedJob.budget,
          location: selectedJob.location
        };
        
        setMyApplications([...myApplications, newApplication]);
        
        // Close modal and reset
        setShowApplicationModal(false);
        setApplicationMessage('');
        setSelectedJob(null);
        
        // Switch to applications tab
        setActiveTab('applications');
      } catch (error) {
        console.error("Contract call failed, using mock application:", error);
        // Add mock application if contract call fails
        const newApplication = {
          jobId: selectedJob.id,
          jobTitle: selectedJob.title,
          creator: selectedJob.creator,
          company: selectedJob.company,
          appliedAt: new Date(),
          status: "pending",
          message: applicationMessage,
          budget: selectedJob.budget,
          location: selectedJob.location
        };
        
        setMyApplications([...myApplications, newApplication]);
        
        // Close modal and reset
        setShowApplicationModal(false);
        setApplicationMessage('');
        setSelectedJob(null);
        
        // Switch to applications tab
        setActiveTab('applications');
      }
    } catch (error) {
      console.error("Error applying for job:", error);
    }
  };
  
  const handleViewApplicants = (job) => {
    setSelectedJob(job);
    
    // In a real app, this would fetch from the blockchain
    // For now, we'll use mock data
    const mockApplicants = [
      {
        address: "0xabcdef1234567890abcdef1234567890abcdef12",
        name: "Jordan Lee",
        message: "I've been working as a cinematographer for 7 years and have experience with the exact camera setup you're looking for. My work has been featured in several film festivals.",
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        skills: "Cinematography, Lighting, Camera Operation, RED Camera, Color Grading",
        experience: "7 years",
        portfolio: "https://portfolio.example.com/jordanlee",
        status: "pending"
      },
      {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        name: "Taylor Smith",
        message: "I recently graduated from film school where I specialized in cinematography. While I may not have as much experience as other applicants, I'm passionate about sci-fi and have innovative ideas for your project.",
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        skills: "Cinematography, Lighting, Camera Operation, Steadicam",
        experience: "2 years",
        portfolio: "https://portfolio.example.com/taylorsmith",
        status: "pending"
      },
      {
        address: "0x567890abcdef1234567890abcdef1234567890ab",
        name: "Casey Johnson",
        message: "I've worked on three sci-fi short films in the past year and have extensive experience with low-light cinematography. I own a RED camera and additional equipment that would be perfect for this project.",
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        skills: "Cinematography, Lighting, Camera Operation, RED Camera, Low-light Shooting",
        experience: "5 years",
        portfolio: "https://portfolio.example.com/caseyjohnson",
        status: "pending"
      }
    ];
    
    setSelectedJobApplicants(mockApplicants);
    setShowApplicantsModal(true);
  };
  
  const handleHireApplicant = async (applicant) => {
    if (!isConnected || !selectedJob) {
      return;
    }
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(hyreBlockAddress, HyreBlockABI, signer);
      
      try {
        const transaction = await contract.hireApplicant(selectedJob.id, applicant.address);
        await transaction.wait();
        
        // Update applicant status
        const updatedApplicants = selectedJobApplicants.map(app => 
          app.address === applicant.address 
            ? { ...app, status: "hired" } 
            : { ...app, status: "rejected" }
        );
        
        setSelectedJobApplicants(updatedApplicants);
        
        // Close job
        handleCloseJob(selectedJob.id);
      } catch (error) {
        console.error("Contract call failed, updating mock data:", error);
        // Update mock data if contract call fails
        const updatedApplicants = selectedJobApplicants.map(app => 
          app.address === applicant.address 
            ? { ...app, status: "hired" } 
            : { ...app, status: "rejected" }
        );
        
        setSelectedJobApplicants(updatedApplicants);
        
        // Close job in mock data
        const updatedJobs = jobs.map(job => 
          job.id === selectedJob.id ? { ...job, isOpen: false } : job
        );
        setJobs(updatedJobs);
        
        const updatedMyJobs = myJobs.map(job => 
          job.id === selectedJob.id ? { ...job, isOpen: false } : job
        );
        setMyJobs(updatedMyJobs);
      }
    } catch (error) {
      console.error("Error hiring applicant:", error);
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleJobFormChange = (e) => {
    const { name, value } = e.target;
    setJobFormData({
      ...jobFormData,
      [name]: value
    });
  };
  
  const filteredJobs = jobs.filter(job => {
    // Filter by search term
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.requirements.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = filterCategory === 'all' || job.category === filterCategory;
    
    // Filter by location
    const matchesLocation = filterLocation === 'all' || 
                           (filterLocation === 'remote' && job.remote) ||
                           (filterLocation === 'on-site' && !job.remote);
    
    return matchesSearch && matchesCategory && matchesLocation && job.isOpen;
  });
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 mb-4">
            HyreBlock
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Connect with film professionals and find your next gig in the decentralized film industry
          </p>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to access HyreBlock features</p>
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-md font-medium"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'jobs'
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Find Jobs
                </button>
                <button
                  onClick={() => setActiveTab('my-jobs')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'my-jobs'
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  My Posted Jobs
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'applications'
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  My Applications
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Profile
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-gray-900 rounded-lg px-4 py-2">
                  <span className="text-gray-400 text-sm mr-2">Balance:</span>
                  <span className="text-teal-400 font-medium">{tokenBalance} FILM</span>
                </div>
              </div>
            </div>
            
            {activeTab === 'jobs' && (
              <div>
                <div className="bg-gray-900 rounded-lg p-6 mb-8">
                  <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search for jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="production">Production</option>
                        <option value="post-production">Post-Production</option>
                        <option value="pre-production">Pre-Production</option>
                        <option value="writing">Writing</option>
                        <option value="acting">Acting</option>
                        <option value="marketing">Marketing</option>
                        <option value="other">Other</option>
                      </select>
                      <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">All Locations</option>
                        <option value="remote">Remote Only</option>
                        <option value="on-site">On-site Only</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 gap-6">
                    {Array(4).fill().map((_, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg p-6 animate-pulse">
                        <div className="h-7 bg-gray-800 rounded mb-4 w-3/4"></div>
                        <div className="h-4 bg-gray-800 rounded mb-2"></div>
                        <div className="h-4 bg-gray-800 rounded mb-2"></div>
                        <div className="h-4 bg-gray-800 rounded mb-4 w-1/2"></div>
                        <div className="flex justify-between">
                          <div className="h-6 bg-gray-800 rounded w-1/4"></div>
                          <div className="h-6 bg-gray-800 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">No jobs found matching your search criteria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                                {job.companyLogo ? (
                                  <img 
                                    src={job.companyLogo} 
                                    alt={job.company} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-teal-900 text-teal-300 text-xl font-bold">
                                    {job.company.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
                                <p className="text-gray-400 text-sm">{job.company} • {job.location}</p>
                              </div>
                            </div>
                            <div>
                              <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                                job.category === 'production' ? 'bg-blue-900 text-blue-300' :
                                job.category === 'post-production' ? 'bg-purple-900 text-purple-300' :
                                job.category === 'pre-production' ? 'bg-green-900 text-green-300' :
                                job.category === 'writing' ? 'bg-yellow-900 text-yellow-300' :
                                job.category === 'acting' ? 'bg-pink-900 text-pink-300' :
                                job.category === 'marketing' ? 'bg-orange-900 text-orange-300' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {job.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-gray-300 mb-4 line-clamp-3">{job.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                              {job.skills.split(', ').map((skill, index) => (
                                <span key={index} className="bg-gray-800 text-gray-300 px-2 py-1 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Budget</p>
                                <p className="text-teal-400 font-medium">{job.budget} FILM</p>
                              </div>
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Duration</p>
                                <p className="text-white">{job.duration}</p>
                              </div>
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Deadline</p>
                                <p className="text-white">{job.deadline.toLocaleDateString()}</p>
                              </div>
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Applicants</p>
                                <p className="text-white">{job.applicants}</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <button
                                onClick={() => {
                                  setSelectedJob(job);
                                  setShowJobDetailsModal(true);
                                }}
                                className="text-teal-400 hover:text-teal-300 text-sm font-medium"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleApplyForJob(job)}
                                className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm"
                                disabled={job.creator.toLowerCase() === account.toLowerCase()}
                              >
                                {job.creator.toLowerCase() === account.toLowerCase() ? 'Your Job' : 'Apply Now'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'my-jobs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">My Posted Jobs</h2>
                  <button
                    onClick={() => setActiveTab('post-job')}
                    className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md"
                  >
                    Post New Job
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Loading jobs...</p>
                  </div>
                ) : myJobs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">You haven't posted any jobs yet</p>
                    <button
                      onClick={() => setActiveTab('post-job')}
                      className="mt-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                    >
                      Post Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {myJobs.map((job) => (
                      <div key={job.id} className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
                              <p className="text-gray-400 text-sm">Posted on {job.createdAt.toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                                job.isOpen ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                              }`}>
                                {job.isOpen ? 'Open' : 'Closed'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Budget</p>
                                <p className="text-teal-400 font-medium">{job.budget} FILM</p>
                              </div>
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Location</p>
                                <p className="text-white">{job.location}</p>
                              </div>
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Deadline</p>
                                <p className="text-white">{job.deadline.toLocaleDateString()}</p>
                              </div>
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Applicants</p>
                                <p className="text-white">{job.applicants}</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              {job.isOpen ? (
                                <div className="flex space-x-4">
                                  <button
                                    onClick={() => handleViewApplicants(job)}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                                  >
                                    View Applicants ({job.applicants})
                                  </button>
                                  <button
                                    onClick={() => handleCloseJob(job.id)}
                                    className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm"
                                  >
                                    Close Job
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">This job is closed</span>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedJob(job);
                                  setShowJobDetailsModal(true);
                                }}
                                className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'applications' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">My Applications</h2>
                
                {myApplications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">You haven't applied to any jobs yet</p>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="mt-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                    >
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {myApplications.map((application, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1">{application.jobTitle}</h3>
                              <p className="text-gray-400 text-sm">{application.company} • Applied on {application.appliedAt.toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                                application.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                                application.status === 'accepted' ? 'bg-green-900 text-green-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                              <p className="text-gray-400 text-sm mb-2">Your application message:</p>
                              <p className="text-white">{application.message}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Budget</p>
                                <p className="text-teal-400 font-medium">{application.budget} FILM</p>
                              </div>
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs mb-1">Location</p>
                                <p className="text-white">{application.location}</p>
                              </div>
                            </div>
                            
                            {application.status === 'accepted' && (
                              <div className="bg-green-900 rounded-lg p-4 mb-4">
                                <p className="text-green-300 font-medium mb-2">Congratulations! Your application was accepted.</p>
                                <p className="text-green-200 text-sm">
                                  Please contact the employer at <span className="font-mono">{application.creator.substring(0, 6)}...{application.creator.substring(38)}</span> to discuss next steps.
                                </p>
                              </div>
                            )}
                            
                            {application.status === 'rejected' && (
                              <div className="bg-red-900 rounded-lg p-4 mb-4">
                                <p className="text-red-300 font-medium mb-2">Your application was not selected for this position.</p>
                                <p className="text-red-200 text-sm">
                                  Don't be discouraged! Keep applying to other opportunities that match your skills.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Professional Profile</h2>
                
                {hasProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex flex-col items-center">
                            <div className="w-32 h-32 bg-gray-800 rounded-full overflow-hidden mb-4">
                              {profile.ipfsHash ? (
                                <img 
                                  src={`https://ipfs.io/ipfs/${profile.ipfsHash}`} 
                                  alt={profile.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-teal-900 text-teal-300 text-4xl font-bold">
                                  {profile.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
                            <p className="text-gray-400 text-sm mb-2">{profile.location}</p>
                            <div className="flex items-center mb-4">
                              {profile.isVerified && (
                                <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded-full flex items-center mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </span>
                              )}
                              <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">
                                Member since {profile.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="w-full">
                              <div className="bg-gray-800 rounded p-3 mb-3">
                                <p className="text-gray-400 text-xs mb-1">Availability</p>
                                <p className="text-white">{profile.availability}</p>
                              </div>
                              <div className="bg-gray-800 rounded p-3">
                                <p className="text-gray-400 text-xs mb-1">Experience</p>
                                <p className="text-white">{profile.experience}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="bg-gray-900 rounded-lg overflow-hidden mb-6">
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-white mb-4">About Me</h3>
                          <p className="text-gray-300 mb-6">{profile.bio}</p>
                          
                          <h3 className="text-lg font-bold text-white mb-4">Skills</h3>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {profile.skills.split(',').map((skill, index) => (
                              <span key={index} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                          
                          <h3 className="text-lg font-bold text-white mb-4">Portfolio</h3>
                          <a 
                            href={profile.portfolio} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                            View Portfolio
                          </a>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-white mb-4">Edit Profile</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                                Name
                              </label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-2">
                                Bio
                              </label>
                              <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleFormChange}
                                rows="4"
                                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                              ></textarea>
                            </div>
                            
                            <div>
                              <label htmlFor="skills" className="block text-sm font-medium text-gray-400 mb-2">
                                Skills (comma separated)
                              </label>
                              <input
                                type="text"
                                id="skills"
                                name="skills"
                                value={formData.skills}
                                onChange={handleFormChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="experience" className="block text-sm font-medium text-gray-400 mb-2">
                                  Experience
                                </label>
                                <input
                                  type="text"
                                  id="experience"
                                  name="experience"
                                  value={formData.experience}
                                  onChange={handleFormChange}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                              <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-2">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  id="location"
                                  name="location"
                                  value={formData.location}
                                  onChange={handleFormChange}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="portfolio" className="block text-sm font-medium text-gray-400 mb-2">
                                  Portfolio URL
                                </label>
                                <input
                                  type="text"
                                  id="portfolio"
                                  name="portfolio"
                                  value={formData.portfolio}
                                  onChange={handleFormChange}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                              <div>
                                <label htmlFor="availability" className="block text-sm font-medium text-gray-400 mb-2">
                                  Availability
                                </label>
                                <select
                                  id="availability"
                                  name="availability"
                                  value={formData.availability}
                                  onChange={handleFormChange}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                  <option value="Full-time">Full-time</option>
                                  <option value="Part-time">Part-time</option>
                                  <option value="Contract">Contract</option>
                                  <option value="Freelance">Freelance</option>
                                  <option value="Project-based">Project-based</option>
                                </select>
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="ipfsHash" className="block text-sm font-medium text-gray-400 mb-2">
                                IPFS Hash (for profile image)
                              </label>
                              <input
                                type="text"
                                id="ipfsHash"
                                name="ipfsHash"
                                value={formData.ipfsHash}
                                onChange={handleFormChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                            
                            <button
                              onClick={handleUpdateProfile}
                              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md font-medium"
                            >
                              Update Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Create Your Professional Profile</h3>
                    <p className="text-gray-400 mb-6">
                      Create a profile to showcase your skills and apply for jobs in the film industry
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-2">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleFormChange}
                          rows="4"
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Tell us about yourself and your experience in the film industry"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label htmlFor="skills" className="block text-sm font-medium text-gray-400 mb-2">
                          Skills (comma separated)
                        </label>
                        <input
                          type="text"
                          id="skills"
                          name="skills"
                          value={formData.skills}
                          onChange={handleFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g. Cinematography, Editing, Sound Design"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="experience" className="block text-sm font-medium text-gray-400 mb-2">
                            Experience
                          </label>
                          <input
                            type="text"
                            id="experience"
                            name="experience"
                            value={formData.experience}
                            onChange={handleFormChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="e.g. 5+ years in film production"
                          />
                        </div>
                        <div>
                          <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleFormChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="e.g. Toronto, Canada"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="portfolio" className="block text-sm font-medium text-gray-400 mb-2">
                            Portfolio URL
                          </label>
                          <input
                            type="text"
                            id="portfolio"
                            name="portfolio"
                            value={formData.portfolio}
                            onChange={handleFormChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="https://your-portfolio.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="availability" className="block text-sm font-medium text-gray-400 mb-2">
                            Availability
                          </label>
                          <select
                            id="availability"
                            name="availability"
                            value={formData.availability}
                            onChange={handleFormChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="freelance">Freelance</option>
                            <option value="project-based">Project-based</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="ipfsHash" className="block text-sm font-medium text-gray-400 mb-2">
                          IPFS Hash (for profile image)
                        </label>
                        <input
                          type="text"
                          id="ipfsHash"
                          name="ipfsHash"
                          value={formData.ipfsHash}
                          onChange={handleFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="IPFS hash for your profile image"
                        />
                      </div>
                      
                      <button
                        onClick={handleCreateProfile}
                        className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                        disabled={!formData.name || !formData.bio || !formData.skills}
                      >
                        Create Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'post-job' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Post a New Job</h2>
                  <button
                    onClick={() => setActiveTab('my-jobs')}
                    className="text-teal-400 hover:text-teal-300"
                  >
                    Back to My Jobs
                  </button>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={jobFormData.title}
                        onChange={handleJobFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g. Cinematographer for Short Film"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
                        Job Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={jobFormData.description}
                        onChange={handleJobFormChange}
                        rows="4"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Detailed description of the job and project"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="requirements" className="block text-sm font-medium text-gray-400 mb-2">
                        Requirements
                      </label>
                      <textarea
                        id="requirements"
                        name="requirements"
                        value={jobFormData.requirements}
                        onChange={handleJobFormChange}
                        rows="3"
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Skills, experience, and qualifications required"
                      ></textarea>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-2">
                          Category
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={jobFormData.category}
                          onChange={handleJobFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="production">Production</option>
                          <option value="post-production">Post-Production</option>
                          <option value="pre-production">Pre-Production</option>
                          <option value="writing">Writing</option>
                          <option value="acting">Acting</option>
                          <option value="marketing">Marketing</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={jobFormData.location}
                          onChange={handleJobFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g. Remote, Toronto, etc."
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-400 mb-2">
                          Budget (FILM tokens)
                        </label>
                        <input
                          type="number"
                          id="budget"
                          name="budget"
                          value={jobFormData.budget}
                          onChange={handleJobFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g. 1000"
                        />
                      </div>
                      <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-400 mb-2">
                          Application Deadline
                        </label>
                        <input
                          type="date"
                          id="deadline"
                          name="deadline"
                          value={jobFormData.deadline}
                          onChange={handleJobFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-400 mb-2">
                          Project Duration
                        </label>
                        <input
                          type="text"
                          id="duration"
                          name="duration"
                          value={jobFormData.duration}
                          onChange={handleJobFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g. 2 weeks, 3 months"
                        />
                      </div>
                      <div>
                        <label htmlFor="skills" className="block text-sm font-medium text-gray-400 mb-2">
                          Required Skills
                        </label>
                        <input
                          type="text"
                          id="skills"
                          name="skills"
                          value={jobFormData.skills}
                          onChange={handleJobFormChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g. Cinematography, Lighting"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="ipfsHash" className="block text-sm font-medium text-gray-400 mb-2">
                        IPFS Hash (optional)
                      </label>
                      <input
                        type="text"
                        id="ipfsHash"
                        name="ipfsHash"
                        value={jobFormData.ipfsHash}
                        onChange={handleJobFormChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="IPFS hash for additional job details or media"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        onClick={handleCreateJob}
                        className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-md font-medium"
                        disabled={!jobFormData.title || !jobFormData.description || !jobFormData.budget}
                      >
                        Post Job
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Job Application Modal */}
            {showApplicationModal && selectedJob && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-4">Apply for "{selectedJob.title}"</h3>
                  
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">Company: {selectedJob.company}</p>
                    <p className="text-gray-400 text-sm mb-2">Budget: {selectedJob.budget} FILM</p>
                    <p className="text-gray-400 text-sm mb-4">Location: {selectedJob.location}</p>
                    
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <p className="text-white text-sm">{selectedJob.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="applicationMessage" className="block text-sm font-medium text-gray-400 mb-2">
                      Your Application Message
                    </label>
                    <textarea
                      id="applicationMessage"
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      rows="5"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Explain why you're a good fit for this role..."
                    ></textarea>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={submitJobApplication}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-2 rounded-md font-medium"
                      disabled={!applicationMessage.trim()}
                    >
                      Submit Application
                    </button>
                    <button
                      onClick={() => {
                        setShowApplicationModal(false);
                        setApplicationMessage('');
                        setSelectedJob(null);
                      }}
                      className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Job Applicants Modal */}
            {showApplicantsModal && selectedJob && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Applicants for "{selectedJob.title}"</h3>
                    <button
                      onClick={() => {
                        setShowApplicantsModal(false);
                        setSelectedJob(null);
                        setSelectedJobApplicants([]);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {selectedJobApplicants.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800 rounded-lg">
                      <p className="text-gray-400">No applications received yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedJobApplicants.map((applicant, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-teal-900 rounded-full flex items-center justify-center text-teal-300 text-xl font-bold">
                                {applicant.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white">{applicant.name}</h4>
                                <p className="text-gray-400 text-sm">Applied {applicant.appliedAt.toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div>
                              <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                                applicant.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                                applicant.status === 'hired' ? 'bg-green-900 text-green-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-900 rounded-lg p-4 mb-4">
                            <p className="text-white">{applicant.message}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-gray-400 text-sm mb-1">Skills</p>
                              <p className="text-white">{applicant.skills}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm mb-1">Experience</p>
                              <p className="text-white">{applicant.experience}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <a 
                              href={applicant.portfolio} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-teal-400 hover:text-teal-300 text-sm"
                            >
                              View Portfolio
                            </a>
                            {applicant.status === 'pending' && (
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleHireApplicant(applicant)}
                                  className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded-md text-sm"
                                >
                                  Hire
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Job Details Modal */}
            {showJobDetailsModal && selectedJob && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                          {selectedJob.companyLogo ? (
                            <img 
                              src={selectedJob.companyLogo} 
                              alt={selectedJob.company} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-teal-900 text-teal-300 text-2xl font-bold">
                              {selectedJob.company.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">{selectedJob.title}</h3>
                          <p className="text-gray-400">{selectedJob.company} • {selectedJob.location}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowJobDetailsModal(false);
                          setSelectedJob(null);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                          selectedJob.category === 'production' ? 'bg-blue-900 text-blue-300' :
                          selectedJob.category === 'post-production' ? 'bg-purple-900 text-purple-300' :
                          selectedJob.category === 'pre-production' ? 'bg-green-900 text-green-300' :
                          selectedJob.category === 'writing' ? 'bg-yellow-900 text-yellow-300' :
                          selectedJob.category === 'acting' ? 'bg-pink-900 text-pink-300' :
                          selectedJob.category === 'marketing' ? 'bg-orange-900 text-orange-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {selectedJob.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                          selectedJob.isOpen ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}>
                          {selectedJob.isOpen ? 'Open' : 'Closed'}
                        </span>
                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-300">
                          Posted on {selectedJob.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-white mb-2">Description</h4>
                      <p className="text-gray-300 mb-6">{selectedJob.description}</p>
                      
                      <h4 className="text-lg font-bold text-white mb-2">Requirements</h4>
                      <p className="text-gray-300 mb-6">{selectedJob.requirements}</p>
                      
                      <h4 className="text-lg font-bold text-white mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {selectedJob.skills.split(', ').map((skill, index) => (
                          <span key={index} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-800 rounded p-3">
                          <p className="text-gray-400 text-xs mb-1">Budget</p>
                          <p className="text-teal-400 font-medium">{selectedJob.budget} FILM</p>
                        </div>
                        <div className="bg-gray-800 rounded p-3">
                          <p className="text-gray-400 text-xs mb-1">Duration</p>
                          <p className="text-white">{selectedJob.duration}</p>
                        </div>
                        <div className="bg-gray-800 rounded p-3">
                          <p className="text-gray-400 text-xs mb-1">Deadline</p>
                          <p className="text-white">{selectedJob.deadline.toLocaleDateString()}</p>
                        </div>
                        <div className="bg-gray-800 rounded p-3">
                          <p className="text-gray-400 text-xs mb-1">Applicants</p>
                          <p className="text-white">{selectedJob.applicants}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      {selectedJob.creator.toLowerCase() === account.toLowerCase() ? (
                        <div className="flex space-x-4">
                          {selectedJob.isOpen && (
                            <>
                              <button
                                onClick={() => handleViewApplicants(selectedJob)}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                              >
                                View Applicants ({selectedJob.applicants})
                              </button>
                              <button
                                onClick={() => handleCloseJob(selectedJob.id)}
                                className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-md"
                              >
                                Close Job
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplyForJob(selectedJob)}
                          className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-md"
                          disabled={!selectedJob.isOpen}
                        >
                          {selectedJob.isOpen ? 'Apply Now' : 'Job Closed'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowJobDetailsModal(false);
                          setSelectedJob(null);
                        }}
                        className="bg-gray-800 text-gray-400 px-6 py-2 rounded-md"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
