pragma solidity ^0.4.23;

contract MinNumBet{
    struct Session{
        bool isOpen;
        address owner;
        address winner;
        uint[] bets;
        address[] players;
        mapping(address => uint) playerToBet;
        mapping(address => bool) playerHasPlacedBet;

    }
    
    Session[] sessions;

    function allSessionsClosed() public view returns (bool){
        for (uint i = 0; i<sessions.length; i++){
            if(sessions[i].isOpen){
                return false;
            }
        }
        return true;
    }
    function createNewSession() public returns (uint) {
        Session memory newSession = Session(true, msg.sender, 0, new uint[](0), new address[](0));
        return sessions.push(newSession) - 1;
    }
    function closeSession(uint sessionId) public {
        Session storage currentSession = sessions[sessionId];
        require(currentSession.isOpen, "Session is already closed, you can't close it again");
        require(currentSession.owner == msg.sender, "You are not the owner of this session, you can't close it");
        require(currentSession.bets.length > 0, "You should have at least one bet before closing the session");
        currentSession.winner = _calculateWinner(sessionId);
        currentSession.isOpen = false;
    }
    
    function placeBet(uint sessionId, uint number) public {
        Session storage currentSession = sessions[sessionId];
        require(currentSession.isOpen,"You can't place a bet on a closed session");
        require(!currentSession.playerHasPlacedBet[msg.sender],"You have already placed a bet in this session");
        currentSession.bets.push(number);
        currentSession.players.push(msg.sender);
        currentSession.playerToBet[msg.sender] = number;
        currentSession.playerHasPlacedBet[msg.sender] = true;
    }

    function getWinner(uint sessionId) public view returns(address){
        Session memory currentSession = sessions[sessionId];
        require(!currentSession.isOpen, "Session must be closed to have a winner.");
        return currentSession.winner;
    }

    function _calculateWinner(uint sessionId) private view returns(address){
        Session storage currentSession = sessions[sessionId];
        // if we return 0 it means there is no winner
        address winner = 0;
        uint betLength = currentSession.bets.length;
        // If there is only one bet, no use to calculate the winner
        if(betLength == 1){
            winner = currentSession.players[0];
        }
        // This means we have more than one bet. Let's see which one is smaller
        else{
            uint[] memory sortedBets = _quickSort(currentSession.bets);
            // We try to see in the sorted array, which bet contains 
            // the smallest number that has not been repeated.
            bool notFound = true;
            uint winningBet;
            uint i = 0;
            do{
                winningBet = sortedBets[i];
                i++;
                notFound = false;
                while(i<betLength && winningBet == sortedBets[i]){
                    i++;
                    notFound = true;
                }
            } while(notFound && i<betLength);
            if(notFound){
                return 0;
            }
            for(i = 0; i<currentSession.players.length; i++){
                address currentPlayer = currentSession.players[i];
                if(currentSession.playerToBet[currentPlayer] == winningBet){
                    return currentPlayer;
                }
            }
        }
        return winner;
    }

    function _quickSort(uint[] storage data) private view returns (uint[]) {

        uint n = data.length;
        uint[] memory arr = new uint[](n);
        uint i;

        for(i = 0; i<n; i++) {
            arr[i] = data[i];
        }

        uint[] memory stack = new uint[](n+2);

        //Push initial lower and higher bound
        uint top = 1;
        stack[top] = 0;
        top = top + 1;
        stack[top] = n-1;

        //Keep popping from stack while is not empty
        while (top > 0) {

            uint h = stack[top];
            top = top - 1;
            uint l = stack[top];
            top = top - 1;

            i = l;
            uint x = arr[h];

            for(uint j=l; j<h; j++){
            if(arr[j] <= x) {
                //Move smaller element
                (arr[i], arr[j]) = (arr[j],arr[i]);
                i = i + 1;
            }
            }
            (arr[i], arr[h]) = (arr[h],arr[i]);
            uint p = i;

            //Push left side to stack
            if (p > l + 1) {
            top = top + 1;
            stack[top] = l;
            top = top + 1;
            stack[top] = p - 1;
            }

            //Push right side to stack
            if (p+1 < h) {
            top = top + 1;
            stack[top] = p + 1;
            top = top + 1;
            stack[top] = h;
            }
        }

        // for(i=0; i<n; i++) {
        //     data[i] = arr[i];
        // }
        return arr;
    }
}