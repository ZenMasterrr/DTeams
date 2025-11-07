# 🎯 Quick Command Reference

All commands you'll need for hybrid implementation.

---

## 📋 **Phase 1: Deploy Contract**

### **Compile contracts**
```bash
npx hardhat compile
```

### **Deploy to Sepolia**
```bash
npx hardhat run scripts/deploy-zapv2.js --network sepolia
```

### **Verify on Etherscan (optional)**
```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

---

## 📋 **Phase 2: Register Keeper**

### **Register as keeper**
```bash
npx hardhat run scripts/register-keeper.js --network sepolia
```

### **Check keeper status**
```bash
# In Hardhat console
npx hardhat console --network sepolia

# Then run:
const ZapV2 = await ethers.getContractFactory("ZapV2");
const zapV2 = ZapV2.attach("YOUR_CONTRACT_ADDRESS");
await zapV2.isKeeper("YOUR_WALLET_ADDRESS");
```

---

## 📋 **Phase 3: Keeper Service**

### **Navigate to keeper**
```bash
cd keeper
```

### **Install dependencies**
```bash
npm install ethers@6 googleapis axios dotenv
npm install --save-dev typescript @types/node ts-node
```

### **Run keeper**
```bash
npx ts-node src/keeper-v2.ts
```

### **Run keeper in background (Linux/Mac)**
```bash
nohup npx ts-node src/keeper-v2.ts > keeper.log 2>&1 &
```

### **Run keeper in background (Windows)**
```powershell
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "ts-node src/keeper-v2.ts"
```

---

## 📋 **Phase 4: Frontend**

### **Navigate to frontend**
```bash
cd frontend
```

### **Install dependencies**
```bash
npm install ethers@6
```

### **Run frontend dev server**
```bash
npm run dev
```

### **Visit pages**
```
http://localhost:3000/dashboard-v2
http://localhost:3000/create-zap-web3
```

---

## 🔧 **Environment Setup**

### **Check .env file**
```bash
cat .env | grep SEPOLIA_RPC_URL
cat .env | grep PRIVATE_KEY
cat .env | grep ZAP_CONTRACT_ADDRESS
```

### **Edit .env (Windows)**
```powershell
notepad .env
```

### **Edit .env (Linux/Mac)**
```bash
nano .env
# or
vim .env
```

---

## 🛠️ **Troubleshooting Commands**

### **Check Sepolia ETH balance**
```bash
npx hardhat console --network sepolia

# Then:
const balance = await ethers.provider.getBalance("YOUR_WALLET_ADDRESS");
console.log(ethers.formatEther(balance), "ETH");
```

### **Check contract deployment**
```bash
# Visit Etherscan
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### **Kill stuck processes (Linux/Mac)**
```bash
# Find process
ps aux | grep keeper

# Kill process
kill -9 PROCESS_ID
```

### **Kill stuck processes (Windows)**
```powershell
# Find process
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Kill process
Stop-Process -Id PROCESS_ID -Force
```

### **Clear npm cache**
```bash
npm cache clean --force
```

### **Reinstall dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 **Testing Commands**

### **Test contract on Hardhat console**
```bash
npx hardhat console --network sepolia

# Then run:
const ZapV2 = await ethers.getContractFactory("ZapV2");
const zapV2 = ZapV2.attach("YOUR_CONTRACT_ADDRESS");

# Check total zaps
await zapV2.getTotalZaps();

# Check keeper
await zapV2.isKeeper("YOUR_ADDRESS");

# Check execution reward
const reward = await zapV2.executionReward();
console.log(ethers.formatEther(reward), "ETH");
```

### **Test frontend build**
```bash
cd frontend
npm run build
npm run start
```

---

## 🔄 **Git Commands**

### **Check status**
```bash
git status
```

### **Commit changes**
```bash
git add .
git commit -m "Phase X complete"
```

### **Push to GitHub**
```bash
git push origin main
```

---

## 📝 **Logs & Monitoring**

### **View keeper logs (if running in background)**
```bash
tail -f keeper.log
```

### **View frontend logs**
```bash
# Check browser console (F12)
# Or check terminal where npm run dev is running
```

### **View backend logs**
```bash
cd hooks
npm run dev
# Logs appear in terminal
```

---

## 🚨 **Emergency Commands**

### **Stop all Node processes (use carefully!)**
```bash
# Linux/Mac
pkill -f node

# Windows PowerShell
Get-Process node | Stop-Process -Force
```

### **Reset Hardhat**
```bash
npx hardhat clean
rm -rf cache artifacts
npx hardhat compile
```

### **Reset MetaMask account**
```
MetaMask → Settings → Advanced → Reset Account
```

---

## 💡 **Quick Snippets**

### **Get current gas price**
```bash
npx hardhat console --network sepolia

# Then:
const gasPrice = await ethers.provider.getFeeData();
console.log("Gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
```

### **Send test transaction**
```bash
npx hardhat console --network sepolia

# Then:
const [signer] = await ethers.getSigners();
const tx = await signer.sendTransaction({
  to: "RECIPIENT_ADDRESS",
  value: ethers.parseEther("0.01")
});
await tx.wait();
```

---

## 📚 **Documentation Commands**

### **Open docs in browser (Linux/Mac)**
```bash
open IMPLEMENTATION_PROGRESS.md
open START_HERE.md
```

### **Open docs in browser (Windows)**
```powershell
start IMPLEMENTATION_PROGRESS.md
start START_HERE.md
```

---

## ✅ **Success Check Commands**

### **Phase 1 Success**
```bash
# Should see your contract
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### **Phase 2 Success**
```bash
npx hardhat console --network sepolia
const ZapV2 = await ethers.getContractFactory("ZapV2");
const zapV2 = ZapV2.attach("YOUR_CONTRACT_ADDRESS");
await zapV2.isKeeper("YOUR_ADDRESS"); # Should return true
```

### **Phase 3 Success**
```bash
# Keeper should show:
# ✅ Keeper registered
# 🔍 Monitoring zaps...
```

### **Phase 4 Success**
```bash
# Visit: http://localhost:3000/dashboard-v2
# Should see mode selection
```

---

**Save this file for quick reference during implementation!** 📋
