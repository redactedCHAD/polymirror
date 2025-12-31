
import React, { useState } from 'react';
import { Copy, Check, Terminal, FileText, Database, Play } from 'lucide-react';

const FILES = [
  {
    name: 'listener.py',
    icon: Play,
    language: 'python',
    content: `import time
import os
from web3 import Web3
from dotenv import load_dotenv
from colorama import Fore, Style, init

# Import our helper modules
from asset_mapper import get_market_details
from executor import execute_copy_trade

init()
load_dotenv()

RPC_URL = os.getenv("RPC_URL")
TARGET_WALLET = "0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d".lower()
CTF_EXCHANGE_ADDR = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"

# Standard CTF Exchange ABI for 'OrderFilled'
CTF_ABI = [{"anonymous":False,"inputs":[{"indexed":True,"internalType":"bytes32","name":"orderHash","type":"bytes32"},{"indexed":True,"internalType":"address","name":"maker","type":"address"},{"indexed":True,"internalType":"address","name":"taker","type":"address"},{"indexed":False,"internalType":"uint256","name":"makerAssetId","type":"uint256"},{"indexed":False,"internalType":"uint256","name":"takerAssetId","type":"uint256"},{"indexed":False,"internalType":"uint256","name":"makerAmountFilled","type":"uint256"},{"indexed":False,"internalType":"uint256","name":"takerAmountFilled","type":"uint256"}],"name":"OrderFilled","type":"event"}]

def start_listener():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print(f"{Fore.RED}RPC Connection Failed{Style.RESET_ALL}")
        return

    print(f"{Fore.GREEN}Listening for Whale: {TARGET_WALLET}{Style.RESET_ALL}")
    contract = w3.eth.contract(address=CTF_EXCHANGE_ADDR, abi=CTF_ABI)
    last_block = w3.eth.block_number

    while True:
        try:
            current_block = w3.eth.block_number
            if current_block > last_block:
                print(f"Scanning block {current_block}...", end="\r")
                events = contract.events.OrderFilled.get_logs(fromBlock=last_block + 1, toBlock=current_block)
                
                for event in events:
                    process_event(event['args'])
                
                last_block = current_block
            time.sleep(2)
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

def process_event(args):
    maker = args['maker'].lower()
    taker = args['taker'].lower()

    # Check if our target is involved
    if TARGET_WALLET not in [maker, taker]:
        return

    # LOGIC: Did the target BUY or SELL?
    # Asset ID '0' is USDC.
    
    is_buy = False
    target_token_id = None
    filled_price_approx = 0.0

    if maker == TARGET_WALLET:
        # Target was MAKER (Limit Order)
        if args['makerAssetId'] == 0:
            is_buy = True # Gave USDC, Got Token
            target_token_id = args['takerAssetId']
            # Price = USDC Given / Tokens Received
            filled_price_approx = args['makerAmountFilled'] / args['takerAmountFilled']
        else:
            is_buy = False # Gave Token, Got USDC
            target_token_id = args['makerAssetId']
            filled_price_approx = args['takerAmountFilled'] / args['makerAmountFilled']

    elif taker == TARGET_WALLET:
        # Target was TAKER (Market Order)
        if args['takerAssetId'] == 0:
            is_buy = True # Gave USDC, Got Token
            target_token_id = args['makerAssetId']
            filled_price_approx = args['takerAmountFilled'] / args['makerAmountFilled']
        else:
            is_buy = False # Gave Token, Got USDC
            target_token_id = args['takerAssetId']
            filled_price_approx = args['makerAmountFilled'] / args['takerAmountFilled']

    # --- ACTION ---
    action_str = "BUY" if is_buy else "SELL"
    details = get_market_details(target_token_id)
    
    print(f"\n{Fore.CYAN}>>> WHALE ALERT <<<{Style.RESET_ALL}")
    print(f"Action: {Fore.MAGENTA}{action_str}{Style.RESET_ALL} on {details['question']} ({details['outcome']})")
    print(f"Price: {filled_price_approx:.3f}")
    
    # Trigger the copy trade
    # Note: We pass the RAW token ID, not the human name, to the executor
    execute_copy_trade(target_token_id, action_str, target_price=filled_price_approx)

if __name__ == "__main__":
    start_listener()`
  },
  {
    name: 'executor.py',
    icon: Terminal,
    language: 'python',
    content: `import os
import time
import sqlite3
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY, SELL
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
ORDER_TYPE = OrderType.FOK 
SLIPPAGE_TOLERANCE = 0.05

def get_client():
    """Initializes the Polymarket CLOB Client"""
    host = "https://clob.polymarket.com"
    key = os.getenv("MY_PRIVATE_KEY")
    chain_id = 137 # Polygon Mainnet
    client = ClobClient(host, key=key, chain_id=chain_id)
    client.set_api_creds(client.create_or_derive_api_creds())
    return client

def log_trade_to_db(market_name, outcome, side, size, price, status):
    conn = sqlite3.connect('trades.db')
    c = conn.cursor()
    c.execute("INSERT INTO trades (timestamp, market, outcome, side, size_usdc, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (time.time(), market_name, outcome, side, size, price, status))
    conn.commit()
    conn.close()

def execute_copy_trade(token_id, side, target_price=None):
    client = get_client()
    trade_size_tokens = 10.0 # Fixed size for MVP
    
    try:
        book_side = SELL if side == "BUY" else BUY 
        price_resp = client.get_price(token_id=str(token_id), side=book_side)
        current_market_price = float(price_resp['price'])
        
        print(f"Target Token: {token_id}")
        print(f"Market Price: {current_market_price}")
        
        if target_price:
            deviation = abs(current_market_price - target_price)
            if deviation > SLIPPAGE_TOLERANCE:
                print(f"Skipping: Price moved too much")
                return

        order_args = OrderArgs(
            price=current_market_price, 
            size=trade_size_tokens,
            side=BUY if side == "BUY" else SELL,
            token_id=str(token_id)
        )
        
        print(f"Submitting {side} order...")
        resp = client.create_and_post_order(order_args, order_type=ORDER_TYPE)
        
        if resp and resp.get("success"):
            print(f"✅ Trade Executed! ID: {resp['orderID']}")
            # Log to DB for Dashboard
            log_trade_to_db("Unknown Market (Lookup required)", "Unknown", side, trade_size_tokens * current_market_price, current_market_price, "FILLED")
        else:
            print(f"❌ Trade Failed: {resp.get('errorMsg')}")
            
    except Exception as e:
        print(f"Execution Error: {e}")`
  },
  {
    name: 'asset_mapper.py',
    icon: FileText,
    language: 'python',
    content: `import requests
from functools import lru_cache

GAMMA_API_URL = "https://gamma-api.polymarket.com/markets"

@lru_cache(maxsize=100)
def get_market_details(asset_id_int):
    token_id_str = str(asset_id_int)
    params = { "clob_token_ids_in": token_id_str }
    
    try:
        response = requests.get(GAMMA_API_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            return {"question": "Unknown Market", "outcome": "Unknown", "market_slug": ""}

        market = data[0]
        question = market.get("question", "Unknown Question")
        slug = market.get("slug", "")
        
        outcome_label = "Unknown"
        tokens = market.get("tokens", [])
        for t in tokens:
            if t.get("token_id") == token_id_str:
                outcome_label = t.get("outcome", "Unknown")
                break
                
        return {
            "question": question,
            "outcome": outcome_label,
            "market_slug": slug
        }

    except Exception as e:
        print(f"API Error: {e}")
        return {"question": "API Error", "outcome": "Err", "market_slug": ""}`
  },
  {
    name: 'db_setup.py',
    icon: Database,
    language: 'python',
    content: `import sqlite3
import json

def init_db():
    conn = sqlite3.connect('trades.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS trades
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  timestamp REAL, 
                  market TEXT, 
                  outcome TEXT, 
                  side TEXT, 
                  size_usdc REAL, 
                  price REAL, 
                  status TEXT)''')
    conn.commit()
    conn.close()

def init_config():
    config = {
        "is_active": False,
        "max_cap_usdc": 500.0,
        "copy_ratio": 0.1,
        "target_wallet": "0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d"
    }
    with open('config.json', 'w') as f:
        json.dump(config, f)

if __name__ == "__main__":
    init_db()
    init_config()
    print("Database and Config initialized.")`
  }
];

export const Code: React.FC = () => {
  const [activeFile, setActiveFile] = useState(FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
      <div className="lg:w-64 flex-shrink-0 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-900 rounded-xl overflow-hidden shadow-sm dark:shadow-lg h-fit">
        <div className="p-4 border-b border-slate-100 dark:border-dark-900 bg-slate-50 dark:bg-dark-900">
          <h2 className="text-slate-900 dark:text-white font-bold">Engine Source</h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Python Logic</p>
        </div>
        <div className="p-2 space-y-1">
          {FILES.map((file) => (
            <button
              key={file.name}
              onClick={() => setActiveFile(file)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFile.name === file.name
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <file.icon size={16} />
              {file.name}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-dark-900 mt-2">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">Environment</h3>
            <div className="bg-slate-50 dark:bg-dark-950 rounded p-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-dark-900 break-all">
                pip install web3 py-clob-client python-dotenv colorama requests
            </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-900 rounded-xl overflow-hidden flex flex-col shadow-sm dark:shadow-lg">
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100 dark:border-dark-900 bg-slate-50 dark:bg-dark-900">
          <div className="flex items-center gap-2">
            <activeFile.icon size={16} className="text-blue-600 dark:text-blue-500" />
            <span className="font-mono text-xs text-slate-700 dark:text-white font-bold">{activeFile.name}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-dark-950">
          <pre className="font-mono text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
