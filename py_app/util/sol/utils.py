from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solders.signature import Signature
from loguru import logger
from solders.system_program import TransferParams, transfer, close_account
from solders.system_program import CloseAccountParams
from spl.token.constants import TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
from solana.rpc.commitment import Finalized
from solana.transaction import Transaction
from solana.rpc.types import TokenAccountOpts
import time
import base58
import random
import json
from typing import Optional, Union, Dict, List, Tuple
from dataclasses import dataclass

DEFAULT_NETWORK_URL = "https://api.mainnet-beta.solana.com"

class SolanaUtilsError(Exception):
    """Base exception class for Solana utilities"""
    pass

@dataclass
class TransferResult:
    total_attempts: int
    successful_sends: int
    total_sol_sent: float
    duration: float

@dataclass
class CloseAccountResult:
    closed_accounts: int
    reclaimed_sol: float
    failed_closures: int

@dataclass
class SendSolParams:
    """Parameters for sending SOL to multiple addresses"""
    addresses: List[str]
    min_amount: float
    max_amount: float
    private_key: str
    network_url: str = DEFAULT_NETWORK_URL

class SolanaClient:
    """A wrapper class for Solana RPC client with utility methods"""
    
    def __init__(self, network_url: str = DEFAULT_NETWORK_URL):
        self.client = Client(network_url)
        self.network_url = network_url
    
    def get_sol_balance(self, address: str) -> float:
        """
        Get SOL balance for a given address
        
        Args:
            address: The Solana wallet address
            
        Returns:
            Balance in SOL (float) or 0 if error occurs
        """
        try:
            logger.info(f"Getting SOL balance for {address}")
            pubkey = Pubkey.from_string(address)
            response = self.client.get_balance(pubkey)

            if response.value is not None:
                return response.value / 1e9
            return 0
        except Exception as e:
            logger.error(f"Error getting SOL balance: {e}")
            return 0
    
    def get_token_info(self, token_contract: str) -> Optional[int]:
        """
        Get token information (decimals) for a given token contract
        
        Args:
            token_contract: The token contract address
            
        Returns:
            Number of decimals or None if error occurs
        """
        try:
            token_pubkey = Pubkey.from_string(token_contract)
            token_info = self.client.get_token_supply(token_pubkey)
            return token_info.value.decimals
        except Exception as e:
            logger.error(f"Error getting token info: {e}")
            return None
    
    def get_token_balance(self, token_contract: str, address: str) -> Optional[float]:
        """
        Get token balance for a given address and token contract
        
        Args:
            token_contract: The token contract address
            address: The wallet address
            
        Returns:
            Token balance or None if error occurs
        """
        try:
            token_pubkey = Pubkey.from_string(token_contract)
            address_pubkey = Pubkey.from_string(address)
            ata = self._get_token_pda(address_pubkey, token_pubkey)
            token_balance = self.client.get_token_account_balance(ata, commitment=Finalized)
            return token_balance.value.ui_amount
        except Exception as e:
            logger.error(f"Error getting token balance: {e}")
            return None
    
    @staticmethod
    def _get_token_pda(owner: Pubkey, token: Pubkey) -> Pubkey:
        """
        Get the associated token account address (PDA)
        
        Args:
            owner: Owner public key
            token: Token public key
            
        Returns:
            Associated token account address
        """
        (pub, _) = Pubkey.find_program_address(
            seeds=[bytes(owner), bytes(TOKEN_PROGRAM_ID), bytes(token)],
            program_id=ASSOCIATED_TOKEN_PROGRAM_ID,
        )
        return pub
    
    def get_token_balances(self, address: str) -> Dict[str, float]:
        """
        Get all token balances > 1 for a given address
        
        Args:
            address: The wallet address
            
        Returns:
            Dictionary of token addresses and their balances
        """
        try:
            _resp = self.client.get_token_accounts_by_owner_json_parsed(
                Pubkey.from_string(address),
                TokenAccountOpts(program_id=TOKEN_PROGRAM_ID),
            )
            response = json.loads(_resp.to_json())
            
            spls = {}
            
            if response.get("result"):
                token_accounts = response["result"]["value"]
                if not token_accounts:
                    return spls
                
                for account in token_accounts:
                    account_info = account.get("account", {}).get("data", {}).get("parsed", {}).get("info", {})
                    mint = account_info.get("mint", "")
                    balance = account_info.get("tokenAmount", {}).get("uiAmount", 0)
                    
                    if balance >= 1:
                        spls[mint] = balance
            else:
                logger.error("Failed to get token info. Please check wallet address or network connection.")
            return spls
        except Exception as e:
            logger.error(f"Error getting token balances: {e}")
            return {}
    
    def transfer_sol(self, sender_private_key: str, receiver_address: str, amount: float) -> Optional[Signature]:
        """
        Transfer SOL from one address to another
        
        Args:
            sender_private_key: Sender's private key in base58
            receiver_address: Recipient's address
            amount: Amount of SOL to send
            
        Returns:
            Transaction signature or None if failed
        """
        try:
            private_key_bytes = base58.b58decode(sender_private_key)
            sender = Keypair.from_bytes(private_key_bytes)
            
            transaction = Transaction().add(transfer(
                TransferParams(
                    from_pubkey=sender.pubkey(),
                    to_pubkey=Pubkey.from_string(receiver_address),
                    lamports=int(amount * 1e9)
                )
            ))
            
            response = self.client.send_transaction(transaction, sender)
            logger.info(f"Successfully sent {amount} SOL to {receiver_address}. Signature: {response.value}")
            return response.value
        except Exception as e:
            logger.error(f"Error transferring SOL: {e}")
            return None
    
    def send_sol_to_addresses(self, params: SendSolParams) -> TransferResult:
        """
        Send SOL to multiple addresses with random amounts within a range
        
        Args:
            params: SendSolParams containing transfer parameters
            
        Returns:
            TransferResult with statistics about the transfers
        """
        logger.info(f"Starting SOL transfer. Network URL: {self.network_url}")
        
        start_time = time.time()
        total_sol_sent = 0
        total_attempts = 0
        successful_sends = 0
        
        for address in params.addresses:
            success = False
            attempts = 0
            while not success and attempts < 3:
                attempts += 1
                total_attempts += 1
                amount = random.uniform(params.min_amount, params.max_amount)
                try:
                    logger.info(f"Attempting to send {amount} SOL to {address}")
                    signature = self.transfer_sol(params.private_key, address, amount)
                    if signature:
                        success = True
                        successful_sends += 1
                        total_sol_sent += amount
                        solscan_url = f"https://solscan.io/tx/{signature}"
                        logger.info(f"Successfully sent {amount} SOL to {address}. {solscan_url}")
                except Exception as e:
                    logger.error(f"Error sending SOL to {address}: {e}")
                    time.sleep(5)
        
        duration = time.time() - start_time
        logger.info(f"SOL transfer completed. Total attempts: {total_attempts}, Successful sends: {successful_sends}")
        
        return TransferResult(
            total_attempts=total_attempts,
            successful_sends=successful_sends,
            total_sol_sent=total_sol_sent,
            duration=duration
        )
    
    def get_sol_transfer_amount(self, tx_hash: str) -> Tuple[List[float], float]:
        """
        Get SOL transfer amount and fee from a transaction hash
        
        Args:
            tx_hash: Transaction hash
            
        Returns:
            Tuple of (list of transfer amounts, fee in SOL)
        """
        try:
            response = self.client.get_transaction(
                Signature.from_string(tx_hash), 
                commitment="confirmed", 
                max_supported_transaction_version=0
            )
            
            if not response.value.transaction:
                logger.error(f"Transaction hash {tx_hash} is invalid or unconfirmed.")
                return [], 0
            
            meta = response.value.transaction.meta
            if not meta:
                logger.error("No metadata found. Transaction may be invalid.")
                return [], 0
            
            pre_balances = meta.pre_balances
            post_balances = meta.post_balances
            
            if len(pre_balances) != len(post_balances):
                logger.error("Balance data mismatch, cannot calculate transfer amount.")
                return [], 0
            
            sol_transfers = []
            for pre, post in zip(pre_balances, post_balances):
                diff = pre - post
                if diff > 0:  # Outgoing transfers
                    sol_transfers.append(diff / 1e9)
            
            if sol_transfers:
                logger.info(f"Transaction {tx_hash} SOL transfers: {sol_transfers} with fee {meta.fee / 1e9}")
                return sol_transfers, meta.fee / 1e9
            else:
                logger.info(f"Transaction {tx_hash} has no SOL transfers.")
                return [], 0
        except Exception as e:
            logger.error(f"Error getting transfer amount: {e}")
            return [], 0
    
    def close_empty_accounts(self, owner_private_key: str) -> CloseAccountResult:
        """
        Close empty token accounts and reclaim rent
        
        Args:
            owner_private_key: Owner's private key in base58
            
        Returns:
            CloseAccountResult with statistics about the closures
        """
        try:
            private_key_bytes = base58.b58decode(owner_private_key)
            owner = Keypair.from_bytes(private_key_bytes)
            
            # Get all token accounts for the owner
            _resp = self.client.get_token_accounts_by_owner_json_parsed(
                owner.pubkey(),
                TokenAccountOpts(program_id=TOKEN_PROGRAM_ID),
            )
            response = json.loads(_resp.to_json())
            
            if not response.get("result"):
                logger.error("Failed to get token accounts")
                return CloseAccountResult(0, 0.0, 0)
            
            token_accounts = response["result"]["value"]
            if not token_accounts:
                logger.info("No token accounts found")
                return CloseAccountResult(0, 0.0, 0)
            
            closed_accounts = 0
            reclaimed_sol = 0.0
            failed_closures = 0
            
            for account in token_accounts:
                account_info = account.get("account", {})
                account_pubkey = account_info.get("pubkey", "")
                balance_info = account_info.get("data", {}).get("parsed", {}).get("info", {}).get("tokenAmount", {})
                
                # Check if account is empty
                if balance_info.get("amount", "0") == "0":
                    try:
                        # Create close account transaction
                        transaction = Transaction().add(
                            close_account(
                                CloseAccountParams(
                                    account=Pubkey.from_string(account_pubkey),
                                    destination=owner.pubkey(),
                                    owner=owner.pubkey(),
                                )
                            )
                        )
                        
                        # Send transaction
                        response = self.client.send_transaction(transaction, owner)
                        
                        if response.value:
                            closed_accounts += 1
                            # Estimate reclaimed rent (approximate)
                            reclaimed_sol += 0.002  # Approximate rent exempt amount for token account
                            logger.info(f"Successfully closed empty account {account_pubkey}. Signature: {response.value}")
                        else:
                            failed_closures += 1
                            logger.error(f"Failed to close account {account_pubkey}")
                    except Exception as e:
                        failed_closures += 1
                        logger.error(f"Error closing account {account_pubkey}: {e}")
                        time.sleep(1)  # Brief delay between attempts
            
            logger.info(f"Closed {closed_accounts} empty accounts, reclaimed ~{reclaimed_sol:.4f} SOL, failed closures: {failed_closures}")
            return CloseAccountResult(closed_accounts, reclaimed_sol, failed_closures)
        except Exception as e:
            logger.error(f"Error in close_empty_accounts: {e}")
            return CloseAccountResult(0, 0.0, 0)

# Legacy functions for backward compatibility
def get_sol_balance(address: str, network_url: str = DEFAULT_NETWORK_URL) -> float:
    return SolanaClient(network_url).get_sol_balance(address)

def get_token_info(token_contract: str, network_url: str = DEFAULT_NETWORK_URL) -> Optional[int]:
    return SolanaClient(network_url).get_token_info(token_contract)

def get_token_balance(token_contract: str, address: str, network_url: str = DEFAULT_NETWORK_URL) -> Optional[float]:
    return SolanaClient(network_url).get_token_balance(token_contract, address)

def get_token_balances(address: str, network_url: str = DEFAULT_NETWORK_URL) -> Dict[str, float]:
    return SolanaClient(network_url).get_token_balances(address)

def transfer_sol(sender_private_key: str, receiver_address: str, amount: float, 
                network_url: str = DEFAULT_NETWORK_URL) -> Optional[Signature]:
    return SolanaClient(network_url).transfer_sol(sender_private_key, receiver_address, amount)

def send_sol_to_addresses(params: SendSolParams) -> TransferResult:
    return SolanaClient(params.network_url).send_sol_to_addresses(params)

def get_sol_transfer_amount(tx_hash: str, network_url: str = DEFAULT_NETWORK_URL) -> Tuple[List[float], float]:
    return SolanaClient(network_url).get_sol_transfer_amount(tx_hash)

def close_empty_accounts(owner_private_key: str, network_url: str = DEFAULT_NETWORK_URL) -> CloseAccountResult:
    return SolanaClient(network_url).close_empty_accounts(owner_private_key)