// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import Chainlink's Aggregator Interface
interface AggregatorV3Interface {
  function decimals() external view returns (uint8);
  function description() external view returns (string memory);
  function version() external view returns (uint256);
  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract CHRLECoinPresale {
    IERC20 public token;
    IERC20 public usdc;
    IERC20 public usdt;
    AggregatorV3Interface public priceFeed;
    // Payment wallet address
    address public paymentWallet = 0xdDc631F8197C9bb390B28a7604A2ddC65dC662FC;
    address public owner;
    bool public paused;
    bool public claimStarted;
    uint256 public totalUsers;
    uint256 public totalVestedUsers;
    uint256 public currentStage;
    uint256 public perDollarPrice;
    uint256 public  maxTokensPerUser = 100_000_000 * 10**18; // Max 100M tokens per user
    uint256[] public stagePrices;
    uint256[] public stageSupplies;
    uint256 public totalTokensSold;
    string private hashedSK;
    uint256 public Usdtoeth; // To track the USD to ETH conversion rate

    // Stage tracking (new variable)
    mapping(uint256 => uint256) public stageSold;  // Mapping to track sold tokens in each stage
    // Tracks the tokens sold at each stage


    // Presale tracking
    mapping(address => uint256) public presaleAllocations;
    mapping(address => bool) public oldBuyer;
    mapping(uint256 => address) public vestedUsers; // Tracks user addresses by index for vesting
    
    // Vesting tracking
    mapping(address => uint256) public vestedAllocations;
    mapping(address => uint256) public vestedClaims;
    
    event ClaimToken(address indexed _user, uint256 indexed _amount);
    
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliff;
        uint256 releaseAmount;
        uint256 released;
        uint256 nextClaimTime;
    }
    
    struct user {
        uint256 native_balance;
        uint256 usdt_balance;
        uint256 token_balance;
        uint256 claimed_token;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => user) public users;
    mapping(uint256 => address) public presaleUsers;
    modifier onlyOwner {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier verifyTXHash (string memory _txHash, bytes32 _encodedHash) {
        require(keccak256(abi.encodedPacked(_txHash, hashedSK)) == _encodedHash, "TX verfication failed");
        _;
    }
    
    event TokensRescued(address indexed recipient, uint256 amount);
    
    constructor(
        uint256[] memory _prices,
        uint256[] memory _supplies,
        address _token,
        address _usdc,
        address _usdt,
        address _priceFeed,
        string memory _hashedSK
    ) {
        require(_prices.length == 6, "Must provide 6 stage prices");
        require(_supplies.length == 6, "Must provide 6 stage supplies");
        owner = msg.sender;
        stagePrices = _prices;
        stageSupplies = _supplies;
        currentStage = 1;
        perDollarPrice = stagePrices[0];
        token = IERC20(_token);
        usdc = IERC20(_usdc);
        usdt = IERC20(_usdt);
        priceFeed = AggregatorV3Interface(_priceFeed);
        hashedSK = _hashedSK;
    }

    // Admin functions
    function setPause(bool _value) external onlyOwner {
        paused = _value;
    }

    function startClaim() external onlyOwner {
        claimStarted = true;
    }

    function stopClaim() external onlyOwner {
        claimStarted = false;
    }

    function changeHashedSK(string memory _hashedSK) external onlyOwner {
        hashedSK = _hashedSK;
    }

    function updateMaxPurchase(uint256 _newLimit) external onlyOwner {
        maxTokensPerUser = _newLimit;
    }

    // Change the payment wallet address (onlyOwner)
    function changePaymentWallet(address _newPaymentWallet) external onlyOwner {
        paymentWallet = _newPaymentWallet;
    }

    function updateToken(address _saleToken) external onlyOwner {
        token = IERC20(_saleToken);
    }

    function changeUSDTInterface(address _address) external onlyOwner {
        usdt = IERC20(_address);
    }

    function changeUSDCInterface(address _address) external onlyOwner {
        usdc = IERC20(_address);
    }

    function updateStagePrice(uint256 _stage, uint256 _price) public onlyOwner {
        require(_stage >= 1 && _stage <= 6, "Invalid stage");
        stagePrices[_stage - 1] = _price;

        if (_stage == currentStage) {
            perDollarPrice = _price;
        }
    }

    function setCurrentStage(uint256 _stage) public onlyOwner {
        require(_stage >= 1 && _stage <= 6, "Invalid stage");
        require(_stage > currentStage, "Cannot go back to previous stages");

        currentStage = _stage;
        perDollarPrice = stagePrices[_stage - 1];
    }
    
    function updateStageSupply(uint256 _stage, uint256 _newSupply) external onlyOwner {
        require(_stage > 0 && _stage <= stageSupplies.length, "Invalid stage number");
        require(_newSupply >= stageSold[_stage], "New supply cannot be less than already sold tokens in this stage");
        stageSupplies[_stage - 1] = _newSupply;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }
 
    function rescueFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Price update
    function updateEthPrice() public {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price data");
        Usdtoeth = uint256(price) * 10**10; // Adjust to 18 decimals
    }

    // Presale purchase with Token (USDC or USDT)
    function buyFromToken(uint256 _pid, uint256 _amount) external {
        require(!paused, "Presale is paused");
        if (!oldBuyer[msg.sender]) {
            presaleUsers[totalUsers] = msg.sender;
            totalUsers += 1;
            oldBuyer[msg.sender] = true; // Mark this user as tracked
        }
        uint256 tokensToAllocate = (_amount * perDollarPrice) / (10**6);
        require(presaleAllocations[msg.sender] + tokensToAllocate <= maxTokensPerUser, "Exceeds maximum token purchase limit");
        require(stageSold[currentStage] + tokensToAllocate <= stageSupplies[currentStage - 1], "Exceeds current stage supply");

        if (_pid == 1) {
            usdt.transferFrom(msg.sender, paymentWallet, _amount);
        } else if (_pid == 2) {
            usdc.transferFrom(msg.sender, paymentWallet, _amount);
        } else {
            revert("Invalid token type");
        }

        presaleAllocations[msg.sender] += tokensToAllocate;
        stageSold[currentStage] += tokensToAllocate;  // Update the stageSold for the current stage
        totalTokensSold += tokensToAllocate;
        users[msg.sender].usdt_balance += _amount;
        users[msg.sender].token_balance = users[msg.sender].token_balance + (tokensToAllocate);
    }

    // Presale purchase with Native Ether
    function buyFromNative() external payable {
        require(!paused, "Presale is paused");
        if (!oldBuyer[msg.sender]) {
            presaleUsers[totalUsers] = msg.sender;
            totalUsers += 1;
            oldBuyer[msg.sender] = true; // Mark this user as tracked
        }
        updateEthPrice();

        uint256 ethAmount = msg.value;
        uint256 usdValue = ethAmount * Usdtoeth; // Convert ETH to USD equivalent
        uint256 tokensToAllocate = (usdValue * perDollarPrice) / (10**18 * 10**18);
        require(presaleAllocations[msg.sender] + tokensToAllocate <= maxTokensPerUser, "Exceeds maximum token purchase limit");
        require(stageSold[currentStage] + tokensToAllocate <= stageSupplies[currentStage - 1], "Exceeds current stage supply");
        presaleAllocations[msg.sender] += tokensToAllocate;
        stageSold[currentStage] += tokensToAllocate;  // Update the stageSold for the current stage
        totalTokensSold += tokensToAllocate;

        users[msg.sender].native_balance = users[msg.sender].native_balance + (msg.value); 
        users[msg.sender].token_balance = users[msg.sender].token_balance + (tokensToAllocate);

        // Transfer the ETH to the owner
        payable(paymentWallet).transfer(ethAmount);
    }

    // Presale purchase with TON
    function buyFromTon(string memory _txHash, bytes32 _encodedHash, address _recipient, uint256 _amount) external verifyTXHash(_txHash, _encodedHash) {
        require(!paused, "Presale is paused");
        if (!oldBuyer[_recipient]) {
            presaleUsers[totalUsers] = _recipient;
            totalUsers += 1;
            oldBuyer[_recipient] = true; // Mark this user as tracked
        }
        require(presaleAllocations[_recipient] + _amount <= maxTokensPerUser, "Exceeds maximum token purchase limit");
        require(stageSold[currentStage] + _amount <= stageSupplies[currentStage - 1], "Exceeds current stage supply");
        presaleAllocations[_recipient] += _amount;
        stageSold[currentStage] += _amount;  // Update the stageSold for the current stage
        totalTokensSold += _amount;
        users[_recipient].token_balance = users[_recipient].token_balance + _amount;
    }

    // Claim bought tokens
    function claimTokens() external {
        require(claimStarted, "Claiming not started yet");
        require(users[msg.sender].token_balance != 0, "Presale: 0 to claim");

        user storage _usr = users[msg.sender];

        token.transfer(msg.sender, _usr.token_balance);
        _usr.claimed_token += _usr.token_balance;
        _usr.token_balance -= _usr.token_balance;
      
        emit ClaimToken(msg.sender, _usr.token_balance);
    }

    function claimVestedTokens() public {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(block.timestamp >= schedule.nextClaimTime, "Claim time not reached");

        uint256 claimable = schedule.releaseAmount;
        require(schedule.released + claimable <= schedule.totalAmount, "Exceeds vesting allocation");

        schedule.released += claimable;
        schedule.nextClaimTime += 90 days;

        vestedClaims[msg.sender] += claimable;
        vestedAllocations[msg.sender] -= claimable;
        token.transfer(msg.sender, claimable);
    }

    // Vesting management
    function tokensVesting(uint256 _amount) external {
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient balance");
   

        uint256 cliff = 365 days; // 1 year
        uint256 totalAmount = vestingSchedules[msg.sender].totalAmount + _amount;
        uint256 releaseAmount = totalAmount / 4;

        // Example logic to add the user to the list
         // If the user already has a vesting schedule, update their schedule
        if (vestingSchedules[msg.sender].totalAmount > 0) {
            // Update vesting schedule to add more tokens
            vestingSchedules[msg.sender].totalAmount = totalAmount;
        } else {
            // If it's the user's first vesting, add them to the list
            vestedUsers[totalVestedUsers] = msg.sender;
            totalVestedUsers++;
        }
        vestingSchedules[msg.sender] = VestingSchedule({
            totalAmount : totalAmount,
            startTime: block.timestamp,
            cliff: cliff,
            releaseAmount: releaseAmount,
            released: 0,
            nextClaimTime: block.timestamp + cliff
        });
  

         // Update the vestedAllocations to include the new vesting amount
        vestedAllocations[msg.sender] += _amount;  // Add new vesting tokens to the user's total vested allocation

        token.transferFrom(msg.sender, address(this), _amount);
    }

    // Query functions
    function getPresalePurchased(address _user) public view returns (uint256) {
        return presaleAllocations[_user];
    }

    function getPresaleUnclaimed(address _user) public view returns (uint256) {
      return users[_user].token_balance;
    }

    function getPresaleClaimed(address _user) public view returns (uint256) {
         return users[_user].claimed_token;
    }

    function getVestedPurchased(address _user) public view returns (uint256) {
        return vestedAllocations[_user];
    }

    function getVestedUnclaimed(address _user) public view returns (uint256) {
        return vestingSchedules[_user].totalAmount - vestingSchedules[_user].released;
    }

    function getVestedClaimed(address _user) public view returns (uint256) {
        return vestedClaims[_user];
    }

    // Function to get the current stage supply
    function getCurrentStageSupply() external view returns (uint256 currentSupply) {
        return stageSupplies[currentStage - 1]; // Return the supply for the current stage
    }
    
    // Function to get the amount of tokens sold in a particular stage
    function getStageSold(uint256 _stage) public view returns (uint256) {
        require(_stage >= 1 && _stage <= 6, "Invalid stage");
        return stageSold[_stage];
    }

    function rescueTokens(address _recipient, uint256 _amount) external onlyOwner {
        uint256 totalLocked = getTotalUnclaimedTokens() + getTotalVestedTokens();
        uint256 contractBalance = token.balanceOf(address(this));
        // Ensure the owner can only withdraw tokens that are not locked (unsold tokens)
        require(_amount <= contractBalance - totalLocked, "Cannot withdraw locked or sold tokens");
        token.transfer(_recipient, _amount);
        emit TokensRescued(_recipient, _amount);
    }
    
    function getTotalUnclaimedTokens() public view returns (uint256) {
        uint256 totalUnclaimed = 0;
        for (uint256 i = 0; i < totalUsers; i++) {
            address userAddress = presaleUsers[i]; // Fetch each presale user's address
            totalUnclaimed += users[userAddress].token_balance; // Add their unclaimed token balance
        }
        return totalUnclaimed;
    }
        
    function getTotalVestedTokens() public view returns (uint256) {
        uint256 totalVested = 0;
        for (uint256 i = 0; i < totalVestedUsers; i++) {
            address userAddress = vestedUsers[i];
            VestingSchedule storage schedule = vestingSchedules[userAddress];
            totalVested += (schedule.totalAmount - schedule.released);
        }
        return totalVested;
    }
}